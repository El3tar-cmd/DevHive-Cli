# Bootstrap Guide

## IMPORTANT: This Skill Handles Data Fetching and Visualization

**You are already in the correct skill.** When building a visualization app with data from integrations:

- DO NOT use `query-integration-data` skill first
- DO NOT write scripts to `.agents/scripts/` before creating the artifact

The workflow is:

1. Create the artifact with `createArtifact()`
2. Use `searchIntegrations()` / `proposeIntegration()` to connect data sources
3. Write integration data fetching code in api-server routes (`artifacts/api-server/src/routes/`)

## Step 0: Refining Requirements

### Data Source Discovery

1. **User mentioned specific sources** (external databases, APIs, services):
   - `searchIntegrations({ query: "Linear" })`
   - Check status: `"already_setup"`, `"not_setup"`, or `"not_added_to_repl"`
   - If not set up: `proposeIntegration({ integrationId: "connector:ccfg_..." })`
   - **Warehouse with large schema?** Read `references/common-data-sources.md` "Warehouse Schema Exploration (Parallel Pattern)" before Step 1.

2. **No data source specified**: Ask the user. Use `searchIntegrations()` to show available connectors.

3. **Data already in chat context** (CSV files, analysis output):
   - Copy files to `artifacts/api-server/data/` (for user-uploaded files) or `.agents/outputs/` (for output like detailed analysis)
   - Create routes in `artifacts/api-server/src/routes/` to serve data

### Requirements Checklist

- **Data source**: integration, CSV, or API
- **Time range**: specific period? (last quarter, last 30 days)
- **Key metrics**: revenue, users, conversions, etc.
- **Purpose**: what decisions will this inform?

## Step 1: Setup the Project

```javascript
const result = await createArtifact({
    artifactType: "data-visualization",
    slug: "my-dashboard",
    previewPath: "/my-dashboard/",
    title: "My Dashboard"
});
```

**Important:** `createArtifact()` handles workflows, Node.js, and npm deps automatically — dependency installation starts in the background and may still be running when the call returns. Do **not** call `configureWorkflow()`, `installProgrammingLanguage()`, or install deps manually.

**1a. Install data-viz packages:**

```bash
pnpm --filter @workspace/<slug> add react-csv papaparse @tanstack/react-table d3-scale-chromatic
pnpm --filter @workspace/<slug> add -D @types/react-csv @types/papaparse
```

Note: recharts and @tanstack/react-query are already in the react-vite scaffold.

**1b. Patch CSS for data-viz overrides:**

Patch `artifacts/<slug>/src/index.css` to fix Tailwind v4 variants, fonts, shadows, chart colors, and print styles. See `references/common-css-overrides.md` for the full CSS patch instructions. **THESE MUST BE APPLIED**

## Pre-Configured Libraries

- **Recharts** -- included in react-vite scaffold
- **react-csv** -- installed in Step 1a (CSVLink for export)
- **PapaParse** -- installed in Step 1a (CSV parsing)
- **@tanstack/react-table** -- installed in Step 1a (sorting, filtering, pagination)
- **@tanstack/react-query** -- included in react-vite scaffold
- **shadcn/ui** -- included in react-vite scaffold
- **d3-scale-chromatic** -- installed in Step 1a (extended color palettes)

## Step 1.5: OpenAPI Spec + Codegen

Use the `pnpm-workspace` skill's references as the source of truth:

- `references/openapi.md` for spec authoring and codegen
- `references/server.md` for route validation, `Promise<void>`, and route registration
- `references/db.md` for schema layout, `@workspace/db` imports, and push commands

For data-visualization specifically:

- Run codegen before launching the design subagent so generated hooks already exist.

Codegen command:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Route Prefixing / API Access

Use generated hooks from `@workspace/api-client-react` for all data fetching. Do NOT use raw `fetch()` or custom query wrappers.

**Accessing response data:** Generated hooks return data typed as `T` directly:

```typescript
const { data } = useGetSalesData();
const salesRows = data;
```

**Curl testing** -- follow the shared proxy rules from the `pnpm-workspace` skill and go through `localhost:80`:

```bash
curl http://localhost:80/api/{ENDPOINT} | jq '.'
```

## Step 2: Build the App

### Delegate to a Design Subagent

1. Launch design subagent (async) with `startAsyncSubagent()`
2. While it runs, implement api-server routes in `artifacts/api-server/src/routes/`
3. Wait for design subagent to finish

**Always use the design subagent for data-visualization artifacts** — the reference files contain critical layout and styling specifications that the design subagent can consume. You must follow the reference files exactly. The design subagent should express the planned product surface beautifully, not invent net-new features beyond it.

```javascript
await startAsyncSubagent({
    task: `Build the data visualization [DASHBOARD|REPORT|EXPLORER]...`,
    specialization: "DESIGN",
    relevantFiles: [
        // Data-viz specific references
        // Generated hooks + schemas
        // CSS theme file
    ]
});
```

**Task description rules:**

Follow the `design` skill for general delegation guidance. Add these data-viz-specific constraints:

- ONLY discuss features and backend info.
- Do NOT mention layout, fonts, colors, or design terminology.
- Mention that hooks come from `@workspace/api-client-react`.
- Mention that the generated hooks return data typed as `T` directly.
- Tell it to take design inspiration from market leaders.

## Step 2.5: Verify API Endpoints

Dashboard APIs take 7-10s to respond. Screenshots capture immediately, showing loading states. **Use curl first.**

1. **Test endpoints through the shared proxy:**

   ```bash
   curl http://localhost:80/api/{ENDPOINT} | jq '.'
   ```

2. **Check server logs** for successful responses
3. **Screenshot** only after curl confirms APIs work. Sleep for 15s after making a web request to ensure that the data is fully loaded before taking the screenshot.

  ```javascript
  await screenshot({ path: "/my-dashboard/" });
  ```

**Common issues:** 404 = check route registration in `artifacts/api-server/src/routes/index.ts` plus the OpenAPI paths. Empty data = check the route logic, generated validators, and DB state (only if using the app DB). Connection refused = check workflow + logs.
**Slow responses (>10s):** Add DB-backed caching. See `references/common-database.md` for the `api_cache` schema and helpers. Wrap the slow route with `getCached`/`setCache`.

## Step 3: Add Sample Data (Optional)

Place CSV files in `artifacts/api-server/data/`.

For CSV-backed endpoints, use `references/common-csv-parsing.md` for the PapaParse-specific logic and the `pnpm-workspace` skill's `references/server.md` for the route shape itself.

## Step 4: Initialize the Database (If Using Database)

If the visualization uses the app DB, follow `references/common-database.md` plus the `pnpm-workspace` skill's `references/db.md`.
