import { gql } from '@apollo/client';

export const LIST_ACADEMIC_YEARS = gql`
  query ListAcademicYears($schoolId: uuid!) {
    academic_years(
      where: { school_id: { _eq: $schoolId } }
      order_by: { starts_on: desc }
    ) {
      id
      name
      code
      starts_on
      ends_on
      is_current
    }
  }
`;

export const LIST_GRADE_LEVELS = gql`
  query ListGradeLevels($schoolId: uuid!) {
    grade_levels(
      where: { school_id: { _eq: $schoolId }, is_active: { _eq: true } }
      order_by: { sort_order: asc }
    ) {
      id
      name
      code
      level_type
      sort_order
    }
  }
`;

export const LIST_BRANCHES = gql`
  query ListBranches($schoolId: uuid!) {
    branches(
      where: { school_id: { _eq: $schoolId }, status: { _eq: "active" } }
      order_by: [{ is_main: desc }, { name: asc }]
    ) {
      id
      code
      name
      is_main
    }
  }
`;

export const LIST_SECTIONS = gql`
  query ListSections(
    $schoolId: uuid!
    $branchId: uuid!
    $academicYearId: uuid!
    $gradeLevelId: uuid!
  ) {
    grade_section_slots(
      where: {
        school_id: { _eq: $schoolId }
        branch_id: { _eq: $branchId }
        academic_year_id: { _eq: $academicYearId }
        grade_level_id: { _eq: $gradeLevelId }
      }
      order_by: { slot_index: asc }
    ) {
      id
      section_name
      slot_index
      max_capacity
    }
  }
`;
