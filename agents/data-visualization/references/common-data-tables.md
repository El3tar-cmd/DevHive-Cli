# Data Tables with @tanstack/react-table

## Basic Sortable Table

```tsx
import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
}

function DataTable<T>({ data, columns }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search all columns..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} onClick={header.column.getToggleSortingHandler()} className="cursor-pointer select-none">
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{ asc: " 🔼", desc: " 🔽" }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
          {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}{" "}
          of {table.getFilteredRowModel().rows.length} results
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
        </div>
      </div>
    </div>
  );
}
```

## Defining Columns

```tsx
import { type ColumnDef } from "@tanstack/react-table";

interface Transaction {
  id: string;
  date: string;
  customer: string;
  amount: number;
  status: "pending" | "completed" | "failed";
}

const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.id}</span>,
  },
  {
    accessorKey: "date",
    header: "Date",
    // refer to `common-chart-patterns.md` for the `formatDate()` function definition
    cell: ({ row }) => formatDate(row.original.date, "MMM d, yyyy"),
  },
  { accessorKey: "customer", header: "Customer" },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(row.original.amount),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const colorMap = {
        pending: "bg-yellow-100 text-yellow-800",
        completed: "bg-green-100 text-green-800",
        failed: "bg-red-100 text-red-800",
      };
      return <span className={`px-2 py-1 rounded text-xs font-medium ${colorMap[status]}`}>{status}</span>;
    },
  },
];
```

## Column Filtering (Per-Column Filters)

```tsx
function DataTableWithColumnFilters<T>({ data, columns }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState([]);

  const table = useReactTable({
    data, columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Filter by customer..."
          value={(table.getColumn("customer")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("customer")?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={(table.getColumn("status")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("status")?.setFilterValue(e.target.value || undefined)}
          className="border rounded px-2"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      {/* Table rendering... */}
    </div>
  );
}
```

## Exporting Data

```tsx
function ExportButton<T>({ table }: { table: ReturnType<typeof useReactTable<T>> }) {
  function exportToCSV() {
    const rows = table.getFilteredRowModel().rows;
    const headers = table.getAllColumns().map((col) => col.id);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => headers.map((header) => {
        const value = row.getValue(header);
        return typeof value === "string" ? `"${value}"` : value;
      }).join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "export.csv"; a.click();
    URL.revokeObjectURL(url);
  }
  return <Button onClick={exportToCSV} variant="outline">Export to CSV</Button>;
}
```

## Best Practices

- **Use TypeScript**: Define interfaces for your data for type safety
- **Memoize columns**: Use `useMemo` to avoid recreating column definitions on every render
- **Format data in cells**: Use `cell` renderer for formatting (currency, dates, badges)
- **Enable sorting by default**: Most tables benefit from sortable columns
- **Add global search**: Users expect to search across all columns
- **Implement pagination**: For large datasets (>50 rows)
- **Show empty states**: Display helpful message when no data or no search results
- **Text size**: Use `text-sm` (14px) minimum for table body. Reserve `text-xs` for badges/annotations.
