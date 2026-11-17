import { gql } from '@apollo/client';

export const LOGOUT_MUTATION = gql`
  mutation Logout($object: LogoutInput!) {
    Logout(object: $object) {
      status
      message
    }
  }
`;
