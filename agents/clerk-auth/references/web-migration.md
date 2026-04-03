# Web Migration: Replit Auth → Clerk (pnpm Workspace)

This guide covers what to remove and what to transition for the Express API server and React+Vite web frontend. When adding Clerk code, refer to the `clerk-auth` skill for implementation details.

## Server-Side Migration

### 1. Remove auth routes

Delete the auth routes file (typically `artifacts/api-server/src/routes/auth.ts`) and its import/mount in `routes/index.ts`. This removes:

- `GET /api/login` — OIDC redirect with PKCE
- `GET /api/callback` — token exchange + user upsert + session creation
- `GET /api/logout` — session clear + OIDC end-session redirect
- `GET /api/auth/user` — returns user from session
- `POST /api/mobile-auth/token-exchange` — mobile PKCE flow (if present)
- `POST /api/mobile-auth/logout` — mobile session delete (if present)

### 2. Remove session library

Delete `artifacts/api-server/src/lib/auth.ts`. This contains `ISSUER_URL`, `getOidcConfig()`, session CRUD (`createSession`, `getSession`, `updateSession`, `deleteSession`), and cookie helpers. Clerk manages sessions externally.

### 3. Remove auth middleware

Delete `artifacts/api-server/src/middlewares/authMiddleware.ts` and remove its `app.use(authMiddleware)` from `app.ts`. This middleware loaded users from the sessions table and patched `req.user` / `req.isAuthenticated()`.

### 4. Remove `upsertUser`

The auth routes file contains an `upsertUser()` function that inserts/updates the user in the local `users` table on each OIDC callback. Remove it entirely — Clerk manages user data externally, so no local user syncing is needed. If other tables have foreign key constraints referencing the `users` table, remove the `.references(() => usersTable.id)` calls from the Drizzle schema files and run `drizzle-kit push` to apply the change to the database.

### 5. Wire Clerk server middleware

Follow the `clerk-auth` skill to:

- Copy the proxy middleware template and mount it before body parsers
- Mount `clerkMiddleware()` from `@clerk/express`

### 6. Transition `req.isAuthenticated()` / `req.user` in route handlers

Search all route files and replace:

| Remove (Replit Auth) | Replace with (Clerk) |
| --- | --- |
| `req.isAuthenticated()` guard | `requireAuth` middleware (see `clerk-auth` skill — rejects unauthorized requests automatically) |
| `req.user.id` | `req.userId` (set by `requireAuth` middleware) |
| `req.user.email`, `req.user.firstName`, etc. | `clerkClient.users.getUser(auth.userId)` using Clerk-native ID (only if needed server-side) |

### 7. Transition dependencies

Follow the `clerk-auth` skill setup section to install Clerk server dependencies. Then remove Replit Auth dependencies:

```bash
pnpm --filter @workspace/api-server remove openid-client cookie-parser
```

## Frontend Migration

### 1. Remove `@workspace/replit-auth-web`

Remove all imports of `useAuth` from `@workspace/replit-auth-web`. This hook called `GET /api/auth/user` and provided `{ user, isLoading, isAuthenticated, login, logout }`.

### 2. Transition auth hook calls

| Remove (Replit Auth) | Replace with (Clerk — see `clerk-auth` skill) |
| --- | --- |
| `useAuth()` from `@workspace/replit-auth-web` | `useUser()` + `useAuth()` from `@clerk/react` |
| `user.email` | `user?.primaryEmailAddress?.emailAddress` |
| `user.profileImageUrl` | `user?.imageUrl` |
| `login()` (navigates to `/api/login`) | Clerk `<SignIn>` component route |
| `logout()` (navigates to `/api/logout`) | `signOut()` from `useClerk()` |
| `isAuthenticated` conditional rendering | `<Show when="signed-in">` / `<Show when="signed-out">` |

### 3. Wire Clerk frontend

Follow the `clerk-auth` skill setup section to install client dependencies and set up `ClerkProvider` with Wouter routing, `/sign-in` and `/sign-up` routes, and `ClerkQueryClientCacheInvalidator` if using `@tanstack/react-query`.

Remove `"@workspace/replit-auth-web": "workspace:*"` from the artifact's `package.json`, then `pnpm install`.
