---
name: replit-auth
description: "Integrate Replit Auth (OpenID Connect with PKCE) into a pnpm monorepo with Express, React+Vite, and Expo React Native. Covers auth routes, middleware, web client hook, mobile auth, database schema, and session management. Use when the user asks to add authentication, login, sign-in, or user accounts, and explicitly requests to use Replit Auth, Replit SSO, or sign-in with Replit."
---

# Replit Auth for pnpm Monorepo (Express + React + Optional Expo)

Replit Auth uses OpenID Connect with PKCE. The server handles the full OIDC flow; there are no custom login forms. This skill covers an Express API server, a React+Vite web app, and optionally an Expo React Native mobile app.

## Architecture Overview

```text
Web (React+Vite)                    Mobile (Expo)
  |                                    |
  | cookie-based                       | expo-auth-session (PKCE)
  | redirect to /api/login             | gets auth code from OIDC provider
  |                                    | sends code to POST /api/mobile-auth/token-exchange
  v                                    v
Express API Server
  ├── middlewares/authMiddleware.ts   (loads user from session on every request)
  ├── routes/auth.ts                 (OIDC login/callback/logout + mobile auth)
  └── lib/auth.ts                    (session CRUD, OIDC config, user upsert)
  |
  | openid-client (v6)
  | cookie-parser, sessions in PostgreSQL
  v
Replit OIDC Provider (https://replit.com/oidc)
```

- **Web flow**: Browser redirects to `/api/login?returnTo=<base>` -> Replit OIDC -> `/api/callback` -> session cookie set -> redirect to the artifact's base path (from `returnTo`)
- **Mobile flow**: `expo-auth-session` opens OIDC provider in secure browser with PKCE -> gets auth code -> app sends code + code_verifier + state + nonce to `POST /api/mobile-auth/token-exchange` -> server validates with `openid-client`'s `authorizationCodeGrant` (full ID token signature verification) -> returns session token over HTTPS -> stored in `expo-secure-store` -> used as `Authorization: Bearer <token>` header

## Setup

### Step 1: OpenAPI Spec

Add the auth endpoints to `lib/api-spec/openapi.yaml` using the entries from `references/openapi.md`. Then run codegen:

```bash
pnpm --filter @workspace/api-spec run codegen
```

This generates Zod schemas in `@workspace/api-zod`, which the server routes use. Auth endpoints may also appear in generated client packages, but those generated clients should not be used for auth operations.

### Step 2: Database Schema

Copy the auth schema template:

```bash
cp .local/skills/replit-auth/templates/lib/db/src/schema/auth.ts lib/db/src/schema/auth.ts
```

Export from the db schema barrel (`lib/db/src/schema/index.ts`):

```typescript
export * from "./auth";
```

Push the schema:

```bash
pnpm --filter @workspace/db run push
```

### Step 3: Copy Server Files

Copy the auth route, middleware, and lib files directly into the API server:

```bash
# Auth utilities (session management, OIDC config, user upsert)
mkdir -p artifacts/api-server/src/lib
cp .local/skills/replit-auth/templates/api-server/src/lib/auth.ts artifacts/api-server/src/lib/auth.ts

# Auth middleware (loads user from session, patches req.isAuthenticated)
mkdir -p artifacts/api-server/src/middlewares
cp .local/skills/replit-auth/templates/api-server/src/middlewares/authMiddleware.ts artifacts/api-server/src/middlewares/authMiddleware.ts

# Auth routes (login, callback, logout, mobile token exchange)
cp .local/skills/replit-auth/templates/api-server/src/routes/auth.ts artifacts/api-server/src/routes/auth.ts
```

Install `openid-client` in the API server:

```bash
pnpm --filter @workspace/api-server add openid-client
```

### Step 4: Wire Up `app.ts`

The `authMiddleware` must be mounted as one of the early middlewares in `artifacts/api-server/src/app.ts`, before the router. It runs on every request, loads the user from the session if one exists, and patches `req.isAuthenticated()` onto the request.

Ensure pino structured logging is set up first — see the **Logging** section in the `pnpm-workspace` skill and `references/server.md` for setup instructions.

Update `app.ts`:

