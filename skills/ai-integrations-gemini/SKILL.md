---
name: ai-integrations-gemini
description: |
  Gemini AI integration via Replit AI Integrations proxy (JavaScript/TypeScript). Provides Gemini-compatible API access without requiring your own API key.
---

# Gemini AI Integration

Set up Gemini AI integration via Replit AI Integrations proxy. Keys are automatically provisioned.

## Supported Gemini APIs

- generateContent/generate_content
- generateContentStream/generate_content_stream

## Supported Gemini Models

- gemini-3.1-pro-preview: latest and most powerful model for agentic workflows and vibe-coding. Prefer this one over other pro series models.
- gemini-3-pro-preview: powerful model for agentic workflows and vibe-coding.
- gemini-3-flash-preview: hybrid reasoning model good for daily use and high-volume tasks. Prefer this one over flash series models.
- gemini-3-pro-image-preview (nano banana pro): thinking model that is good for high-quality image generation tasks where detail and accuracy matters most.
- gemini-2.5-pro: excels at coding and complex reasoning tasks
- gemini-2.5-flash: hybrid reasoning model good for daily use and high-volume tasks
- gemini-2.5-flash-image (nano banana): native image generation model good for ultra-fast image generation tasks where speed matters most.

IMPORTANT: Models not listed above are NOT available through AI integrations. Never use unlisted models with this integration.

## Unsupported Capabilities

The following capabilities are NOT supported by Gemini AI integrations. Do NOT proceed with this integration for these use cases:

- Live API (for any model)
- embeddings
- fine-tuning
- files API
- audio/video generation/output

## Example Use Cases

Some example use cases (non-exhaustive):

- gemini-3.1-pro-preview: tasks requiring complex reasoning
- gemini-2.5-flash: general purpose chat, image/audio/video transcription/summary/analysis, high-volume tasks
- gemini-2.5-flash-image: image generation

## When NOT to Use

Example use cases for when NOT to use this integration are below. For these use cases, consider searching for other integrations first, then use Gemini directly with the user's own API key if none are found:

- realtime voice/video interaction
- audio or video generation

## Agent Stack Note

When user is building features related to "Agent Stack (Agents and Automations)", you MUST always setup an LLM provider - regardless of whether the specific implementation appears to need AI/LLM capabilities or not. DO NOT second-guess this requirement. Skipping the LLM provider setup in such cases will lead to broken code and awful user experience. Follow the guidelines below to determine whether to proceed with this integration or other Gemini integrations.

## Selection Guidelines

Before proceeding with setting up this integration, check if the user already has the integration set up. If they do then DO NOT proceed.

Match whether or not to use this integration based on the following order of precedence (stop at the first match):

Precedence 1 — **Explicit user requests**

- The user wants to use their own API key: Do NOT proceed with this integration
- The user specifically asks for Gemini and the requested capability is supported: Proceed with this integration
- The user asked for Gemini but needs a capability or model NOT listed in the supported sections above: This integration CANNOT provide it. You MUST use Gemini directly with the user's own API key instead

Precedence 2 — **Use-case triggers** (proceed with this integration)

- Image editing/generation (prefer Gemini image generation over OpenAI).
- Audio/video input or other scenarios only supported by this integration.

Precedence 3 — **No provider specified**

- Default to OpenAI AI integrations if it supports the requested use case. If it does not, use OpenAI directly with the user's own API key
- If even OpenAI directly with API key does not support the requested use case, find another integration or alternative

If this is the first time proposing or using this integration, clearly indicate that this internally uses Replit AI Integrations for Gemini access, does not require your own API key, and that charges are billed to your credits. You must specifically include every one of these three details.

## When to Use

- User needs Gemini AI capabilities (chat, completions)
- User does not want to provide their own API key
- Any AI/LLM request that should use Gemini

## How to Set Up

### 1. Provision the AI integration (env vars)

In the JavaScript sandbox, call:

