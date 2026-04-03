---
name: object-storage
description: Object storage (App Storage) setup and usage for web apps in pnpm monorepo projects. For Expo/React Native mobile apps, use the expo_object_storage blueprint instead.
---

# Object Storage for pnpm Monorepo (Express + React)

Replit's object storage (App Storage) provides GCS-backed file storage with presigned URL uploads. The server handles presigned URL generation and object serving; file uploads go directly to GCS from the client.

> **Note:** This skill is for web stacks only. For Expo/React Native mobile apps, the `expo_object_storage` blueprint should be used instead — it provides Expo-specific client utilities and avoids incompatible web libraries.

## Architecture Overview

```text
Web (React+Vite)
  |
  | 1. POST /api/storage/uploads/request-url     (JSON metadata)
  | 2. PUT <presigned-url>                       (file bytes → GCS)
  | 3. GET /api/storage/public-objects/<path>    (serve public assets)
  | 4. GET /api/storage/objects/<path>           (serve object entities)
  |
  v
Express API Server
  ├── lib/objectStorage.ts       (GCS client wrapper, presigned URL generation)
  ├── lib/objectAcl.ts           (ACL policy framework)
  └── routes/storage.ts          (upload + serve endpoints, Zod-validated)
  |
  | @google-cloud/storage (Replit sidecar auth)
  v
Google Cloud Storage
```

### Serving Paths

There are two distinct serving paths:

- **`/storage/public-objects/*`** — serves objects from `PUBLIC_OBJECT_SEARCH_PATHS`. These are unconditionally public with no authentication or ACL checks. Use for app/website assets uploaded via the Object Storage tool pane.
- **`/storage/objects/*`** — serves object entities stored in `PRIVATE_OBJECT_DIR` (uploaded via presigned URLs). These are served from a separate path and can optionally be protected with authentication or ACL checks based on the use case.

## When to Use

- User requests file storage, object storage, or app storage
- User needs to serve public assets from storage
- User requests file upload functionality (public or protected)

## When NOT to Use

- User only needs to render images from given URLs (no storage needed)
- User needs AI-generated images without explicit storage request
- User needs structured data storage (use a database instead)

## Setup

### Step 1: Provision Object Storage

Call `setupObjectStorage()` in the `code_execution` sandbox to provision the bucket. This is **idempotent** — if the bucket already exists it returns immediately with `alreadySetUp: true`.

```javascript
const result = await setupObjectStorage();
console.log(result);
// { success: true, alreadySetUp: true/false, secretKeys: [...], bucketId: "..." }
```

After a successful call the following environment variables are set:

- `DEFAULT_OBJECT_STORAGE_BUCKET_ID` — the bucket ID on GCS
- `PUBLIC_OBJECT_SEARCH_PATHS` — search paths for public assets
- `PRIVATE_OBJECT_DIR` — directory for private objects

### Step 2: OpenAPI Spec

Add the storage endpoints to `lib/api-spec/openapi.yaml` using the entries from `references/openapi.md`. Then run codegen:

```bash
pnpm --filter @workspace/api-spec run codegen
```

This generates Zod schemas (`RequestUploadUrlBody`, `RequestUploadUrlResponse`) in `@workspace/api-zod`, which the server routes use for request/response validation.

### Step 3: Copy Server Files

Copy the storage route, service, and ACL files directly into the API server:

```bash
# Object storage service (GCS client wrapper, presigned URL generation)
mkdir -p artifacts/api-server/src/lib
cp .local/skills/object-storage/templates/api-server/src/lib/objectStorage.ts artifacts/api-server/src/lib/objectStorage.ts

# ACL framework (access control policies for objects)
cp .local/skills/object-storage/templates/api-server/src/lib/objectAcl.ts artifacts/api-server/src/lib/objectAcl.ts

# Storage routes (upload URL request + object serving)
mkdir -p artifacts/api-server/src/routes
cp .local/skills/object-storage/templates/api-server/src/routes/storage.ts artifacts/api-server/src/routes/storage.ts
```

