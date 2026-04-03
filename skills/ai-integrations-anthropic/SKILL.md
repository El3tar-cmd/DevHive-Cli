---
name: ai-integrations-anthropic
description: |
  Anthropic AI integration via Replit AI Integrations proxy (JavaScript/TypeScript). Provides Anthropic-compatible API access without requiring your own API key.
---

# Anthropic AI Integration

Set up Anthropic AI integration via Replit AI Integrations proxy. Keys are automatically provisioned.

## Supported Anthropic APIs

- messages

## Supported Anthropic Models

- claude-opus-4-6: Most capable, best for complex reasoning and coding tasks. Prefer claude-opus-4-6 over other Opus-series models.
- claude-opus-4-5: Earlier Opus generation, prefer claude-opus-4-6.
- claude-opus-4-1: Earlier Opus generation, prefer claude-opus-4-6.
- claude-sonnet-4-6: Balanced performance and speed, recommended for most use cases. Prefer claude-sonnet-4-6 over claude-sonnet-4-5.
- claude-sonnet-4-5: Earlier Sonnet generation, prefer claude-sonnet-4-6.
- claude-haiku-4-5: Fastest and most compact, ideal for simple tasks

IMPORTANT: Models not listed above are NOT available through AI integrations. Never use unlisted models with this integration.

## Unsupported Capabilities

The following capabilities are NOT supported by Anthropic AI integrations. Do NOT proceed with this integration for these use cases:

- Batch API
- Files API

## Agent Stack Note

When user is building features related to "Agent Stack (Agents and Automations)", you MUST always setup an LLM provider - regardless of whether the specific implementation appears to need AI/LLM capabilities or not. DO NOT second-guess this requirement. Skipping the LLM provider setup in such cases will lead to broken code and awful user experience. Follow the guidelines below to determine whether to proceed with this integration or other Anthropic integrations.

## Selection Guidelines

Before proceeding with setting up this integration, check if the user already has the integration set up. If they do then DO NOT proceed.

Match whether or not to use this integration based on the following order of precedence (stop at the first match):

Precedence 1 — **Explicit user requests**

- The user wants to use their own API key: Do NOT proceed with this integration
- The user specifically asks for Anthropic and the requested capability is supported: Proceed with this integration
- The user asked for Anthropic but needs a capability or model NOT listed in the supported sections above: This integration CANNOT provide it. You MUST use Anthropic directly with the user's own API key instead

Precedence 2 — **Use-case triggers** (proceed with this integration)

- Coding tasks requiring complex reasoning (prefer Anthropic for coding over other providers).

Precedence 3 — **No provider specified**

- Default to OpenAI AI integrations if it supports the requested use case. If it does not, use OpenAI directly with the user's own API key
- If even OpenAI directly with API key does not support the requested use case, find another integration or alternative

If this is the first time proposing or using this integration, clearly indicate that this internally uses Replit AI Integrations for Anthropic access, does not require your own API key, and that charges are billed to your credits. You must specifically include every one of these three details.

## When to Use

- User needs Anthropic AI capabilities (chat, completions)
- User does not want to provide their own API key
- Any AI/LLM request that should use Anthropic

## How to Set Up

### 1. Provision the AI integration (env vars)

In the JavaScript sandbox, call:

```javascript
const result = await setupReplitAIIntegrations({
    providerSlug: "anthropic",
    providerUrlEnvVarName: "AI_INTEGRATIONS_ANTHROPIC_BASE_URL",
    providerApiKeyEnvVarName: "AI_INTEGRATIONS_ANTHROPIC_API_KEY"
});
console.log(result);
```

### 2. Copy the template files into your project

```bash
cp -r .local/skills/ai-integrations-anthropic/templates/lib/* lib/
```

This copies two sets of files:

- `lib/integrations-anthropic-ai/` — the integration workspace package
- `lib/db/src/schema/conversations.ts` and `lib/db/src/schema/messages.ts` — the Drizzle schema files for the `conversations` and `messages` tables

### 3. Add the integration dependency

Add the integration package to your API server's `package.json`:

```json
{
  "dependencies": {
    "@workspace/integrations-anthropic-ai": "workspace:*"
  }
}
```

### 4. Install dependencies

```bash
pnpm install --no-frozen-lockfile
```

### 5. Add TypeScript project references

Add the new lib to the root `tsconfig.json` references:

```json
{ "path": "./lib/integrations-anthropic-ai" }
```

Add to `artifacts/api-server/tsconfig.json` references:

```json
{ "path": "../../lib/integrations-anthropic-ai" }
```

### 6. Add the API contract

Read `references/openapi.md` for the OpenAPI spec entries. Add the paths and schemas to `lib/api-spec/openapi.yaml` under the `/anthropic` prefix, then run codegen:

```bash
pnpm --filter @workspace/api-spec run codegen
```

### 7. Implement routes and push database

See Wiring Instructions below.

## IMPORTANT

- You should NEVER ask the user for secrets or env vars for this integration. Nor should you ever attempt to modify these env vars. AI_INTEGRATIONS_ANTHROPIC_BASE_URL and AI_INTEGRATIONS_ANTHROPIC_API_KEY are automatically set during setup
- The value of AI_INTEGRATIONS_ANTHROPIC_API_KEY is a dummy string to make the SDK compatible. Do not assume it's misconfigured without testing the API call. It should work as expected when AI_INTEGRATIONS_ANTHROPIC_BASE_URL is also set
- If setup failed or env vars are missing after setup, retry the `setupReplitAIIntegrations` call. DO NOT try measures other than this to fix the issue. If after 3 retries the issue persists, switch to using an api-key-based approach

