import { gql } from '@apollo/client';

/**
 * CompleteStudentRegistration — per 03-student-registration.md (Step 4):
 *
 *   Standard registration:
 *     mutation CompleteStudentRegistration {
 *       CompleteStudentRegistration(object: {
 *         student_id: "..."
 *         academic_year_id: "..."
 *         grade_level_id: "..."
 *         branch_id: "..."
 *         enrollment_date: "2026-10-30"
 *         payment: {
 *           package_code: "QUARTERLY"
 *           payment_method: "CASH"
 *           payment_date: "2026-10-30"
 *         }
 *       }) {
 *         registration_type
 *         student_id
 *         user_id
 *         registration_id
 *         enrollment_id
 *         section_id
 *         payment_id
 *         payment_status
 *         base_amount
 *         discount_amount
 *         final_amount
 *         package_code
 *       }
 *     }
 *
 *   Bank transfer (payment_method: BANK_TRANSFER requires transfer_reference):
 *     CompleteStudentRegistration(object: {
 *       student_id: "..."
 *       academic_year_id: "..."
 *       grade_level_id: "..."
 *       branch_id: "..."
 *       enrollment_date: "2026-10-30"
 *       payment: {
 *         package_code: "QUARTERLY"
 *         payment_method: "BANK_TRANSFER"
 *         transfer_reference: "TXN-12345"
 *         payment_date: "2026-10-30"
 *       }
 *     }) { enrollment_id, payment_status, final_amount }
 *
 *   Promotion (registration_type: "PROMOTION" for existing students):
 *     CompleteStudentRegistration(object: {
 *       registration_type: "PROMOTION"
 *       student_id: "..."
 *       academic_year_id: "..."
 *       grade_level_id: "..."
 *       branch_id: "..."
 *       enrollment_date: "2026-09-01"
 *       payment: {
 *         package_code: "TEN_MONTH"
 *         payment_method: "CASH"
 *         payment_date: "2026-09-01"
 *       }
 *     }) { registration_type, enrollment_id, section_id, final_amount }
 *
 * Notes from contract:
 *   - payment_method: CASH or BANK_TRANSFER
 *   - transfer_reference is required when payment_method is BANK_TRANSFER
 *   - registration_type is optional (use "PROMOTION" for student promotion)
 *   - Requires registrar roles: school admin, branch admin, receptionist,
 *     finance, provider
 *   - Bearer access token attached automatically by Apollo auth link
 */
export const COMPLETE_STUDENT_REGISTRATION_MUTATION = gql`
  mutation CompleteStudentRegistration($object: CompleteStudentRegistrationInput!) {
    CompleteStudentRegistration(object: $object) {
      registration_type
      student_id
      user_id
      registration_id
      enrollment_id
      section_id
      payment_id
      payment_status
      base_amount
      discount_amount
      final_amount
      package_code
    }
  }
`;
