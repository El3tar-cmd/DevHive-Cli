# Dataset Explorer Workflow

Explorer-specific workflow steps that follow the common bootstrap (Steps 0-4 in `common-bootstrap.md`).

## Requirements Refinement

Before building an explorer, clarify:

- **What data?** Which dataset(s) should be explorable?
- **Key dimensions**: What fields should be filterable? (category, date range, value range, status)
- **Primary metric**: What's the main value column? (amount, count, score)
- **Exploration goal**: What are users trying to find? (outliers, patterns, specific records)

Make good default choices:

- If user says "let me explore my sales data", provide text search + value range + category filters
- Default to showing all columns in the table with sorting enabled
- Include summary stats (total, average, min, max) derived from filtered data
- Add 2 reactive charts: for ex. one bar chart for top items, one area chart for trends.

## Column Intelligence Rules

When building charts and stat cards from dynamic/unknown datasets, apply these rules:

### Chart Column Selection

- **Only chart low-cardinality columns** (3-20 unique values). Skip any column where `uniqueValues` is close to `totalRows` (IDs, titles, descriptions, timestamps).
- **Prefer columns like**: status, priority, category, type, assignee, region, department.
- **Never chart**: identifiers, names/titles, URLs, free-text fields, dates with unique-per-row values.
- If no column has ≤20 unique values, derive chart data by bucketing (e.g., group dates by month, bin numeric ranges).

### Stat Card Fallbacks

- If numeric columns exist: show sum, average, min/max of the top numeric columns.
- If NO numeric columns exist: show count-based stats from top categorical columns (e.g., "23 Done", "4 Priority Levels", "9 Assignees"). Never show empty placeholder cards like "Stat 1: --".
- Always fill all 4 stat card slots with meaningful data. The first card is always "Total Records".

## Step 5: Present the Explorer and Describe

After the explorer is built and working:

```javascript
await presentArtifact({artifactId: result.artifactId});
await screenshot({ path: "/my-explorer/" });
```

**CRITICAL RULES:** Same as dashboard -- `presentArtifact` then IMMEDIATELY `screenshot`. No text output, no confirmation questions between them.

### Exploration Summary

After the screenshot, write a 3-5 sentence summary that:

- Describes the dataset loaded (how many records, what fields)
- Highlights what filters are available
- Points out any initial interesting patterns visible in the summary stats or charts

**Example:** "Your sales data explorer is ready with 12 months of data (144 records). You can filter by name, value range, and category. The summary stats show total revenue of $2.04M with an average monthly value of $170K. The top-performing months are December ($225K) and November ($208K)."

## Step 6: Offer Detailed Analysis

Same as dashboard workflow -- use `user_query` to offer a deeper analysis as a markdown file. See `references/detailed-analysis.md`.

After this step, call `suggestDeploy()` so the user knows their report is ready to publish.

## Explorer Subagent Task Template

**NOTE: Make sure to wait for the subagent to complete its work before updating App.tsx with the explorer component.** This will ensure that the user doesn't see a broken state.

```javascript
await subagent({
    task: `Build a dataset explorer.

The app uses generated React Query hooks from @workspace/api-client-react for data fetching. The generated hooks return data typed as T directly.

Please treat the design guidance in the reference files as strict specs. The goal is to ensure the consistent look, feel, and operation of all dataset explorers.

Features needed:
- [describe the dataset, what fields are available, what's filterable]
- Filter sidebar with text search, category dropdown, value range filters, reset button
- Sortable paginated data table as primary element (TanStack React Table)
- Reactive summary stat cards derived from filtered data
- 2 reactive charts that update when filters change
- "X of Y rows" indicator in table header
- Simple refresh, CSV export of filtered data, PDF export, dark mode toggle

Backend info:
- [describe available API endpoints and what data they return]
- Hook imports from @workspace/api-client-react (NOT just api-client-react)`,
    fromPlan: true,
    specialization: "DESIGN",
    relevantFiles: [
        // Data-viz specific references
        ".local/skills/data-visualization/references/explorer-page-structure.md",
        ".local/skills/data-visualization/references/common-chart-patterns.md",
        ".local/skills/data-visualization/references/explorer-layout.md",
        ".local/skills/data-visualization/references/common-data-tables.md",
        ".local/skills/data-visualization/references/common-controls.md",
        ".local/skills/data-visualization/references/common-color-guide.md",
        ".local/skills/data-visualization/references/common-loading-states.md",
        // Generated hooks + theme
        "lib/api-client-react/src/generated/api.ts",
        "lib/api-client-react/src/generated/api.schemas.ts",
        "artifacts/<slug>/src/index.css",
    ]
});
```

## Explorer Requirements Checklist

Every dataset explorer must include:

- [ ] **Filters working** -- Text search, range, and/or category filters apply correctly
- [ ] **Table sortable** -- All columns sortable, pagination working
- [ ] **Charts reactive** -- Charts update when filters change
- [ ] **Row count indicator** -- "X of Y rows" shown in table header
- [ ] **Summary stats** -- Total, average, min, max from filtered data
- [ ] **CSV export** -- Export filtered data + per-chart CSV export buttons
- [ ] **Simple refresh button** -- No auto-refresh dropdown
- [ ] **PDF export** -- `window.print()` button
- [ ] **Dark mode toggle** -- Sun/Moon toggle
- [ ] **Data Sources badges** -- Indicates which data sources were used
- [ ] **Loading skeletons** -- `isLoading || isFetching` for all query-dependent UI
- [ ] **Wide layout** -- `max-w-[1600px]` container
- [ ] **Reset filters** -- Button to clear all filters
