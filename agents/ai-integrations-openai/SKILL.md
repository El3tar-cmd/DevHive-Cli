---
name: ai-integrations-openai
description: |
  OpenAI AI integration via Replit AI Integrations proxy (JavaScript/TypeScript). Provides OpenAI-compatible API access without requiring your own API key.
---

# OpenAI AI Integration

Set up OpenAI AI integration via Replit AI Integrations proxy. Keys are automatically provisioned.

## Supported OpenAI APIs

- chat-completions
- chat-completions with audio inputs/outputs
- audio transcriptions
- responses
- images generations
- images edits

## Supported OpenAI Models

- All non-use-case-specific gpt models gpt-4o through gpt-5.2 support text + image inputs and text outputs.
- gpt-5.3-codex: most capable coding model, best for complex code generation and software engineering tasks. Prefer this over other gpt models for coding tasks. Only supports the Responses API (not chat completions).
- gpt-5.2: most capable general-purpose model, best for most tasks. Prefer this over all other gpt models for non-coding tasks.
- gpt-5.2-codex: code-optimized variant of gpt-5.2, best for code generation and editing tasks. Only supports the Responses API (not chat completions).
- gpt-5.1: good for most tasks, prefer gpt-5.2
- gpt-5: good for most tasks, prefer gpt-5.2
- gpt-5-mini: cost effective model good for high-volume tasks
- gpt-5-nano: fastest and most cost effective model, use when volume and speed are critical
- gpt-4.1, gpt-4.1-mini, gpt-4.1-nano: legacy models, unless the project already uses these DO NOT use
- gpt-4o, gpt-4o-mini: legacy models, unless the project already uses these DO NOT use
- o4-mini: thinking model for complex reasoning tasks. Prefer this over other o-series models.
- o3: thinking model, slower but more intelligent than o4-mini
- o3-mini: older thinking model for complex reasoning, prefer o4-mini
- gpt-image-1: image generation model (text/image inputs, outputs image)
- gpt-audio: speech-to-speech model, can take in text/audio and output audio with transcript. Best for speech-to-speech interactions with no TTS chaining. Not as generally intelligent as the newer text models (e.g. gpt-5.2).
- gpt-audio-mini: more cost effective but less capable speech-to-speech model
- gpt-4o-mini-transcribe: speech-to-text transcription (audio input, text output)

IMPORTANT: Models not listed above are NOT available through AI integrations. Never use unlisted models with this integration.
OpenAI AI integrations is the usual default for most chat use cases, especially when the user does not specify a provider.

FORBIDDEN: Web Speech API (SpeechSynthesis/SpeechSynthesisUtterance). Users hate its robotic voice. For ANY text-to-speech, voice, or audio output, ALWAYS use AI whether that is OpenAI or ElevenLabs. No exceptions—not for cost, offline support, or word highlighting.

For general speech-to-speech interactions that don't require a separate text model, use OpenAI audio. For non-latency sensitive audio use cases (e.g. batch transcription or speech synthesis), use OpenAI. For interactive/low-latency audio use cases that require STT/TTS chaining, use the ElevenLabs connector instead for both STT and TTS. Even if you think OpenAI is easier than ElevenLabs, DO NOT use OpenAI for interactive use cases requiring a separate text model. It is forbidden unless specifically requested. Examples:

- ai voice chat app: use OpenAI (speech-to-speech, no text model specified)
- ai voice chat app that uses a text model: use ElevenLabs for both STT and TTS (text model specified)
- ai voice chat app that uses the most intelligent LLM: use ElevenLabs for both STT and TTS (and latest OpenAI text model)
- audio booking reading app: use OpenAI (not latency sensitive, TTS)
- call notes transcription app: use OpenAI (not latency sensitive, STT)
- customer support voice chatbot: use OpenAI (speech-to-speech, no text model specified)
- customer support voice chatbot that uses a text model: use ElevenLabs for both STT and TTS (latency sensitive and text model specified)

## Unsupported Capabilities

The following capabilities are NOT supported by OpenAI AI integrations. Do NOT proceed with this integration for these use cases:

- embeddings API
- fine-tuning API
- files API
- images variations
- video inputs
- video outputs
- speech API

## When NOT to Use

Example use cases for when NOT to use this integration are below. For these use cases, consider searching for other integrations first, then use OpenAI directly with the user's own API key if none are found:

- video processing, summary, analysis (use Gemini integration instead)
- OpenAI Realtime API (WebRTC-based streaming) - but gpt-audio models ARE supported for voice

## Agent Stack Note

When user is building features related to "Agent Stack (Agents and Automations)", you MUST always setup an LLM provider - regardless of whether the specific implementation appears to need AI/LLM capabilities or not. DO NOT second-guess this requirement. Skipping the LLM provider setup in such cases will lead to broken code and awful user experience. Follow the guidelines below to determine whether to proceed with this integration or other OpenAI integrations.

## Selection Guidelines

Before proceeding with setting up this integration, check if the user already has the integration set up. If they do then DO NOT proceed.

Match whether or not to use this integration based on the following order of precedence (stop at the first match):

Precedence 1 — **Explicit user requests**

- The user wants to use their own API key: Do NOT proceed with this integration
- The user specifically asks for OpenAI and the requested capability is supported: Proceed with this integration
- The user asked for OpenAI but needs a capability or model NOT listed in the supported sections above: This integration CANNOT provide it. You MUST use OpenAI directly with the user's own API key instead

Precedence 2 — **Use-case triggers** (proceed with this integration)

- TTS, voice chat, audiobooks, read-aloud - use OpenAI audio models. NEVER use Web Speech API.
- If user explicitly needs control of the base response generation model or wants to do STT/TTS chaining, use the ElevenLabs connector instead.

Precedence 3 — **No provider specified**

- Default to OpenAI AI integrations if it supports the requested use case. If it does not, use OpenAI directly with the user's own API key
- If even OpenAI directly with API key does not support the requested use case, find another integration or alternative

If this is the first time proposing or using this integration, clearly indicate that this internally uses Replit AI Integrations for OpenAI access, does not require your own API key, and that charges are billed to your credits. You must specifically include every one of these three details.

## When to Use

- User needs OpenAI AI capabilities (chat, completions)
- User does not want to provide their own API key
- Any AI/LLM request that should use OpenAI

## How to Set Up

### 1. Provision the AI integration (env vars)

In the JavaScript sandbox, call:

```javascript
const result = await setupReplitAIIntegrations({
    providerSlug: "openai",
    providerUrlEnvVarName: "AI_INTEGRATIONS_OPENAI_BASE_URL",
    providerApiKeyEnvVarName: "AI_INTEGRATIONS_OPENAI_API_KEY"
});
console.log(result);
```

### 2. Copy the template files into your project

```bash
cp -r .local/skills/ai-integrations-openai/templates/lib/* lib/
```

This copies three sets of files:

- `lib/integrations-openai-ai-server/` — the server-side integration workspace package (client, batch, image, audio)
- `lib/integrations-openai-ai-react/` — the React client-side integration workspace package (voice chat hooks)
- `lib/db/src/schema/conversations.ts` and `lib/db/src/schema/messages.ts` — the Drizzle schema files for the `conversations` and `messages` tables

### 3. Add the integration dependencies

Add the server integration package to your API server's `package.json`:

```json
{
  "dependencies": {
    "@workspace/integrations-openai-ai-server": "workspace:*"
  }
}
```

Add the React integration package to your frontend's `package.json`:

```json
{
  "dependencies": {
    "@workspace/integrations-openai-ai-react": "workspace:*"
  }
}
```

### 4. Install dependencies

```bash
pnpm install --no-frozen-lockfile
```

### 5. Add TypeScript project references

Add both libs to the root `tsconfig.json` references:

```json
{ "path": "./lib/integrations-openai-ai-server" },
{ "path": "./lib/integrations-openai-ai-react" }
```

Add server package to `artifacts/api-server/tsconfig.json` references:

```json
{ "path": "../../lib/integrations-openai-ai-server" }
```