## Code Generation Guidelines

Use the SDK client shown in the provided modules rather than calling endpoints directly via fetch.

When instantiating the Anthropic client, refer to the code in `lib/integrations-anthropic-ai/src/client.ts` for how to initialize with the env vars.

When building features on Agent Stack (Agents and Automations), use AI_INTEGRATIONS_ANTHROPIC_BASE_URL and AI_INTEGRATIONS_ANTHROPIC_API_KEY when instantiating the Anthropic client.

For any tasks that require multiple/many LLM calls, you MUST use retries with backoff and rate limiters. Use the batch utilities module for guidance.

Do not eagerly upgrade model on existing code unless user explicitly requests it.

If you set a max tokens limit, use 8192 tokens. NEVER set any token limits lower than this unless explicitly requested.

## Provided Modules

After copying the template files, these modules are available:

### Client (`lib/integrations-anthropic-ai/src/client.ts`)

- Pre-configured Anthropic SDK client with env var validation
- Throws at startup if `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` or `AI_INTEGRATIONS_ANTHROPIC_API_KEY` are missing

### Batch utilities (`lib/integrations-anthropic-ai/src/batch/`)

- `batchProcess<T, R>(items, processor, options)` - Generic batch processor with rate limiting and retries
- `batchProcessWithSSE<T, R>(items, processor, sendEvent, options)` - Sequential processor with SSE streaming
- `isRateLimitError(error)` - Helper to detect rate limit errors

### DB Model (`lib/db/src/schema/`)

- Drizzle schema files for the `conversations` and `messages` tables
- Zod validation schemas via drizzle-zod
- TypeScript types for Conversation, Message, and insert types

### API Contract (`references/openapi.md`)

- OpenAPI spec entries for Anthropic chat endpoints under `/anthropic/` prefix
- Read this reference and add the entries to `lib/api-spec/openapi.yaml`

## Wiring Instructions

### 1. Add OpenAPI spec entries

Read `references/openapi.md` and add the paths, schemas, and tag to `lib/api-spec/openapi.yaml`. Endpoints are prefixed with `/anthropic/` (e.g. `/anthropic/conversations`).

### 2. Run codegen

```bash
pnpm --filter @workspace/api-spec run codegen
```

### 3. Export the DB model

Update the existing db package barrel file so migrations pick up the tables. Do not overwrite the existing `lib/db/src/schema/index.ts` when copying files. Add:

```typescript
export * from "./conversations";
export * from "./messages";
```

This is critical — the `conversations` and `messages` tables must be exported from `@workspace/db` so database migrations create them.

### 4. Run database migration

```bash
pnpm --filter @workspace/db run push
# If it fails with column conflicts:
pnpm --filter @workspace/db run push-force
```

### 5. Implement routes

Add routes in `artifacts/api-server/src/routes/anthropic/`. Use generated `@workspace/api-zod` schemas for validation and `@workspace/db` for database queries. Import `anthropic` from `@workspace/integrations-anthropic-ai` for the SDK client.

For the streaming message endpoint, use `anthropic.messages.stream()`. You must set SSE headers and send a termination event:

```typescript
import { anthropic } from "@workspace/integrations-anthropic-ai";

res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Cache-Control", "no-cache");
res.setHeader("Connection", "keep-alive");

let fullResponse = "";

const stream = anthropic.messages.stream({
  model: "claude-sonnet-4-6",
  max_tokens: 8192,
  messages: chatMessages,
});

for await (const event of stream) {
  if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
    fullResponse += event.delta.text;
    res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
  }
}

// Save assistant message to DB, then signal completion
res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
res.end();
```

**SSE codegen limitation:** Orval cannot generate a usable client hook or response Zod schema for this streaming endpoint. The generated `@workspace/api-zod` schema for `SendAnthropicMessageBody` (from the `sendAnthropicMessage` operationId) IS useful for validating the request body, but the response type will be `unknown`. On the client, consume the stream with `fetch` + `ReadableStream` parsing — do NOT use a generated React Query hook for this endpoint.

Mount the router in `artifacts/api-server/src/routes/index.ts`.

### 6. Write client-side UI components based on user requirements

### 7. Batch processing

For batch processing tasks, ALWAYS use the batchProcess utility:

```typescript
import { batchProcess } from "@workspace/integrations-anthropic-ai/batch";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const results = await batchProcess(
  items,
  async (item) => {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{ role: "user", content: `Process: ${item.name}` }],
    });
    const block = message.content[0];
    return block.type === "text" ? block.text : "";
  },
  { concurrency: 2, retries: 5 }
);
```

For SSE streaming progress:

```typescript
import { batchProcessWithSSE } from "@workspace/integrations-anthropic-ai/batch";

await batchProcessWithSSE(
  items,
  async (item) => { /* your processor */ },
  (event) => res.write(`data: ${JSON.stringify(event)}\n\n`)
);
```

## Drizzle Dependency

The project is expected to use Drizzle ORM with drizzle-zod for validation. Use the provided schema files as-is.

## Important

- DO NOT modify the Anthropic client setup - env vars are auto-configured
- DO NOT overwrite the existing db schema barrel when copying files
- DO NOT ask the user for API keys or secrets
