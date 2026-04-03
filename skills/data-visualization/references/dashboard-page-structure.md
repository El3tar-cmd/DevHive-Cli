# Dashboard Page Structure

Condensed composition skeleton for a real-time monitoring dashboard. Dashboards use a wide layout with KPI cards, chart grids, and optional detail tables. They feature split refresh with auto-refresh dropdown for live data updates.

## Imports

```tsx
import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetSalesData } from "@workspace/api-client-react";
import { CSVLink } from "react-csv";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw, ArrowUp, ArrowDown, ChevronDown, Check,
  Sun, Moon, Download, Printer,
} from "lucide-react";
```

Generated hooks come from `@workspace/api-client-react`. Each hook (e.g., `useGetSalesData`) is auto-generated from the OpenAPI/codegen flow. Do NOT write raw `useQuery` calls with `queryKey` strings.

## Data Flow

Generated hooks from `@workspace/api-client-react` return data typed as `T` directly.

```tsx
function Dashboard() {
  const { data, isLoading, isFetching, dataUpdatedAt } = useGetSalesData();

  const salesData = data || [];

  // Derive metrics from the unwrapped array
  const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
  const avgValue = salesData.length > 0 ? totalRevenue / salesData.length : 0;
  const maxMonth = salesData.reduce((max, d) => (d.revenue > max.revenue ? d : max), salesData[0]);
  const growthRate = salesData.length >= 2
    ? ((salesData[salesData.length - 1].revenue - salesData[0].revenue) / salesData[0].revenue) * 100
    : 0;

  const loading = isLoading || isFetching;
  // ...
}
```

## Constants

Define at the top of the file, outside the component:

```tsx
const CHART_COLORS = {
  blue: "#0079F2",
  purple: "#795EFF",
  green: "#009118",
  red: "#A60808",
  pink: "#ec4899",
};

const DATA_SOURCES: string[] = []; // Ex. "App DB", "Linear", "BigQuery", etc.
```

## State

```tsx
const [isDark, setIsDark] = useState(false);
const [autoRefresh, setAutoRefresh] = useState(false);
const [isSpinning, setIsSpinning] = useState(false);
const [dropdownOpen, setDropdownOpen] = useState(false);
const [selectedIntervalMs, setSelectedIntervalMs] = useState(5 * 60 * 1000);
```

Derive `lastRefreshed` from `dataUpdatedAt` (see `common-controls.md`).

## JSX Skeleton

**CRITICAL: Use these exact class names and values. Do not add shadow-*, border-b, or hover: classes to Card components.**

```tsx
<div className="min-h-screen bg-background px-5 py-4 pt-[32px] pb-[32px] pl-[24px] pr-[24px]">
  <div className="max-w-[1400px] mx-auto">

    {/* ── Header ── */}
    <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="pt-2">
        <h1 className="font-bold text-[32px]">Sales Dashboard</h1>
        <p className="text-muted-foreground mt-1.5 text-[14px]">Overview of sales performance</p>
        {/* Data Sources Badges: see common-controls.md for full markup */}
        {lastRefreshed && <p className="text-[12px] text-muted-foreground mt-3">Last refresh: {lastRefreshed}</p>}
      </div>
      <div className="flex items-center gap-3 pt-2 print:hidden">
        {/* Split Refresh: see dashboard-controls.md for full markup */}
        {/* IMPORTANT: PDF and dark mode buttons must use inline styles, NOT shadcn <Button>: */}
        <button
          onClick={() => window.print()}
          className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors"
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
        >
          <Printer className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setIsDark((d) => !d)}
          className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors"
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>

    {/* ── KPI Row ── */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      {/* 4 KPI cards: Total Revenue, Avg Order Value, Growth Rate, Best Month */}
      {/* Each card: loading ? <Skeleton /> : <value style={{ color: "#0079F2" }}> */}
      {/* KPI cards do NOT get CSV export buttons */}
    </div>

    {/* ── Charts Grid ── */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <Card>
        <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Monthly Revenue</CardTitle>
          {/* CSVLink download button -- every chart card must have one */}
          {!loading && salesData.length > 0 && (
            <CSVLink data={salesData} filename="monthly-revenue.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }} aria-label="Export chart data as CSV">
              <Download className="w-3.5 h-3.5" />
            </CSVLink>
          )}
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="w-full h-[300px]" /> : (
            <ResponsiveContainer width="100%" height={300} debounce={0}>
              <AreaChart data={salesData}>{/* ... */}</AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Category Breakdown</CardTitle>
          {/* CSVLink for this chart's data */}
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="w-full h-[300px]" /> : (
            <ResponsiveContainer width="100%" height={300} debounce={0}>
              <BarChart data={categoryData}>{/* ... */}</BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>

    {/* ── Optional Detail Table ── */}
    <Card>
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-base">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : (
          /* Sortable paginated table */
          null
        )}
      </CardContent>
    </Card>

  </div>
</div>
```

## Key Patterns

- **Loading state:** Use `isLoading || isFetching` so skeletons show during both initial load and refresh (see Data Flow above)
- **Derived metrics:** Compute KPI values from the unwrapped data array — do not make separate API calls for summary stats
- **CSV export:** Every chart card needs a `CSVLink` button in `CardHeader`. KPI cards do not. Only render when `!loading && data.length > 0`
- **Auto-refresh:** `useQueryClient().invalidateQueries()` on interval — see `dashboard-controls.md` for full split-refresh markup
- **Dark mode colors:** `const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5"` / `const tickColor = isDark ? "#98999C" : "#71717a"`
