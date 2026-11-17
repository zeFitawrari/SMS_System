import { gql } from '@apollo/client';

/**
 * MyBranches — per 05-data-reads.md (lines 10-18):
 *
 *   query MyBranches {
 *     branches(where: { status: { _eq: "active" } }, order_by: { name: asc }) {
 *       id
 *       name
 *       code
 *       is_main
 *       timezone
 *     }
 *   }
 *
 * Requires Bearer access token. Row-level filters apply by school_id/branch_id.
 */

export const MY_BRANCHES_QUERY = gql`
  query MyBranches {
    branches(where: { status: { _eq: "active" } }, order_by: { name: asc }) {
      id
      name
      code
      is_main
      timezone
    }
  }
`;
