# Replit Auth — OpenAPI Spec Additions

Add these entries to `lib/api-spec/openapi.yaml`. Paths are relative to the base server URL — **do not** include the `/api` prefix (the Orval config sets `baseUrl: "/api"`).

After editing the spec, run codegen:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Tag

Add under `tags`:

```yaml
  - name: Auth
    description: Browser and mobile authentication endpoints.
```

## Paths

Add under `paths`:

```yaml
  /auth/user:
    get:
      tags: [Auth]
      operationId: getCurrentAuthUser
      summary: Get the currently authenticated user
      parameters:
        - $ref: '#/components/parameters/AuthorizationSessionHeader'
        - $ref: '#/components/parameters/SessionCookie'
      responses:
        '200':
          description: Auth status resolved successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthUserEnvelope'
  /login:
    get:
      tags: [Auth]
      operationId: beginBrowserLogin
      summary: Start the browser OIDC login flow
      parameters:
        - name: returnTo
          in: query
          required: false
          description: Relative path to redirect to after login (must start with `/`). Defaults to `/`.
          schema:
            type: string
      responses:
        '302':
          description: Redirect to the OIDC authorization endpoint.
  /callback:
    get:
      tags: [Auth]
      operationId: handleBrowserLoginCallback
      summary: Complete the browser OIDC login flow
      parameters:
        - name: code
          in: query
          required: false
          schema:
            type: string
        - name: state
          in: query
          required: false
          schema:
            type: string
        - name: iss
          in: query
          required: false
          schema:
            type: string
            format: uri
      responses:
        '302':
          description: Redirect to the `returnTo` path on success (defaults to `/`) or `/api/login` on failure.
  /logout:
    get:
      tags: [Auth]
      operationId: logoutBrowserSession
      summary: Clear the session and begin OIDC logout
      parameters:
        - $ref: '#/components/parameters/AuthorizationSessionHeader'
        - $ref: '#/components/parameters/SessionCookie'
      responses:
        '302':
          description: Redirect to the OIDC provider logout URL.
  /mobile-auth/token-exchange:
    post:
      tags: [Auth]
      operationId: exchangeMobileAuthorizationCode
      summary: Exchange a mobile OIDC code for a session token
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/MobileTokenExchangeRequest'
      responses:
        '200':
          description: Session created successfully.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MobileTokenExchangeSuccess'
        '400':
          description: Missing or invalid required fields.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorEnvelope'
        '401':
          description: Token did not contain usable claims.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorEnvelope'
        '500':
          description: Token exchange failed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorEnvelope'
  /mobile-auth/logout:
    post:
      tags: [Auth]
      operationId: logoutMobileSession
      summary: Delete a mobile session token
      parameters:
        - $ref: '#/components/parameters/AuthorizationSessionHeader'
      responses:
        '200':
          description: Logout processed.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LogoutSuccess'
```

## Parameters

Add under `components.parameters`:

```yaml
    AuthorizationSessionHeader:
      name: Authorization
      in: header
      required: false
      description: Opaque session token — `Bearer <sid>`.
      schema:
        type: string
    SessionCookie:
      name: sid
      in: cookie
      required: false
      description: Browser session cookie.
      schema:
        type: string
```

## Schemas

Add under `components.schemas`:

```yaml
    AuthUser:
      type: object
      required: [id, email, firstName, lastName, profileImageUrl]
      properties:
        id:
          type: string
        email:
          type: [string, 'null']
          format: email
        firstName:
          type: [string, 'null']
        lastName:
          type: [string, 'null']
        profileImageUrl:
          type: [string, 'null']
    AuthUserEnvelope:
      type: object
      required: [user]
      properties:
        user:
          oneOf:
            - $ref: '#/components/schemas/AuthUser'
            - type: 'null'
    MobileTokenExchangeRequest:
      type: object
      required: [code, code_verifier, redirect_uri, state]
      properties:
        code:
          type: string
          minLength: 1
        code_verifier:
          type: string
          minLength: 1
        redirect_uri:
          type: string
          minLength: 1
          format: uri
        state:
          type: string
          minLength: 1
        nonce:
          type: string
          minLength: 1
    MobileTokenExchangeSuccess:
      type: object
      required: [token]
      properties:
        token:
          type: string
    LogoutSuccess:
      type: object
      required: [success]
      properties:
        success:
          type: boolean
          const: true
    ErrorEnvelope:
      type: object
      required: [error]
      properties:
        error:
          type: string
```

## Notes

- The `GET /callback` endpoint is **not validated** with Zod on the server because the OIDC provider may include query parameters not expressed in the schema.
- The `GET /auth/user` route should just reflect the auth state already loaded onto `req` by `authMiddleware`.
- Redirect endpoints (`/login`, `/callback`, `/logout`) exist in the spec for documentation and type generation, but the server routes produce `302` redirects, not JSON bodies.
- Do not use generated API client code for auth operations. For browser auth, use `@workspace/replit-auth-web`'s `useAuth()`.
