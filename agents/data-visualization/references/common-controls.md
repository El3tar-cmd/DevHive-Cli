# Common Controls

Controls shared across all app types (dashboards, reports, explorers).

## Dark Mode Toggle

Every app must include a dark mode toggle:

```tsx
import { Sun, Moon } from "lucide-react";

const [isDark, setIsDark] = useState(false);

useEffect(() => {
  document.documentElement.classList.toggle("dark", isDark);
}, [isDark]);

<button
  onClick={() => setIsDark((d) => !d)}
  className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors"
  style={{
    backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2",
    color: isDark ? "#c8c9cc" : "#4b5563",
  }}
  aria-label="Toggle dark mode"
>
  {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
</button>
```

## Export / PDF Button

A `Printer` icon-only button that calls `window.print()`. Matches the dark mode toggle in size (26x26).

```tsx
import { Printer } from "lucide-react";

<button
  onClick={() => window.print()}
  disabled={loading}
  className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors disabled:opacity-50"
  style={{
    backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2",
    color: isDark ? "#c8c9cc" : "#4b5563",
  }}
  aria-label="Export as PDF"
>
  <Printer className="w-3.5 h-3.5" />
</button>
```

## Simple Refresh Button

For reports and explorers (no auto-refresh dropdown):

```tsx
import { RefreshCw } from "lucide-react";

<button
  onClick={handleRefresh}
  disabled={loading}
  className="flex items-center gap-1 px-2 h-[26px] rounded-[6px] text-[12px] hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
  style={{
    backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2",
    color: isDark ? "#c8c9cc" : "#4b5563",
  }}
>
  <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? "animate-spin" : ""}`} />
  Refresh
</button>
```

## Last Refresh Timestamp

Show when data was last refreshed using `query.dataUpdatedAt`:

```tsx
const lastRefreshed = query.dataUpdatedAt
  ? (() => {
      const d = new Date(query.dataUpdatedAt);
      const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
      const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return `${time} on ${date}`;
    })()
  : null;

{lastRefreshed && (
  <p className="text-[12px] text-muted-foreground mt-3">Last refresh: {lastRefreshed}</p>
)}
```

## Data Sources badges

Display which data sources power the dashboard as styled badges in the header, between the subtitle and the "Last refresh" timestamp. This gives users immediate visibility into where their data comes from.

**Constant** — declare near the top of file, after `CHART_COLORS`:

```tsx
const DATA_SOURCES: string[] = ["App DB", "Stripe"]; // These are just examples
```

**JSX** — render between the subtitle `<p>` and the `{lastRefreshed && (` block:

```tsx
{DATA_SOURCES.length > 0 && (
  <div className="flex flex-wrap items-center gap-1.5 mt-2">
    <span className="text-[12px] text-muted-foreground shrink-0">
      Data Sources:
    </span>
    {DATA_SOURCES.map((source) => (
      <span
        key={source}
        className="text-[12px] font-bold rounded px-2 py-0.5 truncate print:!bg-[rgb(229,231,235)] print:!text-[rgb(75,85,99)]"
        title={source}
        style={{
          maxWidth: "20ch",
          backgroundColor: isDark
            ? "rgba(255,255,255,0.1)"
            : "rgb(229, 231, 235)",
          color: isDark ? "#c8c9cc" : "rgb(75, 85, 99)",
        }}
      >
        {source}
      </span>
    ))}
  </div>
)}
```

**Rules:**

- **"App DB" first** — if the dashboard uses the app's own database (Drizzle), list `"App DB"` as the first entry
- **Update on change** — whenever you add or remove a data source handler, update the `DATA_SOURCES` array to match
- **Dark mode support** — use the `isDark` ternary for `backgroundColor` and `color` as shown above
- **Truncation with tooltip** — `maxWidth: "20ch"` + `truncate` class + `title={source}` for long names
- **Badges render in print** — do NOT add `print:hidden` to the Data Sources row (it should appear in PDF exports)

## Spinning Animation Delay

Add a minimum 600ms spin duration for UX polish:

```tsx
const [isSpinning, setIsSpinning] = useState(false);
useEffect(() => {
  if (loading) {
    setIsSpinning(true);
  } else {
    const t = setTimeout(() => setIsSpinning(false), 600);
    return () => clearTimeout(t);
  }
}, [loading]);

// Use isSpinning (not loading) for the spinner class
<RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? "animate-spin" : ""}`} />
```

## Print CSS Notes

**Hide controls in print output:** Add `print:hidden` to the controls wrapper:

```tsx
<div className="flex items-center gap-3 pt-2 print:hidden">
  {/* Refresh, Export, Dark mode buttons */}
</div>
```

**The required `@media print` CSS rules are already in `index.css`:**

- `@page { margin: 0 }` + `body { margin: 0.5in }` -- removes browser headers/footers
- Force light mode -- PDFs always render on white background
- `print-color-adjust: exact` -- preserves chart fill colors
- `break-inside: avoid` -- prevents cards from splitting across pages
- Chart centering via flexbox for fixed-width SVGs
- Scroll constraint removal for full content visibility

## Chart-Level CSV Export

Every chart card must include a CSV export button in the top-right corner of its `CardHeader`. **Only for chart cards, not KPI cards.**

```tsx
import { CSVLink } from "react-csv";
import { Download } from "lucide-react";

<Card>
  <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
    <CardTitle className="text-base">Monthly Revenue</CardTitle>
    {!loading && salesData.length > 0 && (
      <CSVLink
        data={salesData}
        filename="monthly-revenue.csv"
        className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
        style={{
          backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2",
          color: isDark ? "#c8c9cc" : "#4b5563",
        }}
        aria-label="Export chart data as CSV"
      >
        <Download className="w-3.5 h-3.5" />
      </CSVLink>
    )}
  </CardHeader>
  <CardContent>{/* chart */}</CardContent>
</Card>
```

**Rules:**

- **Every chart card** gets a CSV export button -- no exceptions
- **KPI cards** do NOT get a CSV export button
- **Filename**: kebab-case of chart title + `.csv`
- **Conditional render**: Only show when `!loading && data.length > 0`
- **`print:hidden`**: Required so button doesn't appear in PDF exports
- **Styling**: Match existing button aesthetics (26x26, same colors)

## Controls Layout

Place controls in the header, right-aligned:

```tsx
<div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
  <div className="pt-2">
    <h1 className="font-bold text-[32px]">Title</h1>
    <p className="text-muted-foreground mt-1.5 text-[14px]">Subtitle</p>
    {lastRefreshed && <p className="text-[12px] text-muted-foreground mt-3">Last refresh: {lastRefreshed}</p>}
  </div>
  <div className="flex items-center gap-3 pt-2 print:hidden">
    {/* [Refresh] [Export] [Dark Mode] */}
  </div>
</div>
```
