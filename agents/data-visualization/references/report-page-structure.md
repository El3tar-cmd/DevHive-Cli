# Report Page Structure

Condensed composition skeleton for a narrative analysis report. Reports are document-style pages with an executive summary, section cards pairing charts with written analysis, and actionable recommendations. They use a narrow layout and simple refresh (no auto-refresh -- reports are point-in-time snapshots).

## Imports

```tsx
import { useQueryClient } from "@tanstack/react-query";
import { useGetReportData } from "@workspace/api-client-react";
import { CSVLink } from "react-csv";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Sun, Moon, Download, Printer } from "lucide-react";
```

Generated hooks come from `@workspace/api-client-react`. Do NOT write raw `useQuery` calls with `queryKey` strings.

## Data Flow

Generated hooks from `@workspace/api-client-react` return data typed as `T` directly.

```tsx
function AnalysisReport() {
  const { data, isLoading, isFetching, dataUpdatedAt } = useGetReportData();

  const reportData = data || [];

  // Derive analysis metrics
  const totalRevenue = reportData.reduce((sum, d) => sum + d.revenue, 0);
  const avgGrowth = reportData.length > 1
    ? reportData.slice(1).reduce((sum, d, i) => sum + ((d.revenue - reportData[i].revenue) / reportData[i].revenue) * 100, 0) / (reportData.length - 1)
    : 0;
  const maxMonth = reportData.reduce((max, d) => (d.revenue > max.revenue ? d : max), reportData[0]);
  const negativeGrowthMonths = reportData.slice(1).filter((d, i) => d.revenue < reportData[i].revenue);

  const loading = isLoading || isFetching;
  // ...
}
```

## State

```tsx
const [isDark, setIsDark] = useState(false);
const [isSpinning, setIsSpinning] = useState(false);
```

Reports use simple refresh only -- no `autoRefresh`, `dropdownOpen`, or `selectedIntervalMs` state.

Derive `lastRefreshed` from `dataUpdatedAt` (see `common-controls.md`).

## JSX Skeleton

**CRITICAL: Use these exact class names and values. Do not add shadow-*, border-b, or hover: classes to Card components.**

```tsx
<div className="min-h-screen bg-background px-5 py-4 pt-[32px] pb-[32px] pl-[24px] pr-[24px]">
  <div className="max-w-[900px] mx-auto">

    {/* ── Header ── */}
    <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="pt-2">
        <h1 className="font-bold text-[32px]">Revenue Analysis</h1>
        <p className="text-muted-foreground mt-1.5 text-[14px]">Q4 performance review and findings</p>
        {/* Data Sources Badges: see common-controls.md for full markup */}
        {lastRefreshed && <p className="text-[12px] text-muted-foreground mt-3">Last refresh: {lastRefreshed}</p>}
      </div>
      <div className="flex items-center gap-3 pt-2 print:hidden">
        {/* Simple Refresh button (NO split/auto-refresh -- reports are snapshots) */}
        {/* PDF Export button (Printer icon, window.print()) */}
        {/* Dark Mode toggle (Sun/Moon) */}
      </div>
    </div>

    {/* ── Executive Summary ── */}
    <Card className="mb-6">
      <CardHeader className="px-6 pt-6 pb-2">
        <CardTitle className="text-lg">Executive Summary</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
        ) : (
          <ul className="space-y-2 text-sm text-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              <span>Total revenue reached ${totalRevenue.toLocaleString()}, driven by ...</span>
            </li>
            {/* Additional bullet points with blue dot indicators */}
          </ul>
        )}
      </CardContent>
    </Card>

    {/* ── Section Cards (chart + narrative) ── */}
    <div className="space-y-6">

      {/* Section 1: Revenue Trend */}
      <Card>
        <CardHeader className="px-6 pt-6 pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Revenue Trend</CardTitle>
          {!loading && reportData.length > 0 && (
            <CSVLink data={reportData} filename="revenue-trend.csv" className="print:hidden ..." aria-label="Export chart data as CSV">
              <Download className="w-3.5 h-3.5" />
            </CSVLink>
          )}
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {loading ? <Skeleton className="w-full h-[280px]" /> : (
            <ResponsiveContainer width="100%" height={280} debounce={0}>
              <AreaChart data={reportData}>{/* ... */}</AreaChart>
            </ResponsiveContainer>
          )}
          {/* Narrative text below the chart */}
          {!loading && (
            <div className="mt-4 space-y-2 text-sm text-foreground leading-relaxed">
              <p>Revenue has followed a steady upward trajectory, with notable exceptions in ...</p>
              <p>The strongest growth occurred in ... suggesting ...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Growth Analysis */}
      <Card>
        <CardHeader className="px-6 pt-6 pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Growth Analysis</CardTitle>
          {/* CSVLink */}
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {/* Chart at 280px height + narrative text below */}
        </CardContent>
      </Card>

      {/* Additional sections as needed... */}

      {/* ── Recommendations ── */}
      <Card>
        <CardHeader className="px-6 pt-6 pb-2">
          <CardTitle className="text-lg">Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
            </div>
          ) : (
            <ol className="space-y-3 text-sm text-foreground list-decimal list-inside">
              <li><strong>Investigate dip months</strong> -- analyze whether these are seasonal or operational factors.</li>
              <li><strong>Expand top channel</strong> -- allocate more budget to the highest-growth channel.</li>
              <li><strong>Plan for momentum periods</strong> -- prepare inventory and campaigns for high-growth months.</li>
            </ol>
          )}
        </CardContent>
      </Card>

    </div>
  </div>
</div>
```

## Key Patterns

### Chart Height

Report charts use `height={280}` (shorter than dashboard's 300px) because they share vertical space with narrative text.

### Narrative Text

Each section card pairs a chart with explanatory text below it (see `report-layout.md` for full markup).

### Executive Summary Bullets

Blue dot indicators for key takeaways (see `report-layout.md` for full markup).

### No Auto-Refresh

Reports are point-in-time snapshots. Simple refresh only (no split dropdown, no interval selection).

### Vertical Flow

Use `space-y-6` between cards. Charts are embedded within section cards alongside text, not in side-by-side grid cells.

## See Also

- `report-layout.md` -- container width, section card structure, narrative styling, recommendations format
- `common-chart-patterns.md` -- CHART_COLORS, CustomTooltip, CustomLegend, opacity rules
- `common-controls.md` -- simple refresh, dark mode toggle, PDF export, last refresh timestamp, Data Sources badges
- `common-loading-states.md` -- skeleton patterns for charts and text blocks
