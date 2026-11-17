import { gql } from '@apollo/client';

/**
 * Select context — per 01-auth.md (lines 111-145):
 *
 *   SelectContext (school-wide role):
 *     SelectContext(object: { role: "SCHOOL_ADMIN" }) {
 *       access_token, token, active_role, active_branch_id, school_id, session_id, roles
 *     }
 *
 *   SelectContext (branch-scoped role):
 *     SelectContext(object: { role: "TEACHER", branch_id: "..." }) {
 *       access_token, token, active_role, active_branch_id, school_id, roles
 *     }
 *
 * Requires Bearer access token (attached automatically by Apollo auth link).
 */
export const SELECT_CONTEXT_MUTATION = gql`
  mutation SelectContext($object: SelectContextInput!) {
    SelectContext(object: $object) {
      access_token
      token
      active_role
      active_branch_id
      school_id
      session_id
      roles
    }
  }
`;
