import { gql } from '@apollo/client';

/**
 * RoleAssignments — per 05-data-reads.md (lines 157-168):
 *
 *   query RoleAssignments {
 *     role_assignments(where: { revoked_at: { _is_null: true } }) {
 *       id
 *       user_id
 *       role_id
 *       scope_type
 *       branch_id
 *       role {
 *         name
 *       }
 *     }
 *   }
 *
 * Requires Bearer access token. Row-level filters apply by school_id/branch_id.
 */

export const LIST_ROLE_ASSIGNMENTS_QUERY = gql`
  query RoleAssignments {
    role_assignments(where: { revoked_at: { _is_null: true } }) {
      id
      user_id
      role_id
      scope_type
      branch_id
      role {
        name
      }
    }
  }
`;
