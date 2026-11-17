import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { apolloClient } from '../lib/apolloClient';
import { useAuthStore } from '../store/authStore';
import { MANAGE_GRADE_COURSE_MUTATION } from '../graphql/manageGradeCourseMutation';
import { COURSE_SETUP_QUERY } from '../graphql/courseSetupQuery';
import { LIST_ACADEMIC_CONFIG_QUERY } from '../graphql/listAcademicConfigQuery';

/**
 * Grade Course Assignment — per 06-courses.md:
 *
 *   ManageGradeCourse — upsert/delete pattern:
    - is_delete: true + id     → Delete
    - is_delete: false + id    → Update
    - is_delete: false         → Insert (create)
 *
 *   course_id must be a course for the same academic_year_id.
 *   Inactive courses cannot be attached.
 *   Year, grade, and course stay fixed on update.
 *
 *   Fields: academic_year_id, grade_level_id, course_id, sort_order, is_required
 *   (+ id for update/delete)
 *
 *   SCHOOL_OWNER / SCHOOL_ADMIN omit school_id (taken from access token).
 *
 * Requires Bearer access token attached automatically by Apollo auth link.
 */

const COURSE_ALLOWED_ROLES = [
  'SCHOOL_OWNER',
  'SCHOOL_ADMIN',
  'PROVIDER_ADMIN',
  'SUPER_PROVIDER_ADMIN',
];

