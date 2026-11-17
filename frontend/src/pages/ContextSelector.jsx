import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { apolloClient } from '../lib/apolloClient';
import { useAuthStore } from '../store/authStore';
import { LIST_MY_CONTEXTS } from '../graphql/contextsQuery';
import { SELECT_CONTEXT_MUTATION } from '../graphql/selectContextMutation';

/**
 * Context Selector — per 01-auth.md:
 *   Query — ListMyContexts
 *   Mutation — SelectContext (school-wide + branch-scoped)
 */

export default function ContextSelector({ onContextSwitched }) {
  const {
    setAuth,
    setLoading,
    setError,
  } = useAuthStore();

  const [switching, setSwitching] = useState(false);
  const [error, setErrorState] = useState(null);
  const [success, setSuccess] = useState(null);

  const [selectContextMutation] = useMutation(SELECT_CONTEXT_MUTATION, {
    client: apolloClient,
  });

  const { data, error: queryError, loading: queryLoading } = useQuery(
    LIST_MY_CONTEXTS,
    {
      client: apolloClient,
    }
  );

  const contexts = data?.ListMyContexts?.contexts || [];

  if (queryError) {
    setErrorState(queryError.message || 'Failed to load contexts');
  }

  const handleSelectContext = async (context) => {
    setSwitching(true);
    setErrorState(null);
    setSuccess(null);

    try {
      const variables = {
        object: {
          role: context.role,
          ...(context.scope_type === 'BRANCH' && context.branch_id
            ? { branch_id: context.branch_id }
            : {}),
        },
      };

      const res = await selectContextMutation({ variables });

      if (res.error) {
        throw new Error(res.error.message || 'Failed to select context');
      }

      const d = res.data.SelectContext;

      localStorage.setItem('smb_access_token', d.access_token);
      localStorage.setItem('smb_session_token', d.session_token);
      localStorage.setItem('smb_session_id', d.session_id);

      setAuth({
        accessToken: d.access_token,
        sessionToken: d.session_token,
        sessionId: d.session_id,
        activeRole: d.active_role,
        schoolId: d.school_id,
        roles: d.roles,
      });

      setSuccess('Context switched successfully');

      if (onContextSwitched) {
        onContextSwitched();
      }
    } catch (err) {
      setErrorState(err.message || 'Failed to select context');
    } finally {
      setSwitching(false);
    }
  };

  const scopeLabel = (scopeType) => {
    if (scopeType === 'SCHOOL') return 'School-wide';
    if (scopeType === 'BRANCH') return 'Branch-scoped';
    return scopeType;
  };

  const scopeColor = (scopeType) => {
    if (scopeType === 'SCHOOL') return 'bg-blue-100 text-blue-700 border border-blue-200';
    if (scopeType === 'BRANCH') return 'bg-green-100 text-green-700 border border-green-200';
    return 'bg-gray-100 text-gray-600 border border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 xl:py-10 max-w-md sm:max-w-lg lg:max-w-xl">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Select Your Role & Branch
          </h1>
          <p className="text-sm text-gray-600">
            Choose the context you want to work under.
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-xl bg-red-50 p-4 sm:p-5 border border-red-100 shadow-sm mb-6 sm:mb-8 flex items-start gap-3 sm:gap-4">
            <span className="text-red-500 flex shrink-0 mt-0.5 sm:mt-0">⚠</span>
            <div>
              <p className="text-sm text-red-800 font-medium">Error</p>
              <p className="text-sm text-red-600 mt-1 sm:mt-2">{error}</p>
            </div>
          </div>
        )}

        {/* Success state */}
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
        {queryLoading || switching ? (
          <div className="flex items-center justify-center py-12 sm:py-16">
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <svg className="animate-spin h-6 sm:h-8 w-6 sm:w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm sm:text-base text-gray-600">
                {switching ? 'Switching context...' : 'Loading your contexts...'}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {contexts.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 sm:p-12 text-center">
                <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl sm:text-2xl font-bold mb-4 sm:mb-6 mx-auto">
                  👥
                </div>
                <p className="text-gray-500 text-sm sm:text-base">No contexts available.</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-2 sm:mt-4">
                  You do not have any role assignments. Contact your administrator.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm sm:text-base font-medium text-gray-700 mb-4 sm:mb-6">
                  {contexts.length} context{contexts.length !== 1 ? 's' : ''} available:
                </p>

                <div className="space-y-3 sm:space-y-4">
                  {contexts.map((context) => (
                    <div
                      key={context.assignment_id}
                      onClick={() => handleSelectContext(context)}
                      className="flex items-center justify-between p-4 sm:p-5 rounded-xl border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4 sm:gap-5">
                        <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm sm:text-base group-hover:bg-blue-100 transition-colors">
                          {context.role.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm sm:text-base font-semibold text-gray-900">
                            {context.role}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {context.scope_type === 'BRANCH'
                              ? `Branch: ${context.branch_name || 'Unknown'} (${context.branch_code || '—'})`
                              : 'Scope: School-wide'}
                          </p>
                        </div>
                      </div>

                      <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${scopeColor(context.scope_type)}`}>
                        {scopeLabel(context.scope_type)}
                      </span>

                      <svg
                        className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400 group-hover:text-blue-500 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer note */}
        <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-200">
          <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
            Selecting a context will issue a new access token scoped to that
            role and branch. You can switch contexts at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
