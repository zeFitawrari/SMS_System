import { gql } from '@apollo/client';

/**
 * SetStudentGuardians — per 03-student-registration.md (Step 2):
 *
 *   mutation SetStudentGuardians {
 *     SetStudentGuardians(object: {
 *       student_id: "00000000-0000-0000-0000-000000000040"
 *       guardians: [
 *         {
 *           full_name: "Abebe Kebede"
 *           relationship: "father"
 *           phone: "251911223344"
 *           is_primary_contact: true
 *         }
 *       ]
 *     }) {
 *       student_id
 *       guardian_count
 *       school_id
 *       branch_id
 *     }
 *   }
 *
 * Notes from contract:
 *   - guardians is an array of guardian objects
 *   - Each guardian has: full_name, relationship, phone, is_primary_contact
 *   - Relationship values: father, mother, grandfather, grandmother,
 *     aunt, uncle, legal_guardian, other (per 00-common.md)
 *   - is_primary_contact: boolean
 *   - Requires registrar roles: school admin, branch admin, receptionist,
 *     finance, provider
 *   - Bearer access token attached automatically by Apollo auth link
 */
export const SET_STUDENT_GUARDIANS_MUTATION = gql`
  mutation SetStudentGuardians($object: SetStudentGuardiansInput!) {
    SetStudentGuardians(object: $object) {
      student_id
      guardian_count
      school_id
      branch_id
    }
  }
`;
