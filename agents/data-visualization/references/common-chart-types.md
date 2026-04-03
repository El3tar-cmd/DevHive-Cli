# Chart Type Selection Guide

## Default Chart Selection Rule

**For time-series data (daily, weekly, monthly over time), use AreaChart or LineChart -- NEVER BarChart.**

- AreaChart: Best for single-series trends, emphasizing volume (revenue, users, sales over time)
- LineChart: Best for multi-series comparisons (3+ overlapping trends), or when a minimal aesthetic is desired
- BarChart: ONLY for discrete category comparisons (regions, departments, products) or small counts (4-8 bars)

If the x-axis is a continuous time sequence, default to AreaChart. If comparing 3+ overlapping time series, use LineChart.

## CRITICAL: Never Use Bar Charts for Time Series

**Bar charts create poor UX for continuous time data.** Daily, weekly, or monthly data over time creates cluttered, thin bars.

| Data Type | Correct Chart | Why |
|-----------|---------------|-----|
| Daily data over weeks/months | AreaChart or LineChart | Shows trends, handles many data points |
| Weekly data over months | AreaChart or LineChart | Smooth trends, professional appearance |
| Monthly data over quarters/years | AreaChart or LineChart | Clear trend visualization |
| Quarterly comparisons (4-8 bars) | BarChart | Few enough bars to be readable |
| Category comparisons | BarChart | Perfect for discrete categories |
| Regional/department comparisons | BarChart | Not time-based, discrete groups |

## Area Chart vs Line Chart

**Use AreaChart when:**

- Single metric over time (revenue, users, sales) -- emphasizes volume
- Polished, visually weighted dashboard aesthetic
- 1-2 data series (more than 2 overlapping areas gets cluttered)

**Use LineChart when:**

- Multiple overlapping series (3+ metrics compared side by side)
- Comparing trends where intersection points matter
- Clean, minimal aesthetic explicitly requested
- Many data series that would overlap as areas

**Default choice:** Single series -> AreaChart. Multiple series (3+) -> LineChart.

## Example: Area Chart

```tsx
function RevenueChart({ data, isDark }: { data: Array<{ month: string; revenue: number }>; isDark: boolean }) {
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  return (
    <ResponsiveContainer width="100%" height={400} debounce={0}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.5} />
            <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
        <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: 'rgba(0,0,0,0.05)', stroke: 'none' }} />
        <Legend content={<CustomLegend />} />
        <Area type="linear" dataKey="revenue" name="Revenue" fill="url(#gradientRevenue)" stroke={CHART_COLORS.blue} fillOpacity={1} strokeWidth={2} activeDot={{ r: 5, fill: CHART_COLORS.blue, stroke: '#ffffff', strokeWidth: 3 }} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

## Example: Multi-Series Line Chart

```tsx
function MultiMetricChart({ data, isDark }: { data: Array<{ month: string; revenue: number; expenses: number; profit: number }>; isDark: boolean }) {
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  return (
    <ResponsiveContainer width="100%" height={400} debounce={0}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
        <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ stroke: tickColor, strokeDasharray: '3 3' }} />
        <Legend content={<CustomLegend />} />
        <Line type="linear" dataKey="revenue" name="Revenue" stroke={CHART_COLORS.blue} strokeWidth={2} dot={false} activeDot={{ r: 5, fill: CHART_COLORS.blue, stroke: '#ffffff', strokeWidth: 3 }} isAnimationActive={false} />
        <Line type="linear" dataKey="expenses" name="Expenses" stroke={CHART_COLORS.purple} strokeWidth={2} dot={false} activeDot={{ r: 5, fill: CHART_COLORS.purple, stroke: '#ffffff', strokeWidth: 3 }} isAnimationActive={false} />
        <Line type="linear" dataKey="profit" name="Profit" stroke={CHART_COLORS.green} strokeWidth={2} dot={false} activeDot={{ r: 5, fill: CHART_COLORS.green, stroke: '#ffffff', strokeWidth: 3 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

## Example: Composed Chart (Bar + Line)

```tsx
function SalesGrowthChart({ data }: { data: Array<{ month: string; sales: number; growth: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={400} debounce={0}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis yAxisId="left" tickFormatter={(v) => `$${v.toLocaleString()}`} />
        <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} />
        <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
        <Legend content={<CustomLegend />} />
        <Bar yAxisId="left" dataKey="sales" name="Sales" fill={CHART_COLORS.blue} fillOpacity={0.8} activeBar={{ fillOpacity: 1 }} isAnimationActive={false} radius={[2, 2, 0, 0]} />
        <Line yAxisId="right" type="monotone" dataKey="growth" name="Growth %" stroke={CHART_COLORS.purple} strokeWidth={2} dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
```

## Pie/Donut Chart Best Practices

1. **Always use a horizontal legend** -- never a vertical stacked legend inside the container
2. For legends w/ values, **render outside** `ResponsiveContainer` as a `<div>`
3. Set `cy="50%"` and keep `outerRadius` at max ~40% of container height
4. For donut: `innerRadius` at ~60% of `outerRadius`
5. **Contain legends**: use `flexWrap: "wrap"` and `overflow: "hidden"`
6. **Always set** `cornerRadius={2}`, `paddingAngle={2}`, `stroke="none"` on `<Pie>`
7. **Max 6 slices.** Sort by value, keep top 5, sum rest into "Other" slice.

## Example: Pie Chart

```tsx
<ResponsiveContainer width="100%" height={300} debounce={0}>
  <PieChart>
    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} cornerRadius={2} paddingAngle={2} isAnimationActive={false} stroke="none">
      {data.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={CHART_COLOR_LIST[index % CHART_COLOR_LIST.length]} />
      ))}
    </Pie>
    <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
    <Legend content={<CustomLegend />} />
  </PieChart>
</ResponsiveContainer>
```

## Additional Chart Types

**TreeMap**: Hierarchical data, part-to-whole with nested categories (product sales, market segmentation).

**Funnel Chart**: Conversion funnels and sequential drop-off (sales pipelines, signup flows).

**Radar Chart**: Multivariate comparison across dimensions (feature comparisons, skill assessments).

### Chart Selection Summary

| Use Case | Chart Type |
|----------|------------|
| Time-based trends | AreaChart (preferred) or LineChart |
| Category comparisons | BarChart |
| Multiple dimensions | Radar Chart |
| Parts-of-whole (≤6 slices) | PieChart/DonutChart |
| Complex hierarchies | TreeMap |
| Sequential stages | Funnel Chart |
| Dual metrics | ComposedChart (bar + line) |
| Correlations | Scatter Plot |
