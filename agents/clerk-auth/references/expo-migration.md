# Expo Mobile Migration: Replit Auth → Clerk (pnpm Workspace)

This guide covers what to remove and what to transition for an Expo React Native mobile app. When adding Clerk code, refer to the `clerk-auth` skill for implementation details.

## What to Remove

The Replit Auth mobile auth file (typically `artifacts/<mobile-app>/lib/auth.tsx`) contains:

- `ISSUER_URL` constant pointing to `https://replit.com/oidc`
- `AuthProvider` using `expo-auth-session`, `expo-web-browser`, `expo-secure-store`
- `useAutoDiscovery(ISSUER_URL)` and `useAuthRequest()` for PKCE
- Token exchange via `POST /api/mobile-auth/token-exchange`
- `fetchUser()` calling `GET /api/auth/user` with `Authorization: Bearer <token>`
- `useAuth()` hook returning `{ user, isLoading, isAuthenticated, login, logout }`
- `WebBrowser.maybeCompleteAuthSession()` call at module level

Delete this entire file.

## What to Transition

### 1. AuthProvider → ClerkProvider

Replace the Replit Auth `AuthProvider` with `ClerkProvider` from `@clerk/expo`, using a `tokenCache` backed by `expo-secure-store`. Wrap the app in `_layout.tsx`. Follow the `clerk-auth` skill Expo setup section.

### 2. useAuth() hook

| Remove (Replit Auth) | Replace with (Clerk) |
| --- | --- |
| `useAuth()` from `lib/auth` | `useUser()` + `useAuth()` from `@clerk/expo` |
| `user.email` | `user.primaryEmailAddress?.emailAddress` |
| `user.profileImageUrl` | `user.imageUrl` |
| `isLoading` | `!isLoaded` from `useUser()` |
| `isAuthenticated` | `isSignedIn` from `useAuth()` |
| `login()` (calls `promptAsync()`) | Custom sign-in page using `useSignIn()` hook (Clerk's native `<SignIn />` component is not supported in Expo Go). Support Google OAuth and email/password sign-in options. |
| `logout()` (calls `/api/mobile-auth/logout`) | `signOut()` from `useAuth()` |

### 3. Server-side mobile endpoints

Remove from the API server (if not already removed by web migration):

- `POST /api/mobile-auth/token-exchange`
- `POST /api/mobile-auth/logout`

The mobile app no longer communicates with the Express server for auth — `@clerk/expo` talks directly to the Clerk API. For authenticated API calls to the Express server, use `useAuth().getToken()` from `@clerk/expo` to obtain a session token and attach it as a `Bearer` header. The server's `clerkMiddleware()` / `requireAuth` will validate it automatically.

### 4. Setup Clerk Expo

Follow the `clerk-auth` skill Expo setup section to install dependencies, configure environment variables, and wire the provider.
