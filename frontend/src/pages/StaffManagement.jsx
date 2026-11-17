import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { apolloClient } from '../lib/apolloClient';
import { useAuthStore } from '../store/authStore';
import { LIST_AVAILABLE_ROLES_QUERY } from '../graphql/availableRolesQuery';
import { MANAGE_USER_MUTATION } from '../graphql/manageUserMutation';
import { LIST_STAFF_QUERY } from '../graphql/listStaffQuery';
import { LIST_BRANCHES } from '../graphql/queries';

/**
 * Staff Management — per 04-staff.md:
 *   ManageUser (create / update / delete staff & teachers)
 *   StaffRoleIds (list of available staff roles)
 *   ListStaff (read staff profiles)
 * Requires SCHOOL_OWNER / SCHOOL_ADMIN (or provider).
 * Bearer access token attached automatically by Apollo auth link.
 *
 * ManageUser upsert/delete pattern (from 00-common.md):
 *   - is_delete: true + id     → Delete / deactivate
 *   - is_delete: false + id    → Update
 *   - is_delete: false         → Insert (create)
 */

const STAFF_ALLOWED_ROLES = [
  'SCHOOL_OWNER',
  'SCHOOL_ADMIN',
  'PROVIDER_ADMIN',
  'SUPER_PROVIDER_ADMIN',
];

const TEACHER_FIELDS = [
  'education_level',
  'field_of_study',
  'academic_background',
  'years_of_experience',
  'teaching_license_number',
  'employment_type',
];

const EDUCATION_LEVELS = [
  'CERTIFICATE',
  'DIPLOMA',
  'BACHELOR',
  'MASTER',
  'DOCTORATE',
  'OTHER',
];

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT'];

