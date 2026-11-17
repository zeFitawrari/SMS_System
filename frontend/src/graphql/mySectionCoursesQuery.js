import { gql } from '@apollo/client';

/**
 * MySectionCourses — per 06-courses.md (Teacher's own classes):
 *
 *   query MySectionCourses {
 *     section_course_teachers {
 *       id
 *       grade_section_slot { section_name branch_id }
 *       grade_course {
 *         grade_level { name }
 *         course { code name }
 *       }
 *     }
 *   }
 *
 * Requires Bearer access token. Row-level filters apply by role (teacher sees
 * only their own assignments).
 */
export const MY_SECTION_COURSES_QUERY = gql`
  query MySectionCourses {
    section_course_teachers {
      id
      grade_section_slot {
        section_name
        branch_id
      }
      grade_course {
        grade_level {
          name
        }
        course {
          code
          name
        }
      }
    }
  }
`;
