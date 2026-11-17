import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { apolloClient } from '../lib/apolloClient';
import { useAuthStore } from '../store/authStore';
import { LIST_USERS_QUERY } from '../graphql/usersQuery';
import { LIST_ROLE_ASSIGNMENTS_QUERY } from '../graphql/roleAssignmentsQuery';
import { LIST_AVAILABLE_ROLES_QUERY } from '../graphql/availableRolesQuery';
import { LIST_BRANCHES } from '../graphql/queries';
import { ASSIGN_ROLE_MUTATION } from '../graphql/assignRoleMutation';
import { REVOKE_ROLE_ASSIGNMENT_MUTATION } from '../graphql/revokeRoleAssignmentMutation';

/**
 * Role Management — per 01-auth.md (lines 200-251):
 *   AssignRole (school scope + branch scope)
 *   RevokeRoleAssignment
 * Requires Bearer access token.
 */

export default function RoleManagement() {
  const { schoolId, setLoading, setError } = useAuthStore();

  const [assignLoading, setAssignLoading] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(new Set());
  const [assignError, setAssignError] = useState(null);
  const [assignSuccess, setAssignSuccess] = useState(null);
  const [revokeError, setRevokeError] = useState(null);
  const [revokeSuccess, setRevokeSuccess] = useState(null);
  const [scopeType, setScopeType] = useState('SCHOOL');

  const [assignRoleMutation] = useMutation(ASSIGN_ROLE_MUTATION, {
    client: apolloClient,
  });

  const [revokeRoleAssignmentMutation] = useMutation(
    REVOKE_ROLE_ASSIGNMENT_MUTATION,
    { client: apolloClient }
  );

  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
  } = useQuery(LIST_USERS_QUERY, { client: apolloClient });

  const {
    data: assignmentsData,
    loading: assignmentsLoading,
    error: assignmentsError,
    refetch: refetchAssignments,
  } = useQuery(LIST_ROLE_ASSIGNMENTS_QUERY, { client: apolloClient });

  const {
    data: rolesData,
    loading: rolesLoading,
    error: rolesError,
  } = useQuery(LIST_AVAILABLE_ROLES_QUERY, { client: apolloClient });

  const {
    data: branchesData,
    loading: branchesLoading,
    error: branchesError,
  } = useQuery(LIST_BRANCHES, {
    client: apolloClient,
    variables: { schoolId: schoolId || '' },
    skip: !schoolId,
  });

  const users = usersData?.users || [];
  const assignments = assignmentsData?.role_assignments || [];
  const availableRoles = rolesData?.roles || [];
  const branches = branchesData?.branches || [];

  const handleAssignRole = async (e) => {
    e.preventDefault();
    setAssignLoading(true);
    setAssignError(null);
    setAssignSuccess(null);

    const formData = new FormData(e.target);
    const userId = formData.get('user_id');
    const role = formData.get('role');

    const variables = {
      object: {
        user_id: userId,
        role: role,
        scope_type: scopeType,
      },
    };

    if (scopeType === 'BRANCH') {
      const branchId = formData.get('branch_id');
      if (!branchId) {
        setAssignError('Branch is required for branch-scoped roles');
        setAssignLoading(false);
        return;
      }
      variables.object.branch_id = branchId;
    }

    try {
      const res = await assignRoleMutation({ variables });
      if (res.error) {
        throw new Error(res.error.message || 'Failed to assign role');
      }
      setAssignSuccess(
        res.data.AssignRole.message ||
          `Role "${role}" assigned successfully`
      );
      e.target.reset();
      setScopeType('SCHOOL');
      await refetchAssignments();
    } catch (err) {
      setAssignError(err.message || 'Failed to assign role');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRevokeRole = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to revoke this role assignment?')) {
      return;
    }
    setRevokeLoading((prev) => new Set([...prev, assignmentId]));
    setRevokeError(null);
    setRevokeSuccess(null);

    try {
      const res = await revokeRoleAssignmentMutation({
        variables: { object: { assignment_id: assignmentId } },
      });
      if (res.error) {
        throw new Error(res.error.message || 'Failed to revoke role');
      }
      setRevokeSuccess(
        res.data.RevokeRoleAssignment.message ||
          'Role revoked successfully'
      );
      await refetchAssignments();
    } catch (err) {
      setRevokeError(err.message || 'Failed to revoke role');
    } finally {
      setRevokeLoading((prev) => {
        const next = new Set(prev);
        next.delete(assignmentId);
        return next;
      });
    }
  };

  const getUserName = (userId) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return 'Unknown User';
    return `${user.first_name} ${user.middle_name || ''} ${user.last_name}`.trim();
  };

  const getUserEmail = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.email : '';
  };

  const formatAssignment = (assignment) => {
    const userName = getUserName(assignment.user_id);
    const userEmail = getUserEmail(assignment.user_id);
    const roleName = assignment.role?.name || assignment.role_id || 'Unknown';
    const scope = assignment.scope_type === 'SCHOOL' ? 'School-wide' : 'Branch-scoped';
    const branch = branches.find((b) => b.id === assignment.branch_id);
    const branchLabel = branch ? `${branch.name} (${branch.code})` : '—';

    return { userName, userEmail, roleName, scope, branchLabel };
  };

  if (usersLoading || assignmentsLoading || rolesLoading || branchesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-gray-600">Loading role management data...</span>
        </div>
      </div>
    );
  }

  if (usersError || assignmentsError || rolesError || branchesError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <h2 className="text-red-800 font-bold text-sm mb-2">Error loading data</h2>
          <p className="text-red-600 text-xs mb-4">
            {usersError?.message || assignmentsError?.message || rolesError?.message || branchesError?.message}
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Role Management</h1>
            <p className="text-sm text-gray-600">
              Assign and revoke roles for users. Roles can be school-wide or branch-scoped.
            </p>
          </div>
        </div>

        {/* Assign Error / Success */}
        {assignError && (
          <div className="rounded-xl bg-red-50 p-4 sm:p-5 border border-red-100 shadow-sm mb-6 sm:mb-8 flex items-start gap-3 sm:gap-4">
            <span className="text-red-500 flex shrink-0 mt-0.5 sm:mt-0">⚠</span>
            <div>
              <p className="text-sm text-red-800 font-medium">Assign Error</p>
              <p className="text-sm text-red-600 mt-1 sm:mt-2">{assignError}</p>
            </div>
          </div>
        )}
        {assignSuccess && (
          <div className="rounded-xl bg-green-50 p-4 sm:p-5 border border-green-100 shadow-sm mb-6 sm:mb-8 flex items-start gap-3 sm:gap-4">
            <span className="text-green-500 flex shrink-0 mt-0.5 sm:mt-0">✓</span>
            <div>
              <p className="text-sm text-green-800 font-medium">Success</p>
              <p className="text-sm text-green-600 mt-1 sm:mt-2">{assignSuccess}</p>
            </div>
          </div>
        )}
        {revokeError && (
          <div className="rounded-xl bg-red-50 p-4 sm:p-5 border border-red-100 shadow-sm mb-6 sm:mb-8 flex items-start gap-3 sm:gap-4">
            <span className="text-red-500 flex shrink-0 mt-0.5 sm:mt-0">⚠</span>
            <div>
              <p className="text-sm text-red-800 font-medium">Revoke Error</p>
              <p className="text-sm text-red-600 mt-1 sm:mt-2">{revokeError}</p>
            </div>
          </div>
        )}
        {revokeSuccess && (
          <div className="rounded-xl bg-green-50 p-4 sm:p-5 border border-green-100 shadow-sm mb-6 sm:mb-8 flex items-start gap-3 sm:gap-4">
            <span className="text-green-500 flex shrink-0 mt-0.5 sm:mt-0">✓</span>
            <div>
              <p className="text-sm text-green-800 font-medium">Success</p>
              <p className="text-sm text-green-600 mt-1 sm:mt-2">{revokeSuccess}</p>
            </div>
          </div>
        )}

        <div className="space-y-8 sm:space-y-10">
          {/* ================================================================
               LEFT: Assign New Role Form (full width on mobile)
               ================================================================ */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6 mb-8 sm:mb-0">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-5 sm:mb-6 flex items-center gap-2">
              <span className="w-5 sm:w-6 h-5 sm:h-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-xs sm:text-sm font-bold">
                👥
              </span>
              Assign New Role
            </h2>

            <form onSubmit={handleAssignRole} className="space-y-5 sm:space-y-6">
              {/* User select */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  User
                </label>
                <select
                  name="user_id"
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {`${user.first_name} ${user.last_name} (${user.email})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role select */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Role
                </label>
                <select
                  name="role"
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="">Select a role</option>
                  {availableRoles.map((role) => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>

              {/* Scope type */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Scope Type
                </label>
                <div className="flex gap-3 sm:gap-4">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="radio"
                      name="scope_type"
                      value="SCHOOL"
                      checked={scopeType === 'SCHOOL'}
                      onChange={() => setScopeType('SCHOOL')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm sm:text-base text-gray-700">School-wide</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="radio"
                      name="scope_type"
                      value="BRANCH"
                      checked={scopeType === 'BRANCH'}
                      onChange={() => setScopeType('BRANCH')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm sm:text-base text-gray-700">Branch-scoped</span>
                  </label>
                </div>
              </div>

              {/* Branch select (conditional) */}
              {scopeType === 'BRANCH' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Branch
                  </label>
                  <select
                    name="branch_id"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">Select a branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {`${branch.name} (${branch.code})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={assignLoading}
                className="w-full py-3 sm:py-4 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md"
              >
                {assignLoading ? 'Assigning…' : 'Assign Role'}
              </button>
            </form>
          </div>

          {/* ================================================================
               RIGHT: Current Role Assignments Table
               ================================================================ */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                Current Role Assignments
              </h2>
              <span className="text-xs sm:text-sm font-medium text-gray-500">
                {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="overflow-x-auto sm:overflow-visible">
              {assignments.length === 0 ? (
                <div className="px-5 sm:px-6 py-12 sm:py-16 text-center">
                  <p className="text-gray-500 text-sm">No active role assignments found.</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Scope</th>
                      <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                      <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider text-right sm:text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {assignments.map((assignment) => {
                      const { userName, userEmail, roleName, scope, branchLabel } =
                        formatAssignment(assignment);
                      const isRevoking = revokeLoading.has(assignment.id);
                      return (
                        <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-900 font-medium">
                            {userName}
                          </td>
                          <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                            {userEmail}
                          </td>
                          <td className="px-5 sm:px-6 py-4 sm:py-5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                              {roleName}
                            </span>
                          </td>
                          <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                            {scope}
                          </td>
                          <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                            {branchLabel}
                          </td>
                          <td className="px-5 sm:px-6 py-4 sm:py-5 text-right sm:text-right">
                            <button
                              onClick={() => handleRevokeRole(assignment.id)}
                              disabled={isRevoking}
                              className={`text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all ${isRevoking ? 'text-gray-400 bg-gray-100 cursor-not-allowed border border-gray-200' : 'text-red-600 bg-red-50 border border-red-100/50 hover:bg-red-100'}`}
                            >
                              {isRevoking ? 'Revoking…' : 'Revoke'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Info note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-blue-900 mb-3 sm:mb-4">
            How role assignment works
          </h3>
          <ul className="text-sm sm:text-base text-blue-800 space-y-2 sm:space-y-3 list-disc pl-5 sm:pl-6">
            <li>
              <strong>School-wide scope:</strong> The role applies across the entire school. No branch_id is required.
            </li>
            <li>
              <strong>Branch-scoped scope:</strong> The role applies to a specific branch. You must select a branch.
            </li>
            <li>
              Role names come from the available roles list (TEACHER, RECEPTIONIST, FINANCE, BRANCH_ADMIN, etc.).
            </li>
            <li>
              Revoking a role assignment removes it immediately. The user will no longer have that role's permissions.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