```javascript
const result = await setupReplitAIIntegrations({
    providerSlug: "gemini",
    providerUrlEnvVarName: "AI_INTEGRATIONS_GEMINI_BASE_URL",
    providerApiKeyEnvVarName: "AI_INTEGRATIONS_GEMINI_API_KEY"
});
console.log(result);
```

### 2. Copy the template files into your project

```bash
cp -r .local/skills/ai-integrations-gemini/templates/lib/* lib/
```

This copies two sets of files:

- `lib/integrations-gemini-ai/` — the integration workspace package
- `lib/db/src/schema/conversations.ts` and `lib/db/src/schema/messages.ts` — the Drizzle schema files for the `conversations` and `messages` tables

### 3. Add the integration dependency

Add the integration package to your API server's `package.json`:

```json
{
  "dependencies": {
    "@workspace/integrations-gemini-ai": "workspace:*"
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
{ "path": "./lib/integrations-gemini-ai" }
```

Add to `artifacts/api-server/tsconfig.json` references:

```json
{ "path": "../../lib/integrations-gemini-ai" }
```

### 6. Add the API contract

Read `references/openapi.md` for the OpenAPI spec entries. Add the paths and schemas to `lib/api-spec/openapi.yaml` under the `/gemini` prefix, then run codegen:

```bash
pnpm --filter @workspace/api-spec run codegen
```

### 7. Implement routes and push database

See Wiring Instructions below.

## IMPORTANT

- You should NEVER ask the user for secrets or env vars for this integration. Nor should you ever attempt to modify these env vars. AI_INTEGRATIONS_GEMINI_BASE_URL and AI_INTEGRATIONS_GEMINI_API_KEY are automatically set during setup
- The value of AI_INTEGRATIONS_GEMINI_API_KEY is a dummy string to make the SDK compatible. Do not assume it's misconfigured without testing the API call. It should work as expected when AI_INTEGRATIONS_GEMINI_BASE_URL is also set
- If setup failed or env vars are missing after setup, retry the `setupReplitAIIntegrations` call. DO NOT try measures other than this to fix the issue. If after 3 retries the issue persists, switch to using an api-key-based approach

## Code Generation Guidelines

Use the SDK client shown in the provided modules rather than calling endpoints directly via fetch.

When instantiating the Gemini client, refer to the code in `lib/integrations-gemini-ai/src/client.ts` for how to initialize with the env vars.

When building features on Agent Stack (Agents and Automations), use AI_INTEGRATIONS_GEMINI_BASE_URL and AI_INTEGRATIONS_GEMINI_API_KEY when instantiating the Gemini client.

For any tasks that require multiple/many LLM calls, you MUST use retries with backoff and rate limiters. Use the batch utilities module for guidance.

To avoid unexpected overcharges, only use the pro-series image model when the user explicitly:

- requests to use a pro-series image model
- requests to use nano banana pro
- asks for high-quality image generation
By default, prefer to use the latest flash-series image model.

If your app processes audio or video inputs, you MUST chunk your input data into smaller chunks and process individually. Gemini through AI integrations only supports inline input data (no files API support), which has a max input size limit of 8 MB. In addition to chunking you MUST ALWAYS use retries AND rate limiting when making LLM calls for audio/video processing.

Do not eagerly upgrade model on existing code unless user explicitly requests it.

If you set a max tokens limit, use 8192 tokens. NEVER set any token limits lower than this unless explicitly requested.

## Provided Modules

After copying the template files, these modules are available:

### Client (`lib/integrations-gemini-ai/src/client.ts`)

- Pre-configured GoogleGenAI SDK client with env var validation
- Throws at startup if `AI_INTEGRATIONS_GEMINI_BASE_URL` or `AI_INTEGRATIONS_GEMINI_API_KEY` are missing

### Image module (`lib/integrations-gemini-ai/src/image/`)

- `generateImage(prompt)` - Generates an image using Gemini's native image generation and returns `{ b64_json, mimeType }`
- Uses `gemini-2.5-flash-image` model by default with `Modality.IMAGE` response

