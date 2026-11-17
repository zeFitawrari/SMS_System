# Courses — year setup (copy-paste)

**SCHOOL_OWNER** / **SCHOOL_ADMIN** omit `school_id`. It is taken from the access token. Platform admin passes `school_id` because that token has no school.

A course belongs to one academic year. Attach it to a grade, then assign a teacher on a section slot of that grade.

Each course in a section has one teacher. The same teacher can teach several courses in that section: call `ManageSectionCourseTeacher` once per course.

---

## ManageCourse — insert

```graphql
mutation InsertCourse {
  ManageCourse(object: {
    is_delete: false
    academic_year_id: "00000000-0000-0000-0000-000000000002"
    code: "MATH"
    name: "Mathematics"
    description: "Core mathematics"
    is_active: true
  }) {
    deleted
    id
    academic_year_id
    code
    name
    is_active
  }
}
```

## ManageCourse — update

```graphql
mutation UpdateCourse {
  ManageCourse(object: {
    is_delete: false
    id: "00000000-0000-0000-0000-000000000010"
    name: "Mathematics I"
    is_active: true
  }) {
    deleted
    id
    name
    is_active
  }
}
```

## ManageCourse — delete

Remove grade links first.

```graphql
mutation DeleteCourse {
  ManageCourse(object: {
    is_delete: true
    id: "00000000-0000-0000-0000-000000000010"
  }) {
    deleted
    id
  }
}
```

---

## ManageGradeCourse — insert

`course_id` must be a course for the same `academic_year_id`. Inactive courses cannot be attached.

```graphql
mutation AssignCourseToGrade {
  ManageGradeCourse(object: {
    is_delete: false
    academic_year_id: "00000000-0000-0000-0000-000000000002"
    grade_level_id: "00000000-0000-0000-0000-000000000003"
    course_id: "00000000-0000-0000-0000-000000000010"
    sort_order: 1
    is_required: true
  }) {
    deleted
    id
    grade_level_id
    course_id
    sort_order
    is_required
  }
}
```

## ManageGradeCourse — update

Year, grade, and course stay fixed.

```graphql
mutation UpdateGradeCourse {
  ManageGradeCourse(object: {
    is_delete: false
    id: "00000000-0000-0000-0000-000000000011"
    sort_order: 2
    is_required: false
  }) {
    deleted
    id
    sort_order
    is_required
  }
}
```

## ManageGradeCourse — delete

Remove section teachers for this link first.

```graphql
mutation DeleteGradeCourse {
  ManageGradeCourse(object: {
    is_delete: true
    id: "00000000-0000-0000-0000-000000000011"
  }) {
    deleted
    id
  }
}
```

---

## ManageSectionCourseTeacher — insert

`grade_section_slot_id` is the configured section (Grade 1 – A). `staff_profile_id` is the teacher. Repeat for each course that teacher takes in the section.

```graphql
mutation AssignTeacherToSectionCourse {
  ManageSectionCourseTeacher(object: {
    is_delete: false
    grade_section_slot_id: "00000000-0000-0000-0000-000000000012"
    grade_course_id: "00000000-0000-0000-0000-000000000011"
    staff_profile_id: "00000000-0000-0000-0000-000000000013"
  }) {
    deleted
    id
    branch_id
    grade_section_slot_id
    grade_course_id
    staff_profile_id
  }
}
```

## ManageSectionCourseTeacher — change teacher

```graphql
mutation ReassignSectionCourseTeacher {
  ManageSectionCourseTeacher(object: {
    is_delete: false
    id: "00000000-0000-0000-0000-000000000014"
    staff_profile_id: "00000000-0000-0000-0000-000000000015"
  }) {
    deleted
    id
    staff_profile_id
  }
}
```

## ManageSectionCourseTeacher — delete

```graphql
mutation RemoveSectionCourseTeacher {
  ManageSectionCourseTeacher(object: {
    is_delete: true
    id: "00000000-0000-0000-0000-000000000014"
  }) {
    deleted
    id
  }
}
```

---

## List (Hasura tables)

```graphql
query CourseSetup {
  courses(where: { academic_year_id: { _eq: "00000000-0000-0000-0000-000000000002" } }, order_by: { code: asc }) {
    id
    code
    name
    description
    is_active
    grade_courses(order_by: { sort_order: asc }) {
      id
      grade_level_id
      is_required
      sort_order
      grade_level { name code }
      section_course_teachers {
        id
        branch_id
        grade_section_slot_id
        staff_profile_id
        grade_section_slot { section_name }
        staff_profile { employee_code user { first_name last_name } }
      }
    }
  }
}
```

Teacher’s own classes:

```graphql
query MySectionCourses {
  section_course_teachers {
    id
    grade_section_slot { section_name branch_id }
    grade_course {
      grade_level { name }
      course { code name }
    }
  }
}
```
