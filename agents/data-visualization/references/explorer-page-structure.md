# Explorer Page Structure

Condensed composition skeleton for an interactive dataset explorer. Explorers are wide-layout investigation tools with a filter sidebar, sortable paginated table as the primary element, and reactive charts that respond to filter state. All views (stats, table, charts) update when filters change.

## Imports

```tsx
import { useQueryClient } from "@tanstack/react-query";
import { useGetExplorerData } from "@workspace/api-client-react";
import { CSVLink } from "react-csv";
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel,
  flexRender, type ColumnDef, type SortingState,
} from "@tanstack/react-table";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Sun, Moon, Download, Printer } from "lucide-react";
```

Generated hooks come from `@workspace/api-client-react`. Do NOT write raw `useQuery` calls with `queryKey` strings.

## Data Flow

Generated hook provides the full dataset. Client-side filtering via `useMemo` derives the visible subset.

```tsx
const { data, isLoading, isFetching, dataUpdatedAt } = useGetExplorerData();
const allData = data || [];

const filteredData = useMemo(() => {
  let result = allData;
  if (searchTerm) result = result.filter((r) => r.name.toLowerCase().includes(searchTerm.toLowerCase()));
  if (minValue !== "") result = result.filter((r) => r.value >= Number(minValue));
  if (maxValue !== "") result = result.filter((r) => r.value <= Number(maxValue));
  if (selectedCategory) result = result.filter((r) => r.category === selectedCategory);
  return result;
}, [allData, searchTerm, minValue, maxValue, selectedCategory]);

// Summary stats: use numeric columns if available, otherwise count-based categorical stats
// Numeric: show sum/avg/max of top numeric column
// Non-numeric fallback: show count of unique values in top categorical columns (3-20 unique)
// Never leave stat cards empty — always derive something meaningful from the data

const loading = isLoading || isFetching;
```

## State

```tsx
// Filter state
const [searchTerm, setSearchTerm] = useState("");
const [minValue, setMinValue] = useState("");
const [maxValue, setMaxValue] = useState("");
const [selectedCategory, setSelectedCategory] = useState("");

// Table state
const [sorting, setSorting] = useState<SortingState>([]);

// UI state
const [isDark, setIsDark] = useState(false);
const [isSpinning, setIsSpinning] = useState(false);
```

Explorers use simple refresh only -- no auto-refresh state. Derive `lastRefreshed` from `dataUpdatedAt` (see `common-controls.md`). Derive categories from data:

```tsx
const categories = useMemo(() => [...new Set(allData.map((d) => d.category))].sort(), [allData]);
```

## Table Setup

```tsx
const table = useReactTable({
  data: filteredData,
  columns,
  state: { sorting },
  onSortingChange: setSorting,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  initialState: { pagination: { pageSize: 10 } },
});
```

See `common-data-tables.md` for full column definitions, sortable headers with `flexRender`, and pagination controls (Previous/Next buttons + "X of Y rows" indicator).

## JSX Skeleton

```tsx
<div className="min-h-screen bg-background px-5 py-4 pt-[32px] pb-[32px] pl-[24px] pr-[24px]">
  <div className="max-w-[1600px] mx-auto">

    {/* ── Header ── */}
    <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="pt-2">
        <h1 className="font-bold text-[32px]">Sales Explorer</h1>
        <p className="text-muted-foreground mt-1.5 text-[14px]">Filter, search, and analyze</p>
        {lastRefreshed && <p className="text-[12px] text-muted-foreground mt-3">...</p>}
      </div>
      <div className="flex items-center gap-3 pt-2 print:hidden">
        {/* Simple Refresh | CSV of filteredData | PDF Export | Dark Mode */}
      </div>
    </div>

    {/* ── Summary Stats (4 cards from filteredData) ── */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      {/* Total Records | Total Value | Average | Max Value */}
      {/* Each: loading ? <Skeleton /> : <value style={{ color: "#0079F2" }}> */}
    </div>

    {/* ── Sidebar + Content Grid ── */}
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

      {/* Sidebar (1 col): Filters card */}
      <Card className="lg:col-span-1 lg:sticky lg:top-8">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          {/* Search Input (see explorer-layout.md) */}
          {/* Category Dropdown */}
          {/* Min/Max Range Inputs */}
          {/* Reset Filters Button */}
        </CardContent>
      </Card>

      {/* Content (4 cols) */}
      <div className="lg:col-span-4 space-y-4">

        {/* Sortable paginated table (see common-data-tables.md) */}
        <Card>
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-base">
              Data ({filteredData.length} of {allData.length} rows)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {/* loading ? table skeleton : sortable table + pagination */}
          </CardContent>
        </Card>

        {/* Reactive charts (2-col grid, use filteredData) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Top Items by Value</CardTitle>
              {/* CSVLink */}
            </CardHeader>
            <CardContent>{/* BarChart h={250} data={filteredData.slice(0, 10)} */}</CardContent>
          </Card>
          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Value Distribution</CardTitle>
              {/* CSVLink */}
            </CardHeader>
            <CardContent>{/* AreaChart h={250} data={filteredData} */}</CardContent>
          </Card>
        </div>

      </div>
    </div>
  </div>
</div>
```

## Key Patterns

### Client-Side Filtering

The generated hook fetches the full dataset once. `useMemo` derives the filtered subset reactively. All views (stats, table, charts) consume `filteredData`.

### Summary Stats from Filtered Data

Stats cards reflect the currently filtered subset, not the full dataset. They update instantly as filters change.

### Table as Primary Element

The table is the centerpiece. See `explorer-layout.md` for more details.

### Reactive Charts

Charts use `filteredData` (not `allData`), updating in sync with filter changes. Chart height is 250px.

### Header CSV Export

Header-level CSV exports the full `filteredData` array. Individual chart cards also have CSVLink buttons for chart-specific data slices.

## See Also

- `explorer-layout.md` -- container width, sidebar+content grid, filter sidebar patterns, summary stats
- `common-data-tables.md` -- TanStack React Table setup, column definitions, pagination, sorting
- `common-chart-patterns.md` -- CHART_COLORS, CustomTooltip, CustomLegend, opacity rules
- `common-controls.md` -- simple refresh, dark mode toggle, PDF export, CSV export styling, Data Sources badges
- `common-loading-states.md` -- skeleton patterns for tables, charts, and stats cards
