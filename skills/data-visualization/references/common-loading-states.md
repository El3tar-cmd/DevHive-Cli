# Loading States

## CRITICAL: Use Both `isLoading` and `isFetching`

When checking query loading state, use `isLoading || isFetching` to show skeletons during both initial load and manual refresh:

```tsx
import { Skeleton } from "@/components/ui/skeleton"

{query.isLoading || query.isFetching ? (
  <Skeleton className="w-full h-[300px]" />
) : query.data ? (
  // ... render data
) : (
  // ... empty state
)}
```

**Why both flags?**

- `isLoading`: True only on initial fetch when there's no cached data
- `isFetching`: True whenever a query is actively fetching (initial OR refresh)
- Using `isLoading || isFetching` ensures skeleton states appear during manual refresh

## KPI Card Loading Pattern

```tsx
<Card>
  <CardContent className="p-6">
    {query.isLoading || query.isFetching ? (
      <>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-32" />
      </>
    ) : query.data ? (
      <>
        <p className="text-sm text-muted-foreground">Total Revenue</p>
        <p className="text-2xl font-bold" style={{ color: "#0079F2" }}>${revenue.toLocaleString()}</p>
      </>
    ) : (
      <>
        <p className="text-sm text-muted-foreground">Total Revenue</p>
        <p className="text-2xl font-bold text-muted-foreground">--</p>
      </>
    )}
  </CardContent>
</Card>
```

## Chart Loading Pattern

```tsx
<Card>
  <CardHeader>
    <CardTitle>Monthly Revenue</CardTitle>
  </CardHeader>
  <CardContent>
    {query.isLoading || query.isFetching ? (
      <Skeleton className="w-full h-[300px]" />
    ) : query.data ? (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={query.data}>
          {/* chart configuration */}
        </AreaChart>
      </ResponsiveContainer>
    ) : (
      <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    )}
  </CardContent>
</Card>
```

## Table Loading Pattern

```tsx
<Card>
  <CardHeader>
    <CardTitle>Data Table</CardTitle>
  </CardHeader>
  <CardContent>
    {query.isLoading || query.isFetching ? (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    ) : query.data ? (
      <DataTable data={query.data} columns={columns} />
    ) : (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    )}
  </CardContent>
</Card>
```

## Multiple Queries Pattern

When a component depends on multiple queries, check all of them:

```tsx
import { useGetSalesData, useGetUsersData } from "@workspace/api-client-react";

function Dashboard() {
  const salesQuery = useGetSalesData();
  const usersQuery = useGetUsersData();

  const loading = salesQuery.isLoading || usersQuery.isLoading
    || salesQuery.isFetching || usersQuery.isFetching;

  // Use `loading` for all skeleton states
}
```

## Skeleton Component

The scaffold includes `Skeleton` from shadcn/ui. Use it for loading states:

```tsx
import { Skeleton } from "@/components/ui/skeleton";

// KPI skeleton
<Skeleton className="h-4 w-24 mb-2" />
<Skeleton className="h-8 w-32" />

// Chart skeleton
<Skeleton className="w-full h-[300px]" />

// Table row skeleton
<Skeleton className="h-8 w-full" />
```

## Full Page Skeleton

```tsx
function PageSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {/* KPI Cards Loading */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Loading */}
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
```

## Empty States

```tsx
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="rounded-full bg-gray-100 p-6 mb-4">
        <BarChart3Icon className="w-12 h-12 text-gray-400" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No data available</h2>
      <p className="text-muted-foreground mb-4">
        Upload a CSV file or connect a data source to get started
      </p>
    </div>
  );
}
```

## Refresh Loading Overlay

Optional overlay for background refresh while keeping content visible:

```tsx
function LoadingOverlay() {
  return (
    <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
      <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
      Updating data...
    </div>
  );
}
```

## Preventing Unwanted Refreshes

You will need to add `refetchOnWindowFocus: false` to App.tsx to prevent the dashboard from refreshing every time the user switches back to the tab. This is incredibly annoying for users, so please make sure you add it:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});
```
