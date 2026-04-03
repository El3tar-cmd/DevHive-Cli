---
name: clerk-auth
description: Default user authentication solution. Use this skill for any authentication, login, signup, or user account request unless the user explicitly asks for Replit Auth, Sign in with Replit, or Replit SSO.
---

# Clerk Auth

Set up Clerk authentication with proxy support. Keys are automatically provisioned.

## When to Use

- User wants authentication, login, signup, or user accounts (this is the default)
- User wants custom branding on login/signup screens
- User wants their own user database
- Any generic auth request that does not explicitly mention "Replit Auth", "Sign in with Replit", or "Replit SSO"

## Setup

### Step 1: Provision Clerk App

In the JavaScript sandbox, call the `setupClerkWhitelabelAuth` function to provision your Clerk app and set secrets:

```javascript
const result = await setupClerkWhitelabelAuth();
console.log(result);
```

### Step 2: Copy Proxy Middleware Template

```bash
mkdir -p artifacts/api-server/src/middlewares
cp .local/skills/clerk-auth/templates/api-server/src/middlewares/clerkProxyMiddleware.ts artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts
```

### Step 3: Install Server Dependencies

```bash
pnpm --filter @workspace/api-server add http-proxy-middleware @clerk/express
```

### Step 4: Wire Up `app.ts`

In `artifacts/api-server/src/app.ts`, mount the proxy middleware before body parsers (the proxy streams raw bytes). Ensure pino structured logging is set up first — see the **Logging** section in the `pnpm-workspace` skill and `references/server.md` for setup instructions.

```typescript
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
import router from "./routes";

const app = express();

// pinoHttp structured logging middleware should already be mounted here
// (see pnpm-workspace skill / references/server.md for setup)

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(clerkMiddleware());

app.use("/api", router);

export default app;
```

### Step 5: Install Client Dependencies

```bash
pnpm --filter @workspace/<artifact-name> add @clerk/react
```

## Expo Setup (optional)

When the mobile app uses Expo, follow these additional steps to integrate Clerk authentication.

### Step 1: Install Expo Dependencies

Expo ecosystem packages (`expo-*`) must be version-pinned to match the project's Expo SDK. Running `pnpm add` without a version resolves to the latest on npm, which may belong to a newer SDK and break the app.

For SDK 54 projects:

```bash
pnpm --filter @workspace/<expo-app-artifact-name> add -D @clerk/expo expo-auth-session@~7.0.10 expo-secure-store@~15.0.8 expo-web-browser@~15.0.10 expo-crypto@~15.0.8
```

If the project already has any of these packages installed at compatible versions, they can be omitted from the command. If `@clerk/expo` peer dependency warnings mention other missing `expo-*` packages not listed above, use this SDK 54 version reference:

| Package | SDK 54 version |
|---|---|
| `expo-auth-session` | `~7.0.10` |
| `expo-secure-store` | `~15.0.8` |
| `expo-crypto` | `~15.0.8` |
| `expo-web-browser` | `~15.0.10` |
| `expo-constants` | `~18.0.11` |

### Step 2: Pass the Publishable Key to the Dev Script

In the Expo app's `package.json`, prepend the Clerk publishable key as an environment variable to the existing `dev` script (keep all existing env vars and flags intact):

```json
{
  "scripts": {
    "dev": "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=$CLERK_PUBLISHABLE_KEY <existing dev command>"
  }
}
```

### Step 3: Configure Environment Variables in `build.js`

In `build.js`, construct the Clerk proxy URL from the deployment domain and forward all Clerk env vars to the Expo build:

```javascript
const clerkProxyUrl = process.env.CLERK_PROXY_URL
  ? `https://${expoPublicDomain}${process.env.CLERK_PROXY_URL}`
  : "";

const env = {
  ...process.env,
  // ...other env vars...
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY || "",
  EXPO_PUBLIC_CLERK_PROXY_URL: clerkProxyUrl,
};
```

## IMPORTANT

- The server-side proxy code is production only and is not used in development. Do not ask for or set any env vars related to the proxy. All production setup is handled by a separate system.
- When delegating to the design subagent, be sure to include all of the code instructions/guidance below in the task description so it follows them closely

### Home Route Behavior

The artifact's base path (`import.meta.env.BASE_URL`) must always be a publicly accessible landing page for unauthenticated users — never redirect them to sign-in or sign-up. Dropping users onto a sign-in screen with no context about the app causes confusion and hurts conversion. Avoid `<RedirectToSignIn>`, wrapping the homepage in auth-only gates, or any explicit redirect from the base path to `/sign-in` or `/sign-up`.

For authenticated users, always redirect the base path to a user-portal view so they land directly in the app without an extra click. After the user signed-out, redirects to the home route rather than the sign-in route.

Example code:

```typescript
import { Show } from "@clerk/react";
import { Switch, Route, Redirect } from "wouter";

// Inside <WouterRouter base={basePath}>, all route paths and navigation
// targets are base-relative. "/" matches {basePath}/, "/user-portal"
// navigates to {basePath}/user-portal, etc.

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/user-portal" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function UserPortal() {
  return (
    <>
      <Show when="signed-in">
        <UserPortalPage />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/user-portal" component={UserPortal} />
      {/* Other routes */}
    </Switch>
  );
}
```

## After Setup - Web App

### 1. Set up client routing with Wouter base path

**This is vital.** Setting `<WouterRouter base={basePath}>` makes every location change via wouter's components and hooks (e.g. `<Route>`, `<Redirect to>`, `setLocation`) relative to the base URL. However, Clerk's `<SignIn path>` and `<SignUp path>` props read `window.location.pathname` directly and must be **full** paths — use `` `${basePath}/sign-in` `` and `` `${basePath}/sign-up` ``.

**Important:** The proxy setup does not work with Clerk's hosted pages. You must create dedicated `/sign-in` and `/sign-up` routes in your app to handle OAuth callbacks.

```typescript
import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { Switch, Route, useLocation, Router as WouterRouter } from 'wouter';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// NOTE: in dev this env var will be empty, in prod it will be automatically set
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Clerk passes full paths to routerPush/routerReplace, but wouter's
// setLocation prepends the base — strip it to avoid doubling.
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

function SignInPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
      {/* path must be the full browser path — Clerk reads window.location.pathname directly */}
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

// Helps user's webview stay up-to-date when the signed-in user changes by invalidating the QueryClient cache.
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          {/* HomeRedirect renders homepage or user portal based on signed-in status. */}
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          {/* Add other routes here */}
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
```

### 2. Protect API routes

Use `getAuth` from `@clerk/express` to check for an authenticated user:

```typescript
import { getAuth } from "@clerk/express";

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userId = userId;
  next();
};

app.get("/api/protected", requireAuth, handler);
```

### 3. Use auth state in components

Use the `<Show>` component to conditionally render based on authentication state:

```typescript
import { Show } from "@clerk/react";

function MyComponent() {
  return (
    <>
      {/* Show content only to signed-in users */}
      <Show when="signed-in">
        {/* Protected content */}
      </Show>

      {/* Show content only to signed-out users */}
      <Show when="signed-out">
        {/* Login prompt or redirect */}
      </Show>
    </>
  );
}
```

### 4. Render user profile

Use `useUser` hook to get current authenticated user.
**Important:** Do not use `<UserButton />` by default — the built-in component is not customizable and may expose confusing Clerk-level user management options to end users.

```typescript
import { useUser } from "@clerk/react";

// Render component with user profile
const { user, isLoaded } = useUser();
```

## After Setup - Mobile App

### 1. Set Up ClerkProvider in the Root Layout

In the top-level `_layout.tsx`, wrap the app with `ClerkProvider` and `ClerkLoaded`:

```typescript
import { ClerkProvider, ClerkLoaded } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { setBaseUrl } from "@workspace/api-client-react";

const domain = process.env.EXPO_PUBLIC_DOMAIN;
if (domain) setBaseUrl(`https://${domain}`);

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const proxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
      proxyUrl={proxyUrl}
    >
      <ClerkLoaded>
        {/* ...rest of app... */}
      </ClerkLoaded>
    </ClerkProvider>
  );
}
```

### 2. Wire Up the Auth Token for API Calls

In a layout that requires authentication (e.g. `(home)/_layout.tsx`), use `setAuthTokenGetter` from `@workspace/api-client-react` so the generated API client attaches the bearer token to every request:

```typescript
import { useEffect } from "react";
import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/expo";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export default function HomeLayout() {
  const { isSignedIn, getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

### 3. Build Custom Authentication Screens

By default, implement Email + Password and Google as sign-in / sign-up options unless the user asks otherwise.

You **must** build custom authentication screens — native Clerk components are incompatible with Expo Go, so a custom layout is the only viable approach.

All authentication code **must** follow the Clerk Core v3 SDK APIs documented in the references below. Do **not** rely on prior knowledge of the Clerk SDK — the Core v3 API has breaking changes from v2, and using outdated patterns will produce runtime errors. Read the relevant reference in full before writing any authentication code.

- For email/password sign-in and sign-up flows, follow `.local/skills/clerk-auth/references/custom-ui/expo-sdk-email-password.md`.
- For Google OAuth (and other OAuth provider) sign-in and sign-up flows, follow `.local/skills/clerk-auth/references/custom-ui/expo-sdk-oauth.md`.

### 4. (IMPORTANT) Fix Incompatible Package Versions

ALWAYS fix incompatible package version warnings from the system log. These warnings indicate mismatched peer dependencies that **will** cause runtime crashes or subtle bugs. Resolve every version conflict before proceeding — do not ignore them.

## Environment Variables (Auto-Provisioned)

These are set automatically by `setupClerkWhitelabelAuth()`. Do not ask the user for these values.

- `CLERK_SECRET_KEY` (server): Auto-provisioned secret key
- `CLERK_PUBLISHABLE_KEY` (server): Auto-provisioned publishable key
- `VITE_CLERK_PUBLISHABLE_KEY` (client): Auto-provisioned publishable key

## Migrating from Replit Auth

When migrating an existing app from Replit Auth to Clerk, read the following references:

- `references/migration.md` — General migration guidance: detection, common rules, user identity mapping, and the critical `sessionClaims.userId` requirement for migrated users.
- `references/web-migration.md` — Web app migration (Express API server + React+Vite frontend): what to remove and what to transition.
- `references/expo-migration.md` — Expo mobile app migration: what to remove and what to transition.

## Troubleshooting

### Unauthorized (401) errors in the preview web app

When API requests from the web app return 401 Unauthorized, **calling `setAuthTokenGetter` is never the correct fix for web applications**. That function exists only for mobile (Expo) apps where cookie-based sessions are unavailable. In the web app, the browser automatically sends session cookies with every API request, so authentication should work without any explicit token handling.

Instead:

1. **Check middleware setup** — Verify that `clerkMiddleware()` is mounted in `app.ts` before the API routes, and that the `requireAuth` middleware is correctly wired on protected endpoints (checking `getAuth(req)` for a valid session).
2. **When not sure, add debugging logs** — Add temporary logging inside the `requireAuth` middleware (e.g. log the output of `getAuth(req)`) to see what Clerk is receiving. Then restart the client and API server workflows and ask the user to test again so you can inspect the logs.

## Limitations

- Idempotent: Safe to call multiple times
- Proxy path is hardcoded to `/__clerk`
