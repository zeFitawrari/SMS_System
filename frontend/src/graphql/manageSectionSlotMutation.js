import { gql } from '@apollo/client';

/**
 * ManageSectionSlot — per 02-academic-setup.md:
 *
 *   Upsert/delete pattern:
   - is_delete: true + id     → Delete
   - is_delete: false + id    → Update
   - is_delete: false         → Insert
 *
 *   Insert:
 *     ManageSectionSlot(object: {
 *       is_delete: false
 *       school_id: "..."
 *       branch_id: "..."
 *       academic_year_id: "..."
 *       grade_level_id: "..."
 *       slot_index: 1
 *       section_name: "A"
 *       max_capacity: 40
 *     }) { deleted, id, section_name, max_capacity }
 *
 *   Update:
 *     ManageSectionSlot(object: {
 *       is_delete: false
 *       school_id: "..."
 *       id: "..."
 *       max_capacity: 45
 *     }) { deleted, id, max_capacity }
 *
 *   Delete:
 *     ManageSectionSlot(object: {
 *       is_delete: true
 *       school_id: "..."
 *       id: "..."
 *     }) { deleted, id }
 *
 * Requires SCHOOL_OWNER / SCHOOL_ADMIN (or provider).
 */
export const MANAGE_SECTION_SLOT_MUTATION = gql`
  mutation ManageSectionSlot($object: ManageSectionSlotInput!) {
    ManageSectionSlot(object: $object) {
      deleted
      id
      school_id
      branch_id
      academic_year_id
      grade_level_id
      slot_index
      section_name
      max_capacity
    }
  }
`;
