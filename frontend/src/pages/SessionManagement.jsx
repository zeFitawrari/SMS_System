import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { apolloClient } from '../lib/apolloClient';
import { useAuthStore } from '../store/authStore';
import {
  LIST_MY_SESSIONS_QUERY,
} from '../graphql/sessionsQuery';
import {
  REVOKE_SESSION_MUTATION,
} from '../graphql/revokeSessionMutation';
import {
  REVOKE_OTHER_SESSIONS_MUTATION,
} from '../graphql/revokeOtherSessionsMutation';
import {
  LOGOUT_ALL_MUTATION,
} from '../graphql/logoutAllMutation';

/**
 * Session Management — per 01-auth.md:
 *   Query — list my sessions
 *   Revoke one session
 *   Revoke all other sessions
 *   Logout (all devices) — Bearer only, empty body
 */

export default function SessionManagement() {
  const {
    sessions,
    setSessions,
    sessionId: currentSessionId,
    setLoading,
    logout: clearAuth,
  } = useAuthStore();

  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [uiError, setUiError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [revokeSessionMutation] = useMutation(REVOKE_SESSION_MUTATION, {
    client: apolloClient,
  });
  const [revokeOtherSessionsMutation] = useMutation(
    REVOKE_OTHER_SESSIONS_MUTATION,
    { client: apolloClient }
  );
  const [logoutAllMutation] = useMutation(LOGOUT_ALL_MUTATION, {
    client: apolloClient,
  });

  // ---- Fetch sessions on mount ----
  const { data, error: queryError, loading: queryLoading } = useQuery(
    LIST_MY_SESSIONS_QUERY,
    {
      client: apolloClient,
      variables: { object: { include_inactive: false } },
      onCompleted: (data) => {
        if (data.ListMySessions?.sessions) {
          setSessions(data.ListMySessions.sessions);
        }
      },
      onError: (err) => {
        setUiError(err.message || 'Failed to load sessions');
      },
    }
  );

  useEffect(() => {
    if (queryError) {
      setUiError(queryError.message || 'Failed to load sessions');
    }
  }, [queryError]);

  // ---- Revoke a single session ----
  const handleRevokeSession = async (sessionIdToRevoke) => {
    setLoading(true);
    setUiError(null);
    setSuccess(null);
    try {
      const res = await revokeSessionMutation({
        variables: { object: { session_id: sessionIdToRevoke } },
      });
      if (res.error) {
        throw new Error(res.error.message || 'Failed to revoke session');
      }
      setSuccess(res.data.RevokeSession.message || 'Session revoked');
      await fetchSessions();
    } catch (err) {
      setUiError(err.message || 'Failed to revoke session');
    } finally {
      setLoading(false);
    }
  };

  // ---- Revoke all other sessions ----
  const handleRevokeOtherSessions = async () => {
    if (!currentSessionId) {
      setUiError('No current session found');
      return;
    }
    setLoading(true);
    setUiError(null);
    setSuccess(null);
    try {
      const res = await revokeOtherSessionsMutation({
        variables: { object: { current_session_id: currentSessionId } },
      });
      if (res.error) {
        throw new Error(res.error.message || 'Failed to revoke other sessions');
      }
      setSuccess(
        res.data.RevokeOtherSessions.message ||
          `Revoked ${res.data.RevokeOtherSessions.revoked_count} session(s)`
      );
      await fetchSessions();
    } catch (err) {
      setUiError(err.message || 'Failed to revoke other sessions');
    } finally {
      setLoading(false);
    }
  };

  // ---- Logout all devices ----
  const handleLogoutAllDevices = async () => {
    setLoading(true);
    setUiError(null);
    setSuccess(null);
    try {
      const res = await logoutAllMutation({
        variables: { object: {} },
      });
      if (res.error) {
        throw new Error(res.error.message || 'Logout all devices failed');
      }
      setSuccess(res.data.LogoutAll.message || 'Logged out from all devices');
      localStorage.removeItem('smb_access_token');
      localStorage.removeItem('smb_session_token');
      localStorage.removeItem('smb_session_id');
      clearAuth();
    } catch (err) {
      setUiError(err.message || 'Logout all devices failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await apolloClient.query({
        query: LIST_MY_SESSIONS_QUERY,
        variables: { object: { include_inactive: false } },
      });
      if (res.data.ListMySessions?.sessions) {
        setSessions(res.data.ListMySessions.sessions);
      }
    } catch (err) {
      setUiError(err.message || 'Failed to load sessions');
    } finally {
      setSessionsLoading(false);
    }
  };

  const sessionList = sessions || (data?.ListMySessions?.sessions || []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 xl:py-10">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              Session Management
            </h1>
            <p className="text-sm text-gray-600">
              View and manage your active sessions across all devices.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium border border-blue-200">
              {sessionList.length} active
            </span>
          </div>
        </div>

        {/* Error / Success alerts */}
        {uiError && (
          <div className="rounded-xl bg-red-50 p-4 sm:p-5 border border-red-100 shadow-sm mb-6 sm:mb-8 flex items-start gap-3 sm:gap-4">
            <span className="text-red-500 flex shrink-0 mt-0.5 sm:mt-0">⚠</span>
            <div>
              <p className="text-sm text-red-800 font-medium">Error</p>
              <p className="text-sm text-red-600 mt-1 sm:mt-2">{uiError}</p>
            </div>
          </div>
        )}
        {success && (
          <div className="rounded-xl bg-green-50 p-4 sm:p-5 border border-green-100 shadow-sm mb-6 sm:mb-8 flex items-start gap-3 sm:gap-4">
            <span className="text-green-500 flex shrink-0 mt-0.5 sm:mt-0">✓</span>
            <div>
              <p className="text-sm text-green-800 font-medium">Success</p>
              <p className="text-sm text-green-600 mt-1 sm:mt-2">{success}</p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {queryLoading || sessionsLoading ? (
          <div className="flex items-center justify-center py-12 sm:py-16">
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <svg className="animate-spin h-6 sm:h-8 w-6 sm:w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm sm:text-base text-gray-600">Loading sessions...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Session list table (responsive scroll) */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto sm:overflow-visible">
                <div className="px-6 sm:px-8 py-4 sm:py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2 sm:gap-3">
                    <span className="text-blue-600">🖥️</span> Active Sessions
                    <span className="ml-auto sm:ml-0 text-xs sm:text-sm font-medium text-gray-500">
                      {sessionList.length} session{sessionList.length !== 1 ? 's' : ''}
                    </span>
                  </h2>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Device / IP</th>
                      <th className="px-6 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Started</th>
                      <th className="px-6 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Last Active</th>
                      <th className="px-6 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Expires</th>
                      <th className="px-6 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider text-right sm:text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sessionList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 sm:px-8 py-12 sm:py-16 text-center">
                          <p className="text-gray-500 text-sm">No active sessions found.</p>
                        </td>
                      </tr>
                    ) : (
                      sessionList.map((session) => (
                        <tr key={session.session_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 sm:px-8 py-4 sm:py-5">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm sm:text-base">
                                {session.user_agent
                                  ? session.user_agent.slice(0, 1).toUpperCase()
                                  : 'D'}
                              </div>
                              <div>
                                <p className="text-sm sm:text-base font-medium text-gray-900">
                                  {session.user_agent || 'Unknown device'}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  {session.client_ip || 'Unknown IP'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 sm:px-8 py-4 sm:py-5 text-sm text-gray-600">
                            {formatDate(session.created_at)}
                          </td>
                          <td className="px-6 sm:px-8 py-4 sm:py-5 text-sm text-gray-600">
                            {formatDate(session.last_active_at)}
                          </td>
                          <td className="px-6 sm:px-8 py-4 sm:py-5 text-sm text-gray-600">
                            {formatDate(session.expires_at)}
                          </td>
                          <td className="px-6 sm:px-8 py-4 sm:py-5">
                            {session.is_current ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                <span className="relative flex h-1.5 w-1.5 rounded-full bg-blue-800 after:absolute after:inset-0 after:rounded-full after:ring-2 after:ring-blue-400 after:opacity-75 after:after:animate-pulse"></span>
                                Current
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                                <span className="relative flex h-1.5 w-1.5 rounded-full bg-green-800 after:absolute after:inset-0 after:rounded-full after:ring-2 after:ring-green-400 after:opacity-75 after:after:animate-pulse"></span>
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-6 sm:px-8 py-4 sm:py-5 text-right sm:text-right">
                            <button
                              onClick={() => handleRevokeSession(session.session_id)}
                              disabled={session.is_current}
                              className={`text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all ${session.is_current ? 'text-gray-400 bg-gray-100 cursor-not-allowed border border-gray-200' : 'text-red-600 bg-red-50 border border-red-100/50 hover:bg-red-100'}`}
                            >
                              {session.is_current ? 'Current session' : 'Revoke'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bulk actions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
                Bulk Actions
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <button
                  onClick={handleRevokeOtherSessions}
                  disabled={!currentSessionId || sessionsLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium text-red-600 bg-red-50 border border-red-100/50 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sessionsLoading ? (
                    <svg className="animate-spin h-4 sm:h-5 w-4 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    '🔄 Revoke All Other Sessions'
                  )}
                  <span className="text-xs sm:text-sm text-gray-500 ml-1 sm:ml-2">
                    {currentSessionId ? 'Keeps your current session active' : 'No current session'}
                  </span>
                </button>

                <button
                  onClick={handleLogoutAllDevices}
                  disabled={sessionsLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sessionsLoading ? (
                    <svg className="animate-spin h-4 sm:h-5 w-4 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    '🚪 Logout from All Devices'
                  )}
                  <span className="text-xs sm:text-sm text-red-100 ml-1 sm:ml-2">
                    Revokes every session including this one
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
