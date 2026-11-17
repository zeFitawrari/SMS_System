import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { apolloClient } from '../lib/apolloClient';
import { useAuthStore } from '../store/authStore';
import {
  UPDATE_ENROLLMENT_SECTION_MUTATION,
} from '../graphql/updateEnrollmentSectionMutation';
import {
  LIST_ENROLLMENTS_QUERY,
} from '../graphql/enrollmentsQuery';
import {
  LIST_SECTIONS,
} from '../graphql/queries';

/**
 * Enrollment Section Management — per 03-student-registration.md:
 *
 *   UpdateEnrollmentSection (assign/change):
 *     mutation UpdateEnrollmentSection {
 *       UpdateEnrollmentSection(object: {
 *         enrollment_id: "..."
 *         section_id: "..."
 *       }) {
 *         enrollment_id
 *         section_id
 *         warning
 *       }
 *     }
 *
 *   UpdateEnrollmentSection (unassign):
 *     mutation UpdateEnrollmentSection {
 *       UpdateEnrollmentSection(object: {
 *         enrollment_id: "..."
 *         unassign: true
 *       }) {
 *         enrollment_id
 *         section_id
 *       }
 *     }
 *
 * Notes from contract:
 *   - Same mutation handles both assign and unassign
 *   - unassign: true removes the section assignment
 *   - warning field may be returned (e.g., capacity warning)
 *   - Requires registrar roles: school admin, branch admin, receptionist,
 *     finance, provider
 *   - Bearer access token attached automatically by Apollo auth link
 */

