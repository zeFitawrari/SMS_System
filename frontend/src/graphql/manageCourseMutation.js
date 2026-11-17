import { gql } from '@apollo/client';

/**
 * ManageCourse — per 06-courses.md:
 *
 *   Upsert/delete pattern (from 00-common.md):
   - is_delete: true + id     → Delete
   - is_delete: false + id    → Update
   - is_delete: false         → Insert (create)
 *
 *   Insert:
 *     ManageCourse(object: {
 *       is_delete: false
 *       academic_year_id: "..."
 *       code: "MATH"
 *       name: "Mathematics"
 *       description: "Core mathematics"
 *       is_active: true
 *     }) { deleted, id, academic_year_id, code, name, is_active }
 *
 *   Update:
 *     ManageCourse(object: {
 *       is_delete: false
 *       id: "..."
 *       name: "Mathematics I"
 *       is_active: true
 *     }) { deleted, id, name, is_active }
 *
 *   Delete:
 *     ManageCourse(object: {
 *       is_delete: true
 *       id: "..."
 *     }) { deleted, id }
 *
 *   SCHOOL_OWNER / SCHOOL_ADMIN omit school_id (taken from access token).
 *   Platform admin passes school_id.
 * Requires Bearer access token attached automatically by Apollo auth link.
 */
export const MANAGE_COURSE_MUTATION = gql`
  mutation ManageCourse($object: ManageCourseInput!) {
    ManageCourse(object: $object) {
      deleted
      id
      academic_year_id
      code
      name
      description
      is_active
    }
  }
`;
