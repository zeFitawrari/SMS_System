import { gql } from '@apollo/client';

/**
 * Register school — per 01-auth.md (lines 255-277):
 *
 *   mutation RegisterSchool {
 *     RegisterSchool(object: {
 *       school_name: "Demo School"
 *       school_address: "Bole"
 *       admin_email: "admin@demo.local"
 *       admin_phone: "251911223344"
 *       admin_password: "ChangeMeNow123!"
 *       admin_first_name: "Admin"
 *       admin_last_name: "User"
 *     }) {
 *       school_id
 *       main_branch_id
 *       admin_id
 *       access_token
 *       token
 *       session_id
 *       session_token
 *     }
 *   }
 *
 * Provider admin only. Requires Bearer access token
 * (attached automatically by Apollo auth link).
 */
export const REGISTER_SCHOOL_MUTATION = gql`
  mutation RegisterSchool($object: RegisterSchoolInput!) {
    RegisterSchool(object: $object) {
      school_id
      main_branch_id
      admin_id
      access_token
      token
      session_id
      session_token
    }
  }
`;