```typescript
import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./middlewares/authMiddleware";
import router from "./routes";

const app: Express = express();

// pinoHttp structured logging middleware should already be mounted here
// (see pnpm-workspace skill / references/server.md for setup)

app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

export default app;
```

Key points:

- `cors({ credentials: true, origin: true })` is required for the web app to send cookies cross-origin
- `cookieParser()` must be mounted before `authMiddleware`
- `authMiddleware` must be mounted before routes

### Step 5: Wire Up Routes

Import and mount the auth router in `artifacts/api-server/src/routes/index.ts`:

```typescript
import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);

export default router;
```

### Step 6: Web App — Browser Auth Package

Copy the browser auth package:

```bash
cp -r .local/skills/replit-auth/templates/lib/replit-auth-web/ lib/replit-auth-web/
```

Add the dependency to your web artifact's `package.json`:

```json
"@workspace/replit-auth-web": "workspace:*"
```

Then `pnpm install`.

Since `replit-auth-web` is a new composite lib, add it to the root `tsconfig.json` references and to the web artifact's `tsconfig.json` references:

```json
// root tsconfig.json – add to "references"
{ "path": "lib/replit-auth-web" }
```

```json
// artifacts/<web-app>/tsconfig.json – add to "references"
{ "path": "../../lib/replit-auth-web" }
```

Use the `useAuth()` hook in components:

```typescript
import { useAuth } from "@workspace/replit-auth-web";

function App() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <button onClick={login}>Log in</button>;
  return <button onClick={logout}>Log out</button>;
}
```

- `login()` navigates to `/api/login?returnTo=<BASE_URL>` (full page redirect, preserves artifact base path)
- `logout()` navigates to `/api/logout` (full page redirect)
- `useAuth()` calls `GET /api/auth/user` with `credentials: "include"` on mount

**Do NOT use generated API client code for auth operations.** For authentication state, login, and logout, always use `@workspace/replit-auth-web`.

### Step 7: Optional Mobile App (Expo React Native)

Skip this section if your project is web-only.

Copy the mobile auth provider:

```bash
cp .local/skills/replit-auth/templates/mobile/auth.tsx artifacts/<YOUR_MOBILE_APP>/lib/auth.tsx
```

#### Dependencies

Expo ecosystem packages (`expo-*`) must be version-pinned to match the project's Expo SDK. Running `pnpm add` without a version resolves to the latest on npm, which may belong to a newer SDK and break the app.

For SDK 54 projects:

```bash
pnpm --filter @workspace/<mobile-app> add expo-auth-session@~7.0.10 expo-crypto@~15.0.8 expo-web-browser@~15.0.10 expo-secure-store@~15.0.8
```

If the project already has any of these packages installed at compatible versions, they can be omitted from the command. If additional `expo-*` packages are needed, use this SDK 54 version reference:

| Package | SDK 54 version |
|---|---|
| `expo-auth-session` | `~7.0.10` |
| `expo-secure-store` | `~15.0.8` |
| `expo-crypto` | `~15.0.8` |
| `expo-web-browser` | `~15.0.10` |
| `expo-constants` | `~18.0.11` |

#### Environment Variables

The mobile app needs two `EXPO_PUBLIC_*` env vars injected at build time:

In `package.json` dev script:

```json
"dev": "EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN EXPO_PUBLIC_REPL_ID=$REPL_ID EXPO_PACKAGER_PROXY_URL=https://$REPLIT_EXPO_DEV_DOMAIN REACT_NATIVE_PACKAGER_HOSTNAME=$REPLIT_DEV_DOMAIN pnpm exec expo start ..."
```

#### app.json

Ensure the scheme and plugin are configured:

```json
{
  "expo": {
    "scheme": "your-app-slug",
    "plugins": ["expo-web-browser"]
  }
}
```

#### Configure API Client

On mobile, the Expo bundle talks to the API server directly so the base URL must be set explicitly, and there are no cookies so an auth token getter must be registered to attach a bearer token. Configure `@workspace/api-client-react`'s `customFetch` (see `lib/api-client-react/src/custom-fetch.ts`) at module level before any component renders:

