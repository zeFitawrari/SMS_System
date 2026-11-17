import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const {
    user,
    roles,
    activeRole,
    schoolId,
    sessionId: currentSessionId,
  } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Responsive container */}
      <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 xl:py-10">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                School Management System — Welcome back,{user?.firstName}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                {activeRole}
              </span>
            </div>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6 hover:shadow-md transition-shadow">
            <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1 sm:mb-2 uppercase tracking-wider">
              User ID
            </p>
            <p className="text-lg sm:text-xl font-semibold text-gray-900 break-all">
              {user?.id}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6 hover:shadow-md transition-shadow">
            <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1 sm:mb-2 uppercase tracking-wider">
              Email
            </p>
            <p className="text-lg sm:text-xl font-semibold text-gray-900 break-all">
              {user?.email}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6 hover:shadow-md transition-shadow">
            <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1 sm:mb-2 uppercase tracking-wider">
              School ID
            </p>
            <p className="text-lg sm:text-xl font-semibold text-gray-900 break-all">
              {schoolId}
            </p>
          </div>
        </div>

        {/* Roles Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6 mb-8 sm:mb-10">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm sm:text-base">
              👥
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Your Roles</h2>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {roles.map((role) => (
              <span
                key={role}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-blue-100 text-blue-700 text-sm sm:text-base font-medium border border-blue-200"
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Current Session Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm sm:text-base">
              ⏱️
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Current Session</h2>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">Session ID</p>
                <p className="text-sm sm:text-base font-semibold text-gray-900 break-all truncate sm:truncate">
                  {currentSessionId}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800">
                <span className="relative flex h-1.5 w-1.5 rounded-full bg-blue-800 after:absolute after:inset-0 after:rounded-full after:ring-2 after:ring-blue-400 after:opacity-75 after:after:animate-pulse"></span>
                Active
              </span>
            </div>
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">Access Token</p>
                <p className="text-sm sm:text-base font-semibold text-gray-900">
                  Present
                </p>
              </div>
            </div>
          </div>
          <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-500">
            Use <strong>Manage Sessions</strong> to view all active sessions and revoke any device.
          </p>
        </div>
      </div>
    </div>
  );
}
