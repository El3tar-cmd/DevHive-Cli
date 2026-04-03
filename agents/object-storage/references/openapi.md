# Object Storage — OpenAPI Spec Additions

Add these entries to `lib/api-spec/openapi.yaml`. Paths are relative to the base server URL — **do not** include the `/api` prefix (the Orval config sets `baseUrl: "/api"`).

After editing the spec, run codegen:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Tag

Add under `tags`:

```yaml
  - name: Storage
    description: Object storage upload and serving endpoints.
```

## Paths

Add under `paths`:

```yaml
  /storage/uploads/request-url:
    post:
      tags: [Storage]
      operationId: requestUploadUrl
      summary: Request a presigned URL for file upload
      description: |
        Returns a presigned GCS URL for direct upload. The client sends JSON
        metadata here, then uploads the file directly to the returned URL.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UploadUrlRequest'
      responses:
        '200':
          description: Presigned upload URL generated.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UploadUrlResponse'
        '400':
          description: Missing or invalid required fields.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorEnvelope'
        '500':
          description: Failed to generate upload URL.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorEnvelope'
  /storage/public-objects/{filePath}:
    get:
      tags: [Storage]
      operationId: getPublicObject
      summary: Serve a public asset from PUBLIC_OBJECT_SEARCH_PATHS
      description: |
        Unconditionally public — no authentication or ACL checks.
        Searches PUBLIC_OBJECT_SEARCH_PATHS for the given file path.
      parameters:
        - name: filePath
          in: path
          required: true
          schema:
            type: string
          description: Relative file path within the public search paths.
      responses:
        '200':
          description: Object content streamed with correct Content-Type.
          content:
            '*/*':
              schema:
                type: string
                format: binary
        '404':
          description: File not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorEnvelope'
        '500':
          description: Failed to serve public object.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorEnvelope'
  /storage/objects/{objectPath}:
    get:
      tags: [Storage]
      operationId: getStorageObject
      summary: Serve an object entity from PRIVATE_OBJECT_DIR
      description: |
        Serves object entities uploaded via presigned URLs. These can optionally
        be protected with authentication or ACL checks based on the use case.
      parameters:
        - name: objectPath
          in: path
          required: true
          schema:
            type: string
          description: Object path within the private object dir (e.g. `uploads/some-uuid`).
      responses:
        '200':
          description: Object content streamed with correct Content-Type.
          content:
            '*/*':
              schema:
                type: string
                format: binary
        '404':
          description: Object not found.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorEnvelope'
        '500':
          description: Failed to serve object.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorEnvelope'
```

## Schemas

Add under `components.schemas`:

```yaml
    UploadUrlRequest:
      type: object
      required: [name, size, contentType]
      properties:
        name:
          type: string
          minLength: 1
          description: Original file name.
        size:
          type: integer
          minimum: 1
          description: File size in bytes.
        contentType:
          type: string
          minLength: 1
          description: MIME type of the file (e.g. `image/jpeg`).
    UploadUrlResponse:
      type: object
      required: [uploadURL, objectPath]
      properties:
        uploadURL:
          type: string
          format: uri
          description: Presigned GCS URL for PUT upload.
        objectPath:
          type: string
          description: Normalized object path (e.g. `/objects/uploads/uuid`). Store this in your database.
        metadata:
          $ref: '#/components/schemas/UploadUrlRequest'
    ErrorEnvelope:
      type: object
      required: [error]
      properties:
        error:
          type: string
```

## Notes

- The `POST /storage/uploads/request-url` request body contains JSON metadata only — **never** the file itself. The file is uploaded directly to the presigned URL returned in the response.
- The `GET /storage/objects/{objectPath}` endpoint streams binary content. The generated client may not be useful for this endpoint; use `fetch` or `<img src=...>` directly.
- If an `ErrorEnvelope` schema already exists from another skill (e.g. replit-auth), reuse it instead of adding a duplicate.
