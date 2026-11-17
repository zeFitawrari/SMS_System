import { gql } from '@apollo/client';

/**
 * Revoke one session — per 01-auth.md:
 *   mutation RevokeSession {
 *     RevokeSession(object: { session_id: "..." }) {
 *       status
 *       message
 *       revoked_session_id
 *     }
 *   }
 *
 * Requires Bearer access token (sent automatically by Apollo auth link).
 */
export const REVOKE_SESSION_MUTATION = gql`
  mutation RevokeSession($object: RevokeSessionInput!) {
    RevokeSession(object: $object) {
      status
      message
      revoked_session_id
    }
  }
`;
