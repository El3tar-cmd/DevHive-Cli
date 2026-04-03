# Color Guide for Data Visualization

## Default Chart Color Palette

The scaffold comes with pre-filled CSS variables and a matching hex constant. Don't modify unless the user requests a custom theme.

**Use the `CHART_COLORS` hex constant** for all Recharts `fill`/`stroke` props:

```tsx
const CHART_COLORS = {
  blue: "#0079F2",
  purple: "#795EFF",
  green: "#009118",
  red: "#A60808",
  pink: "#ec4899",
};
```

CSS variables (`--chart-1` through `--chart-5`) still exist for Tailwind classes, but for Recharts elements use the hex values above.

## Color Palette Reference

| Variable | Hex | Light Mode HSL | Dark Mode HSL | Use Case |
|----------|-----|----------------|---------------|----------|
| `--chart-1` | Blue (#0079F2) | 211 100% 47% | 211 100% 55% | Primary data series, main metrics |
| `--chart-2` | Purple (#795EFF) | 250 100% 68% | 250 100% 74% | Secondary data series, comparisons |
| `--chart-3` | Green (#009118) | 130 100% 28% | 130 100% 36% | Tertiary data series |
| `--chart-4` | Red (#A60808) | 0 91% 34% | 0 91% 42% | Highlights, warnings |
| `--chart-5` | Pink (#ec4899) | 330 81% 60% | 330 81% 65% | Accents, special cases |

## When to Use Each Color

### Single Data Series

Always use `CHART_COLORS.blue`:

```tsx
<Bar dataKey="revenue" fill={CHART_COLORS.blue} fillOpacity={0.8} activeBar={{ fillOpacity: 1 }} radius={[2, 2, 0, 0]} />
```

### Two Data Series

Use blue and purple for comparisons:

```tsx
<Bar dataKey="actual" fill={CHART_COLORS.blue} fillOpacity={0.8} activeBar={{ fillOpacity: 1 }} radius={[2, 2, 0, 0]} />
<Bar dataKey="target" fill={CHART_COLORS.purple} fillOpacity={0.8} activeBar={{ fillOpacity: 1 }} radius={[2, 2, 0, 0]} />
```

### Three or More Series

Use colors in order: blue -> purple -> green -> red -> pink

### Pie Charts and Multi-Category Data

```tsx
const CHART_COLOR_LIST = [
  CHART_COLORS.blue, CHART_COLORS.purple, CHART_COLORS.green, CHART_COLORS.red, CHART_COLORS.pink,
];

{data.map((entry, index) => (
  <Cell key={`cell-${index}`} fill={CHART_COLOR_LIST[index % CHART_COLOR_LIST.length]} />
))}
```

## Semantic Colors

### Positive/Negative Trends

```tsx
<span className="text-green-600 dark:text-green-400">+12.5%</span>
<span className="text-red-600 dark:text-red-400">-5.2%</span>
<span className="text-muted-foreground">0%</span>
```

### Status Indicators

```tsx
<Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
<Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Pending</Badge>
<Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Inactive</Badge>
```

### KPI Card Values

Default to **blue (`#0079F2`)**. Only deviate for clear semantic meaning:

- **Green (`#009118`)**: Objectively positive (e.g., "Completed", "Resolved")
- **Red (`#A60808`)**: Objectively negative (e.g., "Errors", "Failed")
- **Blue (`#0079F2`)**: Everything else

```tsx
<p className="text-2xl font-bold mt-1" style={{ color: "#0079F2" }}>{value}</p>
```

## Color Combinations

### Recommended Pairings

- **Blue + Purple**: Comparisons (actual vs. target, this year vs. last year)
- **Blue + Green**: Related metrics (revenue + profit)
- **Blue + Red**: Strong contrast for highlighting
- **All 5 colors**: Category breakdowns in pie/donut charts

### Avoid

- **Red + Green alone**: Not colorblind-friendly
- **Yellow on white**: Poor contrast
- **More than 5 series without labels**: Colors repeat, causing confusion

## Customizing Colors

Only customize when user explicitly requests brand colors or accessibility requirements demand it.

Update CSS variables in `src/index.css`:

```css
:root {
  --chart-1: 200 95% 50%;
  --chart-2: 150 80% 45%;
}
```

**Important**: Always provide both light and dark mode variants!

## Accessibility Guidelines

1. **Sufficient contrast**: All colors tested for WCAG AA
2. **Not color-only**: Always include labels, legends, or text alongside colors
3. **Distinct hues**: Colors distinguishable even with color vision deficiency
4. **Pattern support**: Consider adding patterns for critical distinctions
