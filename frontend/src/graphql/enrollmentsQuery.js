import { gql } from '@apollo/client';

/**
 * Enrollments query — per 05-data-reads.md:
 *
 *   query EnrollmentsForYear {
 *     enrollments(
 *       where: { academic_year_id: { _eq: "..." } }
 *       order_by: { enrolled_on: desc }
 *     ) {
 *       id
 *       student_id
 *       grade_level_id
 *       section_id
 *       enrolled_on
 *       status
 *     }
 *   }
 *
 *   Also from StudentsList (for student details):
 *     students {
 *       id
 *       registration_id
 *       user { first_name, middle_name, last_name, email, phone }
 *       enrollments { id, academic_year_id, grade_level_id, section_id, enrolled_on, status }
 *     }
 *
 * Requires Bearer access token. Row-level filters apply by school_id/branch_id.
 */

export const LIST_ENROLLMENTS_QUERY = gql`
  query ListEnrollments($academicYearId: uuid!) {
    enrollments(
      where: { academic_year_id: { _eq: $academicYearId } }
      order_by: { enrolled_on: desc }
    ) {
      id
      student_id
      grade_level_id
      section_id
      enrolled_on
      status
      student {
        id
        registration_id
        user {
          first_name
          middle_name
          last_name
          email
          phone
        }
      }
    }
  }
`;
