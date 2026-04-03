# Database (Drizzle ORM)

## Schema location

Each table goes in its own file under `lib/db/src/schema/`. Re-export from `lib/db/src/schema/index.ts`.

## Pattern

Every model file should define: the Drizzle table, an insert schema, and the derived types.

```typescript
import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const todosTable = pgTable("todos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  completed: text("completed").notNull().default("false"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTodoSchema = createInsertSchema(todosTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTodo = z.infer<typeof insertTodoSchema>;
export type Todo = typeof todosTable.$inferSelect;
```

## Importing

The `@workspace/db` package exports both the client and the full `src/schema` barrel, so prefer importing tables directly from `@workspace/db`:

```typescript
import { db } from "@workspace/db";
import { todosTable } from "@workspace/db";
```

## Push commands

```bash
pnpm --filter @workspace/db run push
# If it fails with column conflicts:
pnpm --filter @workspace/db run push-force
```

## Pitfalls

- Array columns: call `.array()` as a method on the column type — `text("tags").array()`, not `array(text("tags"))`.
- Do not edit `drizzle.config.ts` unless absolutely necessary.
- Make sure date fields use timestamptz by adding `{ withTimezone: true }`
