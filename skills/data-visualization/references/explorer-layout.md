# Dataset Explorer Layout

Dataset explorers are interactive investigation tools. The data table is the primary element, with filters and reactive charts that respond to filter state.

## Container

Use a wide container for workspace feel:

```tsx
<div className="min-h-screen bg-background px-5 py-4 pt-[32px] pb-[32px] pl-[24px] pr-[24px]">
  <div className="max-w-[1600px] mx-auto">
    {/* Explorer content */}
  </div>
</div>
```

## Header

```tsx
<div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
  <div className="pt-2">
    <h1 className="font-bold text-[32px]">Sales Explorer</h1>
    <p className="text-muted-foreground mt-1.5 text-[14px]">Filter, search, and analyze sales data</p>
    {lastRefreshed && <p className="text-[12px] text-muted-foreground mt-3">Last refresh: {lastRefreshed}</p>}
  </div>
  <div className="flex items-center gap-3 pt-2 print:hidden">
    {/* Simple Refresh + CSV Export (filtered data) + PDF + Dark Mode */}
  </div>
</div>
```

**Controls**: Simple refresh button (no auto-refresh), CSV export of filtered data, PDF export, dark mode toggle.

## Summary Stats Row

Small stat cards derived from the currently filtered data:

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
  <Card>
    <CardContent className="p-4">
      <p className="text-xs text-muted-foreground">Total Records</p>
      <p className="text-xl font-bold" style={{ color: "#0079F2" }}>{filteredData.length}</p>
    </CardContent>
  </Card>
  <Card>
    <CardContent className="p-4">
      <p className="text-xs text-muted-foreground">Total Value</p>
      <p className="text-xl font-bold" style={{ color: "#0079F2" }}>${totalValue.toLocaleString()}</p>
    </CardContent>
  </Card>
  <Card>
    <CardContent className="p-4">
      <p className="text-xs text-muted-foreground">Average</p>
      <p className="text-xl font-bold" style={{ color: "#0079F2" }}>${avgValue.toFixed(0)}</p>
    </CardContent>
  </Card>
  <Card>
    <CardContent className="p-4">
      <p className="text-xs text-muted-foreground">Max Value</p>
      <p className="text-xl font-bold" style={{ color: "#0079F2" }}>${maxValue.toLocaleString()}</p>
    </CardContent>
  </Card>
</div>
```

These stats update reactively as filters change.

## Sidebar + Content Grid

```tsx
<div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
  {/* Sidebar - 1 column */}
  <Card className="lg:col-span-1 lg:sticky lg:top-8">
    <CardHeader className="px-4 pt-4 pb-2">
      <CardTitle className="text-base">Filters</CardTitle>
    </CardHeader>
    <CardContent className="px-4 pb-4 space-y-4">
      {/* Filter controls */}
    </CardContent>
  </Card>

  {/* Content - 4 columns */}
  <div className="lg:col-span-4 space-y-4">
    {/* Data table */}
    {/* Charts */}
  </div>
</div>
```

## Filter Sidebar Patterns

### Text Search Filter

```tsx
<div>
  <label className="text-xs text-muted-foreground mb-1 block">Search</label>
  <Input
    placeholder="Search by name..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="h-8 text-sm"
  />
</div>
```

### Number Range Filter

```tsx
<div>
  <label className="text-xs text-muted-foreground mb-1 block">Value Range</label>
  <div className="flex items-center gap-2">
    <Input
      type="number"
      placeholder="Min"
      value={minValue}
      onChange={(e) => setMinValue(e.target.value)}
      className="h-8 text-sm"
    />
    <span className="text-muted-foreground text-xs">to</span>
    <Input
      type="number"
      placeholder="Max"
      value={maxValue}
      onChange={(e) => setMaxValue(e.target.value)}
      className="h-8 text-sm"
    />
  </div>
</div>
```

### Categorical Dropdown Filter

```tsx
<div>
  <label className="text-xs text-muted-foreground mb-1 block">Category</label>
  <select
    value={selectedCategory}
    onChange={(e) => setSelectedCategory(e.target.value)}
    className="w-full h-8 text-sm border rounded px-2 bg-background"
  >
    <option value="">All Categories</option>
    {categories.map((cat) => (
      <option key={cat} value={cat}>{cat}</option>
    ))}
  </select>
</div>
```

### Reset Filters Button

```tsx
<Button
  variant="outline"
  size="sm"
  className="w-full"
  onClick={() => {
    setSearchTerm("");
    setMinValue("");
    setMaxValue("");
    setSelectedCategory("");
  }}
>
  Reset Filters
</Button>
```

## Client-Side Filtering

Apply filters in a `useMemo` to derive filtered data from the full dataset:

```tsx
const filteredData = useMemo(() => {
  let result = allData;

  if (searchTerm) {
    result = result.filter((row) =>
      row.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (minValue !== "") {
    result = result.filter((row) => row.value >= Number(minValue));
  }

  if (maxValue !== "") {
    result = result.filter((row) => row.value <= Number(maxValue));
  }

  if (selectedCategory) {
    result = result.filter((row) => row.category === selectedCategory);
  }

  return result;
}, [allData, searchTerm, minValue, maxValue, selectedCategory]);
```

## Data Table as Primary Element

The table is the centerpiece. Use TanStack React Table with `getCoreRowModel`, `getSortedRowModel`, `getPaginationRowModel`, `pageSize: 10`. Show "X of Y rows" so users see filter impact. Include Previous/Next pagination buttons. See `common-data-tables.md` for more details on `DataTable`.

```tsx
// Initialize the DataTable (see `common-data-tables.md`)

<Card>
  <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
    <CardTitle className="text-base">
      Data ({filteredData.length} of {allData.length} rows)
    </CardTitle>
    {/* CSV export of filtered data */}
  </CardHeader>
  <CardContent className="px-4 pb-4">
    <DataTable data={filteredData} columns={columns} />
  </CardContent>
</Card>
```

## Reactive Charts

Charts respond to the same filtered data as the table:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <Card>
    <CardHeader className="px-4 pt-4 pb-2">
      <CardTitle className="text-base">Top Items by Value</CardTitle>
    </CardHeader>
    <CardContent className="px-4 pb-4">
      <ResponsiveContainer width="100%" height={250} debounce={0}>
        <BarChart data={filteredData.slice(0, 10)}>
          {/* Chart using filteredData */}
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>

  <Card>
    <CardHeader className="px-4 pt-4 pb-2">
      <CardTitle className="text-base">Value Trend</CardTitle>
    </CardHeader>
    <CardContent className="px-4 pb-4">
      <ResponsiveContainer width="100%" height={250} debounce={0}>
        <AreaChart data={filteredData}>
          {/* Chart using filteredData */}
        </AreaChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
</div>
```

## Full Explorer Structure

```text
Header (title, subtitle, data sources badges, last refresh)
Controls (simple refresh, CSV export, PDF, dark mode)
Summary Stats Row (4 cards from filtered data)
Sidebar + Content Grid:
  Sidebar Card (search, range filter, category dropdown, reset)
  Content:
    Data Table Card (sortable, paginated, "X of Y rows")
    Charts Row (2-col grid, reactive to filtered data)
```

## Design Principles

- **Wide layout**: `max-w-[1600px]` for workspace feel
- **Table-first**: The data table is the primary element
- **Reactive**: All views (stats, table, charts) respond to filter state
- **Client-side filtering**: Filter locally for instant response
- **Row count**: Always show "X of Y rows" so users know filter impact
