# Step 02 — Login, refresh, logout (session-based)

Clients authenticate **only via Hasura GraphQL**; Express exposes webhooks under `/api/v1/auth/*`.

## Session model

| Layer | What the client holds |
|-------|------------------------|
| **Access JWT** (`access_token` / `token`) | Short-lived; includes `x-hasura-session-id`; validated by **Hasura auth hook** + active DB session |
| **Session token** (`session_token`) | Opaque; hashed in `identity.sessions.token_hash`, rotated **in place** on refresh |
| **Session id** (`session_id`) | Stable UUID for the row — use later to list/revoke one device |

Server table: `identity.sessions` (not tracked in Hasura metadata). One row ≈ one device/login; `MAX_ACTIVE_SESSIONS_PER_USER` (default 10) evicts oldest sessions on new login.

## Actions

| Mutation | Role (Hasura) | Webhook |
|----------|---------------|---------|
| `Login(object: LoginInput!)` | `anonymous` | `POST /api/v1/auth/login` |
| `RefreshSession(object: RefreshSessionInput!)` | `anonymous` | `POST /api/v1/auth/refresh` |
| `Logout(object: LogoutInput)` | authenticated roles + `anonymous` | `POST /api/v1/auth/logout` |

Types and fields: `hasura/metadata/actions.graphql`.

## Database

Migrations:

- `1783000003000_auth_refresh_tokens` — creates `identity.refresh_tokens` (legacy name)
- `1783000003100_rename_refresh_to_sessions` — renames to `identity.sessions`, `session_family_id`
- `1783000003200_session_row_tracking` — `last_active_at`, `previous_token_hash` (reuse detection)
- `1783000003300_users_phone_and_identity` — optional `phone`, unique email/phone
- `1783000003400_auth_events` — audit log
- `identity.users.last_login_at`

## Flow

1. **Login** — verify email/password, load roles, issue access JWT + new server session.
2. **RefreshSession** — update `token_hash` on the same session row; reuse of an old token revokes that session.
3. **Logout** — pass `session_token` to revoke one session, **or** call with access JWT (no body token) to revoke **all** sessions for that user.

**Auth hook:** Hasura calls `POST /api/v1/auth/hasura-webhook` on each request. No Bearer token → hook returns `X-Hasura-Role: anonymous` (Do **not** set `HASURA_GRAPHQL_UNAUTHORIZED_ROLE` with auth hook on Engine v2.36). With Bearer token → hook verifies JWT + active `identity.sessions` row.

**Login:** exactly one of `email` or `phone` (normalized digits). **Roles:** one role per user, or `PARENT` + one other (see `api/src/constants/rolePolicy.js`).

**Audit:** `identity.auth_events` (login, refresh, logout, hook deny, session reuse).

JWT claims: `x-hasura-user-id`, `x-hasura-school-id`, `x-hasura-session-id`, `x-hasura-allowed-roles`, default role from `api/src/constants/roles.js`. Client may send `x-hasura-role` header to pick among allowed roles.

## Apply

```bash
yarn migrate
yarn metadata
```

## Examples

```graphql
mutation Login($object: LoginInput!) {
  Login(object: $object) {
    id
    token
    session_id
    session_token
    email
    roles
    school_id
  }
}
```

```graphql
mutation Refresh($object: RefreshSessionInput!) {
  RefreshSession(object: $object) {
    token
    session_token
  }
}
```

```graphql
mutation Logout($object: LogoutInput) {
  Logout(object: $object) {
    status
    message
  }
}
```

## Code layout

| Piece | Path |
|-------|------|
| Webhook routes | `api/src/routes/hasura/auth.js` |
| Login / refresh | `api/src/services/auth/login.js` |
| Session storage | `api/src/services/auth/sessionStore.js` |
| Response mapping | `api/src/controllers/auth/formatLoginOutput.js` |
| JWT | `api/src/utils/auth.js` |

Session list / revoke: [02b-session-management.md](02b-session-management.md).

Next: [03-role-assignments.md](03-role-assignments.md) — scoped grants; then **SelectContext** (role + branch in token).
