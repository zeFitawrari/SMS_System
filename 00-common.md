# Common — headers & Manage pattern

## GraphQL HTTP request (example curl)

```bash
curl -X POST http://localhost:8084/v1/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"query":"query { __typename }"}'
```

## Manage* mutations (academic + staff packages)

Same rule for `ManageAcademicYear`, `ManageGradeLevel`, `ManageGradeMonthlyFee`, `ManageSectionSlot`, `ManageSchoolRegistrationPackage`, `ManageUser`:

| is_delete | id | Result |
|-----------|-----|--------|
| true | required | Delete |
| false | set | Update |
| false | omitted | Insert |

## school_id / branch_id on actions

- **School staff:** often omit `school_id` / `branch_id` — taken from JWT after `SelectContext`.
- **SCHOOL_ADMIN:** JWT may have **no** `branch_id` — pass `branch_id` or `scope_branch_id` in the mutation, or use a branch-scoped role in the token.
- **Platform admin:** must pass `school_id` (and usually `branch_id`).

## Sex values (registration)

Use lowercase: `male` or `female`.

## Guardian relationship

`father`, `mother`, `grandfather`, `grandmother`, `aunt`, `uncle`, `legal_guardian`, `other`.
