---
name: artifacts
description: "Use when creating or updating the artifact.toml for artifacts such as websites, web apps, mobile apps, slide decks, pitch decks, videos, and data visualizations. Formerly called the create-artifact skill."
---


# Artifacts Skill

## What Is an Artifact?

An **artifact** is a runnable project that the agent creates for the user. It is the primary unit of output the agent delivers.

Each artifact is a workspace package under `artifacts/<slug>/` in the monorepo. Calling `createArtifact()` runs the shared bootstrap flow for the chosen artifact type, scaffolds the project files, writes an `artifact.toml` with metadata, allocates service ports, and wires the artifact into `.replit` so it can be previewed and deployed. Dependency installation begins in the background and may still be running when `createArtifact()` returns.

When the user asks you to "build a website" or "create an app", you are creating an artifact. Call `createArtifact()` once, then continue implementation.

The workspace already includes a shared backend service. New web artifacts are primarily frontend packages and must treat `previewPath` as a required URL prefix for all app routes and API calls.

## When to Use

Use this skill when:

- Creating a new web application, video, or slide deck
- Bootstrapping any new project in the monorepo

## New Artifact vs. Existing Artifact

Add work to an existing artifact when it is a feature, page, or component of that artifact's product and shares the same domain, branding, and purpose.

Create a **new** artifact when the work is for a different product or domain, has different branding or purpose, or the user used standalone language like "make a web app" or "create a component." Do not reuse an existing artifact just because it is convenient.

**Not everything needs an artifact.** If the output is a file asset (script, document, image, CSV, config file, etc.), just create the file directly and tell the user where it is. Artifacts are for runnable projects with a preview, not for standalone files.

If ambiguous, ask the user: "Should I create this as a new standalone web app, or add it to [existing artifact name]?"

## When NOT to call `createArtifact`

- The artifact has already been created (do not call `createArtifact` twice for the same `slug`)

## Build Approach

Not all artifacts follow the same workflow. Choose your approach based on the artifact type:

- **Creative / canvas artifacts** — no backend, no OpenAPI, no codegen:
  - **mockup-sandbox** (design mockups, UI prototypes, variant comparisons): Read the `mockup-sandbox` skill. It uses its own Vite dev server and canvas iframes. Delegate design work to a DESIGN subagent. No artifact is needed if the mockup sandbox is present.
  - **slides** (slide decks, presentations): Create a slides artifact and build following the `slides` skill — no subagent is needed. Use `media-generation` for images.
  - **video-js** (short animated videos, up to 5 minutes): Create a video artifact and build following the `video-js` skill. Always delegate the entire build to a DESIGN subagent — do not build the video yourself. This is for creating animated content from code, not a video editor.
- **Full-stack artifacts** (react-vite, data-visualization, expo): Follow the OpenAPI-first workflow below.
  - If a `react-vite` artifact is frontend-only and does not need a backend, skip the OpenAPI spec and codegen steps — go straight to building the frontend after calling `createArtifact()`, still using design subagent for the frontend.
  - **Expo apps: skip the OpenAPI workflow by default.** Most mobile apps do not need a backend on the first build. Use AsyncStorage for persistence. Do NOT create a database, OpenAPI spec, or backend routes unless the user explicitly asks for server-side features. After `createArtifact()`, go straight to the Expo skill's `<first_build>` sequence.

**Full-stack artifacts — OpenAPI-first workflow:**

Get async work running as early as possible so it can proceed in the background while you build.

1. **Create the artifact** — call `createArtifact()`. It will guide you to the artifact's skill for build instructions.
2. **Write the OpenAPI spec** in `lib/api-spec/openapi.yaml` — this is the single source of truth for all API contracts. It is on the critical path: the spec gates codegen, which gates the frontend. Include both core CRUD and safe wow endpoints — lightweight read-only endpoints that make the app feel polished (dashboard summaries, recent activity, grouped counts, domain aggregates) — the artifact's skill has details on what to plan.
3. **Run codegen** (`pnpm run --filter @workspace/api-spec codegen`) — generates React Query hooks and Zod schemas. Do NOT read the generated files; they are large and will fill your context.
4. **Launch the frontend build immediately after codegen** — the artifact's skill will tell you how (e.g., async design subagent for react-vite and data-visualization). Do NOT do any other work between codegen and launching the frontend build.
5. **Build the backend while the frontend runs** — provision the database, write the schema, build route handlers, and seed data. The frontend is the bottleneck. **Exception: Expo apps should NOT use this workflow unless the user explicitly requested a backend. Use AsyncStorage instead.**

