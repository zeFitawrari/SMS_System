import { gql } from '@apollo/client';

export const LIST_MY_CONTEXTS = gql`
  query ListMyContexts {
    ListMyContexts {
      contexts {
        assignment_id
        role
        scope_type
        branch_id
        branch_name
        branch_code
      }
    }
  }
`;
