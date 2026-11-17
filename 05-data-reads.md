# Data reads — Hasura queries (not actions)

Use **Bearer token**. Row-level filters apply by role (`school_id`, `branch_id`).

---

## Branches & school

```graphql
query MyBranches {
  branches(where: { status: { _eq: "active" } }, order_by: { name: asc }) {
    id
    name
    code
    is_main
    timezone
  }
}
```

```graphql
query MySchool {
  schools(limit: 1) {
    id
    name
    slug
    status
  }
}
```

---

## Students list

```graphql
query StudentsList {
  students(limit: 50, order_by: { created_at: desc }) {
    id
    registration_id
    branch_id
    date_of_birth
    sex
    user {
      first_name
      middle_name
      last_name
      email
      phone
    }
    enrollments {
      id
      academic_year_id
      grade_level_id
      section_id
      enrolled_on
      status
    }
  }
}
```

## Single student

```graphql
query StudentById {
  student(id: "00000000-0000-0000-0000-000000000040") {
    registration_id
    date_of_birth
    sex
    user {
      first_name
      last_name
    }
    student_guardians {
      relationship
      is_primary_contact
      guardian {
        full_name
        phone
      }
    }
    health {
      allergies
      medical_conditions
    }
    address {
      address_line
      latitude
      longitude
    }
  }
}
```

---

## Enrollments

```graphql
query EnrollmentsForYear {
  enrollments(
    where: { academic_year_id: { _eq: "00000000-0000-0000-0000-000000000010" } }
    order_by: { enrolled_on: desc }
  ) {
    id
    student_id
    grade_level_id
    section_id
    enrolled_on
    status
  }
}
```

---

## Registration payments

```graphql
query RegistrationPayments {
  registration_payments(limit: 50, order_by: { paid_on: desc }) {
    id
    final_amount
    payment_method
    payment_status
    package_code
    paid_on
    student_id
    enrollment_id
  }
}
```

---

## Users directory (no password)

```graphql
query SchoolUsers {
  users(limit: 100, order_by: { last_name: asc }) {
    id
    first_name
    last_name
    email
    phone
    status
  }
}
```

---

## Role assignments (read)

```graphql
query RoleAssignments {
  role_assignments(where: { revoked_at: { _is_null: true } }) {
    id
    user_id
    role_id
    scope_type
    branch_id
    role {
      name
    }
  }
}
```
