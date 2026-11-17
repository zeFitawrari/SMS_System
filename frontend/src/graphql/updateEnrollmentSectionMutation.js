import { gql } from '@apollo/client';

/**
 * UpdateEnrollmentSection — per 03-student-registration.md:
 *
 *   Assign/change section:
 *     mutation UpdateEnrollmentSection {
 *       UpdateEnrollmentSection(object: {
 *         enrollment_id: "..."
 *         section_id: "..."
 *       }) {
 *         enrollment_id
 *         section_id
 *         warning
 *       }
 *     }
 *
 *   Unassign section:
 *     mutation UnassignSection {
 *       UpdateEnrollmentSection(object: {
 *         enrollment_id: "..."
 *         unassign: true
 *       }) {
 *         enrollment_id
 *         section_id
 *       }
 *     }
 *
 * Notes from contract:
 *   - Uses same mutation for both assign and unassign
 *   - unassign: true removes the section assignment
 *   - warning field may be returned (e.g., capacity warning)
 *   - Requires registrar roles: school admin, branch admin, receptionist,
 *     finance, provider
 *   - Bearer access token attached automatically by Apollo auth link
 */
export const UPDATE_ENROLLMENT_SECTION_MUTATION = gql`
  mutation UpdateEnrollmentSection($object: UpdateEnrollmentSectionInput!) {
    UpdateEnrollmentSection(object: $object) {
      enrollment_id
      section_id
      warning
    }
  }
`;
