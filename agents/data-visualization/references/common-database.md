# App Database Access (Drizzle ORM)

Use the shared monorepo references as the source of truth:

- The `pnpm-workspace` skill's `references/db.md` for how to use the database
- The `pnpm-workspace` skill's `references/server.md` for building the endpoints

This reference only covers the data-visualization-specific parts that sit on top of those shared rules.

## When to Use the App DB

- Use the app DB when the user is exploring or reporting on data your app already owns.
- Keep external integrations separate. Fetch upstream data in the API layer and only persist/cache it in Postgres when that materially improves latency or reliability.

## Shape Endpoints for Visualizations

- Prefer chart-ready responses over one giant generic endpoint.
- Push filtering, grouping, and aggregation into SQL for large datasets.
- Return stable numeric/date fields that map cleanly into charts, tables, and summary cards.
- Split endpoints by purpose when helpful:
  - raw rows for tables and explorers
  - aggregated series for charts
  - KPI/summary payloads for cards

Example query shape:

```typescript
const revenueByDate = await db
  .select({
    date: sql<string>`DATE(${ordersTable.createdAt})`,
    revenue: sql<number>`SUM(${ordersTable.amount})`,
  })
  .from(ordersTable)
  .groupBy(sql`DATE(${ordersTable.createdAt})`)
  .orderBy(sql`DATE(${ordersTable.createdAt})`);
```

If the visualization supports a user-selected time range, apply the already-validated range in SQL instead of filtering in the frontend:

```typescript
const revenueByDate = await db
  .select({
    date: sql<string>`DATE(${ordersTable.createdAt})`,
    revenue: sql<number>`SUM(${ordersTable.amount})`,
  })
  .from(ordersTable)
  .where(sql`${ordersTable.createdAt} BETWEEN ${startDate} AND ${endDate}`)
  .groupBy(sql`DATE(${ordersTable.createdAt})`)
  .orderBy(sql`DATE(${ordersTable.createdAt})`);
```

Here, `startDate` and `endDate` should come from params that were already parsed and validated using the `pnpm-workspace` skill's `references/server.md` patterns.

The route that uses this query should still follow the `pnpm-workspace` skill's `references/server.md` for parsing, validation, and response handling.

## DB-Backed API Response Cache

For external-API routes that are slow (>10s) or share a rate-limited token, cache responses in Postgres with a 15-minute TTL. This replaces any in-memory caching pattern.

### Schema (`lib/db/src/schema/apiCache.ts`)

```typescript
import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const apiCacheTable = pgTable("api_cache", {
  cacheKey: text("cache_key").primaryKey(),
  responseData: jsonb("response_data").notNull(),
  cachedAt: timestamp("cached_at", { withTimezone: true }).defaultNow().notNull(),
});
```

Re-export from `lib/db/src/schema/index.ts` and run `pnpm --filter @workspace/db run push`.

### Cache helper (`artifacts/api-server/src/lib/cache.ts`)

```typescript
import { apiCacheTable, db } from "@workspace/db";
import { eq } from "drizzle-orm";

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** Snap date-like params that are within TTL of "now" to 15-min floor. */
function normalizeParams(params: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  const now = Date.now();
  const END_DATE_RE = /date|time|until|end|to|before/i;
  for (const [k, v] of Object.entries(params)) {
    if (END_DATE_RE.test(k)) {
      const ts = new Date(v).getTime();
      if (!isNaN(ts) && Math.abs(ts - now) < CACHE_TTL_MS) {
        const floored = ts - (ts % CACHE_TTL_MS);
        out[k] = new Date(floored).toISOString();
        continue;
      }
    }
    out[k] = v;
  }
  return out;
}

function buildCacheKey(endpoint: string, params: Record<string, string>): string {
  const sorted = Object.fromEntries(
    Object.entries(normalizeParams(params)).sort(([a], [b]) => a.localeCompare(b)),
  );
  return `${endpoint}:${JSON.stringify(sorted)}`;
}

export async function getCached(key: string): Promise<unknown | null> {
  const [row] = await db
    .select()
    .from(apiCacheTable)
    .where(eq(apiCacheTable.cacheKey, key));
  if (!row) return null;
  if (Date.now() - row.cachedAt.getTime() > CACHE_TTL_MS) return null;
  return row.responseData;
}

export async function setCache(key: string, data: unknown): Promise<void> {
  await db
    .insert(apiCacheTable)
    .values({ cacheKey: key, responseData: data, cachedAt: new Date() })
    .onConflictDoUpdate({
      target: apiCacheTable.cacheKey,
      set: { responseData: data, cachedAt: new Date() },
    });
}

export { buildCacheKey };
```

When using cache in a real route:

- Validate and normalize the incoming params using the `pnpm-workspace` skill's `references/server.md` patterns first.
- Build the cache key from those parsed params, not from raw unvalidated input.
- Wrap only the slow upstream fetch with `getCached()` / `setCache()`. Keep the rest of the route thin.