Install server dependencies:

```bash
pnpm --filter @workspace/api-server add @google-cloud/storage google-auth-library
```

The storage route template uses `req.log` for structured logging. Ensure pino and pino-http are set up in the API server before mounting these routes — see the **Logging** section in the `pnpm-workspace` skill and `references/server.md` for setup instructions.

### Step 4: Wire Up Routes

Import and mount the storage router in `artifacts/api-server/src/routes/index.ts`:

```typescript
import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);

export default router;
```

This registers the following endpoints (assuming routes are mounted at `/api`):

- `POST /api/storage/uploads/request-url` — request a presigned upload URL
- `GET /api/storage/public-objects/*` — serve public assets (unconditionally public)
- `GET /api/storage/objects/*` — serve object entities (optionally protected)

### Step 5: Copy Client Package

Copy the browser upload package:

```bash
mkdir -p lib/object-storage-web
cp -r .local/skills/object-storage/templates/lib/object-storage-web/* lib/object-storage-web/
```

Add the dependency to your web artifact's `package.json`:

```json
"@workspace/object-storage-web": "workspace:*"
```

Install Uppy peer dependencies in the web artifact:

```bash
pnpm --filter @workspace/<web-app> add @uppy/aws-s3@^5.0.0 @uppy/core@^5.0.0 @uppy/dashboard@^5.0.0 @uppy/react@^5.0.0
```

**Important:** Uppy v5 declares `react@>=19` as a peer dependency, but the project uses React 18. To prevent pnpm from installing a duplicate React, add overrides to the **root** `package.json`:

```json
{
  "pnpm": {
    "overrides": {
      "react": "$react",
      "react-dom": "$react-dom"
    }
  }
}
```

Then run:

```bash
pnpm install
```

Since `object-storage-web` is a new composite lib, add it to the root `tsconfig.json` references and to the web artifact's `tsconfig.json` references:

```json
// root tsconfig.json – add to "references"
{ "path": "lib/object-storage-web" }
```

```json
// artifacts/<web-app>/tsconfig.json – add to "references"
{ "path": "../../lib/object-storage-web" }
```

### Step 6: (Optional) Protected Uploads with Replit Auth

For protected file uploads requiring user login:

1. Set up Replit Auth first (see the `replit-auth` skill)
2. Uncomment the auth check block in `routes/storage.ts` (the template includes a commented example)
3. Use `req.isAuthenticated()` to guard the upload endpoint
4. Use `req.user.id` as the owner when setting ACL policies

When protected file uploading is requested, both **Replit Auth** and **PostgreSQL** must also be configured, even if not explicitly mentioned. Persistent storage and user authentication are implicitly required for protected file uploading.

## Provided Modules

### Server (copied into API server)

Files copied to `artifacts/api-server/src/`:

- **`lib/objectStorage.ts`** — `ObjectStorageService` class (GCS client wrapper) and `objectStorageClient` (raw GCS `Storage` instance, authenticated via Replit sidecar)
- **`lib/objectAcl.ts`** — ACL framework: `canAccessObject`, `getObjectAclPolicy`, `setObjectAclPolicy`
- **`routes/storage.ts`** — Express routes with Zod-validated request/response handling

### ObjectStorageService methods

