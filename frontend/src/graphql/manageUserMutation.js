import { gql } from '@apollo/client';

/**
 * ManageUser — per 04-staff.md:
 *
 *   Upsert/delete pattern (from 00-common.md):
   - is_delete: true + id     → Delete / deactivate
   - is_delete: false + id    → Update
   - is_delete: false         → Insert (create)
 *
 *   Create teacher:
 *     ManageUser(object: {
 *       is_delete: false
 *       role_id: "..."
 *       scope_type: "BRANCH"
 *       scope_branch_id: "..."
 *       first_name: "Helen"
 *       middle_name: "A"
 *       last_name: "Tadesse"
 *       email: "helen.teacher@school.local"
 *       phone: "251922334455"
 *       password: "ChangeMeNow123!"
 *       employee_code: "T-001"
 *       job_title: "Mathematics Teacher"
 *       hired_on: "2026-09-01"
 *       teacher: {
 *         education_level: "BACHELOR"
 *         field_of_study: "Mathematics"
 *         academic_background: "BSc Mathematics, Addis Ababa University"
 *         years_of_experience: 5
 *         teaching_license_number: "LIC-123"
 *         employment_type: "FULL_TIME"
 *       }
 *     }) { deleted, id, user_id, role_id, scope_type, scope_branch_id,
 *          first_name, last_name, email, teacher { education_level, field_of_study, years_of_experience } }
 *
 *   Update:
 *     ManageUser(object: {
 *       is_delete: false
 *       id: "..."
 *       first_name: "Helen"
 *       teacher: { field_of_study: "Mathematics and Physics", years_of_experience: 6 }
 *     }) { id, user_id, teacher { field_of_study, years_of_experience } }
 *
 *   Delete:
 *     ManageUser(object: {
 *       is_delete: true
 *       id: "..."
 *     }) { deleted, id, user_id, school_id }
 *
 * Requires SCHOOL_OWNER / SCHOOL_ADMIN (or provider).
 * Bearer access token attached automatically by Apollo auth link.
 */
export const MANAGE_USER_MUTATION = gql`
  mutation ManageUser($object: ManageUserInput!) {
    ManageUser(object: $object) {
      deleted
      id
      user_id
      role_id
      scope_type
      scope_branch_id
      first_name
      middle_name
      last_name
      email
      phone
      employee_code
      job_title
      hired_on
      teacher {
        education_level
        field_of_study
        academic_background
        years_of_experience
        teaching_license_number
        employment_type
      }
    }
  }
`;
