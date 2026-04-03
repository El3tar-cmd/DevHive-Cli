# Chart Patterns and Styling

## Color Constant

**Use the `CHART_COLORS` hex constant** for all Recharts `fill`/`stroke` props:

```tsx
const CHART_COLORS = {
  blue: "#0079F2",
  purple: "#795EFF",
  green: "#009118",
  red: "#A60808",
  pink: "#ec4899",
};

const CHART_COLOR_LIST = [
  CHART_COLORS.blue,
  CHART_COLORS.purple,
  CHART_COLORS.green,
  CHART_COLORS.red,
  CHART_COLORS.pink,
];
```

**Key principles**:

1. Single data series -> always use `CHART_COLORS.blue`
2. Multiple series -> use colors in order: blue, purple, green, red, pink
3. Positive trends -> green (#009118), Negative -> red (#ef4444)
4. Never use only red/green for critical distinctions (colorblind consideration)
5. KPI card values default to blue (`#0079F2`). Only use green/red for semantic exceptions.

## Custom Tooltip

Always use with `isAnimationActive={false}` and cursor styling:

```tsx
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "6px",
        padding: "10px 14px",
        border: "1px solid #e0e0e0",
        color: "#1a1a1a",
        fontSize: "13px",
      }}
    >
      <div style={{ marginBottom: "6px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
        {payload.length === 1 && payload[0].color && payload[0].color !== "#ffffff" && (
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: payload[0].color, flexShrink: 0 }} />
        )}
        {label}
      </div>
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
          {payload.length > 1 && entry.color && entry.color !== "#ffffff" && (
            <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: entry.color, flexShrink: 0 }} />
          )}
          <span style={{ color: "#444" }}>{entry.name}</span>
          <span style={{ marginLeft: "auto", fontWeight: 600 }}>
            {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// Usage
<Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: 'rgba(0,0,0,0.05)', stroke: 'none' }} />
```

The tooltip always renders white for readability across both light and dark themes.

## Custom Legend

```tsx
function CustomLegend({ payload }: any) {
  if (!payload || payload.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 16px", fontSize: "13px" }}>
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: entry.color, flexShrink: 0 }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}
```

## Dark Mode Chart Styling

Use adaptive colors for grid lines and axis ticks:

```tsx
const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
const tickColor = isDark ? "#98999C" : "#71717a";

<CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
<XAxis tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
<YAxis tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
```

## Opacity Rules

**Areas**: Use gradient fills with `fillOpacity={1}`:

```tsx
<defs>
  <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.5} />
    <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0.05} />
  </linearGradient>
</defs>
<Area fill="url(#gradientRevenue)" stroke={CHART_COLORS.blue} fillOpacity={1} isAnimationActive={false} />
```

**Lines**: `strokeWidth={2}` with `dot={false}`:

```tsx
<Line stroke={CHART_COLORS.blue} strokeWidth={2} dot={false} activeDot={{ r: 5, fill: CHART_COLORS.blue, stroke: '#ffffff', strokeWidth: 3 }} isAnimationActive={false} />
```

**Bars**: `fillOpacity={0.8}` with hover feedback:

```tsx
<Bar fill={CHART_COLORS.blue} fillOpacity={0.8} activeBar={{ fillOpacity: 1 }} isAnimationActive={false} radius={[2, 2, 0, 0]} />
```

**Radar**: `fillOpacity={0.6}`. **Pie**: `fillOpacity={1}`.

## Animation and Performance

**Always disable animations and debounce:**

```tsx
// On all chart elements (Bar, Area, Line, etc.)
isAnimationActive={false}

// On ResponsiveContainer
<ResponsiveContainer width="100%" height={300} debounce={0}>
```

## Tooltip Cursor Styles

```tsx
// Area/Composed charts - subtle highlight band
cursor={{ fill: 'rgba(0,0,0,0.05)', stroke: 'none' }}

// Bar charts - disable cursor (bars have their own hover state)
cursor={false}

// Line charts - dashed vertical line
cursor={{ stroke: tickColor, strokeDasharray: '3 3' }}
```

## Number Formatting Helpers

```tsx
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 1 }).format(value / 100);
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

// Usage
<YAxis tickFormatter={formatCurrency} />
```

## Date Formatting Helpers

Date-only strings (`YYYY-MM-DD`) from APIs are parsed by `new Date()` as UTC midnight. When formatted in a western timezone (e.g. PST/PDT), the displayed date shifts back by one day. Always use `parseLocalDate` to create a local-time Date object, and the use `formatDate`:

```tsx
import { format } from "date-fns";

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(dateStr: string, fmt = "MMM d"): string {
  return format(parseLocalDate(dateStr), fmt);
}

// Usage in XAxis
<XAxis dataKey="date" tickFormatter={(d) => formatDate(d)} />

// Usage in Tooltip / table cells
<span>{formatDate(row.original.date, "MMM d, yyyy")}</span>
```

## Recharts Patterns

Always wrap charts in ResponsiveContainer:

```tsx
<ResponsiveContainer width="100%" height={300} debounce={0}>
  <AreaChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
    <XAxis dataKey="name" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
    <YAxis tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: 'rgba(0,0,0,0.05)', stroke: 'none' }} />
    <Legend content={<CustomLegend />} />
    <Area dataKey="value" fill="url(#gradient)" stroke={CHART_COLORS.blue} fillOpacity={1} isAnimationActive={false} />
  </AreaChart>
</ResponsiveContainer>
```

## Chart Best Practices

- Always include `<Tooltip />` for interactive data exploration
- Always include `<Legend />` when showing multiple data series
- Use `<CartesianGrid strokeDasharray="3 3" />` for readability
- Format axis ticks with custom formatters for currency, percentages, dates
- Use `angle={-45}` and `textAnchor="end"` on XAxis for long labels
- Set meaningful `name` props on data series for legend labels