| Method | Signature | Description |
| --- | --- | --- |
| `getObjectEntityUploadURL` | `() => Promise<string>` | Generates a presigned PUT URL for uploading to the private object dir. Returns the signed URL string. |
| `normalizeObjectEntityPath` | `(rawPath: string) => string` | Converts a full GCS URL (`https://storage.googleapis.com/...`) to a local object path (`/objects/<id>`). Pass-through if already normalized. |
| `getObjectEntityFile` | `(objectPath: string) => Promise<File>` | Resolves an object path (must start with `/objects/`) to a GCS `File` handle. Throws `ObjectNotFoundError` if missing. |
| `downloadObject` | `(file: File, cacheTtlSec?: number) => Promise<Response>` | Streams a GCS `File` as a `Response` with correct `Content-Type` and cache headers. |
| `searchPublicObject` | `(filePath: string) => Promise<File \| null>` | Searches `PUBLIC_OBJECT_SEARCH_PATHS` for a public object by relative path. Returns `null` if not found. |
| `trySetObjectEntityAclPolicy` | `(rawPath: string, aclPolicy: ObjectAclPolicy) => Promise<string>` | Normalizes the path and sets the ACL policy on the object. Returns the normalized path. |
| `canAccessObjectEntity` | `({userId?, objectFile, requestedPermission?}) => Promise<boolean>` | Checks if a user can access an object based on its ACL policy. |
| `getPublicObjectSearchPaths` | `() => string[]` | Returns parsed `PUBLIC_OBJECT_SEARCH_PATHS` env var. |
| `getPrivateObjectDir` | `() => string` | Returns `PRIVATE_OBJECT_DIR` env var. |

### Client (`@workspace/object-storage-web`)

- `ObjectUploader` — Uppy v5-based upload button with modal file picker. Use when you want a ready-made file picker UI with drag-and-drop, previews, and progress.
- `useUpload()` — React hook for programmatic uploads. Use when you want a plain `<input type="file">` or custom upload UI without the Uppy modal.

## Usage Examples

### ObjectUploader component

```typescript
import { ObjectUploader } from "@workspace/object-storage-web";

<ObjectUploader
  onGetUploadParameters={async (file) => {
    const res = await fetch("/api/storage/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        contentType: file.type,
      }),
    });
    const { uploadURL } = await res.json();
    return {
      method: "PUT",
      url: uploadURL,
      headers: { "Content-Type": file.type },
    };
  }}
  onComplete={(result) => console.log("Upload complete:", result)}
>
  Upload Files
</ObjectUploader>
```

### useUpload hook

