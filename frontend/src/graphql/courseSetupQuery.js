import { gql } from '@apollo/client';

/**
 * CourseSetup — per 06-courses.md (List, Hasura tables):
 *
 *   query CourseSetup {
 *     courses(where: { academic_year_id: { _eq: "..." } }, order_by: { code: asc }) {
 *       id, code, name, description, is_active
 *       grade_courses(order_by: { sort_order: asc }) {
 *         id, grade_level_id, is_required, sort_order
 *         grade_level { name code }
 *         section_course_teachers {
 *           id, branch_id, grade_section_slot_id, staff_profile_id
 *           grade_section_slot { section_name }
 *           staff_profile { employee_code user { first_name last_name } }
 *         }
 *       }
 *     }
 *   }
 *
 * Requires Bearer access token. Row-level filters apply by role.
 */
export const COURSE_SETUP_QUERY = gql`
  query CourseSetup($academicYearId: uuid!) {
    courses(
      where: { academic_year_id: { _eq: $academicYearId } }
      order_by: { code: asc }
    ) {
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
        grade_level {
          name
          code
        }
        section_course_teachers {
          id
          branch_id
          grade_section_slot_id
          staff_profile_id
          grade_section_slot {
            section_name
          }
          staff_profile {
            employee_code
            user {
              first_name
              last_name
            }
          }
        }
      }
    }
  }
`;
