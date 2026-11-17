import { gql } from '@apollo/client';

/**
 * ManageAcademicYear — per 02-academic-setup.md:
 *
 *   Upsert/delete pattern (from 00-common.md):
   - is_delete: true + id     → Delete
   - is_delete: false + id    → Update
   - is_delete: false         → Insert
 *
 *   Insert:
 *     ManageAcademicYear(object: {
 *       is_delete: false
 *       school_id: "..."
 *       name: "2026/2027"
 *       code: "2026-27"
 *       starts_on: "2026-09-01"
 *       ends_on: "2027-06-30"
 *       is_current: true
 *     }) { deleted, id, school_id, code, name, is_current }
 *
 *   Update:
 *     ManageAcademicYear(object: {
 *       is_delete: false
 *       school_id: "..."
 *       id: "..."
 *       is_current: true
 *     }) { deleted, id, is_current }
 *
 *   Delete:
 *     ManageAcademicYear(object: {
 *       is_delete: true
 *       school_id: "..."
 *       id: "..."
 *     }) { deleted, id }
 *
 * Requires SCHOOL_OWNER / SCHOOL_ADMIN (or provider).
 * Bearer access token attached automatically by Apollo auth link.
 */
export const MANAGE_ACADEMIC_YEAR_MUTATION = gql`
  mutation ManageAcademicYear($object: ManageAcademicYearInput!) {
    ManageAcademicYear(object: $object) {
      deleted
      id
      school_id
      code
      name
      starts_on
      ends_on
      is_current
    }
  }
`;
