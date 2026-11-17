import { gql } from '@apollo/client';

/**
 * ManageGradeLevel — per 02-academic-setup.md:
 *
 *   Upsert/delete pattern:
   - is_delete: true + id     → Delete
   - is_delete: false + id    → Update
   - is_delete: false         → Insert
 *
 *   Insert:
 *     ManageGradeLevel(object: {
 *       is_delete: false
 *       school_id: "..."
 *       name: "Grade 1"
 *       code: "G1"
 *       level_type: "GRADE"
 *       sort_order: 1
 *       is_active: true
 *     }) { deleted, id, code, name }
 *
 *   Update:
 *     ManageGradeLevel(object: {
 *       is_delete: false
 *       school_id: "..."
 *       id: "..."
 *       name: "Grade One"
 *     }) { deleted, id, name }
 *
 *   Delete:
 *     ManageGradeLevel(object: {
 *       is_delete: true
 *       school_id: "..."
 *       id: "..."
 *     }) { deleted, id }
 *
 * Requires SCHOOL_OWNER / SCHOOL_ADMIN (or provider).
 */
export const MANAGE_GRADE_LEVEL_MUTATION = gql`
  mutation ManageGradeLevel($object: ManageGradeLevelInput!) {
    ManageGradeLevel(object: $object) {
      deleted
      id
      school_id
      code
      name
      level_type
      sort_order
      is_active
    }
  }
`;
