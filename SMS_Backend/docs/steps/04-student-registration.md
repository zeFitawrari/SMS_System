# Step 04 — Student registration & enrollment

## Academic setup (one mutation per resource)

Every **Manage\*** action uses the same rule:

| `is_delete` | `id` | Result |
|-------------|------|--------|
| `true` | required | **Delete** |
| `false` | set | **Update** |
| `false` | omitted | **Insert** |

Actions: `ManageAcademicYear`, `ManageGradeLevel`, `ManageGradeMonthlyFee`, `ManageSectionSlot`, `ManageSchoolRegistrationPackage`.

Lists for UI: Hasura `academic_years`, `grade_levels`, `grade_section_slots`, `grade_monthly_fees`, `school_registration_packages`.

Then either:

- **Wizard (recommended):** `CreateStudentProfile` → `SetStudentGuardians` → `GetRegistrationPaymentQuote` → `CompleteStudentRegistration`
- **All-in-one:** `GetRegistrationPaymentQuote` → `RegisterStudent`

`school_id` comes from JWT for school staff (platform admins must pass `school_id`).

`branch_id` in JWT is set only for **branch-scoped** roles (e.g. `BRANCH_ADMIN`). **School-wide** roles (`SCHOOL_ADMIN`, `SCHOOL_OWNER`, …) have no branch claim — pass `branch_id` in the mutation, or the API auto-picks the branch when the school has exactly one active branch.

Optional later: `UpdateEnrollmentSection`.

## Examples

**Insert year**
```graphql
ManageAcademicYear(object: {
  is_delete: false
  school_id: "..."
  name: "2026/2027"
  code: "2026-27"
  starts_on: "2026-09-01"
  ends_on: "2027-06-30"
  is_current: true
}) { id code deleted }
```

**Update year**
```graphql
ManageAcademicYear(object: {
  is_delete: false
  school_id: "..."
  id: "<year-uuid>"
  is_current: true
}) { id is_current deleted }
```

**Delete year**
```graphql
ManageAcademicYear(object: {
  is_delete: true
  school_id: "..."
  id: "<year-uuid>"
}) { deleted id }
```

## Identity model

- **Common profile** (`identity.users`): `first_name`, `middle_name`, `last_name`, optional `email` / `phone`, `school_id`. `password_hash` is null until the person can log in.
- **Student-specific** (`student.students`): `registration_id`, `date_of_birth`, `sex`, `branch_id`, `user_id` (required).
- Registration creates both rows; assigns **STUDENT** role at branch scope. Without email/phone, a placeholder `@profile.internal` email is stored until portal invite.

Query names via GraphQL: `student { registration_id date_of_birth user { first_name last_name phone } }`.

## Apply

```bash
yarn migrate
yarn metadata
```
