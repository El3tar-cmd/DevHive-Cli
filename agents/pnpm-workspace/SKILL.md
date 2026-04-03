---
name: pnpm-workspace
description: Understand and build on the pnpm monorepo template. Use when working on workspace structure, TypeScript project references, dependency management, artifact routing, shared libraries, or cross-package changes.
---

# pnpm workspace skill

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
├── lib/                    # Shared libraries
├── scripts/                # Utility scripts (single workspace package)
├── pnpm-workspace.yaml     # Workspace package discovery, catalog pins, overrides
├── tsconfig.base.json      # Shared strict TS defaults for packages that can extend it
├── tsconfig.json           # Root TS solution config for composite libs only
└── package.json            # Root task orchestration and shared dev tooling
```

## TypeScript

Default model:

- `lib/*` packages are composite and emit declarations via `tsc --build`.
- `artifacts/*` and `scripts` are leaf workspace packages checked with `tsc --noEmit`. They should never import from each other, if you need to share functionality (encouraged) you must create a new lib.
- Root `tsconfig.json` is a solution file for libs only, used by `tsc --build`.
- `tsconfig.base.json` contains shared strict defaults. Not all packages extend it (e.g. Expo apps will use its own base).

Root commands:

- `pnpm run typecheck:libs` runs `tsc --build` for the composite libs.
- `pnpm run typecheck` is the canonical full check: builds libs first, then runs leaf workspace package typechecks.
- Prefer the root `typecheck` result over editor/LSP state when they disagree.

Adding a new lib:

- Add `composite`, `declarationMap`, and `emitDeclarationOnly` to its `tsconfig.json`.
- Add it to the root `tsconfig.json` `references` array.
- If it imports another lib, add that lib to its own `references`.

Adding a new artifact:

- Should be usually handled via the `artifacts` skill unless no artifact template satisfies the user's requirements.
- Do **not** add it to the root `tsconfig.json` references.

Project references:

- When one lib imports another lib, the importing lib must declare it in `references` so `tsc --build` can order and rebuild correctly.
- Root `tsconfig.json` should list the lib packages, not every workspace package.
- Artifact `references` to libs are optional but useful for:
  - explicit documentation of direct workspace dependencies
  - better editor/tsserver project awareness
  - standalone `tsc -b artifacts/<name>` style workflows

## Server & API contracts

For backend-backed apps, define the contract in OpenAPI first, then generate helpers from it.

Codegen command:

- `pnpm --filter @workspace/api-spec run codegen`

This generates files such as React Query hooks and Zod schemas. It is strongly recommended that you use them. The server should use Zod schemas to validate inputs and outputs, and clients should use the available hooks.

## Logging

**Never use `console.log` in server code.** Use `req.log` in route handlers and the singleton `logger` for non-request code. See `references/server.md` for setup and examples.

## References

- `references/openapi.md` — Setting up OpenAPI spec and code generation in this contract-first repo.
- `references/server.md` — Important information about adding routes and general tips.
- `references/db.md` — Adding new database schemas and running migrations.

## `scripts` (`@workspace/scripts`)

Put shared utility scripts in `./scripts`.

- Each script lives in `scripts/src/`
- Add a matching npm script in `scripts/package.json`
- `scripts` is treated like a leaf workspace package and typechecked with `tsc --noEmit`

## Proxy & service routing

A global reverse proxy routes traffic by path using each artifact's `.replit-artifact/artifact.toml`.

Example:

```toml
[[services]]
localPort = 8080
name = "API Server"
paths = ["/api"]
```

**Rules for accessing services:**

- For ad hoc requests, such as `curl`, always go through the shared proxy at `localhost:80`. Never call service ports directly.
  - Correct: `localhost:80/api/healthz`
  - Wrong: `localhost:8080/api/healthz`
- Paths are not rewritten. Services must handle their full base path themselves.
- The only exception is the EXPO artifact. If one exists, use $REPLIT_EXPO_DEV_DOMAIN to access it locally.
- In application code, prefer relative URLs when possible. For user-facing access, both development previews and published production domains already route through the shared proxy automatically. Published apps are exposed over HTTPS on the domains listed in `$REPLIT_DOMAINS` (comma-separated).
- Do NOT add Vite proxy configs or custom base URLs to reach other services; the shared proxy already handles cross-service routing.
- Routes across artifacts are matched most-specific-first, so a service on `/api` won't conflict with one on `/`.

## Package management

Workspace package rules:

- Workspace package names should use the `@workspace/` prefix.
- Each package must declare its own dependencies; dependencies are not shared implicitly across workspace packages.
- Root dependencies are for repo-level tooling such as `typescript`, `prettier`, `eslint`, `vitest`, etc.
- Do not use `pnpm add --no-frozen-lockfile`. `pnpm add` will automatically use `catalog:` if the dependency already has a catalog entry.

### devDependencies vs dependencies

- **Static/client-only artifacts** (Vite-built React apps): all packages → `devDependencies`.
- **Server artifacts**: runtime imports (`express`, `drizzle-orm`, `pg`) → `dependencies`; build tools, `@types/*` → `devDependencies`.
- If a dependency already exists in the `pnpm-workspace.yaml` catalog, use `"catalog:"`.
- Libraries should declare shared runtimes (`react`, `react-dom`) as `peerDependencies`.

## Codegen Outputs

See `references/openapi.md` for generated file paths and naming conventions. Do not change the OpenAPI `info.title` — it controls generated filenames.

## Common pitfalls

- Do not introduce an all-composite setup for leaf workspace packages. Declaration emit from apps causes type portability issues (TS2742) when multiple versions of `@types/*` packages exist across workspace packages.
- Do not add leaf workspace packages to the root `tsconfig.json` references; that solution file is for buildable libs only.
- Prefer root commands with `--filter` when targeting a specific package:
  - `pnpm --filter @workspace/api-server run build`
- If the editor and CLI disagree on cross-package types, trust `pnpm run typecheck`.
- If you change Orval output paths or the barrel exports, generated imports may break.

## Artifact Lifecycle

If you are creating or updating an artifact, follow the `artifacts` skill for the artifact callback lifecycle (`createArtifact`, `verifyAndReplaceArtifactToml`, `presentArtifact`, and `suggestDeploy()`) instead of redefining it here.
