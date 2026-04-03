---
name: clerk-auth-migration
description: Migrate user authentication code from Replit Auth to Clerk.
---

# Clerk Auth Migration

Migrate user authentication code from Replit Auth to Clerk. This skill covers code migration only; data migration is handled separately via the migration workflow initiated from the Auth pane.

## When to Use

- The user's app uses Replit Auth and needs to migrate its authentication code to Clerk.

## Prerequisites

- The `clerk-auth` skill describes how to set up Clerk from scratch. Use it for all target Clerk code generation. This migration skill covers only what to remove and how to map Replit Auth patterns to Clerk equivalents.
- Clerk keys (`CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`) must already be provisioned via `setupClerkWhitelabelAuth()`.

## Step 1: Detect What Needs Migrating

Check `replit.md` for mentions of Replit Auth or authentication stack details. Then confirm by scanning the workspace for the following key traits:

| Category | Key trait | Typical location |
| --- | --- | --- |
| **Web (server)** | `ISSUER_URL` constant referencing `replit.com/oidc` | `artifacts/api-server/src/lib/auth.ts` |
| **Web (client)** | `@workspace/replit-auth-web` in dependencies or imports | Web artifact `package.json` / source files |
| **Expo mobile** | `ISSUER_URL` constant referencing `replit.com/oidc` | `artifacts/<mobile-app>/lib/auth.tsx` |

## Step 2: Apply Migration by Category

Based on the detection results:

- **For every web artifact (server + client)**: Read and follow `references/web-migration.md`.
- **For every Expo mobile artifact**: Read and follow `references/expo-migration.md`.

Every artifact in the workspace that uses Replit Auth must be migrated. Do not leave any artifact partially migrated.

## Common Rules

1. **Do NOT drop the `users` table or `sessions` table.** Leave existing database tables and schema definitions in place. However, if other tables have foreign key constraints referencing the `users` table, remove those FK constraints — Clerk manages user data externally and the local `users` table should not be treated as a source of truth. To drop a FK: remove the `.references(() => usersTable.id)` call from the Drizzle schema file, then run `drizzle-kit push` to apply the change to the database. Do not use raw SQL to alter constraints — always go through the schema definition so the schema and database stay in sync. Remove any user upserting logic completely; read user data from the Clerk session directly instead.

2. **Do NOT use "Replit" or "Replit Auth" in user-facing UI text** after migration.

3. **Remove the `@workspace/replit-auth-web` package** if it exists (`lib/replit-auth-web/`). Remove it from root and artifact `tsconfig.json` references, artifact `package.json` dependencies, then delete the directory.

4. **Clean up OpenAPI spec** if the project uses `lib/api-spec/openapi.yaml`. Remove auth endpoint definitions (`/login`, `/callback`, `/logout`, `/auth/user`, `/mobile-auth/token-exchange`, `/mobile-auth/logout`) and re-run codegen:

   ```bash
   pnpm --filter @workspace/api-spec run codegen
   ```

5. **Update `replit.md`** to reflect that authentication now uses Clerk instead of Replit Auth.

## User Identity Mapping

| Replit Auth | Clerk (server) | Clerk (React) |
| --- | --- | --- |
| `req.user.id` | `req.userId` (set by `requireAuth` middleware from `clerk-auth` skill) | `user.id` via `useUser()` |
| `req.user.email` | `clerkClient.users.getUser(auth.userId)` | `user.primaryEmailAddress?.emailAddress` |
| `req.user.firstName` | `clerkClient.users.getUser(auth.userId)` | `user.firstName` |
| `req.user.lastName` | `clerkClient.users.getUser(auth.userId)` | `user.lastName` |
| `req.user.profileImageUrl` | `clerkClient.users.getUser(auth.userId)` | `user.imageUrl` |
| `req.isAuthenticated()` | `requireAuth` middleware (rejects unauthorized requests automatically) | `isSignedIn` via `useAuth()` |
| `useAuth()` from `@workspace/replit-auth-web` | N/A | `useUser()` / `useAuth()` from `@clerk/react` |

**CRITICAL — `requireAuth` must use `sessionClaims.userId`:** The `requireAuth` middleware must extract the user ID as:

```typescript
const userId = auth?.sessionClaims?.userId || auth?.userId;
```

This is essential because migrated users have their original Replit Auth ID (e.g., `"927070657"`) stored as Clerk's `externalId`, which is surfaced via `sessionClaims.userId`. Using `auth.userId` alone would return the Clerk-native ID (e.g., `"user_2abc..."`), which does not match any existing application data for migrated users. New (post-migration) users will fall through to `auth.userId` as expected.
