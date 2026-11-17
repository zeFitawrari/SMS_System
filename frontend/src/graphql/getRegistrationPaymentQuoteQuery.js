import { gql } from '@apollo/client';

/**
 * GetRegistrationPaymentQuote — per 03-student-registration.md (Step 3 of wizard):
 *
 *   query GetRegistrationPaymentQuote {
 *     GetRegistrationPaymentQuote(object: {
 *       academic_year_id: "00000000-0000-0000-0000-000000000010"
 *       grade_level_id: "00000000-0000-0000-0000-000000000011"
 *       branch_id: "00000000-0000-0000-0000-000000000020"
 *     }) {
 *       packages {
 *         package_code
 *         label
 *         duration_months
 *         discount_percent
 *         monthly_fee
 *         base_amount
 *         discount_amount
 *         final_amount
 *       }
 *     }
 *   }
 *
 * Notes from contract:
 *   - This is Step 3 of the registration wizard:
 *     CreateStudentProfile → SetStudentGuardians → GetRegistrationPaymentQuote → CompleteStudentRegistration
 *   - Requires academic_year_id, grade_level_id, branch_id
 *   - Returns array of packages with pricing details
 *   - Requires registrar roles: school admin, branch admin, receptionist,
 *     finance, provider
 *   - Bearer access token attached automatically by Apollo auth link
 */
export const GET_REGISTRATION_PAYMENT_QUOTE_QUERY = gql`
  query GetRegistrationPaymentQuote($object: GetRegistrationPaymentQuoteInput!) {
    GetRegistrationPaymentQuote(object: $object) {
      packages {
        package_code
        label
        duration_months
        discount_percent
        monthly_fee
        base_amount
        discount_amount
        final_amount
      }
    }
  }
`;
