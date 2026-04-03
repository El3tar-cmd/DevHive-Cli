# Dashboard Controls

Dashboard-specific controls that extend the common controls (dark mode, PDF export, simple refresh).

NOTE: the CSS values specified in the examples below are required, not approximate.

## Split Refresh Button with Auto-Refresh

Use a split button design: left side triggers refresh, right side opens auto-refresh dropdown.

```tsx
import { RefreshCw, ChevronDown, Check } from "lucide-react";

const INTERVAL_OPTIONS = [
  { label: "Every 5 min", ms: 5 * 60 * 1000 },
  { label: "Every 15 min", ms: 15 * 60 * 1000 },
  { label: "Every 1 hour", ms: 60 * 60 * 1000 },
  { label: "Every 24 hours", ms: 24 * 60 * 60 * 1000 },
];

const [dropdownOpen, setDropdownOpen] = useState(false);

<div
  className="flex items-center rounded-[6px] overflow-hidden h-[26px] text-[12px]"
  style={{
    backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2",
    color: isDark ? "#c8c9cc" : "#4b5563",
  }}
>
  <button onClick={handleRefresh} disabled={loading} className="flex items-center gap-1 px-2 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50">
    <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? "animate-spin" : ""}`} />
    Refresh
  </button>
  <div className="w-px h-4 shrink-0" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }} />
  <button onClick={() => setDropdownOpen((o) => !o)} className="flex items-center justify-center px-1.5 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
    <ChevronDown className="w-3.5 h-3.5" />
  </button>
</div>
```

The dropdown includes an auto-refresh toggle switch and interval options with checkmarks.

**Click-outside dismiss (required):** The dropdown must close when clicking anywhere outside of it. Wrap the split button and dropdown in a `<div className="relative" ref={dropdownRef}>`, then add:

```tsx
const dropdownRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(e.target as Node)
    ) {
      setDropdownOpen(false);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);
```

## Date Range Filter

Include when the user has specified a time-based query:

```tsx
import { useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

function DateRangeFilter() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
          <Calendar className="mr-2 h-4 w-4" />
          {dateRange.from && dateRange.to ? (
            <>{format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}</>
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent
          mode="range"
          selected={{ from: dateRange.from, to: dateRange.to }}
          onSelect={(range) => { if (range?.from && range?.to) setDateRange({ from: range.from, to: range.to }); }}
        />
      </PopoverContent>
    </Popover>
  );
}
```

**When to include date filters:**

- User mentioned "last quarter", "last 30 days", "this month", or any time range
- Dashboard shows time-series data
- Metrics can be filtered by date

### Quick Date Range Presets

```tsx
function DateRangeWithPresets() {
  const presets = [
    { label: "Last 7 days", days: 7 },
    { label: "Last 30 days", days: 30 },
    { label: "Last 90 days", days: 90 },
    { label: "This year", days: null },
  ];

  function applyPreset(days: number | null) {
    if (days === null) {
      setDateRange({ from: new Date(new Date().getFullYear(), 0, 1), to: new Date() });
    } else {
      setDateRange({ from: new Date(Date.now() - days * 24 * 60 * 60 * 1000), to: new Date() });
    }
  }

  return (
    <div className="flex items-center gap-2">
      <DateRangeFilter />
      <div className="flex gap-1">
        {presets.map((preset) => (
          <Button key={preset.label} variant="ghost" size="sm" onClick={() => applyPreset(preset.days)}>{preset.label}</Button>
        ))}
      </div>
    </div>
  );
}
```

### Single Date Picker

A single-date variant of the range picker above. Used in filter layouts for individual date fields:

```tsx
function DatePicker({ value, onChange }: { value?: Date; onChange: (d: Date | undefined) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <Calendar className="mr-2 h-4 w-4" />
          {value ? format(value, "MMM d, yyyy") : <span className="text-muted-foreground">Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent mode="single" selected={value} onSelect={(d) => d && onChange(d)} />
      </PopoverContent>
    </Popover>
  );
}
```

## Filter Field Layout

When a dashboard has user-input filters (text inputs, date pickers, dropdowns), wrap each label + control pair in a fixed-width container and use a CSS grid or constrained flex row so fields stay on one line at typical dashboard widths.

```tsx
{/* Each field: label above, input below, in a fixed-width wrapper */}
<div className="mb-4 flex flex-wrap items-end gap-3">
  <div className="w-[220px]">
    <Label className="text-[13px] mb-1 block">Org ID</Label>
    <Input placeholder="e.g. org_123" />
  </div>
  <div className="w-[200px]">
    <Label className="text-[13px] mb-1 block">Start Date</Label>
    <DatePicker />
  </div>
  <div className="w-[200px]">
    <Label className="text-[13px] mb-1 block">End Date</Label>
    <DatePicker />
  </div>
  <Button>Fetch Data</Button>
</div>
```

**Rules:**

Every filter control must be wrapped with its label in a single div with an explicit width (w-[Npx]).
Use items-end so the button aligns with the inputs, not the labels.
Never place labels and inputs as loose siblings in the flex container.

## Dashboard Header with Filters

```tsx
function DashboardHeader() {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="pt-2">
          <h1 className="font-bold text-[32px]">Sales Dashboard</h1>
          <p className="text-muted-foreground mt-1.5 text-[14px]">Overview of your sales performance</p>
          {lastRefreshed && <p className="text-[12px] text-muted-foreground mt-3">Last refresh: {lastRefreshed}</p>}
        </div>
        <div className="flex items-center gap-3 pt-2 print:hidden">
          {/* Split Refresh button + PDF + Dark mode toggle */}
        </div>
      </div>
      {/* Filters -- use the Filter Field Layout pattern above */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <DateRangeFilter />
      </div>
    </>
  );
}
```