Add React package to `artifacts/frontend/tsconfig.json` (or equivalent) references:

```json
{ "path": "../../lib/integrations-openai-ai-react" }
```

### 6. Add the API contract

Read `references/openapi.md` for the OpenAPI spec entries. Add the paths and schemas to `lib/api-spec/openapi.yaml` under the `/openai` prefix, then run codegen:

```bash
pnpm --filter @workspace/api-spec run codegen
```

### 7. Implement routes and push database

See Wiring Instructions below.

## IMPORTANT

- You should NEVER ask the user for secrets or env vars for this integration. Nor should you ever attempt to modify these env vars. AI_INTEGRATIONS_OPENAI_BASE_URL and AI_INTEGRATIONS_OPENAI_API_KEY are automatically set during setup
- The value of AI_INTEGRATIONS_OPENAI_API_KEY is a dummy string to make the SDK compatible. Do not assume it's misconfigured without testing the API call. It should work as expected when AI_INTEGRATIONS_OPENAI_BASE_URL is also set
- If setup failed or env vars are missing after setup, retry the `setupReplitAIIntegrations` call. DO NOT try measures other than this to fix the issue. If after 3 retries the issue persists, switch to using an api-key-based approach

## Code Generation Guidelines

Use the SDK client shown in the provided modules rather than calling endpoints directly via fetch.

When instantiating the OpenAI client, refer to the code in `lib/integrations-openai-ai-server/src/client.ts` for how to initialize with the env vars.

When building features on Agent Stack (Agents and Automations), use AI_INTEGRATIONS_OPENAI_BASE_URL and AI_INTEGRATIONS_OPENAI_API_KEY when instantiating the OpenAI client.

For any tasks that require multiple/many LLM calls, you MUST use retries with backoff and rate limiters. Use the batch utilities module for guidance.

When using gpt-5 or newer models, follow these restrictions strictly:

- `temperature` parameter is not specifiable (always defaults to 1).
- `max_tokens` is not supported. Use `max_completion_tokens` instead for capping the max number of tokens.

When using gpt-image-1 model, follow these restrictions strictly:

- `response_format` parameter is not supported, and the response format is always in base64 format.

When using gpt-4o-mini-transcribe or gpt-4o-transcribe:

- Use openai.audio.transcriptions.create() API.
- The only supported response format is 'json'

gpt-audio and gpt-audio-mini are combined audio/text input/output models, best for speech-to-speech use cases with no TTS chaining.

- For simple voice chat, use voiceChatStream() with gpt-audio
- When using a separate text model, do STT/TTS chaining using ElevenLabs instead of OpenAI.
- Always prefer to use streaming when possible, as not streaming for long responses may result in timeouts
- ALWAYS convert browser WebM to WAV with ffmpeg before sending
- ALWAYS increase Express body limit for audio payloads (e.g. 50MB)

Text and voice should use separate endpoints: keep `POST /openai/conversations/{id}/messages` for text and `POST /openai/conversations/{id}/voice-messages` for speech-to-speech audio. Do NOT overload a single endpoint with both payload and stream formats.

Do not eagerly upgrade model on existing code unless user explicitly requests it.

If you set a max tokens limit, use 8192 tokens. NEVER set any token limits lower than this unless explicitly requested.

## Provided Modules

After copying the template files, these modules are available:

### Server Package (`lib/integrations-openai-ai-server/`)

#### Client (`lib/integrations-openai-ai-server/src/client.ts`)

- Pre-configured OpenAI SDK client with env var validation
- Throws at startup if `AI_INTEGRATIONS_OPENAI_BASE_URL` or `AI_INTEGRATIONS_OPENAI_API_KEY` are missing

#### Image module (`lib/integrations-openai-ai-server/src/image/`)

- `generateImageBuffer(prompt, size?)` - Generates an image using gpt-image-1 and returns a `Buffer`
- `editImages(imageFiles, prompt, outputPath?)` - Edits one or more image files and returns a `Buffer`

#### Audio module (`lib/integrations-openai-ai-server/src/audio/`)

