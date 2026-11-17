import { gql } from '@apollo/client';

/**
 * Query — list my sessions — per 01-auth.md:
 *   query ListMySessions {
 *     ListMySessions(object: { include_inactive: false }) {
 *       sessions {
 *         session_id
 *         created_at
 *         last_active_at
 *         expires_at
 *         is_active
 *         is_current
 *         user_agent
 *         client_ip
 *       }
 *     }
 *   }
 *
 * Requires Bearer access token (sent automatically by Apollo auth link).
 */
export const LIST_MY_SESSIONS_QUERY = gql`
  query ListMySessions($object: ListMySessionsInput!) {
    ListMySessions(object: $object) {
      sessions {
        session_id
        created_at
        last_active_at
        expires_at
        is_active
        is_current
        user_agent
        client_ip
      }
    }
  }
`;
