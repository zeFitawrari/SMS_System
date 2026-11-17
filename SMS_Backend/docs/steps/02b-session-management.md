# Step 02b — List and revoke sessions

Authenticated users manage **their own** server sessions (`identity.sessions`). Clients still use **Hasura GraphQL only**.

## Actions

| Operation | GraphQL | Auth | Webhook |
|-----------|---------|------|---------|
| List devices | `ListMySessions` | Access JWT | `POST /api/v1/auth/list-my-sessions` |
| Revoke one | `RevokeSession` | Access JWT | `POST /api/v1/auth/revoke-session` |
| Revoke all others | `RevokeOtherSessions` | Access JWT | `POST /api/v1/auth/revoke-other-sessions` |

Hasura forwards the client JWT as `session_variables`; Express sets `req.authUserId` from `x-hasura-user-id`. Users cannot list or revoke another user’s rows.

## ListMySessions

Pass `current_session_id` (from `Login` / `RefreshSession`) so the API marks `is_current: true` on this device.

```graphql
query MySessions($object: ListMySessionsInput) {
  ListMySessions(object: $object) {
    sessions {
      session_id
      last_active_at
      expires_at
      user_agent
      is_active
      is_current
    }
  }
}
```

Variables:

```json
{
  "object": {
    "current_session_id": "<uuid from login>",
    "include_inactive": false
  }
}
```

Default: **active sessions only**. Set `include_inactive: true` to include expired/revoked history.

## RevokeSession

Ends one session by id (including the current device if you pass its `session_id`).

```graphql
mutation RevokeOne($object: RevokeSessionInput!) {
  RevokeSession(object: $object) {
    status
    revoked_session_id
  }
}
```

## RevokeOtherSessions

“Sign out everywhere else” — keeps the session identified by `current_session_id`.

```graphql
mutation RevokeOthers($object: RevokeOtherSessionsInput!) {
  RevokeOtherSessions(object: $object) {
    status
    revoked_count
  }
}
```

## Apply

```bash
yarn metadata
```

## Code

| Piece | Path |
|-------|------|
| Service | `api/src/services/auth/sessionManagement.js` |
| Controllers | `api/src/controllers/auth/listMySessionsController.js`, `revokeSessionController.js`, `revokeOtherSessionsController.js` |
| Auth middleware | `requireUser: true` on `hasuraAction()` + `requireHasuraUser` |
