# Step 01 — Register school with main branch

## Client flow

1. Authenticate as a **provider** user (seeded by `npm run seed:provider`).
2. Call Hasura:

```graphql
mutation RegisterSchool($object: RegisterSchoolInput!) {
  RegisterSchool(object: $object) {
    school_id
    main_branch_id
    admin_id
    owner_id
    token
  }
}
```

3. Hasura validates GraphQL types, checks action role, POSTs to Express with `x-hasura-action-secret`.

## Express flow (Hasura webhook)

`POST /api/v1/auth/register-school` — registered in `api/src/routes/hasura/`

1. **Hasura** — action role permissions + GraphQL input validation (before webhook)
2. `verifyHasuraWebhook` — once on the Hasura router; verifies `x-hasura-action-secret` and parses input
3. `registerSchoolSafetySchema` (optional per action) — password/geo rules GraphQL cannot express
4. `provisionSchool()` — one transaction
5. Response body = `RegisterSchoolOutput` fields (snake_case)

## Apply schema

```bash
yarn migrate
yarn metadata
```

Identity table permissions: [01b-identity-hasura-permissions.md](01b-identity-hasura-permissions.md).

## Seed provider (local dev)

```bash
npm run seed:provider
```

Use the printed email/password in `Login` (Step 02 will formalize; for now use Hasura JWT from seed output if provided).
