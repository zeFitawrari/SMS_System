import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation Login($object: LoginInput!) {
    Login(object: $object) {
      id
      access_token
      token
      session_id
      session_token
      email
      phone
      first_name
      last_name
      school_id
      roles
      active_role
      active_branch_id
    }
  }
`;
