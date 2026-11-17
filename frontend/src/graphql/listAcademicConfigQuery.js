import { gql } from '@apollo/client';

/**
 * ListAcademicConfig — per 02-academic-setup.md:
 *
 *   Combined list query for admin UI:
 *     query ListAcademicConfig {
 *       academic_years(order_by: { starts_on: desc }) {
 *         id, name, code, is_current, starts_on, ends_on
 *       }
 *       grade_levels(where: { is_active: { _eq: true } }, order_by: { sort_order: asc }) {
 *         id, name, code, level_type
 *       }
 *       grade_monthly_fees {
 *         id, academic_year_id, grade_level_id, monthly_amount
 *       }
 *       grade_section_slots(order_by: { slot_index: asc }) {
 *         id, branch_id, academic_year_id, grade_level_id, section_name, max_capacity
 *       }
 *       school_registration_packages(where: { is_enabled: { _eq: true } }) {
 *         id, package_code, is_enabled
 *       }
 *       registration_payment_packages(order_by: { sort_order: asc }) {
 *         code, label, duration_months, discount_percent
 *       }
 *       branches(where: { status: { _eq: "active" } }) {
 *         id, name, code, is_main
 *       }
 *     }
 *
 * Requires Bearer access token. Row-level filters apply by school_id/branch_id.
 */
export const LIST_ACADEMIC_CONFIG_QUERY = gql`
  query ListAcademicConfig {
    academic_years(order_by: { starts_on: desc }) {
      id
      name
      code
      is_current
      starts_on
      ends_on
    }
    grade_levels(
      where: { is_active: { _eq: true } }
      order_by: { sort_order: asc }
    ) {
      id
      name
      code
      level_type
    }
    grade_monthly_fees {
      id
      academic_year_id
      grade_level_id
      monthly_amount
    }
    grade_section_slots(order_by: { slot_index: asc }) {
      id
      branch_id
      academic_year_id
      grade_level_id
      section_name
      max_capacity
    }
    school_registration_packages(where: { is_enabled: { _eq: true } }) {
      id
      package_code
      is_enabled
    }
    registration_payment_packages(order_by: { sort_order: asc }) {
      code
      label
      duration_months
      discount_percent
    }
    branches(where: { status: { _eq: "active" } }) {
      id
      name
      code
      is_main
    }
  }
`;
