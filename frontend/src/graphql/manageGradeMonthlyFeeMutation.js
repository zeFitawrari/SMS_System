import { gql } from '@apollo/client';

/**
 * ManageGradeMonthlyFee — per 02-academic-setup.md:
 *
 *   Upsert/delete pattern:
   - is_delete: true + id     → Delete
   - is_delete: false + id    → Update
   - is_delete: false         → Insert
 *
 *   Insert:
 *     ManageGradeMonthlyFee(object: {
 *       is_delete: false
 *       school_id: "..."
 *       academic_year_id: "..."
 *       grade_level_id: "..."
 *       monthly_amount: 2500.00
 *     }) { deleted, id, monthly_amount }
 *
 *   Update:
 *     ManageGradeMonthlyFee(object: {
 *       is_delete: false
 *       school_id: "..."
 *       id: "..."
 *       monthly_amount: 2700.00
 *     }) { deleted, id, monthly_amount }
 *
 *   Delete:
 *     ManageGradeMonthlyFee(object: {
 *       is_delete: true
 *       school_id: "..."
 *       id: "..."
 *     }) { deleted, id }
 *
 * Requires SCHOOL_OWNER / SCHOOL_ADMIN (or provider).
 */
export const MANAGE_GRADE_MONTHLY_FEE_MUTATION = gql`
  mutation ManageGradeMonthlyFee($object: ManageGradeMonthlyFeeInput!) {
    ManageGradeMonthlyFee(object: $object) {
      deleted
      id
      school_id
      academic_year_id
      grade_level_id
      monthly_amount
    }
  }
`;
