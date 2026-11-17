import { gql } from '@apollo/client';

/**
 * ManageSchoolRegistrationPackage — per 02-academic-setup.md:
 *
 *   Upsert/delete pattern:
   - is_delete: true + id     → Delete
   - is_delete: false + id    → Update (enable/disable via is_enabled)
   - is_delete: false         → Insert (enable package)
 *
 *   Enable package (insert or update):
 *     ManageSchoolRegistrationPackage(object: {
 *       is_delete: false
 *       school_id: "..."
 *       package_code: "QUARTERLY"
 *       is_enabled: true
 *     }) { deleted, id, package_code, is_enabled }
 *
 *   Disable package:
 *     ManageSchoolRegistrationPackage(object: {
 *       is_delete: false
 *       school_id: "..."
 *       id: "..."
 *       is_enabled: false
 *     }) { deleted, id, package_code, is_enabled }
 *
 *   Delete package:
 *     ManageSchoolRegistrationPackage(object: {
 *       is_delete: true
 *       school_id: "..."
 *       id: "..."
 *     }) { deleted, id }
 *
 * Requires SCHOOL_OWNER / SCHOOL_ADMIN (or provider).
 */
export const MANAGE_SCHOOL_REGISTRATION_PACKAGE_MUTATION = gql`
  mutation ManageSchoolRegistrationPackage(
    $object: ManageSchoolRegistrationPackageInput!
  ) {
    ManageSchoolRegistrationPackage(object: $object) {
      deleted
      id
      school_id
      package_code
      is_enabled
    }
  }
`;
