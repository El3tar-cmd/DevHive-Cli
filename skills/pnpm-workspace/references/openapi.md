# OpenAPI Spec & Codegen

`lib/api-spec/openapi.yaml` is the single source of truth for all API contracts. Define endpoints here first, then generate typed helpers.

## Codegen

```bash
pnpm --filter @workspace/api-spec run codegen
```

This produces:

- Zod validation schemas in `@workspace/api-zod` (used by the server)
- React Query hooks in `@workspace/api-client-react` (used by frontends)

Re-run codegen after every spec change. Do not hand-write types that the codegen already produces.

After codegen, Orval writes to fixed paths:

```text
lib/api-client-react/src/generated/api.ts
lib/api-client-react/src/generated/api.schemas.ts
lib/api-zod/src/generated/api.ts
```

## Writing the spec

- Base server URL is `/api`. Do not change this.
- Keep the existing `/healthz` endpoint and `HealthStatus` schema.
- Every endpoint must have an `operationId` — Orval uses these to derive hook and schema names.
- For array responses, define the item schema separately under `components/schemas` and reference it with `type: array` + `items: { $ref: ... }`.
- For nullable fields use `type: ["<actual_type>", "null"]` (OpenAPI 3.1), where `<actual_type>` is the real type of the field (`string`, `integer`, `number`, `boolean`, etc.). For example: `type: ["integer", "null"]` for a nullable number.
- The workspace Orval config forces `info.title` to `Api` so generated outputs stay at the fixed `generated/api*` filenames. Do not fight that convention or hand-rename the generated files/barrels.

## Using generated hooks

**Queries** return data typed as `T` directly — no wrapper object around the payload. Each query hook also exports a `get*QueryKey` helper for cache invalidation:

```tsx
import { useGetNotes, getGetNotesQueryKey } from "@workspace/api-client-react";

const { data, isLoading } = useGetNotes();
// data is Note[] directly

// After a mutation, invalidate the cache:
queryClient.invalidateQueries({ queryKey: getGetNotesQueryKey() });
```

**Mutations** take variables as `{ data: T }` (plus any path params). The `onSuccess` result is typed as `T` directly:

```tsx
const mutation = useCreateNote();
mutation.mutate({ data: { title: "New note" } });
```

**Errors** are `ApiError` instances with `status`, `statusText`, `data`, and `headers` properties — these fields live on the error object, not the success response.

## Errors

- Use standard HTTP status codes (400, 404) for errors
- Generated React Query hooks handle error/loading states automatically
- Keep error responses simple, for example `{ error: "message" }`

## Deriving endpoints

Before writing the spec, list every user-facing action the app supports, then map each to an endpoint:

```text
Features:
- Users can create, view, edit, delete notes
- Notes can be favorited

Derived endpoints:
  GET    /notes           → list
  POST   /notes           → create
  GET    /notes/{id}      → get
  PATCH  /notes/{id}      → update
  DELETE /notes/{id}      → delete
  PATCH  /notes/{id}/star → toggleFavorite
```

If a feature implies a user action, it needs an endpoint in the spec. Missing endpoints mean missing generated hooks, which means the frontend can't call them.

## If delegating spec to a subagent

Tell the subagent:

- The exact file path: `lib/api-spec/openapi.yaml`
- The codegen command: `pnpm --filter @workspace/api-spec run codegen`
- To keep the existing `HealthStatus` schema and `/healthz` endpoint
- Every schema and endpoint in detail — don't leave anything for the subagent to infer
