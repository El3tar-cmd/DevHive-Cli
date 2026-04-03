---
name: data-visualization
description: Build interactive data visualization apps (dashboards, analysis reports, dataset explorers) with React, Recharts, and OpenAPI codegen workflow. Handles all data sources internally including integrations, databases, APIs, and CSV files.
---

# Data Visualization Skill

This skill helps you create interactive data visualization apps with charts, data tables, and CSV handling.

## When to Use

Use this skill when the user asks to:

- **Create a dashboard, report, or data exploration app** with data from any source
- **Build charts, graphs, or data tables**
- **Visualize data** from integrations (Stripe, Google Analytics, Linear, databases, etc.)
- **Create an interactive analytics dashboard** with filters and controls
- **Build a reporting interface**, metrics dashboard, or analysis report
- **Explore or investigate a dataset** with filters and drill-down
- **Combine multiple data sources** into a unified visualization

**Key point:** This skill handles data fetching internally. You do NOT need to query data first using other skills - this skill will use `searchIntegrations()` and `proposeIntegration()` to connect to data sources as part of building the app.

### Example user requests

- "Create a dashboard showing my Stripe revenue"
- "Build a sales analytics dashboard"
- "Analyze my revenue data and present the findings"
- "Create a report explaining why conversions dropped"
- "Let me explore my customer data with filters"
- "Build a tool to browse and filter our product catalog"
- "Visualize this CSV file"

## When NOT to Use

- The user is asking questions about data in chat (e.g., "How many Linear issues were closed last week?") - use `query-integration-data` skill
- The user simply wants to fetch/export/transform data without visualization - use `query-integration-data` skill
- The user is not asking for any visual output or web interface

## Architecture

This skill uses the **react-vite scaffold** with backend conventions from the **`pnpm-workspace` skill**:

1. Create the artifact (`createArtifact()` with type `data-visualization`)
2. Install data-viz packages and patch CSS (chart colors + print styles)
3. Follow the contract-first backend flow from the `pnpm-workspace` skill (`references/openapi.md`, `references/server.md`, `references/db.md`)
4. Launch a design subagent (async) for the frontend
5. Implement API routes in the shared `artifacts/api-server/`

See `references/common-bootstrap.md` for the full step-by-step workflow.

**IMPORTANT:** Data visualization artifacts must use the design subagent workflow. The reference files contain critical layout and styling specifications that only the design subagent can consume. Plan dashboard summary, grouped counts, and trend endpoints in the OpenAPI spec so the design subagent has real hooks for the wow surfaces.

## App Type Classification

Classify the user's request into one of three types. If ambiguous, default to Dashboard.

### Dashboard (default)

**Signals:** "dashboard", "monitor", "KPIs", "metrics overview", "analytics", "track", "real-time"

**Layout:** KPI cards + grid of charts + optional detail table. Wide container (`max-w-[1400px]`).

**Read these references:**

- `references/common-bootstrap.md` — Setup and workflow
- `references/dashboard-workflow.md` — Steps 5-6, checklist, subagent template
- `references/dashboard-layout.md` — Grid patterns, KPI cards
- `references/dashboard-controls.md` — Split refresh with auto-refresh, date filters

**Page structure:** See `references/dashboard-page-structure.md` for composition skeleton

---

### Analysis Report

**Signals:** "report", "analysis", "findings", "explain", "why is", "summarize", "readout", "review", "assessment"

**Layout:** Vertical narrative with embedded charts and written analysis. Narrow container (`max-w-[900px]`).

**Read these references:**

- `references/common-bootstrap.md` — Setup and workflow
- `references/report-workflow.md` — Steps 5-6, checklist, subagent template
- `references/report-layout.md` — Executive summary, section cards, recommendations

**Page structure:** See `references/report-page-structure.md` for composition skeleton

---

### Dataset Explorer

**Signals:** "explore", "investigate", "browse", "filter", "drill down", "search data", "let me query", "look through"

**Layout:** Sidebar filters + central data table + reactive charts. Wide container (`max-w-[1600px]`).

**Read these references:**

- `references/common-bootstrap.md` — Setup and workflow
- `references/explorer-workflow.md` — Steps 5-6, checklist, subagent template
- `references/explorer-layout.md` — Filter sidebar, data table, reactive charts

**Page structure:** See `references/explorer-page-structure.md` for composition skeleton

---

## Common References (all types)

These references apply to all three app types. Read as needed:

- `references/common-chart-patterns.md` — CHART_COLORS, CustomTooltip, CustomLegend, dark mode styling, opacity, animation
- `references/common-chart-types.md` — Chart selection guide, area vs line vs bar, pie/donut best practices
- `references/common-controls.md` — Dark mode toggle, PDF export, simple refresh, CSV export per chart
- `references/common-data-sources.md` — Choose between app DB, integrations, CSV, and direct REST APIs
- `references/common-loading-states.md` — Skeleton patterns, loading states, empty states
- `references/common-csv-parsing.md` — PapaParse for client and server CSV handling
- `references/common-color-guide.md` — Color palette, semantic colors, accessibility
- `references/common-css-overrides.md` — Tailwind v4 CSS patches, fonts, shadows, chart colors, print styles
- `references/common-database.md` — Data-viz-specific DB query shaping and DB-backed API caching
- `references/common-data-tables.md` — TanStack React Table with sorting, filtering, pagination
- `references/detailed-analysis.md` — Guide for generating comprehensive analysis reports
- `references/dashboard-page-structure.md` — Dashboard composition skeleton with generated hooks
- `references/report-page-structure.md` — Report composition skeleton with generated hooks
- `references/explorer-page-structure.md` — Explorer composition skeleton with generated hooks

## Handling Truncated Reference Files

**IMPORTANT:** When reading a reference file, the output may be truncated (indicated by `...[Truncated]` at the end). If truncated, note the last line number shown and re-read the file with `offset` set to that line number minus 10 (for overlap). Repeat until no `...[Truncated]` appears. Do not act on partial instructions from a truncated file.
