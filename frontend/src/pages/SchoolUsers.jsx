import { useQuery } from '@apollo/client';
import { apolloClient } from '../lib/apolloClient';
import { LIST_USERS_QUERY } from '../graphql/usersQuery';

export default function SchoolUsers() {
  const { data } = useQuery(LIST_USERS_QUERY, { client: apolloClient });
  const users = data?.users || [];

  if (!data) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold mx-auto mb-4">👥</div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Users Directory</h2>
        <p className="text-sm text-gray-600">View all registered users.</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 xl:py-10 max-w-7xl">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-8">Users Directory</h1>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto sm:overflow-visible">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider text-center sm:text-center">Status</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider text-right sm:text-right">User ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-900 font-medium">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 break-all">
                      {user.email || '—'}
                    </td>
                    <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 break-all">
                      {user.phone || '—'}
                    </td>
                    <td className="px-5 sm:px-6 py-4 sm:py-5 text-center sm:text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200">
                        <span className={user.status === 'active' ? 'text-green-800 bg-green-100' : 'text-gray-800 bg-gray-100'}>{user.status || '—'}</span>
                      </span>
                    </td>
                    <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 break-all text-right sm:text-right">
                      {user.id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