**Key principles:**

- Do NOT provision the database or write DB schema before launching the frontend build. DB work doesn't gate the frontend — OpenAPI does.
- **Expo reminder: do not create a database for Expo apps in the first build.** Use AsyncStorage. This is the most common mistake.
- There is no need to test or code review the first build.
- Trust generated frontend and subagent output as-is. Do not verify it.
- Batch independent operations within the same artifact into parallel tool calls (e.g., write multiple files for the same artifact at once, read multiple files at once). Do NOT try to build two artifacts simultaneously — build one at a time.
- Do not waste time reading files you don't need. All important files have been opened for you.
- Do not read the artifact's skill before creating the artifact or the skill will be read twice. Creating an artifact automatically loads the relevant skill instructions into your context. Do not waste time reading the skill yourself.

## Creating an Artifact

Artifact creation is a single callback call. `createArtifact()` handles bootstrap + registration internally.

```javascript
const result = await createArtifact({
    artifactType: "<artifactType>",
    slug: "<slug>",
    previewPath: "/",
    title: "My Project"
});
```

`createArtifact()` expects a fresh slug. If `artifacts/<slug>/` already exists, the call fails instead of trying to reuse partially created files.

## Available Callbacks

### createArtifact(artifactType, slug, previewPath, title)

Bootstrap and register a new artifact in one call. This should be your default for all new artifacts, and it requires an unused `slug`.

**Parameters:**

<!-- BEGIN_ARTIFACT_LIST -->
- `artifactType` (str, required): The artifact type identifier. Use one of:
  - `"expo"` (mobile app)
  - `"data-visualization"` (data visualization scaffold (dashboards, analysis reports, dataset explorers) with chart/table defaults)
  - `"mockup-sandbox"` (isolated mockup sandbox for rapid UI prototyping on the canvas)
  - `"react-vite"` (React + Vite web app)
  - `"slides"` (presentation slide deck scaffold)
  - `"video-js"` (Replit Animation app)
<!-- END_ARTIFACT_LIST -->
- `slug` (str, required): A short, kebab-case slug (e.g., `"my-website"`, `"q1-pitch-deck"`, `"budget-tracker"`). This slug is used in two places:
  - Workspace package name: `@workspace/<slug>`
  - Artifact directory: `artifacts/<slug>/`
- `previewPath` (str, required): The URL prefix where the artifact is served. **Use `"/<slug>/"` (e.g., `"/my-website/"`, `"/budget-tracker/"`) for consistency.** However, **one artifact should always be at `"/"`** — if nothing is at the root, the dev URL (e.g. `my-app.replit.app`) shows a blank page, which is a bad experience. Prefer placing web apps (`react-vite`, `data-visualization`) at the root over mobile, video, or slides artifacts. Every artifact in the workspace must use unique service paths.
- `title` (str, required): A short, human-readable title for the artifact (e.g., `"Recipe Finder"`, `"Q1 Pitch Deck"`). Displayed to the user in the UI.

**Returns:** Dict with:

- `success` (bool): Whether the operation succeeded
- `artifactId` (str): The stable artifact ID — pass this to `presentArtifact`
- `ports` (dict[str, int]): Map of service names to their assigned local ports

**Example:**

```javascript
const result = await createArtifact({
    artifactType: "react-vite",
    slug: "my-website",
    previewPath: "/",
    title: "Recipe Finder"
});
```

### listArtifacts()

List all artifacts currently registered in the workspace. Use this to look up artifact IDs when you need to present or reference an artifact you didn't just create.

**Parameters:** None

**Returns:** Dict with:

- `artifacts` (list): Each entry contains:
  - `artifactId` (str): The stable artifact ID — pass this to `presentArtifact`
  - `kind` (str): How the artifact is presented (preview kind, e.g., `"web"`, `"slides"`, `"video"`)
  - `title` (str | null): The human-readable title
  - `artifactDir` (str): The folder name where the artifact lives

**Example:**

```javascript
const {artifacts} = await listArtifacts();
```

### verifyAndReplaceArtifactToml(tempFilePath, artifactTomlPath)

Replace an existing `artifact.toml` file through a validated temp file. Do not edit `artifact.toml` directly.

**Parameters:**

- `tempFilePath` (str, required): Absolute path to the temporary TOML file you wrote and edited.
- `artifactTomlPath` (str, required): Absolute path to the real `artifact.toml` file to replace.

**Important rules:**

