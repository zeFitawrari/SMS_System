import { gql } from '@apollo/client';

/**
 * Available roles — per 04-staff.md (lines 8-18):
 *
 *   query StaffRoleIds {
 *     roles(
 *       where: {
 *         school_id: { _is_null: true }
 *         name: { _in: ["TEACHER", "LIBRARIAN", "RECEPTIONIST", "FINANCE", "SCHOOL_STAFF", "BRANCH_ADMIN"] }
 *       }
 *     ) {
 *       id, name
 *     }
 *   }
 *
 * Requires Bearer access token.
 */
export const LIST_AVAILABLE_ROLES_QUERY = gql`
  query ListAvailableRoles {
    roles(
      where: {
        school_id: { _is_null: true }
        name: {
          _in: [
            "TEACHER",
            "LIBRARIAN",
            "RECEPTIONIST",
            "FINANCE",
            "SCHOOL_STAFF",
            "BRANCH_ADMIN",
          ]
        }
      }
    ) {
      id
      name
    }
  }
`;
