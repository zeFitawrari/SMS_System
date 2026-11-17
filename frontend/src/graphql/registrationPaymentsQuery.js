import { gql } from '@apollo/client';

/**
 * RegistrationPayments — per 05-data-reads.md (lines 121-133):
 *
 *   query RegistrationPayments {
 *     registration_payments(limit: 50, order_by: { paid_on: desc }) {
 *       id
 *       final_amount
 *       payment_method
 *       payment_status
 *       package_code
 *       paid_on
 *       student_id
 *       enrollment_id
 *     }
 *   }
 *
 * Requires Bearer access token. Row-level filters apply by school_id/branch_id.
 */

export const REGISTRATION_PAYMENTS_QUERY = gql`
  query RegistrationPayments {
    registration_payments(limit: 50, order_by: { paid_on: desc }) {
      id
      final_amount
      payment_method
      payment_status
      package_code
      paid_on
      student_id
      enrollment_id
    }
  }
`;
