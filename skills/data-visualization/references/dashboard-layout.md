# Dashboard Layout Patterns

## Grid-Based Dashboard

Use Tailwind's grid system for responsive dashboard layouts:

```tsx
function Dashboard() {
  return (
    <div className="p-4 space-y-4">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Revenue" value="$125,000" change="+12%" trend="up" />
        <KPICard title="Active Users" value="1,234" change="+5%" trend="up" />
        <KPICard title="Conversion Rate" value="3.2%" change="-0.5%" trend="down" />
        <KPICard title="Avg Order Value" value="$85" change="+8%" trend="up" />
      </div>

      {/* Main Charts - Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle>Revenue</CardTitle></CardHeader><CardContent><RevenueChart /></CardContent></Card>
        <Card><CardHeader><CardTitle>Categories</CardTitle></CardHeader><CardContent><CategoryChart /></CardContent></Card>
      </div>

      {/* Full-Width Detail Table */}
      <Card><CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader><CardContent><DataTable /></CardContent></Card>
    </div>
  );
}
```

**CardTitle styling:** Always use `<CardTitle className="text-base">` for chart card titles. Do NOT add `font-medium` or `font-semibold` — CardTitle already has its own weight.

## KPI Cards

### KPI Card Value Colors

1. **Default**: All KPI values use `style={{ color: "#0079F2" }}` (`CHART_COLORS.blue`)
2. **Semantic exception**: Green (`#009118`) for positive metrics, Red (`#A60808`) for negative
3. **Consistency**: Within a dashboard, all KPI values should be blue unless there's a clear semantic reason
4. **Never** assign random colors for visual variety

### KPI Card Component

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

function KPICard({ title, value, change, trend }: { title: string; value: string; change: string; trend: "up" | "down" }) {
  const isPositive = trend === "up";
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold mt-1" style={{ color: "#0079F2" }}>{value}</p>
        <div className="flex items-center gap-1 mt-1">
          {isPositive ? <ArrowUpIcon className="w-4 h-4 text-green-600" /> : <ArrowDownIcon className="w-4 h-4 text-red-600" />}
          <span className={`text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>{change}</span>
          <span className="text-sm text-muted-foreground">from last period</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

### KPI Card with Sparkline

```tsx
import { LineChart, Line, ResponsiveContainer } from "recharts";

function KPICardWithSparkline({ title, value, change, trend, sparklineData }: { title: string; value: string; change: string; trend: "up" | "down"; sparklineData: Array<{ value: number }> }) {
  const isPositive = trend === "up";
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: "#0079F2" }}>{value}</p>
            <p className={`text-sm mt-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>{change} from last period</p>
          </div>
          <ResponsiveContainer width={80} height={40}>
            <LineChart data={sparklineData}>
              <Line type="monotone" dataKey="value" stroke={isPositive ? "#16a34a" : "#dc2626"} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
```

### WoW Change Indicator

```tsx
function WoWChange({ value, previousValue }: { value: number; previousValue: number }) {
  if (previousValue === 0) return null;
  const pct = ((value - previousValue) / previousValue) * 100;
  const up = pct >= 0;
  const accentColor = up ? "#009118" : "#ef4444";
  return (
    <div className="flex items-center gap-1 mt-1" style={{ fontSize: "12px", color: "#6b7280" }}>
      {up ? <ArrowUp className="w-3 h-3" style={{ color: accentColor }} /> : <ArrowDown className="w-3 h-3" style={{ color: accentColor }} />}
      <span style={{ color: accentColor }}>{Math.abs(pct).toFixed(1)}%</span>
      <span>vs last period</span>
    </div>
  );
}
```

## Dashboard Wrapper

Always wrap dashboard content in a max-width container:

```tsx
<div className="min-h-screen bg-background px-5 py-4 pt-[32px] pb-[32px] pl-[24px] pr-[24px]">
  <div className="max-w-[1400px] mx-auto">
    {/* Dashboard content */}
  </div>
</div>
```

## Responsive Grid Patterns

### Two-Column Layout

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <ChartCard title="Revenue" />
  <ChartCard title="Users" />
</div>
```

### Three-Column Layout

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <ChartCard title="Sales" />
  <ChartCard title="Orders" />
  <ChartCard title="Customers" />
</div>
```

### Sidebar Layout

```tsx
<div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
  <Card className="lg:col-span-1"><FilterPanel /></Card>
  <div className="lg:col-span-3 space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{/* KPIs */}</div>
    <Card><MainChart /></Card>
  </div>
</div>
```

### Asymmetric Layout

```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  <Card className="lg:col-span-2"><LargeChart /></Card>
  <div className="space-y-4">
    <Card><PieChart /></Card>
    <Card><TopProductsList /></Card>
  </div>
</div>
```

## Number Formatting

```tsx
function formatNumber(value: number, type: "currency" | "percent" | "compact"): string {
  switch (type) {
    case "currency": return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    case "percent": return new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value / 100);
    case "compact": return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
  }
}
```

## Text Size Guidelines

| Element | Minimum | Property |
|---------|---------|----------|
| Chart axis ticks | 12px | `tick={{ fontSize: 12 }}` |
| Tooltips | 13px | `fontSize: "13px"` |
| Legend text | 13px | `fontSize: "13px"` |
| Table body text | `text-sm` (14px) | Tailwind class |
| KPI card labels | `text-sm` (14px) | Already correct |
| KPI card values | `text-2xl` (24px) | Already correct |

**Rule:** Never use `text-xs` for primary table data -- reserve for secondary annotations only.
