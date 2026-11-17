import { gql } from '@apollo/client';

/**
 * ManageGradeCourse — per 06-courses.md:
 *
 *   Upsert/delete pattern (from 00-common.md):
   - is_delete: true + id     → Delete
   - is_delete: false + id    → Update
   - is_delete: false         → Insert (create)
 *
 *   course_id must be a course for the same academic_year_id.
 *   Inactive courses cannot be attached.
 *
 *   Insert:
 *     ManageGradeCourse(object: {
 *       is_delete: false
 *       academic_year_id: "..."
 *       grade_level_id: "..."
 *       course_id: "..."
 *       sort_order: 1
 *       is_required: true
 *     }) { deleted, id, grade_level_id, course_id, sort_order, is_required }
 *
 *   Update:
 *     ManageGradeCourse(object: {
 *       is_delete: false
 *       id: "..."
 *       sort_order: 2
 *       is_required: false
 *     }) { deleted, id, sort_order, is_required }
 *
 *   Delete:
 *     ManageGradeCourse(object: {
 *       is_delete: true
 *       id: "..."
 *     }) { deleted, id }
 *
 * Requires Bearer access token attached automatically by Apollo auth link.
 */
export const MANAGE_GRADE_COURSE_MUTATION = gql`
  mutation ManageGradeCourse($object: ManageGradeCourseInput!) {
    ManageGradeCourse(object: $object) {
      deleted
      id
      academic_year_id
      grade_level_id
      course_id
      sort_order
      is_required
    }
  }
`;
