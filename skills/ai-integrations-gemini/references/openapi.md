# Gemini Integration — OpenAPI Endpoints

Add these entries to `lib/api-spec/openapi.yaml`. All paths below are relative to the base server URL (`/api`).

After editing the spec, run codegen:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Tag

Add under `tags`:

```yaml
  - name: gemini
    description: Gemini AI chat and image operations
```

## Paths

Add under `paths`:

```yaml
  /gemini/conversations:
    get:
      operationId: listGeminiConversations
      tags: [gemini]
      summary: List all conversations
      responses:
        "200":
          description: List of conversations
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/GeminiConversation"
    post:
      operationId: createGeminiConversation
      tags: [gemini]
      summary: Create a new conversation
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateGeminiConversationBody"
      responses:
        "201":
          description: Created conversation
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GeminiConversation"
  /gemini/conversations/{id}:
    get:
      operationId: getGeminiConversation
      tags: [gemini]
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
                $ref: "#/components/schemas/GeminiConversationWithMessages"
        "404":
          description: Not found
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GeminiError"
    delete:
      operationId: deleteGeminiConversation
      tags: [gemini]
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
                $ref: "#/components/schemas/GeminiError"
  /gemini/conversations/{id}/messages:
    get:
      operationId: listGeminiMessages
      tags: [gemini]
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
                  $ref: "#/components/schemas/GeminiMessage"
    post:
      operationId: sendGeminiMessage
      tags: [gemini]
      summary: Send a message and receive an AI response (SSE stream)
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
              $ref: "#/components/schemas/SendGeminiMessageBody"
      responses:
        "200":
          description: SSE stream of assistant response chunks
          content:
            text/event-stream: {}
  /gemini/generate-image:
    post:
      operationId: generateGeminiImage
      tags: [gemini]
      summary: Generate an image from a text prompt
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/GenerateGeminiImageBody"
      responses:
        "200":
          description: Generated image data
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GenerateGeminiImageResponse"
```

## Schemas

Add under `components.schemas`:

```yaml
    GeminiConversation:
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
    GeminiMessage:
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
    CreateGeminiConversationBody:
      type: object
      properties:
        title:
          type: string
      required:
        - title
    SendGeminiMessageBody:
      type: object
      properties:
        content:
          type: string
      required:
        - content
    GeminiConversationWithMessages:
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
            $ref: "#/components/schemas/GeminiMessage"
      required:
        - id
        - title
        - createdAt
        - messages
    GenerateGeminiImageBody:
      type: object
      properties:
        prompt:
          type: string
      required:
        - prompt
    GenerateGeminiImageResponse:
      type: object
      properties:
        b64_json:
          type: string
        mimeType:
          type: string
      required:
        - b64_json
        - mimeType
    GeminiError:
      type: object
      properties:
        error:
          type: string
      required:
        - error
```

## Notes

- The `sendGeminiMessage` endpoint returns an SSE stream (`text/event-stream`). Orval cannot generate a typed hook for SSE. Consume it manually with `fetch` + `ReadableStream` on the client (`EventSource` only supports GET and cannot send a request body).
- The SSE stream sends `data: {"content": "..."}` chunks followed by a final `data: {"done": true}`.
- The `generateGeminiImage` endpoint returns base64 image data. Use the `generateImage` helper from `@workspace/integrations-gemini-ai/image` in the route handler.
