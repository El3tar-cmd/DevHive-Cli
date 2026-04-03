# OpenRouter Integration — OpenAPI Endpoints

Add these entries to `lib/api-spec/openapi.yaml`. All paths below are relative to the base server URL (`/api`).

After editing the spec, run codegen:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Tag

Add under `tags`:

```yaml
  - name: openrouter
    description: OpenRouter AI chat operations
```

## Paths

Add under `paths`:

```yaml
  /openrouter/conversations:
    get:
      operationId: listOpenrouterConversations
      tags: [openrouter]
      summary: List all conversations
      responses:
        "200":
          description: List of conversations
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/OpenrouterConversation"
    post:
      operationId: createOpenrouterConversation
      tags: [openrouter]
      summary: Create a new conversation
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateOpenrouterConversationBody"
      responses:
        "201":
          description: Created conversation
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/OpenrouterConversation"
  /openrouter/conversations/{id}:
    get:
      operationId: getOpenrouterConversation
      tags: [openrouter]
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
                $ref: "#/components/schemas/OpenrouterConversationWithMessages"
        "404":
          description: Not found
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/OpenrouterError"
    delete:
      operationId: deleteOpenrouterConversation
      tags: [openrouter]
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
                $ref: "#/components/schemas/OpenrouterError"
  /openrouter/conversations/{id}/messages:
    get:
      operationId: listOpenrouterMessages
      tags: [openrouter]
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
                  $ref: "#/components/schemas/OpenrouterMessage"
    post:
      operationId: sendOpenrouterMessage
      tags: [openrouter]
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
              $ref: "#/components/schemas/SendOpenrouterMessageBody"
      responses:
        "200":
          description: SSE stream of assistant response chunks
          content:
            text/event-stream: {}
```

## Schemas

Add under `components.schemas`:

```yaml
    OpenrouterConversation:
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
    OpenrouterMessage:
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
    CreateOpenrouterConversationBody:
      type: object
      properties:
        title:
          type: string
      required:
        - title
    SendOpenrouterMessageBody:
      type: object
      properties:
        content:
          type: string
      required:
        - content
    OpenrouterConversationWithMessages:
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
            $ref: "#/components/schemas/OpenrouterMessage"
      required:
        - id
        - title
        - createdAt
        - messages
    OpenrouterError:
      type: object
      properties:
        error:
          type: string
      required:
        - error
```

## Notes

- The `sendOpenrouterMessage` endpoint returns an SSE stream (`text/event-stream`). Orval cannot generate a typed hook for SSE. Consume it manually with `fetch` + `ReadableStream` on the client (`EventSource` only supports GET and cannot send a request body).
- The SSE stream sends `data: {"content": "..."}` chunks followed by a final `data: {"done": true}`.
