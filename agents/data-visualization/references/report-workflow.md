# Analysis Report Workflow

Report-specific workflow steps that follow the common bootstrap (Steps 0-4 in `common-bootstrap.md`).

## Requirements Refinement

Before building a report, clarify the core question:

- **What question is this report answering?** (e.g., "Why did revenue dip in October?")
- **Who is the audience?** (executive summary depth depends on this)
- **What data sources are relevant?**
- **What time period should be covered?**

Make good default choices:

- If user says "analyze my sales data", default to last 12 months
- If user says "explain why revenue dropped", focus on the period around the drop
- Always include an executive summary and recommendations

## Step 5: Present the Report and Summarize

After the report is built and working:

```javascript
await presentArtifact({artifactId: result.artifactId});
await screenshot({ path: "/my-report/" });
```

**CRITICAL RULES:** Same as dashboard -- `presentArtifact` then IMMEDIATELY `screenshot`. No text output, no confirmation questions between them.

### Analysis Summary

After the screenshot, write a 3-5 sentence summary that:

- Directly answers the user's question
- Highlights the 2-3 most important findings from the report
- References specific numbers from the executive summary

**Example:** "Your revenue analysis report is ready. Key finding: Q4 revenue reached $2.04M (+12% QoQ), but April and October both showed negative growth suggesting seasonal vulnerability. The online channel is your strongest performer with consistent 8.4% average growth."

## Step 6: Offer Detailed Analysis

Same as dashboard workflow -- use `user_query` to offer a deeper analysis report as a markdown file. See `references/detailed-analysis.md`.

After this step, call `suggestDeploy()` so the user knows their report is ready to publish.

## Report Subagent Task Template

**NOTE: Make sure to wait for the subagent to complete its work before updating App.tsx with the report component.** This will ensure that the user doesn't see a broken state.

```javascript
await subagent({
    task: `Build an analysis report.

The app uses generated React Query hooks from @workspace/api-client-react for data fetching. The generated hooks return data typed as T directly.

Please treat the design guidance in the reference files as strict specs. The goal is to ensure the consistent look, feel, and operation of all reports.

Features needed:
- [describe the report topic, what question it answers]
- Executive summary with 3-5 bullet points
- Section cards with chart + narrative text analysis
- Recommendations section with actionable items
- Simple refresh button (no auto-refresh -- reports are snapshots)
- CSV export per chart, PDF export via window.print()
- Dark mode toggle

Backend info:
- [describe available API endpoints and what data they return]
- Hook imports from @workspace/api-client-react (NOT just api-client-react)`,
    fromPlan: true,
    specialization: "DESIGN",
    relevantFiles: [
        // Data-viz specific references
        ".local/skills/data-visualization/references/report-page-structure.md",
        ".local/skills/data-visualization/references/common-chart-types.md",
        ".local/skills/data-visualization/references/common-chart-patterns.md",
        ".local/skills/data-visualization/references/report-layout.md",
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

## Report Requirements Checklist

Every analysis report must include:

- [ ] **Executive summary** -- 3-5 bullet points at the top
- [ ] **Narrative per section** -- Each chart has accompanying text analysis
- [ ] **Recommendations** -- Actionable items at the end
- [ ] **CSV export per chart** -- CSVLink download button in chart CardHeaders
- [ ] **Simple refresh button** -- No auto-refresh dropdown
- [ ] **PDF export** -- `window.print()` button
- [ ] **Dark mode toggle** -- Sun/Moon toggle
- [ ] **Data Sources badges** -- Indicates which data sources were used
- [ ] **Loading skeletons** -- `isLoading || isFetching` for all query-dependent UI
- [ ] **Narrow layout** -- `max-w-[900px]` container
