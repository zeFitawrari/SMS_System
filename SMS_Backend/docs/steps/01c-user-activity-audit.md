# User activity via GraphQL (nested on `users`)

Read-only Hasura tracking for **sessions**, **auth_events**, and **role_assignments**. Writes stay on Express actions (login, logout, AssignRole, etc.).

## Example query (school admin)

```graphql
query SchoolUserActivity($schoolId: uuid!) {
  users(where: { school_id: { _eq: $schoolId } }, order_by: { last_login_at: desc_nulls_last }) {
    id
    email
    first_name
    last_name
    last_login_at
    sessions(order_by: { last_active_at: desc }, limit: 5) {
      id
      last_active_at
      expires_at
      revoked_at
      active_role
      active_branch_id
      user_agent
    }
    auth_events(order_by: { created_at: desc }, limit: 20) {
      event_type
      created_at
      client_ip
      metadata
    }
    role_assignments(where: { revoked_at: { _is_null: true } }) {
      scope_type
      branch_id
      role {
        name
      }
    }
  }
}
```

## Who sees what (hierarchy)

| Role | Users visible | Nested audit |
|------|----------------|--------------|
| Platform admin | All | All rows |
| `SCHOOL_OWNER` | Everyone in the school | Full school audit |
| `SCHOOL_ADMIN` | School users **except** anyone with active `SCHOOL_OWNER` or `SCHOOL_ADMIN` assignment (cannot see owner / peer admins) | Same filter — branch managers downward |
| `BRANCH_ADMIN` | Self + users on `X-Hasura-Branch-Id` with roles **below** branch manager (teacher, student, staff, etc.) | Same branch + role filter |
| `STUDENT` / `PARENT` | Own user row only | Own sessions / events / assignments |

School-wide `FINANCE` / staff without owner/admin roles remain visible to `SCHOOL_ADMIN`. Use **SelectContext** so branch admins have `X-Hasura-Branch-Id` in the JWT.

**Never exposed:** `token_hash`, `previous_token_hash`, `session_family_id`, passwords.

**Branch context:** `BRANCH_ADMIN` should use **SelectContext** with a branch so JWT includes `X-Hasura-Branch-Id`.

## Apply

```bash
yarn metadata
```
