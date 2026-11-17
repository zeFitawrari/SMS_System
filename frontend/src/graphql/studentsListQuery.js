import { gql } from '@apollo/client';

/**
 * StudentsList — per 05-data-reads.md (lines 38-60):
 *
 *   query StudentsList {
 *     students(limit: 50, order_by: { created_at: desc }) {
 *       id
 *       registration_id
 *       branch_id
 *       date_of_birth
 *       sex
 *       user {
 *         first_name
 *         middle_name
 *         last_name
 *         email
 *         phone
 *       }
 *       enrollments {
 *         id
 *         academic_year_id
 *         grade_level_id
 *         section_id
 *         enrolled_on
 *         status
 *       }
 *     }
 *   }
 *
 * Requires Bearer access token. Row-level filters apply by school_id/branch_id.
 */

export const STUDENTS_LIST_QUERY = gql`
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
`;