### Batch utilities (`lib/integrations-gemini-ai/src/batch/`)

- `batchProcess<T, R>(items, processor, options)` - Generic batch processor with rate limiting and retries
- `batchProcessWithSSE<T, R>(items, processor, sendEvent, options)` - Sequential processor with SSE streaming
- `isRateLimitError(error)` - Helper to detect rate limit errors

### DB Model (`lib/db/src/schema/`)

- Drizzle schema files for the `conversations` and `messages` tables
- Zod validation schemas via drizzle-zod
- TypeScript types for Conversation, Message, and insert types

### API Contract (`references/openapi.md`)

- OpenAPI spec entries for Gemini chat and image endpoints under `/gemini/` prefix
- Read this reference and add the entries to `lib/api-spec/openapi.yaml`

## Wiring Instructions

### 1. Add OpenAPI spec entries

Read `references/openapi.md` and add the paths, schemas, and tag to `lib/api-spec/openapi.yaml`. Endpoints are prefixed with `/gemini/` (e.g. `/gemini/conversations`, `/gemini/generate-image`).

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

Add routes in `artifacts/api-server/src/routes/gemini/`. Use generated `@workspace/api-zod` schemas for validation and `@workspace/db` for database queries. Import `ai` from `@workspace/integrations-gemini-ai` for the SDK client.

For the streaming message endpoint, use `ai.models.generateContentStream()`. You must set SSE headers, map the Gemini `"model"` role, and send a termination event:

```typescript
import { ai } from "@workspace/integrations-gemini-ai";

res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Cache-Control", "no-cache");
res.setHeader("Connection", "keep-alive");

let fullResponse = "";

const stream = await ai.models.generateContentStream({
  model: "gemini-2.5-flash",
  contents: chatMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  })),
  config: { maxOutputTokens: 8192 },
});

for await (const chunk of stream) {
  const text = chunk.text;
  if (text) {
    fullResponse += text;
    res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
  }
}

// Save assistant message to DB, then signal completion
res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
res.end();
```

**Gemini role mapping:** Gemini uses `"model"` where other providers use `"assistant"`. When loading messages from the DB (which stores `"assistant"`), map the role before passing to `generateContentStream`.

**SSE codegen limitation:** Orval cannot generate a usable client hook or response Zod schema for this streaming endpoint. The generated `@workspace/api-zod` schema for `SendGeminiMessageBody` (from the `sendGeminiMessage` operationId) IS useful for validating the request body, but the response type will be `unknown`. On the client, consume the stream with `fetch` + `ReadableStream` parsing — do NOT use a generated React Query hook for this endpoint.

For image generation:

```typescript
import { generateImage } from "@workspace/integrations-gemini-ai/image";

const { b64_json, mimeType } = await generateImage(prompt);
res.json({ b64_json, mimeType });
```

Mount the router in `artifacts/api-server/src/routes/index.ts`.

### 6. Write client-side UI components based on user requirements

### 7. Batch processing

For batch processing tasks, ALWAYS use the batchProcess utility:

```typescript
import { batchProcess } from "@workspace/integrations-gemini-ai/batch";
import { ai } from "@workspace/integrations-gemini-ai";

const results = await batchProcess(
  items,
  async (item) => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: `Process: ${item.name}` }] }],
      config: { responseMimeType: "application/json" },
    });
    return response.text ?? "";
  },
  { concurrency: 2, retries: 5 }
);
```

For SSE streaming progress:

```typescript
import { batchProcessWithSSE } from "@workspace/integrations-gemini-ai/batch";

await batchProcessWithSSE(
  items,
  async (item) => { /* your processor */ },
  (event) => res.write(`data: ${JSON.stringify(event)}\n\n`)
);
```

## Drizzle Dependency

The project is expected to use Drizzle ORM with drizzle-zod for validation. Use the provided schema files as-is.

## Important

- DO NOT modify the Gemini client setup - env vars are auto-configured
- DO NOT overwrite the existing db schema barrel when copying files
- DO NOT ask the user for API keys or secrets
