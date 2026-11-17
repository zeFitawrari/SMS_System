import { gql } from '@apollo/client';

/**
 * Revoke all other sessions — per 01-auth.md:
 *   mutation RevokeOtherSessions {
 *     RevokeOtherSessions(object: { current_session_id: "..." }) {
 *       status
 *       message
 *       revoked_count
 *     }
 *   }
 *
 * Requires Bearer access token (sent automatically by Apollo auth link).
 */
export const REVOKE_OTHER_SESSIONS_MUTATION = gql`
  mutation RevokeOtherSessions($object: RevokeOtherSessionsInput!) {
    RevokeOtherSessions(object: $object) {
      status
      message
      revoked_count
    }
  }
`;
