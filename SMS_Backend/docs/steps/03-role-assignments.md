# Step 03 — Role assignments (single school, branch-ready)

**No multi-school:** tenant = `users.school_id`. **Scoped grants:** `identity.role_assignments`.

## Phase 1 — Database ✅

Migration `1783000003500_role_assignments`:

| Object | Purpose |
|--------|---------|
| `identity.role_assignments` | Source of truth: `scope_type` (`identity.role_assignment_scope` enum), optional `branch_id` |
| `users.authz_version` | Bumped on grant/revoke; JWT + auth hook must match |

Not tracked in Hasura metadata (Express-only).

## Phase 2–3 — Grants & read path ✅

| Piece | Behavior |
|-------|----------|
| `grantSchoolScopeRoles()` / `grantBranchScopeRole()` | Inserts assignment, bumps `authz_version` |
| Login / refresh | Load roles from assignments; JWT carries one **active** role |
| `x-hasura-authz-version` + auth hook | Enforced |

## Phase 4 — Context & admin actions ✅

Migrations:

| Migration | Purpose |
|-----------|---------|
| `1783000003600_session_active_context` | `sessions.active_role`, `active_branch_id` |
| `1783000003700_drop_userroles` | Drops legacy `identity.userroles` |
| `1783000003800_role_assignment_scope_enum` | Postgres enum ↔ GraphQL `RoleAssignmentScope` |

GraphQL actions (webhooks under `/api/v1/auth/*`):

| Action | Purpose |
|--------|---------|
| `ListMyContexts` | Assignments the user can switch to |
| `SelectContext` | Set session role (+ branch); new access JWT |
| `AssignRole` | School owners/admins (+ platform) grant roles |
| `RevokeRoleAssignment` | Revoke by assignment id |

Legacy `identity.userroles` removed from metadata and seed. Auth hook re-validates active role (and branch when present) against assignments.

## Apply

```bash
yarn migrate
yarn metadata
```

Restart API after deploy.
