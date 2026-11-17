import { useQuery } from '@apollo/client';
import { apolloClient } from '../lib/apolloClient';
import { MY_BRANCHES_QUERY } from '../graphql/myBranchesQuery';
import { MY_SCHOOL_QUERY } from '../graphql/mySchoolQuery';

/**
 * Branches & School — per 05-data-reads.md (lines 10-30):
 *
 *   query MyBranches {
 *     branches(where: { status: { _eq: "active" } }, order_by: { name: asc }) {
 *       id, name, code, is_main, timezone
 *     }
 *   }
 *
 *   query MySchool {
 *     schools(limit: 1) {
 *       id, name, slug, status
 *     }
 *   }
 *
 * Requires Bearer access token. Row-level filters apply by school_id/branch_id.
 */

export default function BranchesSchool() {
  const {
    data: branchesData,
    loading: branchesLoading,
    error: branchesError,
  } = useQuery(MY_BRANCHES_QUERY, { client: apolloClient });

  const {
    data: schoolData,
    loading: schoolLoading,
    error: schoolError,
  } = useQuery(MY_SCHOOL_QUERY, { client: apolloClient });

  const branches = branchesData?.branches || [];
  const school = schoolData?.schools?.[0] || null;

  if (branchesLoading || schoolLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-gray-600">Loading branches & school...</span>
        </div>
      </div>
    );
  }

  if (branchesError || schoolError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <h2 className="text-red-800 font-bold text-sm mb-2">Error loading data</h2>
          <p className="text-red-600 text-xs mb-4">
            {branchesError?.message || schoolError?.message}
          </p>
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
              Branches & School
            </h1>
            <p className="text-sm text-gray-600">
              View school information and all active branches.
            </p>
          </div>
        </div>

        {/* School Info Card */}
        <div className="mb-8 sm:mb-10 bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
          <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-5 sm:w-6 h-5 sm:h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs sm:text-sm font-bold">
              🏫
            </span>
            School Information
          </h2>
          {school ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">School ID</p>
                <p className="text-sm font-semibold text-gray-900 break-all">{school.id}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</p>
                <p className="text-sm font-semibold text-gray-900 break-all">{school.name}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Slug</p>
                <p className="text-sm font-semibold text-gray-900 break-all">{school.slug || '—'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</p>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                  school.status === 'active'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  {school.status || '—'}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm">No school information available.</p>
            </div>
          )}
        </div>

        {/* Branches List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-5 sm:w-6 h-5 sm:h-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-xs sm:text-sm font-bold">
                🏢
              </span>
              Active Branches ({branches.length})
            </h2>
          </div>

          <div className="overflow-x-auto sm:overflow-visible">
            {branches.length === 0 ? (
              <div className="px-5 sm:px-6 py-12 sm:py-16 text-center">
                <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl sm:text-2xl font-bold mb-4 sm:mb-6 mx-auto">
                  🏢
                </div>
                <p className="text-gray-500 text-sm sm:text-base">
                  No active branches found.
                </p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider text-center sm:text-center">Main Branch</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Timezone</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider text-right sm:text-right">Branch ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {branches.map((branch) => (
                    <tr key={branch.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-900 font-medium">
                        {branch.name}
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-gray-100 text-gray-700 border border-gray-200">
                          {branch.code}
                        </span>
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-center sm:text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          branch.is_main
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {branch.is_main ? 'Main' : '—'}
                        </span>
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                        {branch.timezone || '—'}
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 break-all text-right sm:text-right">
                        {branch.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
