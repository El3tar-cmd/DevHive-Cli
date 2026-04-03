# Analysis Report Layout

Analysis reports are narrative-first documents with embedded visuals. They answer a question or explain findings, with charts supporting the written analysis.

## Container

Use a narrow container for readability:

```tsx
<div className="min-h-screen bg-background px-5 py-4 pt-[32px] pb-[32px] pl-[24px] pr-[24px]">
  <div className="max-w-[900px] mx-auto">
    {/* Report content */}
  </div>
</div>
```

## Header

```tsx
<div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
  <div className="pt-2">
    <h1 className="font-bold text-[32px]">Revenue Analysis</h1>
    <p className="text-muted-foreground mt-1.5 text-[14px]">Q4 2024 performance review and findings</p>
    {lastRefreshed && <p className="text-[12px] text-muted-foreground mt-3">Last refresh: {lastRefreshed}</p>}
  </div>
  <div className="flex items-center gap-3 pt-2 print:hidden">
    {/* Simple Refresh + PDF Export + Dark Mode -- NO auto-refresh */}
  </div>
</div>
```

**Controls**: Reports use the simple refresh button (no split/auto-refresh dropdown). Real-time refresh doesn't make sense for narrative analysis.

## Executive Summary Card

The first card in every report. Provides key takeaways for readers who won't scroll further.

```tsx
<Card>
  <CardHeader className="px-6 pt-6 pb-2">
    <CardTitle className="text-lg">Executive Summary</CardTitle>
  </CardHeader>
  <CardContent className="px-6 pb-6">
    <ul className="space-y-2 text-sm text-foreground">
      <li className="flex items-start gap-2">
        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
        <span>Total revenue reached $2.04M, up 12% from Q3, driven by strong November and December performance.</span>
      </li>
      <li className="flex items-start gap-2">
        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
        <span>Online channel contributed 60% of revenue with consistent month-over-month growth averaging 8.4%.</span>
      </li>
      <li className="flex items-start gap-2">
        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
        <span>April and October showed negative growth, suggesting seasonal sensitivity that warrants investigation.</span>
      </li>
    </ul>
  </CardContent>
</Card>
```

## Report Section Card

Each section pairs a heading with an optional chart and narrative text. Stack them vertically with `space-y-6`.

```tsx
<Card>
  <CardHeader className="px-6 pt-6 pb-2 flex-row items-center justify-between space-y-0">
    <CardTitle className="text-lg">Revenue Trend</CardTitle>
    {!loading && data.length > 0 && (
      <CSVLink data={data} filename="revenue-trend.csv" className="print:hidden ..." aria-label="Export chart data as CSV">
        <Download className="w-3.5 h-3.5" />
      </CSVLink>
    )}
  </CardHeader>
  <CardContent className="px-6 pb-6">
    {/* Chart */}
    <ResponsiveContainer width="100%" height={300} debounce={0}>
      <AreaChart data={data}>
        {/* ... chart config ... */}
      </AreaChart>
    </ResponsiveContainer>

    {/* Narrative */}
    <div className="mt-4 space-y-2 text-sm text-foreground leading-relaxed">
      <p>Revenue has followed a steady upward trajectory, with two notable exceptions in April (-4.8%) and October (-3.1%).</p>
      <p>The strongest growth occurred in May (+13.0%) and January (+12.5%), suggesting post-holiday momentum and spring demand surges.</p>
    </div>
  </CardContent>
</Card>
```

## Recommendations Card

The final card. Contains actionable recommendations tied to findings.

```tsx
<Card>
  <CardHeader className="px-6 pt-6 pb-2">
    <CardTitle className="text-lg">Recommendations</CardTitle>
  </CardHeader>
  <CardContent className="px-6 pb-6">
    <ol className="space-y-3 text-sm text-foreground list-decimal list-inside">
      <li><strong>Investigate April/October dips</strong> -- analyze whether these are seasonal, promotional, or operational factors.</li>
      <li><strong>Double down on online channel</strong> -- allocate more marketing budget to digital given consistent 8.4% growth.</li>
      <li><strong>Plan for Q1 momentum</strong> -- January shows strong recovery; prepare inventory and campaigns to capitalize.</li>
    </ol>
  </CardContent>
</Card>
```

## Full Report Structure

```text
Header (title, subtitle, data sources badges, last refresh)
Controls (simple refresh, PDF, dark mode) -- no auto-refresh
Executive Summary Card
<div className="space-y-6">
  Section 1 Card -- heading + chart + narrative
  Section 2 Card -- heading + chart + narrative
  ...more sections as needed...
  Recommendations Card
</div>
```

## Report-Specific Patterns

### Vertical Flow

Reports are read top-to-bottom. Use `space-y-6` between cards, not grid layouts. Charts are embedded within cards alongside text, not in separate grid cells.

### Chart Sizing

Charts in reports should be shorter than dashboard charts since they share space with narrative text:

```tsx
<ResponsiveContainer width="100%" height={280} debounce={0}>
```

### Narrative Text Styling

Use `text-sm text-foreground leading-relaxed` for paragraph text. Use `<strong>` for emphasis within narratives.

```tsx
<div className="mt-4 space-y-2 text-sm text-foreground leading-relaxed">
  <p>Written analysis of what the chart shows...</p>
  <p><strong>Important Point:</strong>...</p>
  <p>Additional context and implications...</p>
</div>
```

### Section Numbering (Optional)

For longer reports, number sections in the heading:

```tsx
<CardTitle className="text-lg">1. Revenue Overview</CardTitle>
<CardTitle className="text-lg">2. Growth Analysis</CardTitle>
<CardTitle className="text-lg">3. Channel Breakdown</CardTitle>
```

## Design Principles

- **Narrow width**: `max-w-[900px]` keeps text readable (65-75 chars per line)
- **Narrative-first**: The written analysis is primary; charts support the text
- **Sequential flow**: Each section builds on the previous one
- **Actionable ending**: Always conclude with specific recommendations
- **No auto-refresh**: Reports are point-in-time snapshots, not live views
