# CSV Parsing with PapaParse

## Client-Side CSV Upload

Use PapaParse to parse user-uploaded CSV files in the browser:

```tsx
import Papa from "papaparse";
import { useState } from "react";

function CSVUploader({ onDataLoaded }: { onDataLoaded: (data: any[], columns: string[]) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsLoading(false);
        onDataLoaded(results.data, results.meta.fields || []);
      },
      error: (error) => {
        setIsLoading(false);
        setError(`CSV parse error: ${error.message}`);
        console.error("CSV parse error:", error);
      },
    });
  }

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        disabled={isLoading}
      />
      {isLoading && <p>Loading CSV...</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
```

## Server-Side CSV Parsing

Follow the `pnpm-workspace` skill's `references/server.md` for the actual Express route shape. This reference only covers the CSV-specific parsing logic.

```typescript
import Papa from "papaparse";

export function parseCsvText(csvContent: string): Array<Record<string, unknown>> {
  const parsed = Papa.parse<Record<string, unknown>>(csvContent, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message ?? "CSV parsing failed");
  }

  return parsed.data;
}
```

When the route reads files by name, validate or sanitize the filename before constructing a path so it cannot escape the intended data directory.

## Fetching CSV Data from Client

Use generated hooks from `@workspace/api-client-react` to fetch and cache CSV data:

```tsx
import { useGetSalesData } from "@workspace/api-client-react";

function SalesChart() {
  const { data, isLoading, error } = useGetSalesData();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <BarChart data={data} />;
}
```

## PapaParse Configuration Options

```typescript
Papa.parse(input, {
  header: true,           // Parse first row as field names
  dynamicTyping: true,    // Auto-convert numeric and boolean values
  skipEmptyLines: true,   // Skip empty lines in the CSV
  delimiter: ",",         // Custom delimiter (auto-detected by default)
  transform: (value, field) => {
    if (field === "date") return new Date(value);
    return value;
  },
  complete: (results) => { console.log("Parsing complete:", results.data); },
  error: (error) => { console.error("Parsing error:", error); },
});
```

## Data Flow Pattern: CSV to App

### 1. Static CSV Files on Server

Place CSV files in `artifacts/api-server/data/`:

```text
artifacts/api-server/
  data/
    sales.csv
    revenue.csv
    users.csv
  src/
    routes/
      sales.ts
```

### 2. Create API Routes

Implement the route using the `pnpm-workspace` skill's `references/server.md` guidance plus the parsing helper above.

### 3. Fetch and Display

```tsx
import { useGetSalesData } from "@workspace/api-client-react";

function Dashboard() {
  const { data: salesData } = useGetSalesData();
  return (
    <div>
      <h1>Sales Dashboard</h1>
      {salesData?.data && <SalesChart data={salesData.data} />}
    </div>
  );
}
```

## Handling Large CSV Files

For large CSV files (>10MB), consider streaming. Apply this parser inside a route that already follows the `pnpm-workspace` skill's `references/server.md` patterns.

```typescript
const rows: Array<Record<string, unknown>> = [];
const stream = fs.createReadStream("/path/to/large.csv");
let responded = false;

const respondWithError = (status: number, message: string): void => {
  if (responded) return;
  responded = true;
  res.status(status).json({ error: message });
};

stream.on("error", () => {
  respondWithError(500, "File read error");
});

Papa.parse<Record<string, unknown>>(stream, {
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
  step: (row) => {
    rows.push(row.data);
  },
  complete: () => {
    if (responded) return;
    responded = true;
    res.json(rows);
  },
  error: (error) => {
    respondWithError(400, error.message);
  },
});
```
