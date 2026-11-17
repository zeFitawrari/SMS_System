# Student registration — actions (copy-paste)

Registrar roles: school admin, branch admin, receptionist, finance, provider.

Wizard: **CreateStudentProfile → SetStudentGuardians → GetRegistrationPaymentQuote → CompleteStudentRegistration**

---

## Query — registration payment quote

```graphql
query GetRegistrationPaymentQuote {
  GetRegistrationPaymentQuote(object: {
    academic_year_id: "00000000-0000-0000-0000-000000000010"
    grade_level_id: "00000000-0000-0000-0000-000000000011"
    branch_id: "00000000-0000-0000-0000-000000000020"
  }) {
    packages {
      package_code
      label
      duration_months
      discount_percent
      monthly_fee
      base_amount
      discount_amount
      final_amount
    }
  }
}
```

---

## Step 1 — CreateStudentProfile

```graphql
mutation CreateStudentProfile {
  CreateStudentProfile(object: {
    branch_id: "00000000-0000-0000-0000-000000000020"
    first_name: "Selamawit"
    middle_name: "Abele"
    last_name: "Melaku"
    date_of_birth: "2007-10-30"
    sex: "female"
    email: "selamawit.student@parent.local"
    address: {
      address_line: "Bole"
      label: "home"
      latitude: 9.0
      longitude: 38.7
    }
    health: {
      allergies: "None"
    }
  }) {
    student_id
    user_id
    registration_id
    school_id
    branch_id
  }
}
```

---

## Step 2 — SetStudentGuardians

```graphql
mutation SetStudentGuardians {
  SetStudentGuardians(object: {
    student_id: "00000000-0000-0000-0000-000000000040"
    guardians: [
      {
        full_name: "Abebe Kebede"
        relationship: "father"
        phone: "251911223344"
        is_primary_contact: true
      }
    ]
  }) {
    student_id
    guardian_count
    school_id
    branch_id
  }
}
```

---

## Step 4 — CompleteStudentRegistration

```graphql
mutation CompleteStudentRegistration {
  CompleteStudentRegistration(object: {
    student_id: "00000000-0000-0000-0000-000000000040"
    academic_year_id: "00000000-0000-0000-0000-000000000010"
    grade_level_id: "00000000-0000-0000-0000-000000000011"
    branch_id: "00000000-0000-0000-0000-000000000020"
    enrollment_date: "2026-10-30"
    payment: {
      package_code: "QUARTERLY"
      payment_method: "CASH"
      payment_date: "2026-10-30"
    }
  }) {
    registration_type
    student_id
    user_id
    registration_id
    enrollment_id
    section_id
    payment_id
    payment_status
    base_amount
    discount_amount
    final_amount
    package_code
  }
}
```

## Complete — bank transfer

```graphql
mutation CompleteStudentRegistrationTransfer {
  CompleteStudentRegistration(object: {
    student_id: "00000000-0000-0000-0000-000000000040"
    academic_year_id: "00000000-0000-0000-0000-000000000010"
    grade_level_id: "00000000-0000-0000-0000-000000000011"
    enrollment_date: "2026-10-30"
    payment: {
      package_code: "QUARTERLY"
      payment_method: "BANK_TRANSFER"
      transfer_reference: "TXN-12345"
      payment_date: "2026-10-30"
    }
  }) {
    enrollment_id
    payment_status
    final_amount
  }
}
```

## Promotion (existing student)

```graphql
mutation CompletePromotion {
  CompleteStudentRegistration(object: {
    registration_type: "PROMOTION"
    student_id: "00000000-0000-0000-0000-000000000040"
    academic_year_id: "00000000-0000-0000-0000-000000000050"
    grade_level_id: "00000000-0000-0000-0000-000000000051"
    branch_id: "00000000-0000-0000-0000-000000000020"
    enrollment_date: "2026-09-01"
    payment: {
      package_code: "TEN_MONTH"
      payment_method: "CASH"
      payment_date: "2026-09-01"
    }
  }) {
    registration_type
    enrollment_id
    section_id
    final_amount
  }
}
```

---

## All-in-one — RegisterStudent

```graphql
mutation RegisterStudent {
  RegisterStudent(object: {
    branch_id: "00000000-0000-0000-0000-000000000020"
    academic_year_id: "00000000-0000-0000-0000-000000000010"
    grade_level_id: "00000000-0000-0000-0000-000000000011"
    first_name: "Selamawit"
    last_name: "Melaku"
    date_of_birth: "2007-10-30"
    sex: "female"
    enrollment_date: "2026-10-30"
    guardians: [
      {
        full_name: "Abebe Kebede"
        relationship: "father"
        phone: "251911223344"
      }
    ]
    payment: {
      package_code: "QUARTERLY"
      payment_method: "CASH"
      payment_date: "2026-10-30"
    }
  }) {
    student_id
    user_id
    registration_id
    enrollment_id
    section_id
    payment_id
    final_amount
  }
}
```

---

## UpdateEnrollmentSection

```graphql
mutation UpdateEnrollmentSection {
  UpdateEnrollmentSection(object: {
    enrollment_id: "00000000-0000-0000-0000-000000000060"
    section_id: "00000000-0000-0000-0000-000000000061"
  }) {
    enrollment_id
    section_id
    warning
  }
}
```

## Unassign section

```graphql
mutation UnassignSection {
  UpdateEnrollmentSection(object: {
    enrollment_id: "00000000-0000-0000-0000-000000000060"
    unassign: true
  }) {
    enrollment_id
    section_id
  }
}
```