- `ensureCompatibleFormat(audioBuffer)` - Returns `{ buffer, format }` after converting unsupported audio to an OpenAI-compatible format
- `detectAudioFormat(buffer)` / `convertToWav(buffer)` - Audio format utilities
- `voiceChat(audioBuffer, voice?, inputFormat?, outputFormat?)` - Non-streaming voice chat with gpt-audio
- `voiceChatStream(audioBuffer, voice?, inputFormat?)` - Streaming voice chat with gpt-audio
- `textToSpeech(text, voice?, format?)` / `textToSpeechStream(text, voice?)` - TTS generation
- `speechToText(audioBuffer, format?)` / `speechToTextStream(audioBuffer, format?)` - STT transcription

#### Batch utilities (`lib/integrations-openai-ai-server/src/batch/`)

- `batchProcess<T, R>(items, processor, options)` - Generic batch processor with rate limiting and retries
- `batchProcessWithSSE<T, R>(items, processor, sendEvent, options)` - Sequential processor with SSE streaming
- `isRateLimitError(error)` - Helper to detect rate limit errors

### React Package (`lib/integrations-openai-ai-react/`)

#### Audio hooks (`lib/integrations-openai-ai-react/src/audio/`)

- `useVoiceRecorder()` - React hook for recording audio from the microphone (negotiates MIME type across Chrome, Firefox, and Safari)
- `useAudioPlayback(workletPath)` - React hook for playing back PCM16 audio chunks
- `useVoiceStream({ workletPath, ...options })` - React hook for streaming voice chat (combines recording + playback)
- `decodePCM16ToFloat32(data)` / `createAudioPlaybackContext(workletPath)` - Low-level audio utilities
- `audio-playback-worklet.js` - AudioWorklet for smooth playback (copy to `public/`)

### DB Model (`lib/db/src/schema/`)

- Drizzle schema files for the `conversations` and `messages` tables
- Zod validation schemas via drizzle-zod
- TypeScript types for Conversation, Message, and insert types

### API Contract (`references/openapi.md`)

- OpenAPI spec entries for OpenAI text chat, voice chat, and image endpoints under `/openai/` prefix
- Read this reference and add the entries to `lib/api-spec/openapi.yaml`

## Wiring Instructions

### 1. Add OpenAPI spec entries

Read `references/openapi.md` and add the paths, schemas, and tag to `lib/api-spec/openapi.yaml`. Endpoints are prefixed with `/openai/` (e.g. `/openai/conversations`, `/openai/conversations/{id}/voice-messages`, `/openai/generate-image`).

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

Add routes in `artifacts/api-server/src/routes/openai/`. Use generated `@workspace/api-zod` schemas for validation and `@workspace/db` for database queries. Import `openai` from `@workspace/integrations-openai-ai-server` for the SDK client.

For the text message endpoint (`POST /openai/conversations/:id/messages`), validate the request with the generated `SendOpenaiMessageBody` schema, then use `openai.chat.completions.create()`. You must set SSE headers and send a termination event:

```typescript
import { openai } from "@workspace/integrations-openai-ai-server";

res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Cache-Control", "no-cache");
res.setHeader("Connection", "keep-alive");

let fullResponse = "";

const stream = await openai.chat.completions.create({
  model: "gpt-5.2",
  max_completion_tokens: 8192,
  messages: chatMessages,
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    fullResponse += content;
    res.write(`data: ${JSON.stringify({ content })}\n\n`);
  }
}

// Save assistant message to DB, then signal completion
res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
res.end();
```

For the voice endpoint (`POST /openai/conversations/:id/voice-messages`), validate the request with the generated `SendOpenaiVoiceMessageBody` schema, then use the audio helpers (same SSE header pattern):

```typescript
import { voiceChatStream, ensureCompatibleFormat } from "@workspace/integrations-openai-ai-server/audio";

res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Cache-Control", "no-cache");
res.setHeader("Connection", "keep-alive");

const { buffer, format } = await ensureCompatibleFormat(audioBuffer);
const stream = await voiceChatStream(buffer, "alloy", format);

let assistantTranscript = "";

for await (const event of stream) {
  if (event.type === "transcript") {
    assistantTranscript += event.data;
  }
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

// Persist both sides of the conversation so voice and text history stay in sync
await db.insert(messages).values([
  { conversationId: id, role: "user", content: userTranscript },
  { conversationId: id, role: "assistant", content: assistantTranscript },
]);

res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
res.end();
```

