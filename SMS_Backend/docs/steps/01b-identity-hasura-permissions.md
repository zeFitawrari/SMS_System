# Step 01b — Identity & tenancy (Hasura permissions)

## Platform roles (`SUPER_PROVIDER_ADMIN`, `PROVIDER_ADMIN`)

**Cross-tenant control plane:** full GraphQL access (no row filter) on identity and tenancy tables.

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `identity.roles` | All rows | Yes | Yes | Yes |
| `identity.users` | All rows (no `password_hash` via GraphQL) | Yes | Yes | Yes |
| `identity.userroles` | All rows | Yes | Yes | Yes |
| `tenancy.schools` | All schools | Yes | Yes | Yes |
| `tenancy.branches` | All branches | Yes | Yes | Yes |

Use provider JWT with the matching role. Prefer audited Express flows for production password changes when Step 02+ adds them; Hasura permissions exist for console and platform tooling.

**Note:** `RegisterSchool` remains the supported provisioning path; direct GraphQL inserts must respect DB constraints (e.g. one main branch per school).

## School roles (tenant-scoped)

| Table | Policy |
|-------|--------|
| `identity.roles` | Read global catalog + roles for `X-Hasura-School-Id` only (`SCHOOL_OWNER`, `SCHOOL_ADMIN`, `BRANCH_ADMIN`) |
| `identity.users` | Admins: users in school (no `password_hash`); `TEACHER`: directory; `STUDENT`/`PARENT`: own row |
| `identity.userroles` | Admins: grants in school; others: own grants only |
| `tenancy.schools` | `SCHOOL_OWNER` / `SCHOOL_ADMIN`: own school (read only) |
| `tenancy.branches` | School admins: all branches in school; `BRANCH_ADMIN`: assigned branch (read, when `X-Hasura-Branch-Id` is set) |

**No** insert/update/delete for school roles on these tables (Express provisioning and future assignment APIs).

## Apply

```bash
yarn metadata
```

Metadata:

- `identity_roles.yaml`
- `identity_users.yaml`
- `identity_userroles.yaml`
