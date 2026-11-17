import { useQuery } from '@apollo/client';
import { apolloClient } from '../lib/apolloClient';
import { LIST_ACADEMIC_CONFIG_QUERY } from '../graphql/listAcademicConfigQuery';

/**
 * Academic Setup Checklist — per 02-academic-setup.md:
 *
 *   Combined list query for admin UI:
 *     query ListAcademicConfig {
 *       academic_years, grade_levels, grade_monthly_fees,
 *       grade_section_slots, school_registration_packages,
 *       registration_payment_packages, branches
 *     }
 *
 *   Shows configuration status for each academic setup item.
 *   Requires Bearer access token. Row-level filters apply by school_id/branch_id.
 */

export default function AcademicSetupChecklist() {
  const {
    data,
    loading: queryLoading,
    error: queryError,
    refetch: refetchConfig,
  } = useQuery(LIST_ACADEMIC_CONFIG_QUERY, { client: apolloClient });

  const academicYears = data?.academic_years || [];
  const gradeLevels = data?.grade_levels || [];
  const monthlyFees = data?.grade_monthly_fees || [];
  const sectionSlots = data?.grade_section_slots || [];
  const registrationPackages = data?.school_registration_packages || [];
  const branches = data?.branches || [];

  const currentYear = academicYears.find((y) => y.is_current);
  const activeGradeLevels = gradeLevels.filter((g) => g.is_active);
  const activePackages = registrationPackages.filter((p) => p.is_enabled);
  const activeBranches = branches.filter((b) => b.status === 'active');

  const items = [
    {
      key: 'academic-years',
      label: 'Academic Years',
      icon: '📅',
      count: academicYears.length,
      configured: academicYears.length > 0,
      description: 'Set up academic years (e.g., 2026/2027)',
      current: currentYear ? currentYear.name : null,
      route: 'academic-years',
    },
    {
      key: 'grade-levels',
      label: 'Grade Levels',
      icon: '📚',
      count: activeGradeLevels.length,
      configured: activeGradeLevels.length > 0,
      description: 'Define grade levels (e.g., Grade 1, Grade 2)',
      current: null,
      route: 'grade-levels',
    },
    {
      key: 'monthly-fees',
      label: 'Monthly Fees',
      icon: '💰',
      count: monthlyFees.length,
      configured: monthlyFees.length > 0,
      description: 'Set monthly tuition per grade and year',
      current: null,
      route: 'monthly-fees',
    },
    {
      key: 'section-slots',
      label: 'Section Slots',
      icon: '🏫',
      count: sectionSlots.length,
      configured: sectionSlots.length > 0,
      description: 'Configure sections (A, B, C) per grade',
      current: null,
      route: 'section-slots',
    },
    {
      key: 'registration-packages',
      label: 'Registration Packages',
      icon: '💳',
      count: activePackages.length,
      configured: activePackages.length > 0,
      description: 'Enable payment packages for registration',
      current: null,
      route: 'registration-packages',
    },
    {
      key: 'branches',
      label: 'Branches',
      icon: '🏢',
      count: activeBranches.length,
      configured: activeBranches.length > 0,
      description: 'Configure school branches',
      current: null,
      route: null,
    },
  ];

  const allConfigured = items.every((item) => item.configured);

  if (queryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-gray-600">Loading setup status...</span>
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <h2 className="text-red-800 font-bold text-sm mb-2">Error loading data</h2>
          <p className="text-red-600 text-xs mb-4">{queryError.message}</p>
          <button
            onClick={() => refetchConfig()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 xl:py-10 max-w-7xl">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              Academic Setup Checklist
            </h1>
            <p className="text-sm text-gray-600">
              Complete academic configuration before student registration.
              All items must be configured to enable registration.
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
            allConfigured ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
          }`}>
            <span className={allConfigured ? 'text-green-600' : 'text-blue-600'}>{allConfigured ? '✓' : '○'}</span>
            <span className="text-sm sm:text-base font-medium">
              {allConfigured ? 'Setup Complete' : `${items.filter((i) => i.configured).length} of ${items.length} configured`}
            </span>
          </div>
        </div>

        {/* Checklist Items */}
        <div className="space-y-4 sm:space-y-6">
          {items.map((item) => (
            <div
              key={item.key}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900">
                      {item.label}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {item.description}
                    </p>
                    {item.current && (
                      <p className="text-xs text-blue-600 font-medium mt-1">
                        Current: {item.current}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium ${
                      item.configured
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {item.configured ? '✓ Configured' : '○ Not Configured'}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-gray-600 bg-gray-50 px-2.5 py-1 rounded">
                    {item.count}
                  </span>
                  {item.route && (
                    <button
                      onClick={() => {
                        // Navigation handled by parent App.jsx via context
                        window.dispatchEvent(
                          new CustomEvent('navigate-to', {
                            detail: { route: item.route },
                          })
                        );
                      }}
                      className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Configure
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8 sm:mt-10 bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-4">
            Setup Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
                Total Items
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {items.length}
              </p>
            </div>
            <div className="bg-green-50 p-4 sm:p-6 rounded-lg border border-green-100">
              <p className="text-xs text-green-600 uppercase tracking-wider font-semibold mb-2">
                Configured
              </p>
              <p className="text-xl sm:text-2xl font-bold text-green-700">
                {items.filter((i) => i.configured).length}
              </p>
            </div>
            <div className="bg-amber-50 p-4 sm:p-6 rounded-lg border border-amber-100">
              <p className="text-xs text-amber-600 uppercase tracking-wider font-semibold mb-2">
                Remaining
              </p>
              <p className="text-xl sm:text-2xl font-bold text-amber-700">
                {items.filter((i) => !i.configured).length}
              </p>
            </div>
          </div>
          {allConfigured ? (
            <div className="mt-6 sm:mt-8 bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="text-green-600 flex shrink-0">✓</span>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Academic setup is complete!
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    You can now proceed to student registration.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 sm:mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="text-amber-600 flex shrink-0">⚠</span>
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Academic setup is incomplete.
                  </p>
                  <p className="text-sm text-amber-600 mt-1">
                    Please configure the remaining items before registering students.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
