import { gql } from '@apollo/client';

/**
 * Users directory — per 05-data-reads.md (lines 137-150):
 *
 *   query SchoolUsers {
 *     users(limit: 100, order_by: { last_name: asc }) {
 *       id, first_name, last_name, email, phone, status
 *     }
 *   }
 *
 * No passwords returned. Requires Bearer access token.
 */
export const LIST_USERS_QUERY = gql`
  query ListUsers {
    users(limit: 100, order_by: { last_name: asc }) {
      id
      first_name
      middle_name
      last_name
      email
      phone
      status
    }
  }
`;
