import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { apolloClient } from '../lib/apolloClient';
import { useAuthStore } from '../store/authStore';
import { MANAGE_COURSE_MUTATION } from '../graphql/manageCourseMutation';
import { LIST_ACADEMIC_CONFIG_QUERY } from '../graphql/listAcademicConfigQuery';

/**
 * Course Management — per 06-courses.md:
 *
 *   ManageCourse — upsert/delete pattern:
    - is_delete: true + id     → Delete
    - is_delete: false + id    → Update
    - is_delete: false         → Insert (create)
 *
 *   Fields: academic_year_id, code, name, description, is_active
 *   (+ id for update/delete)
 *
 *   SCHOOL_OWNER / SCHOOL_ADMIN omit school_id (taken from access token).
 *   Platform admin passes school_id.
 *
 * Requires Bearer access token attached automatically by Apollo auth link.
 */

const COURSE_ALLOWED_ROLES = [
  'SCHOOL_OWNER',
  'SCHOOL_ADMIN',
  'PROVIDER_ADMIN',
  'SUPER_PROVIDER_ADMIN',
];

export default function CourseManagement() {
  const { roles, schoolId } = useAuthStore();

  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(new Set());
  const [modalError, setModalError] = useState(null);
  const [modalSuccess, setModalSuccess] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);

  const [manageCourseMutation] = useMutation(MANAGE_COURSE_MUTATION, {
    client: apolloClient,
  });

  const {
    data,
    loading: queryLoading,
    error: queryError,
    refetch: refetchConfig,
  } = useQuery(LIST_ACADEMIC_CONFIG_QUERY, { client: apolloClient });

  const academicYears = data?.academic_years || [];

  // ---- Role-based guard ----
  const hasCourseAccess = roles.some((r) => COURSE_ALLOWED_ROLES.includes(r));

  if (queryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-gray-600">Loading courses...</span>
        </div>
      </div>
    );
  }

  if (!hasCourseAccess) {
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
            Course management requires one of: {COURSE_ALLOWED_ROLES.join(', ')}.
          </p>
          <p className="text-xs sm:text-sm text-amber-600">
            Your current roles: {roles.length ? roles.join(', ') : 'none'}
          </p>
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <h2 className="text-red-800 font-bold text-sm sm:text-base mb-2">
            Error loading data
          </h2>
          <p className="text-red-600 text-sm sm:text-base mb-4">
            {queryError.message}
          </p>
        </div>
      </div>
    );
  }

  // ---- Form state ----
  const [form, setForm] = useState({
    academic_year_id: '',
    code: '',
    name: '',
    description: '',
    is_active: true,
  });

  // ---- Open modal for create ----
  const handleOpenCreate = () => {
    setForm({
      academic_year_id: '',
      code: '',
      name: '',
      description: '',
      is_active: true,
    });
    setEditingId(null);
    setModalError(null);
    setModalSuccess(null);
    setOpenModal(true);
  };

  // ---- Open modal for edit ----
  const handleOpenEdit = (course) => {
    setForm({
      academic_year_id: course.academic_year_id || '',
      code: course.code || '',
      name: course.name || '',
      description: course.description || '',
      is_active: course.is_active ?? true,
    });
    setEditingId(course.id);
    setModalError(null);
    setModalSuccess(null);
    setOpenModal(true);
  };

  // ---- Handle submit (create or update) ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);
    setModalSuccess(null);

    if (!form.academic_year_id) {
      setModalError('Academic year is required.');
      setModalLoading(false);
      return;
    }
    if (!form.code) {
      setModalError('Course code is required.');
      setModalLoading(false);
      return;
    }
    if (!form.name) {
      setModalError('Course name is required.');
      setModalLoading(false);
      return;
    }

    const variables = {
      object: {
        is_delete: false,
        ...(editingId ? { id: editingId } : {}),
        academic_year_id: form.academic_year_id,
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        is_active: form.is_active,
      },
    };

    try {
      const res = await manageCourseMutation({ variables });
      if (res.error) {
        throw new Error(res.error.message || 'Failed to save course');
      }
      setModalSuccess(
        editingId
          ? 'Course updated successfully'
          : 'Course created successfully'
      );
      setOpenModal(false);
      await refetchConfig();
    } catch (err) {
      setModalError(err.message || 'Failed to save course');
    } finally {
      setModalLoading(false);
    }
  };

  // ---- Handle delete ----
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return;
    }
    setDeleteLoading((prev) => new Set([...prev, id]));
    setDeleteError(null);
    setDeleteSuccess(null);

    try {
      const res = await manageCourseMutation({
        variables: {
          object: {
            is_delete: true,
            id,
          },
        },
      });
      if (res.error) {
        throw new Error(res.error.message || 'Failed to delete course');
      }
      setDeleteSuccess('Course deleted successfully');
      await refetchConfig();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete course');
    } finally {
      setDeleteLoading((prev) => {
        const next = new Set(prev);
        next.delete(id);
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              Course Management
            </h1>
            <p className="text-sm text-gray-600">
              Create, update, and delete courses. Each course belongs to one
              academic year and can then be attached to grade levels.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-semibold text-white transition-all bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md"
          >
            <span>+</span> Add Course
          </button>
        </div>

        {/* Modal Error / Success */}
        {modalError && (
          <div className="rounded-xl bg-red-50 p-4 sm:p-5 border border-red-100 shadow-sm mb-6 sm:mb-8 flex items-start gap-3 sm:gap-4">
            <span className="text-red-500 flex shrink-0 mt-0.5 sm:mt-0">⚠</span>
            <div>
              <p className="text-sm text-red-800 font-medium">Save Error</p>
              <p className="text-sm text-red-600 mt-1 sm:mt-2">{modalError}</p>
            </div>
          </div>
        )}
        {modalSuccess && (
          <div className="rounded-xl bg-green-50 p-4 sm:p-5 border border-green-100 shadow-sm mb-6 sm:mb-8 flex items-start gap-3 sm:gap-4">
            <span className="text-green-500 flex shrink-0 mt-0.5 sm:mt-0">✓</span>
            <div>
              <p className="text-sm text-green-800 font-medium">Success</p>
              <p className="text-sm text-green-600 mt-1 sm:mt-2">{modalSuccess}</p>
            </div>
          </div>
        )}
        {deleteError && (
          <div className="rounded-xl bg-red-50 p-4 sm:p-5 border border-red-100 shadow-sm mb-6 sm:mb-8 flex items-start gap-3 sm:gap-4">
            <span className="text-red-500 flex shrink-0 mt-0.5 sm:mt-0">⚠</span>
            <div>
              <p className="text-sm text-red-800 font-medium">Delete Error</p>
              <p className="text-sm text-red-600 mt-1 sm:mt-2">{deleteError}</p>
            </div>
          </div>
        )}
        {deleteSuccess && (
          <div className="rounded-xl bg-green-50 p-4 sm:p-5 border border-green-100 shadow-sm mb-6 sm:mb-8 flex items-start gap-3 sm:gap-4">
            <span className="text-green-500 flex shrink-0 mt-0.5 sm:mt-0">✓</span>
            <div>
              <p className="text-sm text-green-800 font-medium">Success</p>
              <p className="text-sm text-green-600 mt-1 sm:mt-2">{deleteSuccess}</p>
            </div>
          </div>
        )}

        {/* Courses Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">
              Courses ({academicYears.length})
            </h2>
          </div>

          <div className="overflow-x-auto sm:overflow-visible">
            {academicYears.length === 0 ? (
              <div className="px-5 sm:px-6 py-12 sm:py-16 text-center">
                <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl sm:text-2xl font-bold mb-4 sm:mb-6 mx-auto">
                  📚
                </div>
                <p className="text-gray-500 text-sm sm:text-base">
                  No courses found.
                </p>
                <p className="text-xs sm:text-sm text-gray-400 mt-2 sm:mt-4">
                  Click "Add Course" to create your first course.
                </p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Academic Year</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider text-right sm:text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {academicYears.map((year) => (
                    <tr key={year.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 font-mono">
                        {year.code}
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-900 font-medium">
                        {year.name}
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                        {year.starts_on}
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5">
                        {year.is_current ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            Current Year
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            Inactive Year
                          </span>
                        )}
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-right sm:text-right">
                        <div className="flex items-center justify-end gap-2 sm:gap-3">
                          <button
                            onClick={() => handleOpenEdit(year)}
                            className="p-2 sm:p-2.5 text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.414l8.586-8.586z"></path>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(year.id)}
                            disabled={deleteLoading.has(year.id)}
                            className={`p-2 sm:p-2.5 rounded-lg transition-colors ${deleteLoading.has(year.id) ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                            title="Delete"
                          >
                            {deleteLoading.has(year.id) ? (
                              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-4 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6.4m6.549.945a12.48 12.48 0 002.504-2.318m-4.302-.455a12.48 12.48 0 01-2.504-2.318m-4.302-.455c-.787-.786-1.79-1.39-2.895-1.707a11.1 11.1 0 00-2.09 0c-1.105.317-2.108.921-2.895 1.707m-4.302-.455c-.787-.786-1.79-1.39-2.895-1.707a11.1 11.1 0 00-2.09 0c-1.105.317-2.108.921-2.895 1.707m7.506 6.549a12.48 12.48 0 002.504-2.318"></path>
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            openModal ? '' : 'hidden'
          }`}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setOpenModal(false)}
          ></div>

          {/* Modal Panel */}
          <div className="relative w-full max-w-md sm:max-w-lg mx-auto mt-10 sm:mt-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-5 sm:p-8">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {editingId ? 'Edit Course' : 'Create Course'}
                </h2>
                <button
                  onClick={() => setOpenModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-7">
                {/* Academic Year */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Academic Year *
                  </label>
                  <select
                    name="academic_year_id"
                    value={form.academic_year_id}
                    onChange={(e) => setForm({ ...form, academic_year_id: e.target.value })}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">Select an academic year</option>
                    {academicYears.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.name} ({year.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Code */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Course Code *
                  </label>
                  <input
                    name="code"
                    type="text"
                    placeholder="e.g., MATH"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Course Name *
                  </label>
                  <input
                    name="name"
                    type="text"
                    placeholder="e.g., Mathematics"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="e.g., Core mathematics"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                {/* Is Active */}
                <div>
                  <div className="flex items-start gap-3">
                    <input
                      name="is_active"
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) =>
                        setForm({ ...form, is_active: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-1 sm:mt-0"
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Active Course
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Inactive courses cannot be attached to grade levels.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setOpenModal(false)}
                    className="flex-1 py-3 sm:py-4 rounded-lg font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 py-3 sm:py-4 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md"
                  >
                    {modalLoading ? 'Saving…' : editingId ? 'Update Course' : 'Create Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
