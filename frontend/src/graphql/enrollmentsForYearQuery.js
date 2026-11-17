import { gql } from '@apollo/client';

/**
 * EnrollmentsForYear — per 05-data-reads.md (lines 101-113):
 *
 *   query EnrollmentsForYear {
 *     enrollments(
 *       where: { academic_year_id: { _eq: "00000000-0000-0000-0000-000000000010" } }
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
 * Requires Bearer access token. Row-level filters apply by school_id/branch_id.
 */

export const ENROLLMENTS_FOR_YEAR_QUERY = gql`
  query EnrollmentsForYear($academicYearId: uuid!) {
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
    }
  }
`;
