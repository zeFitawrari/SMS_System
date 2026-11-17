import { gql } from '@apollo/client';

/**
 * ManageSectionCourseTeacher — per 06-courses.md:
 *
 *   Upsert/delete pattern (from 00-common.md):
   - is_delete: true + id     → Delete
   - is_delete: false + id    → Update
   - is_delete: false         → Insert (create)
 *
 *   grade_section_slot_id is the configured section (Grade 1 – A).
 *   staff_profile_id is the teacher. Repeat for each course that teacher
 *   takes in the section (call once per course).
 *
 *   Insert:
 *     ManageSectionCourseTeacher(object: {
 *       is_delete: false
 *       grade_section_slot_id: "..."
 *       grade_course_id: "..."
 *       staff_profile_id: "..."
 *     }) { deleted, id, branch_id, grade_section_slot_id, grade_course_id, staff_profile_id }
 *
 *   Change teacher:
 *     ManageSectionCourseTeacher(object: {
 *       is_delete: false
 *       id: "..."
 *       staff_profile_id: "..."
 *     }) { deleted, id, staff_profile_id }
 *
 *   Delete:
 *     ManageSectionCourseTeacher(object: {
 *       is_delete: true
 *       id: "..."
 *     }) { deleted, id }
 *
 * Requires Bearer access token attached automatically by Apollo auth link.
 */
export const MANAGE_SECTION_COURSE_TEACHER_MUTATION = gql`
  mutation ManageSectionCourseTeacher($object: ManageSectionCourseTeacherInput!) {
    ManageSectionCourseTeacher(object: $object) {
      deleted
      id
      branch_id
      grade_section_slot_id
      grade_course_id
      staff_profile_id
    }
  }
`;
