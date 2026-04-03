# Data Sources and Integrations

## App Database vs External Sources

**Critical distinction:**

- **App's own database** (Postgres): Access directly using Drizzle ORM. No integration needed.
- **External/third-party sources**: Use integrations when available (Stripe, Google Analytics, Linear, etc.)

**When it's unclear**: If the user mentions data stored in their app (users, orders, posts), start with the app database. If they mention third-party services by name, check integrations first.

## Priority 1: App Database Access (Drizzle ORM)

For apps that use the built-in Postgres database with Drizzle ORM, see `references/common-database.md`. That reference layers data-viz-specific guidance on top of the `pnpm-workspace` skill's `references/db.md` and `references/server.md`.

## Priority 2: External Data Sources (Integrations)

1. Search: `searchIntegrations({ query: "stripe" })`
2. Check status: `"already_setup"`, `"not_setup"`, or `"not_added_to_repl"`
3. Use existing integrations -- they handle auth, secrets, and setup automatically

### CRITICAL: Efficient Data Fetching from Integration SDKs

**Integration SDKs use lazy-loading.** Accessing `issue.state`, `charge.customer`, etc. triggers a separate API call per object. 70 items × 3 relations = 210+ calls → rate limit or timeout. **Never await related objects inside a loop.**
**Batch strategies (pick first that applies):**

1. **Raw GraphQL** (Linear, GitHub): Use `fetch("https://api.linear.app/graphql", ...)` with nested field selection (`state { name type }`, `assignee { displayName }`) to get everything in one request. Do NOT use SDK methods that lazy-load relations.
2. **SDK expansion params**: `expand` (Stripe), `associations` (HubSpot), `include` params.
3. **Parallel lookup + join**: Fetch main list + reference tables via `Promise.all()`, join in memory.

| Approach              | 70 items × 3 relations | Result             |
| --------------------- | ---------------------- | ------------------ |
| ❌ Lazy-loading (N+1) | 210+ API calls         | rate limit/timeout |
| ✅ Any batch strategy | 1-3 API calls          | 2-5s               |

### CRITICAL: Server-Side Caching for Slow or Rate-Limited Endpoints

Dashboards hit 5-7 endpoints per load, all sharing one API token. Without caching, API calls multiply on every refresh and hit rate limits. **When curl shows >10s response times in Step 2.5**, add DB-backed caching (15-min TTL, survives restarts). See `references/common-database.md` for the `api_cache` schema, cache helpers, and route integration guidance.

### Pagination: Exhaustive Search

When searching for items via paginated APIs, **iterate through ALL pages** before concluding an item that a user mentioned doesn't exist. Always check `hasNextPage`/`has_more` and follow cursors until exhausted.

### Warehouse Schema Exploration (Parallel Pattern)

When building from a warehouse with 15+ tables, use parallel subagents to explore before creating the artifact:

```javascript
// 1. Discover tables
const tables = await executeSql({ sqlQuery: `SELECT table_schema, table_name FROM INFORMATION_SCHEMA.TABLES`, target: "bigquery" });

// 2. Group tables into clusters by schema/prefix/relevance

// 3. Launch parallel subagents to explore each group
const groupA = await startAsyncSubagent({
  task: `Explore these BigQuery tables: analytics.events, analytics.sessions...
  For each: query COLUMNS and SELECT * LIMIT 5.
  Return: relevance, column details, join conditions.`,
  specialization: 'SMALL_TASK',
});

// 4. Wait for all exploration, then createArtifact()
```

**Key points:** Happens BEFORE `createArtifact()`. Use `SMALL_TASK` specialization. Keep to 2-4 subagents. Skip for schemas with <15 tables.

## CSV Data

- Store static CSV files under `artifacts/api-server/data/`.
- Use the PapaParse-specific patterns in `references/common-csv-parsing.md`.
- Implement the route itself using the `pnpm-workspace` skill's `references/server.md` guidance rather than inventing a custom route style here.

## Direct REST APIs

If an exhaustive search of a user's integrations isn't successful, or if a user specifically asks to integrate with a particular API that we don't have an integration for.

- Call the upstream API from `artifacts/api-server/src/routes/`.
- Validate request and response shapes using the `pnpm-workspace` skill's `references/server.md` patterns.
- Set a timeout on upstream fetches, for example `AbortSignal.timeout(10_000)`, so slow providers fail predictably.
- Add DB-backed caching when endpoints are slow or rate-limited. See `references/common-database.md`.

## Dashboard Header: Data Sources Badges

Every app displays its data sources as badges in the header. You **must** keep the `DATA_SOURCES` constant in the tsx file in sync whenever you add or remove a data source handler.

**Rules:**

- **Always update `DATA_SOURCES`** when adding or removing a source handler in the api-server
- **"App DB" first** — if any handler uses Drizzle (the app's own database), `"App DB"` must be the first entry
- **Use display names** — e.g., `"Stripe"`, `"Google Analytics"`, `"BigQuery"`, `"Linear"`, `"CSV Upload"`
- **One entry per distinct source** — deduplicate (e.g., if two handlers both query Stripe, list `"Stripe"` once)

See `references/common-controls.md` "Data Sources Badges" section for the full JSX pattern and styling.