```typescript
import { useUpload } from "@workspace/object-storage-web";

function MyUploader() {
  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (response) => console.log("Uploaded:", response.objectPath),
  });

   ```json
   {
     "pnpm": {
       "overrides": {
         "react": "$react",
         "react-dom": "$react-dom"
       }
     }
   }
   ```

   This forces all packages to use the project's React version. Run `pnpm install` after adding the overrides.

1. **Define endpoints in the OpenAPI spec.** Add the object storage endpoints to `lib/api-spec/openapi.yaml`:

   - `POST /api/storage/uploads/request-url` -- request a presigned upload URL (accepts JSON metadata: name, size, contentType; returns uploadURL and objectPath)
   - `GET /api/storage/objects/{objectPath}` -- serve uploaded objects

   Then run codegen to generate typed route stubs and React Query hooks:

   ```bash
   pnpm --filter @workspace/api-spec run codegen
   ```

2. **Mount storage routes** on your Express app. Use `createObjectStorageRouter()` to register the route handlers:

   ```typescript
   import { createObjectStorageRouter } from "@workspace/integrations-object-storage/server";

   app.use("/api/storage", createObjectStorageRouter());
   ```

   This registers `/api/storage/uploads/request-url` and `/api/storage/objects/*`.

3. **Install server dependencies:**

   ```bash
   pnpm add @google-cloud/storage google-auth-library
   ```

   Run this in the API server artifact directory.

4. **Use generated hooks on the frontend.** After codegen, use the generated React Query hooks from `@workspace/api-client-react` for requesting presigned URLs. The `ObjectUploader` component and `useUpload` hook are available for the Uppy modal UI and the direct-to-GCS upload step (step 2), which is outside your API spec since it goes to Google Cloud Storage directly.

   Example with `ObjectUploader` using the generated hook for step 1:

   ```typescript
   import { ObjectUploader } from "@workspace/integrations-object-storage/client";

   <ObjectUploader
     onGetUploadParameters={async (file) => {
       // Use the generated API client hook or fetch for step 1
       const res = await fetch("/api/storage/uploads/request-url", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           name: file.name,
           size: file.size,
           contentType: file.type,
         }),
       });
       const { uploadURL } = await res.json();
       // Step 2: upload directly to GCS via presigned URL
       return {
         method: "PUT",
         url: uploadURL,
         headers: { "Content-Type": file.type },
       };
     }}
     onComplete={(result) => console.log("Upload complete:", result)}
   >
     Upload Files
   </ObjectUploader>
   ```

5. **Or use the useUpload hook** for custom upload UI:

   ```typescript
   import { useUpload } from "@workspace/integrations-object-storage/client";

   function MyUploader() {
     const { uploadFile, isUploading, progress } = useUpload({
       onSuccess: (response) => console.log("Uploaded:", response.objectPath),
     });

     return (
       <input
         type="file"
         onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
         disabled={isUploading}
       />
     );
   }
   ```

## Presigned URL Upload Flow

File uploads use a two-step presigned URL flow:

1. **Request presigned URL** from the API server (send JSON metadata, NOT the file). This endpoint is defined in `openapi.yaml` and validated with Zod schemas on the server.
2. **Upload directly** to the presigned URL (NOT to your backend). This goes to Google Cloud Storage directly and is outside the OpenAPI spec.

Critical rules:

- DO NOT send the file as FormData to get the presigned URL
- DO NOT send the file to your backend server
- The file is uploaded DIRECTLY to Google Cloud Storage via the presigned URL
- Your backend only handles metadata and generates the presigned URL

## objectPath and Serving URL

The `objectPath` returned by the upload endpoint already includes the `/objects/` prefix (e.g., `/objects/uploads/some-uuid`). To construct the serving URL, simply prepend your storage mount path — do **not** add `/objects/` again:

```text
Upload response:  { objectPath: "/objects/uploads/some-uuid" }
Serving URL:      GET /api/storage/objects/uploads/some-uuid
                      = /api/storage + objectPath
```

Store `objectPath` in your database. To serve it: `fetch(\`/api/storage\${objectPath}\`)`.

For public assets (not user uploads), use the public-objects path instead:

For protected file uploads requiring user login:

- Use Replit Auth for user authentication (see the `replit-auth` skill)
- Add the `isAuthenticated` middleware to the storage routes
- Use ACL policies to control access (see `objectAcl.ts`)

When protected file uploading is requested, both **Replit Auth** and **PostgreSQL** must also be configured, even if not explicitly mentioned. Persistent storage and user authentication are implicitly required for protected file uploading.

If tracking upload metadata (which user uploaded what, file descriptions, etc.), define a Drizzle schema file in `lib/db/src/schema/` and push the schema with `pnpm --filter @workspace/db run push`

## Public Asset Serving

When the user wants to store app/website assets (not user uploads):

- Set up object storage
- Direct the user to upload files from the Object Storage tool pane
- Serve assets via `GET /api/storage/public-objects/<file-path>` — this route searches `PUBLIC_OBJECT_SEARCH_PATHS` and serves files unconditionally with no authentication

## Error Handling

If you encounter errors containing "App Storage service suspended" from `setupObjectStorage()` or from object storage operations at runtime:

1. Inform the user that their cloud budget has been exceeded
2. Call the `notify_cloud_budget_exceeded` tool with `service_name="object_storage"`

This error handling is ONLY for budget exceeded errors from Object Storage. Do NOT use `notify_cloud_budget_exceeded` for any other errors.

## Important

- Do NOT modify the GCS client setup in `objectStorage.ts` — it uses Replit sidecar authentication which is auto-configured.
- Do NOT modify the `objectAcl.ts` ACL framework unless adapting access group types for your use case.
- Do NOT modify `ObjectUploader.tsx` or `use-upload.ts` — the Uppy v5 imports and CSS paths are already correct. Do not consult external Uppy docs to "fix" them.
