import { useQuery } from '@apollo/client';
import { apolloClient } from '../lib/apolloClient';
import { LIST_ROLE_ASSIGNMENTS_QUERY } from '../graphql/roleAssignmentsQuery';

const RoleRow = ({ assignment }) => (
  <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
    <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-900 font-medium break-all">
      {assignment.id}
    </td>
    <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 break-all">
      {assignment.user_id}
    </td>
    <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 break-all">
      {assignment.role_id}
    </td>
    <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 break-all">
      {assignment.role?.name || '—'}
    </td>
    <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 capitalize">
      {assignment.scope_type || '—'}
    </td>
    <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 break-all text-center sm:text-center">
      {assignment.branch_id || '—'}
    </td>
  </tr>
);

export default function RoleAssignments() {
  const { data } = useQuery(LIST_ROLE_ASSIGNMENTS_QUERY, { client: apolloClient });
  const roleAssignments = data?.role_assignments || [];

  if (!data) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold mx-auto mb-4">🏷️</div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Role Assignments</h2>
        <p className="text-sm text-gray-600">View all active role assignments.</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 xl:py-10 max-w-7xl">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-8">Role Assignments</h1>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs sm:text-sm font-bold">🏷️</span>Role Assignments ({roleAssignments.length})
            </h2>
          </div>

          <div className="overflow-x-auto sm:overflow-visible">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Assignment ID</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">User ID</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Role ID</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Role Name</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Scope Type</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider text-center sm:text-center">Branch ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {roleAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 sm:px-6 py-12 sm:py-16 text-center">
                      <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl sm:text-2xl font-bold mx-auto mb-4">👥</div>
                      <p className="text-gray-500 text-sm sm:text-base">No active role assignments found.</p>
                    </td>
                  </tr>
                ) : (
                  roleAssignments.map((assignment) => (
                    <RoleRow key={assignment.id} assignment={assignment} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
