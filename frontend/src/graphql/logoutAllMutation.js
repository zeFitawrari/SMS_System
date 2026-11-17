import { gql } from '@apollo/client';

/**
 * Logout (all devices) — per 01-auth.md:
 *   "Logout (all devices — use Bearer only, empty body token)"
 *   mutation LogoutAll { Logout(object: {}) { status message } }
 *
 * Called with an empty object {}. The Bearer access token is sent
 * automatically by the Apollo auth link (apolloClient.js).
 */
export const LOGOUT_ALL_MUTATION = gql`
  mutation LogoutAll($object: LogoutInput!) {
    Logout(object: $object) {
      status
      message
    }
  }
`;