export default function GradeCourseAssignment() {
  const { roles, schoolId } = useAuthStore();

  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(new Set());
  const [modalError, setModalError] = useState(null);
  const [modalSuccess, setModalSuccess] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);

  const [manageGradeCourseMutation] = useMutation(
    MANAGE_GRADE_COURSE_MUTATION,
    { client: apolloClient }
  );

  // Academic years + grade levels for dropdowns
  const {
    data: configData,
    loading: configLoading,
    error: configError,
  } = useQuery(LIST_ACADEMIC_CONFIG_QUERY, { client: apolloClient });

  // Courses + existing grade_course assignments for the selected year
  const {
    data: setupData,
    loading: setupLoading,
    refetch: refetchSetup,
  } = useQuery(COURSE_SETUP_QUERY, {
    client: apolloClient,
    variables: { academicYearId: selectedAcademicYearId },
    skip: !selectedAcademicYearId,
  });

  const academicYears = configData?.academic_years || [];
  const gradeLevels = configData?.grade_levels || [];

  // Flatten courses → grade_courses into a flat list of assignments
  const assignments = setupData?.courses
    ?.flatMap((course) =>
      course.grade_courses.map((gc) => ({
        ...gc,
        course_id: course.id,
        course_code: course.code,
        course_name: course.name,
      }))
    ) || [];

  const courses = setupData?.courses || [];

  // ---- Role-based guard ----
  const hasCourseAccess = roles.some((r) => COURSE_ALLOWED_ROLES.includes(r));

  if (configLoading || setupLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-gray-600">Loading course setup...</span>
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

  if (configError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <h2 className="text-red-800 font-bold text-sm sm:text-base mb-2">
            Error loading data
          </h2>
          <p className="text-red-600 text-sm sm:text-base mb-4">
            {configError.message}
          </p>
        </div>
      </div>
    );
  }

  // ---- Form state ----
  const [form, setForm] = useState({
    academic_year_id: selectedAcademicYearId,
    grade_level_id: '',
    course_id: '',
    sort_order: 1,
    is_required: false,
  });

  // ---- Open modal for create ----
  const handleOpenCreate = () => {
    setForm({
      academic_year_id: selectedAcademicYearId,
      grade_level_id: '',
      course_id: '',
      sort_order: 1,
      is_required: false,
    });
    setEditingId(null);
    setModalError(null);
    setModalSuccess(null);
    setOpenModal(true);
  };

  // ---- Open modal for edit ----
  const handleOpenEdit = (assignment) => {
    setForm({
      academic_year_id: assignment.academic_year_id || selectedAcademicYearId,
      grade_level_id: assignment.grade_level_id || '',
      course_id: assignment.course_id || '',
      sort_order: assignment.sort_order ?? 1,
      is_required: assignment.is_required ?? false,
    });
    setEditingId(assignment.id);
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
    if (!form.grade_level_id) {
      setModalError('Grade level is required.');
      setModalLoading(false);
      return;
    }
    if (!form.course_id) {
      setModalError('Course is required.');
      setModalLoading(false);
      return;
    }

    const variables = {
      object: {
        is_delete: false,
        ...(editingId ? { id: editingId } : {}),
        academic_year_id: form.academic_year_id,
        grade_level_id: form.grade_level_id,
        course_id: form.course_id,
        sort_order: Number(form.sort_order) || 1,
        is_required: form.is_required,
      },
    };

    try {
      const res = await manageGradeCourseMutation({ variables });
      if (res.error) {
        throw new Error(res.error.message || 'Failed to save grade course assignment');
      }
      setModalSuccess(
        editingId
          ? 'Grade course assignment updated successfully'
          : 'Grade course assignment created successfully'
      );
      setOpenModal(false);
      await refetchSetup();
    } catch (err) {
      setModalError(err.message || 'Failed to save grade course assignment');
    } finally {
      setModalLoading(false);
    }
  };

  // ---- Handle delete ----
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this course from the grade?')) {
      return;
    }
    setDeleteLoading((prev) => new Set([...prev, id]));
    setDeleteError(null);
    setDeleteSuccess(null);

    try {
      const res = await manageGradeCourseMutation({
        variables: {
          object: {
            is_delete: true,
            id,
          },
        },
      });
      if (res.error) {
        throw new Error(res.error.message || 'Failed to remove grade course assignment');
      }
      setDeleteSuccess('Grade course assignment removed successfully');
      await refetchSetup();
    } catch (err) {
      setDeleteError(err.message || 'Failed to remove grade course assignment');
    } finally {
      setDeleteLoading((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Helper: get course name by id
  const getCourseName = (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? `${course.code} — ${course.name}` : '—';
  };

  // Helper: get grade level name by id
  const getGradeLevelName = (gradeLevelId) => {
    const gl = gradeLevels.find((g) => g.id === gradeLevelId);
    return gl ? `${gl.code} — ${gl.name}` : '—';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 xl:py-10 max-w-7xl">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              Grade Course Assignment
            </h1>
            <p className="text-sm text-gray-600">
              Attach courses to grade levels. Each course belongs to one
              academic year and can be assigned to multiple grade levels with
              a sort order and required flag.
            </p>
          </div>
          {!selectedAcademicYearId && (
            <button
              disabled={academicYears.length === 0}
              className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md"
            >
              <span>+</span> Select Academic Year
            </button>
          )}
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
            <span className="text-green-500 flex shrink-0 sm:mt-0">✓</span>
            <div>
              <p className="text-sm text-green-800 font-medium">Success</p>
              <p className="text-sm text-green-600 mt-1 sm:mt-2">{deleteSuccess}</p>
            </div>
          </div>
        )}

        {/* Academic Year Selector */}
        {!selectedAcademicYearId && academicYears.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-3 sm:mb-4">
                Select Academic Year
              </label>
              <select
                value={selectedAcademicYearId}
                onChange={(e) => setSelectedAcademicYearId(e.target.value)}
                className="w-full sm:w-96 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">Select an academic year</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name} ({year.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {selectedAcademicYearId && (
          <>
            {/* Actions + Info */}
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <button
                onClick={handleOpenCreate}
                disabled={courses.length === 0}
                className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md"
              >
                <span>+</span> Assign Course to Grade
              </button>
              <p className="text-xs sm:text-sm text-gray-500">
                {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} across {courses.length} course{courses.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Grade Course Assignments Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                  Grade Course Assignments
                </h2>
              </div>

              <div className="overflow-x-auto sm:overflow-visible">
                {assignments.length === 0 ? (
                  <div className="px-5 sm:px-6 py-12 sm:py-16 text-center">
                    <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl sm:text-2xl font-bold mb-4 sm:mb-6 mx-auto">
                      📚
                    </div>
                    <p className="text-gray-500 text-sm sm:text-base">
                      No grade course assignments found.
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400 mt-2 sm:mt-4">
                      Click "Assign Course to Grade" to attach a course to a
                      grade level.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                        <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Grade Level</th>
                        <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Sort Order</th>
                        <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Required</th>
                        <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider text-right sm:text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {assignments.map((assignment) => {
                        const isDeleting = deleteLoading.has(assignment.id);
                        return (
                          <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 font-mono">
                              {getCourseName(assignment.course_id)}
                            </td>
                            <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                              {getGradeLevelName(assignment.grade_level_id)}
                            </td>
                            <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                              {assignment.sort_order}
                            </td>
                            <td className="px-5 sm:px-6 py-4 sm:py-5">
                              {assignment.is_required ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                  Yes
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                  No
                                </span>
                              )}
                            </td>
                            <td className="px-5 sm:px-6 py-4 sm:py-5 text-right sm:text-right">
                              <div className="flex items-center justify-end gap-2 sm:gap-3">
                                <button
                                  onClick={() => handleOpenEdit(assignment)}
                                  className="p-2 sm:p-2.5 text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.414l8.586-8.586z"></path>
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(assignment.id)}
                                  disabled={isDeleting}
                                  className={`p-2 sm:p-2.5 rounded-lg transition-colors ${isDeleting ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                                  title="Remove"
                                >
                                  {isDeleting ? (
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
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

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
                  {editingId ? 'Edit Assignment' : 'Assign Course to Grade'}
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
                    onChange={(e) =>
                      setForm({ ...form, academic_year_id: e.target.value })
                    }
                    disabled={!!editingId}
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

                {/* Grade Level */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Grade Level *
                  </label>
                  <select
                    name="grade_level_id"
                    value={form.grade_level_id}
                    onChange={(e) =>
                      setForm({ ...form, grade_level_id: e.target.value })
                    }
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">Select a grade level</option>
                    {gradeLevels.map((gl) => (
                      <option key={gl.id} value={gl.id}>
                        {gl.code} — {gl.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Course */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Course *
                  </label>
                  <select
                    name="course_id"
                    value={form.course_id}
                    onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} — {course.name}
                      </option>
                    ))}
                  </select>
                  {courses.length === 0 && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      No courses found for this academic year. Create a course
                      first.
                    </p>
                  )}
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Sort Order
                  </label>
                  <input
                    name="sort_order"
                    type="number"
                    min="1"
                    value={form.sort_order || 1}
                    onChange={(e) =>
                      setForm({ ...form, sort_order: Number(e.target.value) || 1 })
                    }
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Determines the display order of courses within the grade.
                  </p>
                </div>

                {/* Is Required */}
                <div>
                  <div className="flex items-start gap-3">
                    <input
                      name="is_required"
                      type="checkbox"
                      checked={form.is_required}
                      onChange={(e) =>
                        setForm({ ...form, is_required: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-1 sm:mt-0"
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Required Course
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Whether this course is mandatory for the grade level.
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
                    {modalLoading ? 'Saving…' : editingId ? 'Update Assignment' : 'Create Assignment'}
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
