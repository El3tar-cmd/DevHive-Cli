# API Server

We maintain a single API server in this monorepo built with Express 5 and Node. It implements the OpenAPI contract.

## Logging

The API server uses **pino** for structured JSON logging. All server-side code must use the shared logger instead of `console.log` or `console.error`.

> **Note:** Older workspaces created before the structured-logging stack update may not have `pino-http` in `app.ts` or `src/lib/logger.ts`. Before following the guidance below, check whether `artifacts/api-server/src/lib/logger.ts` exists and `app.ts` mounts `pinoHttp(...)`. If they are missing, install `pino` and `pino-http` as dependencies and `pino-pretty` as a devDependency, create `src/lib/logger.ts` with the canonical content below, and add the canonical `pinoHttp` middleware in `app.ts` before the routes (see the **Canonical pino-http middleware** section below for the full snippet — do not use a bare `pinoHttp({ logger })` call, as the custom serializers are required to strip query strings and prevent sensitive data from leaking into logs). Also replace any existing `console.log` and `console.error` calls in server code (e.g. `index.ts`, route files) with the appropriate `logger` or `req.log` calls so all output is structured JSON.

Canonical `artifacts/api-server/src/lib/logger.ts`:

```typescript
import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});
```

Import the logger (adjust the relative path based on file depth):

```typescript
// From src/index.ts:
import { logger } from "./lib/logger";

// From src/routes/*.ts or src/middlewares/*.ts:
import { logger } from "../lib/logger";

// From nested route directories like src/routes/todos/index.ts:
import { logger } from "../../lib/logger";
```

### Canonical pino-http middleware

Add the following `pinoHttp` middleware in `app.ts` **before** any routes. The custom serializers strip query strings from logged URLs (preventing sensitive parameters like OIDC callback codes from leaking) and limit response logging to the status code:

```typescript
import pinoHttp from "pino-http";
import { logger } from "./lib/logger";

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
```

### Inside route handlers — use `req.log`

Inside Express route handlers and middleware, prefer `req.log` over the singleton `logger`. The `pino-http` middleware attaches a child logger to every request that automatically includes the request ID for correlation:

```typescript
router.get("/todos", async (req, res): Promise<void> => {
  req.log.info("Fetching todos");
  const todos = await db.select().from(todosTable);
  res.json(ListTodosResponse.parse(todos));
});

router.post("/todos", async (req, res): Promise<void> => {
  const parsed = CreateTodoBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid request body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  // ...
});
```

Use the singleton `logger` only for application-level logs outside of request context (e.g. startup, shutdown, background tasks).

### General rules

- **Never use `console.log` or `console.error` in server code.** Use `req.log` in handlers or the singleton `logger` for non-request code.
- Pass structured context as the first argument (an object), then the message string. This ensures fields are machine-parseable in production (JSON) and human-readable in development (pretty-printed).
- Use appropriate log levels: `logger.info()` for lifecycle events, `logger.error()` / `req.log.error()` for errors, `logger.warn()` for recoverable issues, `logger.debug()` for development diagnostics.
- Request logging is handled automatically by the `pino-http` middleware in `app.ts` — do not add manual request/response logging.
- In production, pino outputs newline-delimited JSON. In development (`NODE_ENV=development`), it uses `pino-pretty` for colored, human-readable output.
- Sensitive headers (`Authorization`, `Cookie`) are automatically redacted by the logger configuration. Response headers (including `Set-Cookie`) are excluded from logs by the custom `res` serializer in `app.ts`.

## Express 5

Express 5 is a relatively new version and you might forget some things such as:

- Wildcard routes need names
  - Express 4 used`app.get("*", ...)`
  - In Express 5 you must do `app.get("/*splat", ...)`
- Optional params changed
  - Express 4 used `/todos/:id?`
  - Express 5 uses `/todos{/:id}`
- `res.redirect('back')` is removed, use `res.redirect(req.get('Referrer') || '/')`
- Async errors auto-forward — no need to `try/catch` + `next(err)` for 500s
- `req.params.id` is `string | string[]`, not just `string`. Always parse params:

  ```typescript
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  ```

- Every async handler should be annotated `Promise<void>`:

  ```typescript
  router.get("/things", async (req, res): Promise<void> => { ... });
  ```

  Without this, TypeScript errors on early-return responses.
- For early returns, use `res.status(...).json(...); return;` — never `return res.status(...).json(...)`.

## Implementing a route

Add new routers under `artifacts/api-server/src/routes` and re-export them in `artifacts/api-server/src/routes/index.ts`.

```typescript
import todosRouter from "./todos";
router.use(todosRouter);
```

The root router already handles `/api` — your routes do not need to add it.

Split routes by domain. A domain may span multiple files exported from a single barrel, e.g. `artifacts/api-server/src/routes/todos/index.ts`.

Keep route handlers thin — they should validate, call the DB, and respond. Push complex logic into separate modules (e.g. `artifacts/api-server/src/lib/mylib.ts`).

Always validate inputs (params, query, body) and outputs (responses) with `@workspace/api-zod` schemas generated from the OpenAPI spec. Status codes must match the contract.

```typescript
import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, todosTable } from "@workspace/db";
import {
  CreateTodoBody,
  UpdateTodoBody,
  GetTodoParams,
  GetTodoResponse,
  UpdateTodoParams,
  UpdateTodoResponse,
  DeleteTodoParams,
  ListTodosResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/todos", async (_req, res): Promise<void> => {
  const todos = await db
    .select()
    .from(todosTable)
    .orderBy(todosTable.createdAt);
  res.json(ListTodosResponse.parse(todos));
});

router.post("/todos", async (req, res): Promise<void> => {
  const parsed = CreateTodoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [todo] = await db.insert(todosTable).values(parsed.data).returning();

  res.status(201).json(GetTodoResponse.parse(todo));
});

router.get("/todos/:id", async (req, res): Promise<void> => {
  const params = GetTodoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [todo] = await db
    .select()
    .from(todosTable)
    .where(eq(todosTable.id, params.data.id));

  if (!todo) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  res.json(GetTodoResponse.parse(todo));
});

router.patch("/todos/:id", async (req, res): Promise<void> => {
  const params = UpdateTodoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTodoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [todo] = await db
    .update(todosTable)
    .set(parsed.data)
    .where(eq(todosTable.id, params.data.id))
    .returning();

  if (!todo) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  res.json(UpdateTodoResponse.parse(todo));
});

router.delete("/todos/:id", async (req, res): Promise<void> => {
  const params = DeleteTodoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [todo] = await db
    .delete(todosTable)
    .where(eq(todosTable.id, params.data.id))
    .returning();

  if (!todo) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
```

Dates work out of the box when casting from DB results to Zod (OpenAPI) schema.

For numeric fields coming from inputs such as query params and path params, the Zod types are already configured to coerce correctly from string to the target type.

### String field validation

When validating required string fields in route handlers, use `content == null` or `typeof content !== "string"` rather than `!content`. An empty string `""` is a valid value for text content fields — falsy checks (`!content`) will incorrectly reject it with a 400 error. Only use `!field` for fields that must be non-empty (like `title`).

```typescript
// WRONG — rejects content: "" which is valid for a new blank note
if (!title || !content) {
  res.status(400).json({ error: "Missing required fields" });
  return;
}

// CORRECT — title must be non-empty, content is allowed to be empty
if (!title || content == null) {
  res.status(400).json({ error: "Missing required fields" });
  return;
}
```

When sending a response early (404, 400, etc.), use `res.status().json(); return;` — never `return res.status().json()`:

```typescript
if (!note) {
  res.status(404).json({ error: "Note not found" });
  return;
}
```
