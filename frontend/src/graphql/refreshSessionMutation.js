import { gql } from '@apollo/client';

/**
 * Refresh session — per 01-auth.md (lines 50-66):
 *
 *   mutation Refresh {
 *     RefreshSession(object: {
 *       session_token: "your-session-token"
 *     }) {
 *       access_token
 *       token
 *       session_id
 *       session_token
 *       roles
 *       active_role
 *       active_branch_id
 *     }
 *   }
 *
 * No Bearer token required (Hasura role: anonymous).
 * Used for silent token rotation on app load and on JWT expiry.
 */
export const REFRESH_SESSION_MUTATION = gql`
  mutation RefreshSession($object: RefreshSessionInput!) {
    RefreshSession(object: $object) {
      access_token
      token
      session_id
      session_token
      roles
      active_role
      active_branch_id
    }
  }
`;
