import { gql } from '@apollo/client';

/**
 * Staff directory list — per 04-staff.md (lines 191-218):
 *
 *   query ListStaff {
 *     staff_profiles(order_by: { created_at: desc }) {
 *       id, employee_code, job_title, hired_on, branch_id,
 *       user { id, first_name, middle_name, last_name, email, phone, status },
 *       teacher_profile { education_level, field_of_study, years_of_experience, employment_type }
 *     }
 *   }
 *
 * Requires Bearer access token. Row-level filters apply by role (school_id).
 */
export const LIST_STAFF_QUERY = gql`
  query ListStaff {
    staff_profiles(order_by: { created_at: desc }) {
      id
      employee_code
      job_title
      hired_on
      branch_id
      school_id
      user {
        id
        first_name
        middle_name
        last_name
        email
        phone
        status
      }
      teacher_profile {
        education_level
        field_of_study
        years_of_experience
        employment_type
      }
    }
  }
`;
