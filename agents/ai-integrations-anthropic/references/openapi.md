# Anthropic Integration — OpenAPI Endpoints

Add these entries to `lib/api-spec/openapi.yaml`. All paths below are relative to the base server URL (`/api`).

After editing the spec, run codegen:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Tag

Add under `tags`:

```yaml
  - name: anthropic
    description: Anthropic AI chat operations
```

## Paths

Add under `paths`:

```yaml
  /anthropic/conversations:
    get:
      operationId: listAnthropicConversations
      tags: [anthropic]
      summary: List all conversations
      responses:
        "200":
          description: List of conversations
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/AnthropicConversation"
    post:
      operationId: createAnthropicConversation
      tags: [anthropic]
      summary: Create a new conversation
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateAnthropicConversationBody"
      responses:
        "201":
          description: Created conversation
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AnthropicConversation"
  /anthropic/conversations/{id}:
    get:
      operationId: getAnthropicConversation
      tags: [anthropic]
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
                $ref: "#/components/schemas/AnthropicConversationWithMessages"
        "404":
          description: Not found
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AnthropicError"
    delete:
      operationId: deleteAnthropicConversation
      tags: [anthropic]
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
                $ref: "#/components/schemas/AnthropicError"
  /anthropic/conversations/{id}/messages:
    get:
      operationId: listAnthropicMessages
      tags: [anthropic]
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
                  $ref: "#/components/schemas/AnthropicMessage"
    post:
      operationId: sendAnthropicMessage
      tags: [anthropic]
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
              $ref: "#/components/schemas/SendAnthropicMessageBody"
      responses:
        "200":
          description: SSE stream of assistant response chunks
          content:
            text/event-stream: {}
```

## Schemas

Add under `components.schemas`:

```yaml
    AnthropicConversation:
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
    AnthropicMessage:
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
    CreateAnthropicConversationBody:
      type: object
      properties:
        title:
          type: string
      required:
        - title
    SendAnthropicMessageBody:
      type: object
      properties:
        content:
          type: string
      required:
        - content
    AnthropicConversationWithMessages:
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
            $ref: "#/components/schemas/AnthropicMessage"
      required:
        - id
        - title
        - createdAt
        - messages
    AnthropicError:
      type: object
      properties:
        error:
          type: string
      required:
        - error
```

## Notes

- The `sendAnthropicMessage` endpoint returns an SSE stream (`text/event-stream`). Orval cannot generate a typed hook for SSE. Consume it manually with `fetch` + `ReadableStream` on the client (`EventSource` only supports GET and cannot send a request body).
- The SSE stream sends `data: {"content": "..."}` chunks followed by a final `data: {"done": true}`.
