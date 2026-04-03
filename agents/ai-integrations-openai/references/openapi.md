# OpenAI Integration — OpenAPI Endpoints

Add these entries to `lib/api-spec/openapi.yaml`. All paths below are relative to the base server URL (`/api`).

After editing the spec, run codegen:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Tag

Add under `tags`:

```yaml
  - name: openai
    description: OpenAI AI chat, image, and audio operations
```

## Paths

Add under `paths`:

```yaml
  /openai/conversations:
    get:
      operationId: listOpenaiConversations
      tags: [openai]
      summary: List all conversations
      responses:
        "200":
          description: List of conversations
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/OpenaiConversation"
    post:
      operationId: createOpenaiConversation
      tags: [openai]
      summary: Create a new conversation
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateOpenaiConversationBody"
      responses:
        "201":
          description: Created conversation
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/OpenaiConversation"
  /openai/conversations/{id}:
    get:
      operationId: getOpenaiConversation
      tags: [openai]
      summary: Get conversation with messages
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        "200":
          description: Conversation with messages
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/OpenaiConversationWithMessages"
        "404":
          description: Not found
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/OpenaiError"
    delete:
      operationId: deleteOpenaiConversation
      tags: [openai]
      summary: Delete a conversation
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        "204":
          description: Deleted
        "404":
          description: Not found
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/OpenaiError"
  /openai/conversations/{id}/messages:
    get:
      operationId: listOpenaiMessages
      tags: [openai]
      summary: List messages in a conversation
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        "200":
          description: List of messages
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/OpenaiMessage"
    post:
      operationId: sendOpenaiMessage
      tags: [openai]
      summary: Send a text message and receive a streaming text response
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/SendOpenaiMessageBody"
      responses:
        "200":
          description: SSE stream of assistant text chunks
          content:
            text/event-stream: {}
  /openai/conversations/{id}/voice-messages:
    post:
      operationId: sendOpenaiVoiceMessage
      tags: [openai]
      summary: Send audio and receive a streaming voice response
      description: |
        This endpoint is for gpt-audio speech-to-speech flows.
        It accepts base64-encoded audio input and streams back transcript and audio events.
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/SendOpenaiVoiceMessageBody"
      responses:
        "200":
          description: SSE stream of transcript and audio chunks
          content:
            text/event-stream: {}
  /openai/generate-image:
    post:
      operationId: generateOpenaiImage
      tags: [openai]
      summary: Generate an image from a text prompt
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/GenerateOpenaiImageBody"
      responses:
        "200":
          description: Generated image data
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GenerateOpenaiImageResponse"
```

## Schemas

Add under `components.schemas`:

```yaml
    OpenaiConversation:
      type: object
      properties:
        id:
          type: integer
        title:
          type: string
        createdAt:
          type: string
          format: date-time
      required:
        - id
        - title
        - createdAt
    OpenaiMessage:
      type: object
      properties:
        id:
          type: integer
        conversationId:
          type: integer
        role:
          type: string
        content:
          type: string
        createdAt:
          type: string
          format: date-time
      required:
        - id
        - conversationId
        - role
        - content
        - createdAt
    CreateOpenaiConversationBody:
      type: object
      properties:
        title:
          type: string
      required:
        - title
    SendOpenaiMessageBody:
      type: object
      properties:
        content:
          type: string
      required:
        - content
    SendOpenaiVoiceMessageBody:
      type: object
      properties:
        audio:
          type: string
          description: Base64-encoded audio data
      required:
        - audio
    OpenaiConversationWithMessages:
      type: object
      properties:
        id:
          type: integer
        title:
          type: string
        createdAt:
          type: string
          format: date-time
        messages:
          type: array
          items:
            $ref: "#/components/schemas/OpenaiMessage"
      required:
        - id
        - title
        - createdAt
        - messages
    GenerateOpenaiImageBody:
      type: object
      properties:
        prompt:
          type: string
        size:
          type: string
          enum: ["1024x1024", "512x512", "256x256"]
      required:
        - prompt
    GenerateOpenaiImageResponse:
      type: object
      properties:
        b64_json:
          type: string
      required:
        - b64_json
    OpenaiError:
      type: object
      properties:
        error:
          type: string
      required:
        - error
```

## Notes

- The `sendOpenaiMessage` and `sendOpenaiVoiceMessage` endpoints both return SSE streams (`text/event-stream`). Orval cannot generate a typed hook for SSE. Consume them manually with `fetch` + `ReadableStream` on the client (`EventSource` only supports GET and cannot send a request body).
- `sendOpenaiMessage` is the text endpoint. Its SSE stream sends `data: {"content": "..."}` chunks followed by `data: {"done": true}`.
- `sendOpenaiVoiceMessage` is the voice endpoint. Its SSE stream sends `data: {"type": "transcript", "data": "..."}` and `data: {"type": "audio", "data": "<base64>"}` chunks, then a final `data: {"done": true}`.
- For image generation, `response_format` is always base64 with gpt-image-1 (not configurable via API).