- First copy the current `artifact.toml` to a temp file, such as `/absolute/path/to/artifacts/my-app/.replit-artifact/artifact.edit.toml`
- Make all TOML edits against the temp file using normal file editing tools
- Then call `verifyAndReplaceArtifactToml()` with absolute paths to validate the temp file against the artifact schema and replace the real `artifact.toml`
- The target path must point to a real `.replit-artifact/artifact.toml` file inside the repl
- If validation fails, the temp file is left in place so you can inspect and fix it

**Recommended update flow:**

1. Use `listArtifacts()` to identify the artifact directory when needed.
2. Read the current `artifact.toml`.
3. Write a sibling temp file such as `/absolute/path/to/artifacts/my-app/.replit-artifact/artifact.edit.toml`.
4. Make the desired metadata or service changes in that temp file.
5. Call `verifyAndReplaceArtifactToml()` with the absolute temp file path and the absolute real `artifact.toml` path.

**When to use this:**

- changing artifact metadata like `title`, `previewPath`, `kind`, or `version`
- changing service definitions, paths, commands, ports, rewrites, or env blocks in `artifact.toml`
- making multiple coordinated TOML edits at once where a patch-style API would be awkward

**Do not:**

- edit `artifact.toml` in place
- call this with arbitrary file paths outside `.replit-artifact/artifact.toml`
- expect the callback to merge partial changes for you; the temp file should contain the full final TOML you want to keep

**Returns:** Dict with:

- `success` (bool): Whether the replacement succeeded

**Example:**

```javascript
await verifyAndReplaceArtifactToml({
    tempFilePath: "/absolute/path/to/artifacts/my-website/.replit-artifact/artifact.edit.toml",
    artifactTomlPath: "/absolute/path/to/artifacts/my-website/.replit-artifact/artifact.toml"
});
```

## Delivering the Result — `presentArtifact` + `suggestDeploy`

After building the artifact, present it and — for deployable types — suggest publish, all in one code execution block.

**Deployable artifacts** (`react-vite`, `expo`, `data-visualization`) — present and suggest deploy:

```javascript
await presentArtifact({artifactId: result.artifactId});
await suggestDeploy();
```

**Non-deployable artifacts** (`slides`, `video-js`, `mockup-sandbox`) — present only. `mockup-sandbox` is a local prototyping sandbox and is not meant to be deployed. `slides` and `video-js` are exported from the preview pane. **Never call `suggestDeploy` for these types:**

```javascript
await presentArtifact({artifactId: result.artifactId});
```

- `presentArtifact` opens the preview pane so the user can see what you built. Without this call, the user won't see the artifact preview — even if the app is running correctly. Pass the `artifactId` (str, required) returned by `createArtifact`.
- `suggestDeploy` prompts the user to publish their project with one click. Takes no parameters. This is a terminal action — once called, do not take further actions.

Always call `presentArtifact` after finishing work on any artifact — whether you just created it, made changes to it, or fixed a bug in it. If you built multiple artifacts, present each one. Some skills define additional post-present steps (e.g., data analysis); follow those skill-specific instructions after presenting.

## Services and Workflows

<!-- BEGIN_SERVICES_TABLE -->
| Artifact | Preview Kind | Service name(s) | Dev command(s) | Path | Production serve | Production build | Production run |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `expo` | `mobile` | `expo` | `pnpm --filter @workspace/__SLUG__ run dev` | `previewPath` |  | `pnpm --filter @workspace/__SLUG__ run build` | `pnpm --filter @workspace/__SLUG__ run serve` |
| `data-visualization` | `web` | `web` | `pnpm --filter @workspace/__SLUG__ run dev` | `previewPath` | `static` | `pnpm --filter @workspace/__SLUG__ run build` |  |
| `mockup-sandbox` | `design` | `web` | `pnpm --filter @workspace/__SLUG__ run dev` | `previewPath` | — | — | — |
| `react-vite` | `web` | `web` | `pnpm --filter @workspace/__SLUG__ run dev` | `previewPath` | `static` | `pnpm --filter @workspace/__SLUG__ run build` |  |
| `slides` | `slides` | `web` | `pnpm --filter @workspace/__SLUG__ run dev` | `previewPath` | `static` | `pnpm --filter @workspace/__SLUG__ run build` |  |
| `video-js` | `video` | `web` | `pnpm --filter @workspace/__SLUG__ run dev` | `previewPath` | `static` | `pnpm --filter @workspace/__SLUG__ run build` |  |
<!-- END_SERVICES_TABLE -->

