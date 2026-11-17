# Staff & teachers — ManageUser (copy-paste)

**SCHOOL_OWNER** / **SCHOOL_ADMIN** (and provider).

Load `role_id` first:

```graphql
query StaffRoleIds {
  roles(
    where: {
      school_id: { _is_null: true }
      name: { _in: ["TEACHER", "LIBRARIAN", "RECEPTIONIST", "FINANCE", "SCHOOL_STAFF", "BRANCH_ADMIN"] }
    }
  ) {
    id
    name
  }
}
```

Teacher `education_level`: `CERTIFICATE`, `DIPLOMA`, `BACHELOR`, `MASTER`, `DOCTORATE`, `OTHER`.  
`employment_type`: `FULL_TIME`, `PART_TIME`, `CONTRACT`.

---

## ManageUser — create teacher

```graphql
mutation CreateTeacher {
  ManageUser(object: {
    is_delete: false
    role_id: "00000000-0000-0000-0000-000000000070"
    scope_type: "BRANCH"
    scope_branch_id: "00000000-0000-0000-0000-000000000020"
    first_name: "Helen"
    middle_name: "A"
    last_name: "Tadesse"
    email: "helen.teacher@school.local"
    phone: "251922334455"
    password: "ChangeMeNow123!"
    employee_code: "T-001"
    job_title: "Mathematics Teacher"
    hired_on: "2026-09-01"
    teacher: {
      education_level: "BACHELOR"
      field_of_study: "Mathematics"
      academic_background: "BSc Mathematics, Addis Ababa University"
      years_of_experience: 5
      teaching_license_number: "LIC-123"
      employment_type: "FULL_TIME"
    }
  }) {
    deleted
    id
    user_id
    role_id
    scope_type
    scope_branch_id
    first_name
    last_name
    email
    teacher {
      education_level
      field_of_study
      years_of_experience
    }
  }
}
```

## ManageUser — create receptionist (branch)

```graphql
mutation CreateReceptionist {
  ManageUser(object: {
    is_delete: false
    role_id: "00000000-0000-0000-0000-000000000071"
    scope_type: "BRANCH"
    scope_branch_id: "00000000-0000-0000-0000-000000000020"
    first_name: "Sara"
    last_name: "Hailu"
    email: "sara@school.local"
    password: "ChangeMeNow123!"
    employee_code: "R-001"
  }) {
    id
    user_id
    role_id
  }
}
```

## ManageUser — create finance (school scope)

```graphql
mutation CreateFinance {
  ManageUser(object: {
    is_delete: false
    role_id: "00000000-0000-0000-0000-000000000072"
    scope_type: "SCHOOL"
    first_name: "Dawit"
    last_name: "Mekonnen"
    email: "finance@school.local"
    password: "ChangeMeNow123!"
  }) {
    id
    user_id
    role_id
    scope_type
  }
}
```

---

## ManageUser — update profile / teacher details

```graphql
mutation UpdateTeacher {
  ManageUser(object: {
    is_delete: false
    id: "00000000-0000-0000-0000-000000000080"
    first_name: "Helen"
    last_name: "Tadesse-Gebre"
    teacher: {
      field_of_study: "Mathematics and Physics"
      years_of_experience: 6
    }
  }) {
    id
    user_id
    teacher {
      field_of_study
      years_of_experience
    }
  }
}
```

## ManageUser — change role

```graphql
mutation ChangeStaffRole {
  ManageUser(object: {
    is_delete: false
    id: "00000000-0000-0000-0000-000000000080"
    role_id: "00000000-0000-0000-0000-000000000071"
    scope_type: "BRANCH"
    scope_branch_id: "00000000-0000-0000-0000-000000000020"
  }) {
    id
    role_id
    scope_type
  }
}
```

## ManageUser — reset password

```graphql
mutation ResetStaffPassword {
  ManageUser(object: {
    is_delete: false
    id: "00000000-0000-0000-0000-000000000080"
    password: "NewSecurePassword123!"
  }) {
    id
    user_id
  }
}
```

## ManageUser — deactivate / delete staff

```graphql
mutation DeleteStaff {
  ManageUser(object: {
    is_delete: true
    id: "00000000-0000-0000-0000-000000000080"
  }) {
    deleted
    id
    user_id
    school_id
  }
}
```

---

## List staff (Hasura)

```graphql
query ListStaff {
  staff_profiles(order_by: { created_at: desc }) {
    id
    employee_code
    job_title
    hired_on
    branch_id
    user {
      id
      first_name
      middle_name
      last_name
      email
      phone
      status
    }
    teacher_profile {
      education_level
      field_of_study
      years_of_experience
      employment_type
    }
  }
}
```
