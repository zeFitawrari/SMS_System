import { gql } from '@apollo/client';

/**
 * MySchool — per 05-data-reads.md (lines 22-30):
 *
 *   query MySchool {
 *     schools(limit: 1) {
 *       id
 *       name
 *       slug
 *       status
 *     }
 *   }
 *
 * Requires Bearer access token. Row-level filters apply by school_id/branch_id.
 */

export const MY_SCHOOL_QUERY = gql`
  query MySchool {
    schools(limit: 1) {
      id
      name
      slug
      status
    }
  }
`;