export default function EnrollmentSection() {
  const {
    schoolId,
    setLoading,
    setError,
  } = useAuthStore();

  const [openModal, setOpenModal] = useState(false);
  const [editingEnrollmentId, setEditingEnrollmentId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [unassignLoading, setUnassignLoading] = useState(new Set());
  const [modalError, setModalError] = useState(null);
  const [modalSuccess, setModalSuccess] = useState(null);
  const [unassignError, setUnassignError] = useState(null);
  const [unassignSuccess, setUnassignSuccess] = useState(null);

  const [updateEnrollmentSectionMutation] = useMutation(
    UPDATE_ENROLLMENT_SECTION_MUTATION,
    { client: apolloClient }
  );

  const {
    data,
    loading: queryLoading,
    error: queryError,
    refetch: refetchEnrollments,
  } = useQuery(LIST_ENROLLMENTS_QUERY, {
    client: apolloClient,
    variables: { academicYearId: '' },
    skip: true,
  });

  const {
    data: sectionsData,
    loading: sectionsLoading,
    error: sectionsError,
  } = useQuery(LIST_SECTIONS, {
    client: apolloClient,
    variables: {
      schoolId: schoolId || '',
      branchId: '',
      academicYearId: '',
      gradeLevelId: '',
    },
    skip: true,
  });

  const enrollments = data?.enrollments || [];
  const sections = sectionsData?.grade_section_slots || [];

  const [form, setForm] = useState({
    enrollment_id: '',
    section_id: '',
    academicYearId: '',
    branchId: '',
    gradeLevelId: '',
  });

  const handleUpdateSection = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);
    setModalSuccess(null);

    const variables = {
      object: {
        enrollment_id: form.enrollment_id,
        section_id: form.section_id,
      },
    };

    try {
      const res = await updateEnrollmentSectionMutation({ variables });
      if (res.error) {
        throw new Error(res.error.message || 'Failed to update section');
      }

      const d = res.data.UpdateEnrollmentSection;
      setModalSuccess(
        d.warning
          ? `Section updated. Warning: ${d.warning}`
          : 'Section assigned successfully'
      );
      setOpenModal(false);
      await refetchEnrollments();
    } catch (err) {
      setModalError(err.message || 'Failed to update section');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUnassignSection = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to unassign the section from this enrollment?')) {
      return;
    }
    setUnassignLoading((prev) => new Set([...prev, enrollmentId]));
    setUnassignError(null);
    setUnassignSuccess(null);

    try {
      const res = await updateEnrollmentSectionMutation({
        variables: {
          object: {
            enrollment_id: enrollmentId,
            unassign: true,
          },
        },
      });
      if (res.error) {
        throw new Error(res.error.message || 'Failed to unassign section');
      }

      setUnassignSuccess('Section unassigned successfully');
      await refetchEnrollments();
    } catch (err) {
      setUnassignError(err.message || 'Failed to unassign section');
    } finally {
      setUnassignLoading((prev) => {
        const next = new Set(prev);
        next.delete(enrollmentId);
        return next;
      });
    }
  };

  const handleOpenAssign = (enrollmentId, currentSectionId) => {
    setForm({
      enrollment_id: enrollmentId,
      section_id: currentSectionId || '',
      academicYearId: form.academicYearId,
      branchId: form.branchId,
      gradeLevelId: form.gradeLevelId,
    });
    setEditingEnrollmentId(enrollmentId);
    setModalError(null);
    setModalSuccess(null);
    setOpenModal(true);
  };

  if (queryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-gray-600">Loading enrollments...</span>
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <h2 className="text-red-800 font-bold text-sm mb-2">Error loading data</h2>
          <p className="text-red-600 text-xs mb-4">{queryError.message}</p>
          <button
            onClick={() => refetchEnrollments()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 xl:py-10 max-w-7xl">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              Enrollment Section Management
            </h1>
            <p className="text-sm text-gray-600">
              Assign or change sections for student enrollments.
              Sections can also be unassigned when needed.
            </p>
          </div>
        </div>

        {modalError && (
          <div className="rounded-xl bg-red-50 p-4 sm:p-5 border border-red-100 shadow-sm mb-6 sm:mb-8 flex items-start gap-3 sm:gap-4">
            <span className="text-red-500 flex shrink-0 mt-0.5 sm:mt-0">⚠</span>
            <div>
              <p className="text-sm text-red-800 font-medium">Update Error</p>
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
        {unassignError && (
          <div className="rounded-xl bg-red-50 p-4 sm:p-5 border border-red-100 shadow-sm mb-6 sm:mb-8 flex items-start gap-3 sm:gap-4">
            <span className="text-red-500 flex shrink-0 mt-0.5 sm:mt-0">⚠</span>
            <div>
              <p className="text-sm text-red-800 font-medium">Unassign Error</p>
              <p className="text-sm text-red-600 mt-1 sm:mt-2">{unassignError}</p>
            </div>
          </div>
        )}
        {unassignSuccess && (
          <div className="rounded-xl bg-green-50 p-4 sm:p-5 border border-green-100 shadow-sm mb-6 sm:mb-8 flex items-start gap-3 sm:gap-4">
            <span className="text-green-500 flex shrink-0 mt-0.5 sm:mt-0">✓</span>
            <div>
              <p className="text-sm text-green-800 font-medium">Success</p>
              <p className="text-sm text-green-600 mt-1 sm:mt-2">{unassignSuccess}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">
              Enrollments ({enrollments.length})
            </h2>
          </div>

          <div className="overflow-x-auto sm:overflow-visible">
            {enrollments.length === 0 ? (
              <div className="px-5 sm:px-6 py-12 sm:py-16 text-center">
                <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl sm:text-2xl font-bold mb-4 sm:mb-6 mx-auto">
                  👨‍🎓
                </div>
                <p className="text-gray-500 text-sm sm:text-base">
                  No enrollments found.
                </p>
                <p className="text-xs sm:text-sm text-gray-400 mt-2 sm:mt-4">
                  Select filters or register a new student to see enrollments.
                </p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Registration ID</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Grade Level</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider text-center sm:text-center">Section</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Enrolled On</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider text-right sm:text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-900 font-medium">
                        {enrollment.student?.user?.first_name} {enrollment.student?.user?.last_name}
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 break-all">
                        {enrollment.student?.registration_id || '—'}
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                        {enrollment.grade_level_id || '—'}
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                        {enrollment.section_id || (
                          <span className="text-gray-400">No section</span>
                        )}
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                        {enrollment.enrolled_on || '—'}
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium ${
                          enrollment.status === 'active'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {enrollment.status || '—'}
                        </span>
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-right sm:text-right">
                        <div className="flex items-center justify-end gap-2 sm:gap-3">
                          <button
                            onClick={() => handleOpenAssign(enrollment.id, enrollment.section_id || '')}
                            className="p-2 sm:p-2.5 text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                            title="Assign/Change Section"
                          >
                            <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.414l8.586-8.586z"></path>
                            </svg>
                          </button>
                          {enrollment.section_id && (
                            <button
                              onClick={() => handleUnassignSection(enrollment.id)}
                              disabled={unassignLoading.has(enrollment.id)}
                              className={`p-2 sm:p-2.5 rounded-lg transition-colors ${unassignLoading.has(enrollment.id) ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                              title="Unassign Section"
                            >
                              {unassignLoading.has(enrollment.id) ? (
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
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            openModal ? '' : 'hidden'
          }`}
        >
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setOpenModal(false)}></div>
          <div className="relative w-full max-w-md sm:max-w-lg mx-auto mt-10 sm:mt-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-5 sm:p-8">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Assign Section
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

              <form onSubmit={handleUpdateSection} className="space-y-5 sm:space-y-7">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Enrollment ID
                  </label>
                  <input
                    type="text"
                    value={form.enrollment_id}
                    readOnly
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 focus:ring-0 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Section *
                  </label>
                  <select
                    name="section_id"
                    value={form.section_id}
                    onChange={(e) => setForm({ ...form, section_id: e.target.value })}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">Select section</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.section_name} (Slot {s.slot_index}, Capacity: {s.max_capacity})
                      </option>
                    ))}
                  </select>
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
                    {modalLoading ? 'Updating…' : 'Assign Section'}
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