```tsx
import * as SecureStore from "expo-secure-store";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

const domain = process.env.EXPO_PUBLIC_DOMAIN;
if (domain) setBaseUrl(`https://${domain}`);
setAuthTokenGetter(() => SecureStore.getItemAsync("auth_session_token"));
```

#### Wiring the Auth Provider

Wrap the app in `AuthProvider` in `_layout.tsx`:

```tsx
import { AuthProvider } from "@/lib/auth";

export default function RootLayout() {
  return (
    <AuthProvider>
      {/* rest of the app */}
    </AuthProvider>
  );
}
```

Use the hook in components:

```tsx
import { useAuth } from "@/lib/auth";

function HomeScreen() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  // ...
}
```

## Auth Routes

Routes are mounted at `/api` via the Express router (implemented as defined in `references/openapi.md`).

| Route | Method | Purpose |
| ------- | -------- | --------- |
| `/auth/user` | GET | Returns the current auth state from `req.user` — response validated with `GetCurrentAuthUserResponse` |
| `/login` | GET | Redirects to Replit OIDC with PKCE (web flow). Accepts optional `?returnTo=` query param (validated, stored in cookie) |
| `/callback` | GET | OIDC callback — validates tokens, creates session, sets cookie, redirects to the artifact's base path (from `return_to` cookie, defaults to `/`) |
| `/logout` | GET | Clears session, redirects to OIDC end-session endpoint |
| `/mobile-auth/token-exchange` | POST | Mobile token exchange — request body validated with `ExchangeMobileAuthorizationCodeBody` |
| `/mobile-auth/logout` | POST | Deletes session, returns `{ success: true }` |

The `GET /callback` route does **not** validate query parameters with Zod because the OIDC provider may include parameters not expressed in the schema.

## Using `req.isAuthenticated()` and `req.user`

The `authMiddleware` runs on every request. If a valid session exists, it sets `req.user` and patches `req.isAuthenticated()` as a TypeScript type guard. If no session is found, the request proceeds without a user.

Use `req.isAuthenticated()` to narrow the request type in route handlers:

```typescript
router.get("/profile", (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  // req.user is guaranteed to be defined here
  res.json({ name: req.user.firstName });
});
```

The global type augmentation (in `authMiddleware.ts`) ensures `req.user` and `req.isAuthenticated()` are available on every Express `Request` with full type safety.

## Security Considerations

- **Never pass session tokens in URLs or deep links.** The mobile flow uses `expo-auth-session` which handles the OIDC redirect securely, and the auth code is exchanged via HTTPS POST.
- **Always validate ID tokens server-side.** Use `openid-client`'s `authorizationCodeGrant()` which verifies the JWT signature, issuer, audience, nonce, and expiration. Never manually decode the ID token payload without verification.
- **Store mobile tokens in `expo-secure-store`**, not `AsyncStorage`. SecureStore uses the device's encrypted keychain.
- **Session cookies are `httpOnly`, `secure`, `sameSite: lax`** — not accessible to client-side JavaScript.
- **PKCE is mandatory** — both web and mobile flows use S256 code challenge.
- **OIDC state and nonce** prevent CSRF and replay attacks.

## Gotchas and Pitfalls

1. **`openid-client` v6 vs v5**: v6 uses a functional API (`client.discovery()`, `client.authorizationCodeGrant()`) not class-based. Do not use `new Issuer()` patterns — those are v5.

2. **Metro bundler crash**: If Metro crashes watching `openid-client`'s temp directory, add it to the blocklist in `metro.config.js`:

   ```javascript
   const { getDefaultConfig } = require("expo/metro-config");
   const config = getDefaultConfig(__dirname);
   config.resolver.blockList = [/\.cache\/openid-client\/.*/];
   module.exports = config;
   ```

3. **CORS**: The Express server must use `cors({ credentials: true, origin: true })` for the web app's cookie-based auth to work through the Replit proxy.

4. **Do NOT use "Replit" or "Replit Auth" in user-facing UI text.** Just use generic "Log in" / "Log out" labels.

5. **Do NOT create custom login/signup forms.** Replit provides authentication via its OIDC provider.

6. **Do NOT use generated API client code for auth operations.** Use `@workspace/replit-auth-web` for browser auth state and auth redirects.