**Voice context limitation:** `voiceChatStream()` sends only the current audio turn to `gpt-audio`; it does not accept prior conversation messages. Each voice call is a one-shot exchange. If you need multi-turn context in voice conversations, pass prior text transcripts as system/user messages alongside the audio input by building a custom messages array with the OpenAI SDK directly. Always persist both the user's transcript (from the `user_transcript` SSE event or a separate STT call) and the assistant's transcript so voice and text history stay in sync.

**SSE codegen limitation:** Orval cannot generate a usable client hook or response Zod schema for either streaming endpoint. The generated `@workspace/api-zod` schemas for `SendOpenaiMessageBody` and `SendOpenaiVoiceMessageBody` are useful for validating the request bodies, but the response type will be `unknown`. On the client, consume the stream with `fetch` + `ReadableStream` parsing — do NOT use a generated React Query hook for these endpoints. The React hooks from `@workspace/integrations-openai-ai-react` already handle SSE parsing for voice streams.

For image generation:

```typescript
import { generateImageBuffer } from "@workspace/integrations-openai-ai-server/image";

const buffer = await generateImageBuffer(prompt, "1024x1024");
res.json({ b64_json: buffer.toString("base64") });
```

Mount the router in `artifacts/api-server/src/routes/index.ts`.

### 6. Write client-side UI components based on user requirements

For voice chat UIs, use the React hooks from `@workspace/integrations-openai-ai-react`:

```typescript
import { useVoiceRecorder, useVoiceStream } from "@workspace/integrations-openai-ai-react";
```

Copy `audio-playback-worklet.js` to your `public/` folder for audio playback support.

Do not assume the worklet is available at `/audio-playback-worklet.js`. The caller must pass a `workletPath` that matches the deployed artifact base URL.

For example:

```typescript
const stream = useVoiceStream({
  workletPath,
  onTranscript: (_, full) => setTranscript(full),
});
```

When calling `streamVoiceResponse()`, point it at the voice endpoint, for example:

```typescript
await stream.streamVoiceResponse(
  `/api/openai/conversations/${conversationId}/voice-messages`,
  blob
);
```

### 7. Batch processing

For batch processing tasks, ALWAYS use the batchProcess utility:

```typescript
import { batchProcess } from "@workspace/integrations-openai-ai-server/batch";
import { openai } from "@workspace/integrations-openai-ai-server";

const results = await batchProcess(
  items,
  async (item) => {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [{ role: "user", content: `Process: ${item.name}` }],
    });
    return response.choices[0]?.message?.content ?? "";
  },
  { concurrency: 2, retries: 5 }
);
```

For SSE streaming progress:

```typescript
import { batchProcessWithSSE } from "@workspace/integrations-openai-ai-server/batch";

await batchProcessWithSSE(
  items,
  async (item) => { /* your processor */ },
  (event) => res.write(`data: ${JSON.stringify(event)}\n\n`)
);
```

## Drizzle Dependency

The project is expected to use Drizzle ORM with drizzle-zod for validation. Use the provided schema files as-is.

## Model Info

Chat:

- The newest OpenAI model is "gpt-5.2" for general tasks, and "gpt-5.3-codex" for coding tasks.
- For coding tasks, prefer gpt-5.3-codex. For general tasks, prefer gpt-5.2.
- Use max_completion_tokens instead of max_tokens for token limits
- Streaming enabled by default for real-time responses

Image:

- Uses gpt-image-1 model for image generation
- response_format is always base64 (not configurable via API)
- Supported sizes: 1024x1024, 512x512, 256x256

## Important

- DO NOT modify the OpenAI client setup - env vars are auto-configured
- DO NOT overwrite the existing db schema barrel when copying files
- DO NOT ask the user for API keys or secrets
