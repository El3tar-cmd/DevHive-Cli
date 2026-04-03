---
name: deployment
description: Use when the user asks to publish, deploy, or configure deployment settings, or when the user reports their deployed app is broken, asks about production errors, or wants to check server logs.
---

# Deployment Skill

Configure deployment settings, publish your project, and debug deployment issues.

## When to Use

Use this skill when:

- Configuring how the project should run in production
- The project is in a working state and ready for publishing
- The user explicitly asks to publish or deploy the project
- You've completed implementing a feature and verified it works
- Setting up deployment for different project types (websites, bots, scheduled jobs)
- The user reports their deployed application is not working correctly
- The user wants to see what errors are occurring in production
- The user needs to debug a runtime issue with their deployed app
- The user asks to check deployment or server logs

## When NOT to Use

- Project has known errors or incomplete features
- You haven't validated that the project works
- The user is just testing or prototyping

## Reference Documents

This skill has additional reference documents for specific deployment scenarios. Read them as needed:

- `references/deployment-logs.md` — How to fetch and analyze runtime deployment logs. Read this when the user's deployed app is misbehaving, the live site is down, or they want to check production logs.

## Available Functions

### verifyAndReplaceArtifactToml({ tempFilePath, artifactTomlPath })

Validate and replace an artifact's `artifact.toml` through a temp file (from the `artifacts` skill). To update deployment settings, copy the current `artifact.toml` to a temp file (e.g. `artifact.edit.toml`), edit the temp file, then call this callback with absolute paths. Do not edit `artifact.toml` directly. See the `artifacts` skill for full documentation, parameters, and usage rules.

### suggestDeploy()

Prompt the user to click the Publish button after the app is ready. **Only works in the main repl context** — in task-agent/subrepl sessions this callback returns `success: false`. If you are in a task agent, skip this call and instead remind the user to publish from the main version after merging.

### fetchDeploymentLogs({ afterTimestamp, beforeTimestamp, message, messageContext })

Fetch and analyze deployment logs. See `references/deployment-logs.md` for full documentation.

## Deployment Targets

Choose the appropriate deployment target based on your project type:

### autoscale (Recommended Default)

Use for stateless websites and APIs that don't need persistent server memory.

- **Best for:** Web applications, REST APIs, stateless services
- **Behavior:** Scales up/down based on traffic, only runs when requests arrive
- **State:** Use databases for persistent state (not server memory)
- **Cost:** Most cost-effective for variable traffic

### vm (Always Running)

Use for applications that need persistent server-side state or long-running processes.

- **Best for:** Discord/Telegram bots, WebSocket servers, web scrapers, background workers
- **Behavior:** Always running, maintains state in server memory
- **State:** Can use in-memory databases, local files, or external databases

### scheduled

Use for cron-like jobs that run on a schedule.

- **Best for:** Data processing, cleanup tasks, periodic reports, batch jobs
- **Behavior:** Runs on configured schedule, not continuously
- **Note:** Do NOT use for websites or APIs

### static

Use for client-side websites with no backend server.

- **Best for:** Static HTML sites, SPAs (React, Vue, etc.), documentation sites
- **Behavior:** Serves static files directly, no server-side processing
- **Note:** The `run` command is ignored; must specify `publicDir`

## Deployment Configuration in Pnpm workspace

In a PNPM workspace, deployment configuration lives in each artifact's `.replit-artifact/artifact.toml` file, **not** in `.replit`. The `.replit` file's `deployment.run` is ignored and each artifact's `artifact.toml` controls run/build commands. `.replit`'s `deployment.build` acts only as a pre-build hook that runs at the repo root before artifact-specific builds.

Each artifact's `[services.production]` section controls:

- `run` — the production run command
- `build` — the production build command
- `serve` — whether to serve as `static` or run a process
- `publicDir` — directory containing static files (for static serve mode)

To update these settings, use `verifyAndReplaceArtifactToml` from the `artifacts` skill.

## Best Practices

1. **Validate before publishing**: Always verify the project works before suggesting publish
2. **Use production servers**: Avoid insecure development servers in production
3. **Choose the right target**: Match deployment type to your application's needs
4. **Configure once**: Set up deployment config early, then suggest publishing when ready
5. **Check workflows first**: Ensure workflows are running without errors before publishing

## Important Notes

1. **User-initiated publishing**: The user must click the Publish button to actually deploy
2. **Automatic handling**: Publishing handles building, hosting, TLS, and health checks automatically
3. **Domain**: Published apps are available at a `.replit.app` domain or custom domain if configured
4. **Production config lives in `artifact.toml`**: Each artifact's deployment settings are in its `.replit-artifact/artifact.toml` file, not in `.replit`. Always check `artifact.toml` when configuring deployment.

## Example Workflow

```javascript
// 1. To update deployment settings, use verifyAndReplaceArtifactToml
// from the artifacts skill (temp-file workflow)

// 2. After verifying the app works, suggest publishing to the user
await suggestDeploy();
```
