import { gql } from '@apollo/client';

/**
 * RegisterStudent — per 03-student-registration.md (All-in-one):
 *
 *   mutation RegisterStudent {
 *     RegisterStudent(object: {
 *       branch_id: "..."
 *       academic_year_id: "..."
 *       grade_level_id: "..."
 *       first_name: "Selamawit"
 *       last_name: "Melaku"
 *       date_of_birth: "2007-10-30"
 *       sex: "female"
 *       enrollment_date: "2026-10-30"
 *       guardians: [
 *         {
 *           full_name: "Abebe Kebede"
 *           relationship: "father"
 *           phone: "251911223344"
 *         }
 *       ]
 *       payment: {
 *         package_code: "QUARTERLY"
 *         payment_method: "CASH"
 *         payment_date: "2026-10-30"
 *       }
 *     }) {
 *       student_id
 *       user_id
 *       registration_id
 *       enrollment_id
 *       section_id
 *       payment_id
 *       final_amount
 *     }
 *   }
 *
 * Notes from contract:
 *   - All-in-one mutation combining CreateStudentProfile + SetStudentGuardians +
 *     CompleteStudentRegistration in a single call
 *   - sex values: lowercase 'male' or 'female' (per 00-common.md)
 *   - guardians is an array with full_name, relationship, phone
 *   - payment includes package_code, payment_method (CASH/BANK_TRANSFER), payment_date
 *   - Requires registrar roles: school admin, branch admin, receptionist,
 *     finance, provider
 *   - Bearer access token attached automatically by Apollo auth link
 */
export const REGISTER_STUDENT_MUTATION = gql`
  mutation RegisterStudent($object: RegisterStudentInput!) {
    RegisterStudent(object: $object) {
      student_id
      user_id
      registration_id
      enrollment_id
      section_id
      payment_id
      final_amount
    }
  }
`;
