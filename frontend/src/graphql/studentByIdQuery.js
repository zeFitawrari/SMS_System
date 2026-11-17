import { gql } from '@apollo/client';

/**
 * StudentById — per 05-data-reads.md (lines 67-93):
 *
 *   query StudentById {
 *     student(id: "00000000-0000-0000-0000-000000000040") {
 *       registration_id
 *       date_of_birth
 *       sex
 *       user {
 *         first_name
 *         last_name
 *       }
 *       student_guardians {
 *         relationship
 *         is_primary_contact
 *         guardian {
 *           full_name
 *           phone
 *         }
 *       }
 *       health {
 *         allergies
 *         medical_conditions
 *       }
 *       address {
 *         address_line
 *         latitude
 *         longitude
 *       }
 *     }
 *   }
 *
 * Requires Bearer access token. Row-level filters apply by school_id/branch_id.
 */

export const STUDENT_BY_ID_QUERY = gql`
  query StudentById($id: uuid!) {
    student(id: $id) {
      registration_id
      date_of_birth
      sex
      user {
        first_name
        last_name
      }
      student_guardians {
        relationship
        is_primary_contact
        guardian {
          full_name
          phone
        }
      }
      health {
        allergies
        medical_conditions
      }
      address {
        address_line
        latitude
        longitude
      }
    }
  }
`;
