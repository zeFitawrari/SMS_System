# Academic setup — Manage* actions + list queries

Requires **SCHOOL_OWNER** or **SCHOOL_ADMIN** (or provider). Set `school_id` if not in JWT.

---

## ManageAcademicYear — insert

```graphql
mutation InsertAcademicYear {
  ManageAcademicYear(object: {
    is_delete: false
    school_id: "00000000-0000-0000-0000-000000000001"
    name: "2026/2027"
    code: "2026-27"
    starts_on: "2026-09-01"
    ends_on: "2027-06-30"
    is_current: true
  }) {
    deleted
    id
    school_id
    code
    name
    is_current
  }
}
```

## ManageAcademicYear — update

```graphql
mutation UpdateAcademicYear {
  ManageAcademicYear(object: {
    is_delete: false
    school_id: "00000000-0000-0000-0000-000000000001"
    id: "00000000-0000-0000-0000-000000000002"
    is_current: true
  }) {
    deleted
    id
    is_current
  }
}
```

## ManageAcademicYear — delete

```graphql
mutation DeleteAcademicYear {
  ManageAcademicYear(object: {
    is_delete: true
    school_id: "00000000-0000-0000-0000-000000000001"
    id: "00000000-0000-0000-0000-000000000002"
  }) {
    deleted
    id
  }
}
```

---

## ManageGradeLevel — insert

```graphql
mutation InsertGradeLevel {
  ManageGradeLevel(object: {
    is_delete: false
    school_id: "00000000-0000-0000-0000-000000000001"
    name: "Grade 1"
    code: "G1"
    level_type: "GRADE"
    sort_order: 1
    is_active: true
  }) {
    deleted
    id
    code
    name
  }
}
```

## ManageGradeLevel — update

```graphql
mutation UpdateGradeLevel {
  ManageGradeLevel(object: {
    is_delete: false
    school_id: "00000000-0000-0000-0000-000000000001"
    id: "00000000-0000-0000-0000-000000000003"
    name: "Grade One"
  }) {
    deleted
    id
    name
  }
}
```

## ManageGradeLevel — delete

```graphql
mutation DeleteGradeLevel {
  ManageGradeLevel(object: {
    is_delete: true
    school_id: "00000000-0000-0000-0000-000000000001"
    id: "00000000-0000-0000-0000-000000000003"
  }) {
    deleted
    id
  }
}
```

---

## ManageGradeMonthlyFee — insert

```graphql
mutation InsertGradeFee {
  ManageGradeMonthlyFee(object: {
    is_delete: false
    school_id: "00000000-0000-0000-0000-000000000001"
    academic_year_id: "00000000-0000-0000-0000-000000000010"
    grade_level_id: "00000000-0000-0000-0000-000000000011"
    monthly_amount: 2500.00
  }) {
    deleted
    id
    monthly_amount
  }
}
```

## ManageGradeMonthlyFee — update

```graphql
mutation UpdateGradeFee {
  ManageGradeMonthlyFee(object: {
    is_delete: false
    school_id: "00000000-0000-0000-0000-000000000001"
    id: "00000000-0000-0000-0000-000000000012"
    monthly_amount: 2700.00
  }) {
    deleted
    id
    monthly_amount
  }
}
```

## ManageGradeMonthlyFee — delete

```graphql
mutation DeleteGradeFee {
  ManageGradeMonthlyFee(object: {
    is_delete: true
    school_id: "00000000-0000-0000-0000-000000000001"
    id: "00000000-0000-0000-0000-000000000012"
  }) {
    deleted
    id
  }
}
```

---

## ManageSectionSlot — insert

```graphql
mutation InsertSectionSlot {
  ManageSectionSlot(object: {
    is_delete: false
    school_id: "00000000-0000-0000-0000-000000000001"
    branch_id: "00000000-0000-0000-0000-000000000020"
    academic_year_id: "00000000-0000-0000-0000-000000000010"
    grade_level_id: "00000000-0000-0000-0000-000000000011"
    slot_index: 1
    section_name: "A"
    max_capacity: 40
  }) {
    deleted
    id
    section_name
    max_capacity
  }
}
```

## ManageSectionSlot — update

```graphql
mutation UpdateSectionSlot {
  ManageSectionSlot(object: {
    is_delete: false
    school_id: "00000000-0000-0000-0000-000000000001"
    id: "00000000-0000-0000-0000-000000000021"
    max_capacity: 45
  }) {
    deleted
    id
    max_capacity
  }
}
```

## ManageSectionSlot — delete

```graphql
mutation DeleteSectionSlot {
  ManageSectionSlot(object: {
    is_delete: true
    school_id: "00000000-0000-0000-0000-000000000001"
    id: "00000000-0000-0000-0000-000000000021"
  }) {
    deleted
    id
  }
}
```

---

## ManageSchoolRegistrationPackage — enable package

```graphql
mutation EnableRegistrationPackage {
  ManageSchoolRegistrationPackage(object: {
    is_delete: false
    school_id: "00000000-0000-0000-0000-000000000001"
    package_code: "QUARTERLY"
    is_enabled: true
  }) {
    deleted
    id
    package_code
    is_enabled
  }
}
```

## ManageSchoolRegistrationPackage — disable

```graphql
mutation DisableRegistrationPackage {
  ManageSchoolRegistrationPackage(object: {
    is_delete: false
    school_id: "00000000-0000-0000-0000-000000000001"
    id: "00000000-0000-0000-0000-000000000030"
    is_enabled: false
  }) {
    deleted
    id
    is_enabled
  }
}
```

## ManageSchoolRegistrationPackage — delete

```graphql
mutation DeleteSchoolPackage {
  ManageSchoolRegistrationPackage(object: {
    is_delete: true
    school_id: "00000000-0000-0000-0000-000000000001"
    id: "00000000-0000-0000-0000-000000000030"
  }) {
    deleted
    id
  }
}
```

---

## List queries (Hasura tables — for admin UI)

```graphql
query ListAcademicConfig {
  academic_years(order_by: { starts_on: desc }) {
    id
    name
    code
    is_current
    starts_on
    ends_on
  }
  grade_levels(where: { is_active: { _eq: true } }, order_by: { sort_order: asc }) {
    id
    name
    code
    level_type
  }
  grade_monthly_fees {
    id
    academic_year_id
    grade_level_id
    monthly_amount
  }
  grade_section_slots(order_by: { slot_index: asc }) {
    id
    branch_id
    academic_year_id
    grade_level_id
    section_name
    max_capacity
  }
  school_registration_packages(where: { is_enabled: { _eq: true } }) {
    id
    package_code
    is_enabled
  }
  registration_payment_packages(order_by: { sort_order: asc }) {
    code
    label
    duration_months
    discount_percent
  }
  branches(where: { status: { _eq: "active" } }) {
    id
    name
    code
    is_main
  }
}
```