The web service's URL prefix is set to whatever you pass as `previewPath`. Route handling is prefix-aware: frontend routes and API requests must include this prefix.

**Mobile:** Expo is served directly at its assigned port and uses `previewPath` as its registered route.

## Failure Recovery

If `createArtifact` fails, inspect the error and retry with corrected inputs. The callback requires a clean `slug` on each attempt, so remove any partial `artifacts/<slug>/` directory before reusing that slug.

- **Slug already exists** → Choose a different `slug`, or remove the existing artifact directory before retrying
- **`DUPLICATE_PREVIEW_PATH`** → Choose a different `previewPath`
- **Bootstrap fails** → Fix the reported shell/setup issue, then retry with a clean slug or after removing any partial directory
- **Artifact is missing `files/`** → Migrate that artifact type to the shared bootstrap layout before using `createArtifact`

## Examples

<!-- BEGIN_EXAMPLES -->
### Mobile app (`expo`)

```javascript
const result = await createArtifact({
    artifactType: "expo",
    slug: "my-app",
    previewPath: "/",
    title: "My App"
});
const expoPort = result.ports.expo;

// Expo is scaffolded under artifacts/my-app
// and API work should be added to the shared api-server.
//
// Multi-artifact note: do not tell the subagent to read a sibling web
// artifact's src/index.css for design tokens here — that CSS is only
// trustworthy after the web frontend build has finished. Instead,
// extract tokens in the main loop after the web build completes, sync
// them into constants/colors.ts (colors + radius), app.json, and _layout.tsx yourself,
// then launch the Expo subagent with the synced files. See
// multi-artifact-creation.md "Visual Consistency" for the full sequence.
await startAsyncSubagent({
    task: "Build the mobile app frontend. Read the expo SKILL.md, then implement the UI components and screens. Use the design tokens from constants/colors.ts via the useColors hook (colors and radius), configure fonts in app/_layout.tsx, and set the splash background in app.json.",
    fromPlan: true,
    relevantFiles: [
        ".local/skills/expo/SKILL.md",
        "artifacts/my-app/app/_layout.tsx",
        "artifacts/my-app/app/(tabs)/_layout.tsx",
        "artifacts/my-app/app/(tabs)/index.tsx",
        "artifacts/api-server/src/index.ts",
        "artifacts/my-app/constants/colors.ts",
        "artifacts/my-app/hooks/useColors.ts",
        "artifacts/my-app/app.json"
    ]
});

await presentArtifact({artifactId: result.artifactId});
await suggestDeploy();
```

### Dashboard scaffold with chart/table defaults (`data-visualization`)

```javascript
const result = await createArtifact({
    artifactType: "data-visualization",
    slug: "sales-dashboard",
    previewPath: "/sales-dashboard/",
    title: "Sales Dashboard"
});

// Recharts, PapaParse, and TanStack React Table are pre-configured
await startAsyncSubagent({
    task: "Build the dashboard",
    fromPlan: true,
    relevantFiles: [
        ".local/skills/data-visualization/SKILL.md",
        "artifacts/dashboard/client/src/pages/Dashboard.tsx",
        "artifacts/dashboard/server/routes.ts",
        "artifacts/dashboard/client/src/config.ts"
    ]
});

await presentArtifact({artifactId: result.artifactId});
await suggestDeploy();
```

Creates a data visualization dashboard with Recharts (charts), PapaParse (CSV parsing), and TanStack React Table (data tables) pre-configured.
<!-- END_EXAMPLES -->

### Multiple artifacts in one workspace

Each artifact must have a unique `slug` and `previewPath`. At least one artifact MUST use `previewPath: "/"` — otherwise users will see a blank page at the root.

**IMPORTANT:** When building multiple artifacts, you MUST read the file `references/multi-artifact-creation.md` BEFORE creating any artifacts. Do not skip this — it contains critical sequencing and parallelism rules that will significantly affect build quality and speed.

## Limitations

- Each `slug` can only be used once — calling `createArtifact` again with the same `slug` will fail
- Artifacts must use one of the artifact types listed above
- Port assignment is automatic and cannot be manually specified

## Bootstrap Constraints

<!-- BEGIN_BOOTSTRAP_CONSTRAINTS -->
### Mobile bootstrap rules (`artifact: "expo"`)

- Expo now uses the shared Express API server in the monorepo. Add backend routes in `artifacts/api-server`.
- The generated package owns its Expo dependencies; keep them in `files/package.json.template` so `pnpm install` produces a runnable app.
<!-- END_BOOTSTRAP_CONSTRAINTS -->
