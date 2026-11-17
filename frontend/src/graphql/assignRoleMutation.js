import { gql } from '@apollo/client';

/**
 * Assign role — per 01-auth.md (lines 200-236):
 *
 *   AssignRole (school scope):
 *     AssignRole(object: {
 *       user_id: "..."
 *       role: "RECEPTIONIST"
 *       scope_type: SCHOOL
 *     }) {
 *       status, user_id, role, scope_type, school_id
 *     }
 *
 *   AssignRole (branch scope):
 *     AssignRole(object: {
 *       user_id: "..."
 *       role: "BRANCH_ADMIN"
 *       scope_type: BRANCH
 *       branch_id: "..."
 *     }) {
 *       status, user_id, role, scope_type, branch_id, school_id
 *     }
 *
 * Requires Bearer access token (attached automatically by Apollo auth link).
 */
export const ASSIGN_ROLE_MUTATION = gql`
  mutation AssignRole($object: AssignRoleInput!) {
    AssignRole(object: $object) {
      status
      user_id
      role
      scope_type
      school_id
      branch_id
    }
  }
`;
