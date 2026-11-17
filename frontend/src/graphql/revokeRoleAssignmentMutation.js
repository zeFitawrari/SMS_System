import { gql } from '@apollo/client';

/**
 * Revoke role assignment — per 01-auth.md (lines 238-251):
 *
 *   mutation RevokeRoleAssignment {
 *     RevokeRoleAssignment(object: {
 *       assignment_id: "00000000-0000-0000-0000-000000000001"
 *     }) {
 *       status
 *       message
 *       assignment_id
 *       user_id
 *     }
 *   }
 *
 * Requires Bearer access token (attached automatically by Apollo auth link).
 */
export const REVOKE_ROLE_ASSIGNMENT_MUTATION = gql`
  mutation RevokeRoleAssignment($object: RevokeRoleAssignmentInput!) {
    RevokeRoleAssignment(object: $object) {
      status
      message
      assignment_id
      user_id
    }
  }
`;
