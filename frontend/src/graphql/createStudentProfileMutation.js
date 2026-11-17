import { gql } from '@apollo/client';

/**
 * CreateStudentProfile — per 03-student-registration.md (Step 1):
 *
 *   mutation CreateStudentProfile {
 *     CreateStudentProfile(object: {
 *       branch_id: "..."
 *       first_name: "Selamawit"
 *       middle_name: "Abele"
 *       last_name: "Melaku"
 *       date_of_birth: "2007-10-30"
 *       sex: "female"
 *       email: "selamawit.student@parent.local"
 *       address: {
 *         address_line: "Bole"
 *         label: "home"
 *         latitude: 9.0
 *         longitude: 38.7
 *       }
 *       health: {
 *         allergies: "None"
 *       }
 *     }) {
 *       student_id
 *       user_id
 *       registration_id
 *       school_id
 *       branch_id
 *     }
 *   }
 *
 * Notes from contract:
 *   - Sex values: lowercase 'male' or 'female' (per 00-common.md)
 *   - Address and health are nested input objects
 *   - Requires registrar roles: school admin, branch admin, receptionist,
 *     finance, provider
 *   - Bearer access token attached automatically by Apollo auth link
 */
export const CREATE_STUDENT_PROFILE_MUTATION = gql`
  mutation CreateStudentProfile($object: CreateStudentProfileInput!) {
    CreateStudentProfile(object: $object) {
      student_id
      user_id
      registration_id
      school_id
      branch_id
    }
  }
`;