export default function StaffManagement() {
  const { roles, schoolId } = useAuthStore();

  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(new Set());
  const [deleteLoading, setDeleteLoading] = useState(new Set());
  const [resetPasswordLoading, setResetPasswordLoading] = useState(new Set());
  const [error, setErrorState] = useState(null);
  const [success, setSuccessState] = useState(null);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [scopeType, setScopeType] = useState('SCHOOL');

  // ---- Form state (controlled inputs) ----
  const [form, setForm] = useState({
    role_id: '',
    scope_type: 'SCHOOL',
    scope_branch_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    employee_code: '',
    job_title: '',
    hired_on: '',
    teacher: {
      education_level: '',
      field_of_study: '',
      academic_background: '',
      years_of_experience: '',
      teaching_license_number: '',
      employment_type: '',
    },
  });

  const [manageUserMutation] = useMutation(MANAGE_USER_MUTATION, {
    client: apolloClient,
  });

  const {
    data: rolesData,
    loading: rolesLoading,
    error: rolesError,
  } = useQuery(LIST_AVAILABLE_ROLES_QUERY, { client: apolloClient });

  const {
    data: staffData,
    loading: staffLoading,
    error: staffError,
  } = useQuery(LIST_STAFF_QUERY, { client: apolloClient });

  const availableRoles = rolesData?.roles || [];
  const branches = branchesData?.branches || [];
  const staffProfiles = staffData?.staff_profiles || [];

  // ---- Role-based guard ----
  const hasStaffAccess = roles.some((r) => STAFF_ALLOWED_ROLES.includes(r));

  if (rolesLoading || staffLoading || branchesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-gray-600">Loading staff management...</span>
        </div>
      </div>
    );
  }

  if (!hasStaffAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 sm:p-8 max-w-md text-center">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-amber-600 font-bold text-xl">🔒</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-amber-900 mb-2">
            Access Restricted
          </h2>
          <p className="text-sm sm:text-base text-amber-700 mb-4">
            Staff management requires one of: {STAFF_ALLOWED_ROLES.join(', ')}.
          </p>
          <p className="text-xs sm:text-sm text-amber-600">
            Your current roles: {roles.length ? roles.join(', ') : 'none'}
          </p>
        </div>
      </div>
    );
  }

  if (rolesError || staffError || branchesError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 sm:p-8 max-w-md">
          <h2 className="text-red-800 font-bold text-sm sm:text-base mb-2">
            Error loading staff data
          </h2>
          <p className="text-red-600 text-sm sm:text-base mb-4">
            {(rolesError || staffError || branchesError)?.message ||
              'Failed to load staff management data.'}
          </p>
        </div>
      </div>
    );
  }

  const isEditing = !!editingStaffId;
  const selectedRole = availableRoles.find((r) => r.id === form.role_id);

  const handleInputChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrorState(null);
  };

  const handleTeacherChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      teacher: { ...prev.teacher, [field]: value },
    }));
    setErrorState(null);
  };

  const handleScopeChange = (value) => {
    setScopeType(value);
    setForm((prev) => ({
      ...prev,
      scope_type: value,
      ...(value === 'SCHOOL' ? { scope_branch_id: '' } : {}),
    }));
    setErrorState(null);
  };

  const handleBranchChange = (value) => {
    setForm((prev) => ({ ...prev, scope_branch_id: value }));
    setErrorState(null);
  };

  const handleRoleChange = (value) => {
    setForm((prev) => ({ ...prev, role_id: value }));
    setErrorState(null);
  };

  const handleEditStaff = (staff) => {
    setEditingStaffId(staff.id);
    const user = staff.user || {};
    const teacher = staff.teacher_profile || null;
    setForm({
      role_id: '',
      scope_type: staff.branch_id ? 'BRANCH' : 'SCHOOL',
      scope_branch_id: staff.branch_id || '',
      first_name: user.first_name || '',
      middle_name: user.middle_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      employee_code: staff.employee_code || '',
      job_title: staff.job_title || '',
      hired_on: staff.hired_on || '',
      teacher: {
        education_level: teacher?.education_level || '',
        field_of_study: teacher?.field_of_study || '',
        academic_background: teacher?.academic_background || '',
        years_of_experience: teacher?.years_of_experience || '',
        teaching_license_number: teacher?.teaching_license_number || '',
        employment_type: teacher?.employment_type || '',
      },
    });
    setScopeType(staff.branch_id ? 'BRANCH' : 'SCHOOL');
    setErrorState(null);
    setSuccessState(null);
  };

  const handleCancelEdit = () => {
    setEditingStaffId(null);
    setForm({
      role_id: '',
      scope_type: 'SCHOOL',
      scope_branch_id: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      employee_code: '',
      job_title: '',
      hired_on: '',
      teacher: {
        education_level: '',
        field_of_study: '',
        academic_background: '',
        years_of_experience: '',
        teaching_license_number: '',
        employment_type: '',
      },
    });
    setScopeType('SCHOOL');
    setErrorState(null);
    setSuccessState(null);
  };

  const handleSaveStaff = async () => {
    setErrorState(null);
    setSuccessState(null);

    // Basic validation
    if (!form.role_id) {
      setErrorState('Role is required.');
      return;
    }
    if (!form.first_name) {
      setErrorState('First name is required.');
      return;
    }
    if (!form.last_name) {
      setErrorState('Last name is required.');
      return;
    }
    if (!form.email) {
      setErrorState('Email is required.');
      return;
    }
    if (scopeType === 'BRANCH' && !form.scope_branch_id) {
      setErrorState('Branch is required for branch-scoped staff.');
      return;
    }

    const isTeacher = selectedRole?.name === 'TEACHER';

    const variables = {
      object: {
        is_delete: false,
        ...(isEditing ? { id: editingStaffId } : {}),
        role_id: form.role_id,
        scope_type: scopeType,
        ...(scopeType === 'BRANCH' ? { scope_branch_id: form.scope_branch_id } : {}),
        first_name: form.first_name,
        middle_name: form.middle_name || null,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || null,
        password: isEditing ? undefined : form.password || null,
        employee_code: form.employee_code || null,
        job_title: form.job_title || null,
        hired_on: form.hired_on || null,
        ...(isTeacher
          ? {
              teacher: {
                education_level: form.teacher.education_level || null,
                field_of_study: form.teacher.field_of_study || null,
                academic_background: form.teacher.academic_background || null,
                years_of_experience:
                  form.teacher.years_of_experience !== ''
                    ? Number(form.teacher.years_of_experience)
                    : null,
                teaching_license_number:
                  form.teacher.teaching_license_number || null,
                employment_type: form.teacher.employment_type || null,
              },
            }
          : {}),
      },
    };

    const setLoading = isEditing ? setUpdateLoading : setCreateLoading;
    setLoading(isEditing ? new Set([editingStaffId]) : true);

    try {
      const res = await manageUserMutation({ variables });

      if (res.error) {
        throw new Error(res.error.message || 'Failed to save staff member.');
      }

      const data = res.data.ManageUser;

      if (isEditing) {
        setSuccessState(
          `Staff member "${data.first_name} ${data.last_name}" updated successfully.`
        );
      } else {
        setSuccessState(
          `Staff member "${data.first_name} ${data.last_name}" created successfully.`
        );
      }

      handleCancelEdit();
    } catch (err) {
      setErrorState(err.message || 'Failed to save staff member. Please try again.');
    } finally {
      setLoading(isEditing ? new Set() : false);
    }
  };

  const handleResetPassword = async (userId, staffName) => {
    if (!window.confirm(`Reset password for ${staffName}?`)) {
      return;
    }
    setResetPasswordLoading((prev) => new Set([...prev, userId]));
    setErrorState(null);

    try {
      const res = await manageUserMutation({
        variables: {
          object: {
            is_delete: false,
            id: userId,
            password: 'ChangeMeNow123!',
          },
        },
      });

      if (res.error) {
        throw new Error(res.error.message || 'Failed to reset password.');
      }

      setSuccessState(`Password reset for ${staffName}.`);
    } catch (err) {
      setErrorState(err.message || 'Failed to reset password.');
    } finally {
      setResetPasswordLoading((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleDeactivateStaff = async (staff) => {
    if (
      !window.confirm(
        `Are you sure you want to deactivate "${staff.user?.first_name} ${staff.user?.last_name}"?`
      )
    ) {
      return;
    }
    setDeleteLoading((prev) => new Set([...prev, staff.id]));
    setErrorState(null);

    try {
      const res = await manageUserMutation({
        variables: {
          object: {
            is_delete: true,
            id: staff.id,
          },
        },
      });

      if (res.error) {
        throw new Error(res.error.message || 'Failed to deactivate staff member.');
      }

      setSuccessState(
        `Staff member "${staff.user?.first_name} ${staff.user?.last_name}" deactivated.`
      );
    } catch (err) {
      setErrorState(err.message || 'Failed to deactivate staff member.');
    } finally {
      setDeleteLoading((prev) => {
        const next = new Set(prev);
        next.delete(staff.id);
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 xl:py-10 max-w-7xl">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 sm:mb-0 sm:mb-4">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                👥
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                  Staff Management
                </h1>
                <p className="text-sm text-indigo-600 font-medium">
                  School Owner / School Admin / Provider
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Create, update, and deactivate staff and teacher accounts. Teacher
              details include education level, field of study, and employment
              type.
            </p>
          </div>
        </div>

        {/* Error / Success banners */}
        {error && (
          <div className="rounded-xl bg-red-50 p-4 sm:p-5 border border-red-100 shadow-sm mb-6 sm:mb-8 flex items-start gap-3 sm:gap-4">
            <span className="text-red-500 flex shrink-0 mt-0.5 sm:mt-0">⚠</span>
            <div>
              <p className="text-sm text-red-800 font-medium">Error</p>
              <p className="text-sm text-red-600 mt-1 sm:mt-2">{error}</p>
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

        <div className="space-y-8 sm:space-y-10">
          {/* ================================================================
               LEFT: Create / Edit Staff Form
               ================================================================ */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6 mb-8 sm:mb-0">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-5 sm:mb-6 flex items-center gap-2">
              <span className="w-5 sm:w-6 h-5 sm:h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs sm:text-sm font-bold">
                {isEditing ? '✎' : '+'}
              </span>
              {isEditing ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h2>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-5 sm:space-y-6">
              {/* Role select */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Role *
                </label>
                <select
                  name="role_id"
                  value={form.role_id}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="">Select a role</option>
                  {availableRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
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
                      onChange={() => handleScopeChange('SCHOOL')}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm sm:text-base text-gray-700">
                      School-wide
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="radio"
                      name="scope_type"
                      value="BRANCH"
                      checked={scopeType === 'BRANCH'}
                      onChange={() => handleScopeChange('BRANCH')}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm sm:text-base text-gray-700">
                      Branch-scoped
                    </span>
                  </label>
                </div>
              </div>

              {/* Branch select (conditional) */}
              {scopeType === 'BRANCH' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Branch *
                  </label>
                  <select
                    name="scope_branch_id"
                    value={form.scope_branch_id}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
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

              {/* Basic info fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    First Name *
                  </label>
                  <input
                    name="first_name"
                    type="text"
                    value={form.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="e.g., Helen"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Last Name *
                  </label>
                  <input
                    name="last_name"
                    type="text"
                    value={form.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="e.g., Tadesse"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Email *
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="e.g., helen@school.local"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Phone
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="e.g., 251922334455"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Employee Code
                  </label>
                  <input
                    name="employee_code"
                    type="text"
                    value={form.employee_code}
                    onChange={(e) => handleInputChange('employee_code', e.target.value)}
                    placeholder="e.g., T-001"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Job Title
                  </label>
                  <input
                    name="job_title"
                    type="text"
                    value={form.job_title}
                    onChange={(e) => handleInputChange('job_title', e.target.value)}
                    placeholder="e.g., Mathematics Teacher"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="mt-4 sm:mt-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Hired On
                </label>
                <input
                  name="hired_on"
                  type="date"
                  value={form.hired_on}
                  onChange={(e) => handleInputChange('hired_on', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              {/* Teacher-specific fields (shown when role is TEACHER) */}
              {isTeacher && (
                <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
                  <h3 className="text-xs sm:text-sm font-bold text-indigo-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <span className="w-4 sm:w-5 h-4 sm:h-5 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs sm:text-sm font-bold">
                      🎓
                    </span>
                    Teacher Details
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-5">
                    These fields are required when the selected role is
                    <strong>TEACHER</strong>.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Education Level
                      </label>
                      <select
                        name="teacher.education_level"
                        value={form.teacher.education_level}
                        onChange={(e) =>
                          handleTeacherChange('education_level', e.target.value)
                        }
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      >
                        <option value="">Select level</option>
                        {EDUCATION_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Employment Type
                      </label>
                      <select
                        name="teacher.employment_type"
                        value={form.teacher.employment_type}
                        onChange={(e) =>
                          handleTeacherChange('employment_type', e.target.value)
                        }
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      >
                        <option value="">Select type</option>
                        {EMPLOYMENT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Field of Study
                      </label>
                      <input
                        name="teacher.field_of_study"
                        type="text"
                        value={form.teacher.field_of_study}
                        onChange={(e) =>
                          handleTeacherChange('field_of_study', e.target.value)
                        }
                        placeholder="e.g., Mathematics"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Academic Background
                      </label>
                      <input
                        name="teacher.academic_background"
                        type="text"
                        value={form.teacher.academic_background}
                        onChange={(e) =>
                          handleTeacherChange('academic_background', e.target.value)
                        }
                        placeholder="e.g., BSc Mathematics, Addis Ababa University"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Years of Experience
                      </label>
                      <input
                        name="teacher.years_of_experience"
                        type="number"
                        value={form.teacher.years_of_experience}
                        onChange={(e) =>
                          handleTeacherChange('years_of_experience', e.target.value)
                        }
                        min="0"
                        placeholder="e.g., 5"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Teaching License Number
                      </label>
                      <input
                        name="teacher.teaching_license_number"
                        type="text"
                        value={form.teacher.teaching_license_number}
                        onChange={(e) =>
                          handleTeacherChange(
                            'teaching_license_number',
                            e.target.value
                          )
                        }
                        placeholder="e.g., LIC-123"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveStaff}
                disabled={createLoading}
                className="w-full py-3.5 sm:py-4 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-sm hover:shadow-md"
              >
                {createLoading ? 'Saving…' : isEditing ? 'Update Staff' : 'Create Staff'}
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full py-3 sm:py-4 mt-3 sm:mt-4 rounded-lg font-medium text-gray-700 bg-gray-50 border border-gray-200 transition-all hover:bg-gray-100 focus:ring-2 focus:ring-indigo-500"
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>

          {/* ================================================================
               RIGHT: Staff List Table
               ================================================================ */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                Staff Directory
              </h2>
              <span className="text-xs sm:text-sm font-medium text-gray-500">
                {staffProfiles.length} staff member{staffProfiles.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="overflow-x-auto sm:overflow-visible">
              {staffProfiles.length === 0 ? (
                <div className="px-5 sm:px-6 py-12 sm:py-16 text-center">
                  <p className="text-gray-500 text-sm">
                    No staff members found. Add your first staff member using
                    the form on the left.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Employee Code</th>
                      <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Job Title</th>
                      <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider text-right sm:text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {staffProfiles.map((staff) => {
                      const user = staff.user || {};
                      const teacher = staff.teacher_profile || null;
                      const isTeacher = !!teacher;
                      const isDeleting = deleteLoading.has(staff.id);
                      const isResetting = resetPasswordLoading.has(user.id || staff.id);
                      return (
                        <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-900 font-medium">
                            {user.first_name} {user.last_name || ''}
                          </td>
                          <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                            {user.email}
                          </td>
                          <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                            {staff.employee_code || '—'}
                          </td>
                          <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                            {staff.job_title || '—'}
                          </td>
                          <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                            {isTeacher ? 'Teacher' : 'Staff'}
                          </td>
                          <td className="px-5 sm:px-6 py-4 sm:py-5 text-right sm:text-right">
                            <button
                              onClick={() => handleEditStaff(staff)}
                              disabled={isDeleting || isResetting}
                              className={`text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all ${isDeleting || isResetting ? 'text-gray-400 bg-gray-100 cursor-not-allowed border border-gray-200' : 'text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100'}`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleResetPassword(user.id || staff.id, `${user.first_name} ${user.last_name || ''}`)}
                              disabled={isDeleting || isResetting}
                              className={`ml-2 text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all ${isResetting ? 'text-gray-400 bg-gray-100 cursor-not-allowed border border-gray-200' : 'text-red-600 bg-red-50 border border-red-100/50 hover:bg-red-100'}`}
                            >
                              {isResetting ? 'Resetting…' : 'Reset Password'}
                            </button>
                            <button
                              onClick={() => handleDeactivateStaff(staff)}
                              disabled={isDeleting}
                              className={`ml-2 text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all ${isDeleting ? 'text-gray-400 bg-gray-100 cursor-not-allowed border border-gray-200' : 'text-red-600 bg-red-50 border border-red-100/50 hover:bg-red-100'}`}
                            >
                              {isDeleting ? 'Deactivating…' : 'Deactivate'}
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

          {/* Info note */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 sm:p-6">
            <h3 className="text-sm sm:text-base font-semibold text-indigo-900 mb-3 sm:mb-4 flex items-center gap-2">
              <span className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs sm:text-sm font-bold">
                ℹ
              </span>
              How staff management works
            </h3>
            <ul className="text-sm sm:text-base text-indigo-800 space-y-2 sm:space-y-3 list-disc pl-5 sm:pl-6">
              <li>
                <strong>Create:</strong> Select a role, scope (school or
                branch), and fill in the staff details. Teacher-specific fields
                (education level, employment type, etc.) appear when TEACHER is
                selected.
              </li>
              <li>
                <strong>Update:</strong> Click Edit on any staff member to
                modify their details or change their role.
              </li>
              <li>
                <strong>Deactivate / Delete:</strong> Set
                <code className="text-indigo-900 text-xs">is_delete: true</code>
                on the ManageUser action to remove a staff member.
              </li>
              <li>
                <strong>Reset Password:</strong> Sends a password reset via the
                ManageUser action with the given user id.
              </li>
              <li>
                Role names come from the available roles list (TEACHER,
                RECEPTIONIST, FINANCE, BRANCH_ADMIN, etc.).
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
