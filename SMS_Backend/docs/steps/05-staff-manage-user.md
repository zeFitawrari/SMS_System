# Step 05 — Staff / teacher provisioning (`ManageUser`)

Same **Manage\*** pattern as academic config:

| `is_delete` | `id` | Result |
|-------------|------|--------|
| `true` | required (`staff_profiles.id`) | Deactivate user, revoke staff roles, delete profile |
| `false` | set | Update user + profile (+ optional role change) |
| `false` | omitted | Create user + profile + role assignment |

## Identity split

- **`identity.users`**: names, email, phone, optional `password`, `school_id`
- **`staff.staff_profiles`**: `employee_code`, `job_title`, `hired_on`, optional home `branch_id`
- **`teacher.teacher_profiles`**: academic fields when role is TEACHER (1:1 with `staff_profiles`)
- **`identity.role_assignments`**: one primary staff role per create

### Teacher-only fields (`teacher` on `ManageUser`)

| Field | Notes |
|-------|--------|
| `education_level` | `CERTIFICATE`, `DIPLOMA`, `BACHELOR`, `MASTER`, `DOCTORATE`, `OTHER` — **required on create** for TEACHER |
| `field_of_study` | e.g. Mathematics |
| `academic_background` | free text |
| `years_of_experience` | integer ≥ 0 |
| `teaching_license_number` | optional |
| `employment_type` | `FULL_TIME`, `PART_TIME`, `CONTRACT` |

## Roles

Pass **`role_id`** from the global catalog (`identity.roles` where `school_id` is null).  
Allowed names: `TEACHER`, `LIBRARIAN`, `RECEPTIONIST`, `FINANCE`, `SCHOOL_STAFF`, `BRANCH_ADMIN`.

```graphql
query {
  roles(where: { school_id: { _is_null: true }, name: { _in: ["TEACHER","LIBRARIAN","RECEPTIONIST","FINANCE","SCHOOL_STAFF","BRANCH_ADMIN"] } }) {
    id
    name
  }
}
```

Use **`scope_type`**: `BRANCH` (default for teachers) or `SCHOOL` (e.g. FINANCE).  
For branch scope, pass **`scope_branch_id`** or **`branch_id`**.

## Example — create teacher

```graphql
mutation {
  ManageUser(object: {
    is_delete: false
    role_id: "<teacher-role-uuid>"
    scope_type: "BRANCH"
    scope_branch_id: "<branch-uuid>"
    first_name: "Helen"
    last_name: "Tadesse"
    email: "helen@school.local"
    password: "ChangeMeNow123!"
    employee_code: "T-001"
    job_title: "Math Teacher"
    teacher: {
      education_level: "BACHELOR"
      field_of_study: "Mathematics"
      academic_background: "BSc Addis Ababa University"
      years_of_experience: 5
      employment_type: "FULL_TIME"
    }
  }) {
    id
    user_id
    role_id
    teacher { education_level field_of_study }
  }
}
```

List teachers: `staff_profiles { employee_code user { first_name } teacher_profile { education_level field_of_study } }`.

```bash
yarn migrate
yarn metadata
```
