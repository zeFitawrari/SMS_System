import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { apolloClient } from '../lib/apolloClient';
import { useAuthStore } from '../store/authStore';
import { MANAGE_SECTION_SLOT_MUTATION } from '../graphql/manageSectionSlotMutation';
import { LIST_ACADEMIC_CONFIG_QUERY } from '../graphql/listAcademicConfigQuery';

/**
 * Section Slots — per 02-academic-setup.md:
 *
 *   ManageSectionSlot — upsert/delete pattern:
   - is_delete: true + id     → Delete
   - is_delete: false + id    → Update
   - is_delete: false         → Insert
 *
 *   Fields: school_id, branch_id, academic_year_id, grade_level_id,
 *           slot_index, section_name, max_capacity
 *
 * Requires SCHOOL_OWNER / SCHOOL_ADMIN (or provider).
 */

export default function SectionSlots() {
  const {
    schoolId,
    setLoading,
    setError,
  } = useAuthStore();

  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(new Set());
  const [modalError, setModalError] = useState(null);
  const [modalSuccess, setModalSuccess] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);

  const [manageSectionSlotMutation] = useMutation(
    MANAGE_SECTION_SLOT_MUTATION,
    { client: apolloClient }
  );

  const {
    data,
    loading: queryLoading,
    error: queryError,
    refetch: refetchConfig,
  } = useQuery(LIST_ACADEMIC_CONFIG_QUERY, { client: apolloClient });

  const slots = data?.grade_section_slots || [];
  const branches = data?.branches || [];
  const academicYears = data?.academic_years || [];
  const gradeLevels = data?.grade_levels || [];

  const [form, setForm] = useState({
    school_id: schoolId || '',
    branch_id: '',
    academic_year_id: '',
    grade_level_id: '',
    slot_index: 1,
    section_name: 'A',
    max_capacity: 40,
  });

  const handleOpenCreate = () => {
    setForm({
      school_id: schoolId || '',
      branch_id: '',
      academic_year_id: '',
      grade_level_id: '',
      slot_index: 1,
      section_name: 'A',
      max_capacity: 40,
    });
    setEditingId(null);
    setModalError(null);
    setModalSuccess(null);
    setOpenModal(true);
  };

  const handleOpenEdit = (slot) => {
    setForm({
      school_id: slot.school_id || schoolId || '',
      branch_id: slot.branch_id || '',
      academic_year_id: slot.academic_year_id || '',
      grade_level_id: slot.grade_level_id || '',
      slot_index: slot.slot_index?.toString() || '1',
      section_name: slot.section_name || 'A',
      max_capacity: slot.max_capacity?.toString() || '40',
    });
    setEditingId(slot.id);
    setModalError(null);
    setModalSuccess(null);
    setOpenModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);
    setModalSuccess(null);

    const variables = {
      object: {
        is_delete: false,
        ...(editingId ? { id: editingId } : {}),
        school_id: form.school_id,
        branch_id: form.branch_id,
        academic_year_id: form.academic_year_id,
        grade_level_id: form.grade_level_id,
        slot_index: parseInt(form.slot_index) || 1,
        section_name: form.section_name,
        max_capacity: parseInt(form.max_capacity) || 40,
      },
    };

    try {
      const res = await manageSectionSlotMutation({ variables });
      if (res.error) {
        throw new Error(res.error.message || 'Failed to save section slot');
      }
      setModalSuccess(
        editingId
          ? 'Section slot updated successfully'
          : 'Section slot created successfully'
      );
      setOpenModal(false);
      await refetchConfig();
    } catch (err) {
      setModalError(err.message || 'Failed to save section slot');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this section slot?')) {
      return;
    }
    setDeleteLoading((prev) => new Set([...prev, id]));
    setDeleteError(null);
    setDeleteSuccess(null);

    try {
      const res = await manageSectionSlotMutation({
        variables: {
          object: {
            is_delete: true,
            school_id: schoolId || '',
            id,
          },
        },
      });
      if (res.error) {
        throw new Error(res.error.message || 'Failed to delete section slot');
      }
      setDeleteSuccess('Section slot deleted successfully');
      await refetchConfig();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete section slot');
    } finally {
      setDeleteLoading((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const getBranchName = (id) => {
    const b = branches.find((br) => br.id === id);
    return b ? `${b.name} (${b.code})` : 'Unknown';
  };

  const getYearName = (id) => {
    const y = academicYears.find((yr) => yr.id === id);
    return y ? `${yr.name} (${yr.code})` : 'Unknown';
  };

  const getLevelName = (id) => {
    const g = gradeLevels.find((gl) => gl.id === id);
    return g ? `${g.name} (${g.code})` : 'Unknown';
  };

  if (queryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-gray-600">Loading section slots...</span>
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
              Section Slots
            </h1>
            <p className="text-sm text-gray-600">
              Configure class sections (A, B, C, etc.) per grade level for each
              academic year and branch.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-semibold text-white transition-all bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md"
          >
            <span>+</span> Add Section Slot
          </button>
        </div>

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

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">
              Section Slots ({slots.length})
            </h2>
          </div>

          <div className="overflow-x-auto sm:overflow-visible">
            {slots.length === 0 ? (
              <div className="px-5 sm:px-6 py-12 sm:py-16 text-center">
                <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl sm:text-2xl font-bold mb-4 sm:mb-6 mx-auto">
                  🏫
                </div>
                <p className="text-gray-500 text-sm sm:text-base">
                  No section slots configured.
                </p>
                <p className="text-xs sm:text-sm text-gray-400 mt-2 sm:mt-4">
                  Click "Add Section Slot" to create class sections.
                </p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Academic Year</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Grade Level</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider text-center sm:text-center">Slot Index</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Section Name</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider text-right sm:text-right">Max Capacity</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider text-right sm:text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {slots.map((slot) => (
                    <tr key={slot.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-900 font-medium">
                        {getBranchName(slot.branch_id)}
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                        {getYearName(slot.academic_year_id)}
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                        {getLevelName(slot.grade_level_id)}
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-center sm:text-center text-sm text-gray-600">
                        {slot.slot_index}
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-900 font-medium">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200">
                          {slot.section_name}
                        </span>
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 text-right sm:text-right">
                        {slot.max_capacity?.toLocaleString()}
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-right sm:text-right">
                        <div className="flex items-center justify-end gap-2 sm:gap-3">
                          <button
                            onClick={() => handleOpenEdit(slot)}
                            className="p-2 sm:p-2.5 text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.414l8.586-8.586z"></path>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(slot.id)}
                            disabled={deleteLoading.has(slot.id)}
                            className={`p-2 sm:p-2.5 rounded-lg transition-colors ${deleteLoading.has(slot.id) ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                            title="Delete"
                          >
                            {deleteLoading.has(slot.id) ? (
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
                  {editingId ? 'Edit Section Slot' : 'Create Section Slot'}
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
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    School ID
                  </label>
                  <input
                    type="text"
                    value={form.school_id}
                    readOnly
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 focus:ring-0 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Branch *
                  </label>
                  <select
                    name="branch_id"
                    value={form.branch_id}
                    onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">Select branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

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
                    <option value="">Select academic year</option>
                    {academicYears.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.name} ({y.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Grade Level *
                  </label>
                  <select
                    name="grade_level_id"
                    value={form.grade_level_id}
                    onChange={(e) => setForm({ ...form, grade_level_id: e.target.value })}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">Select grade level</option>
                    {gradeLevels.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Slot Index
                    </label>
                    <input
                      name="slot_index"
                      type="number"
                      min="1"
                      value={form.slot_index}
                      onChange={(e) => setForm({ ...form, slot_index: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Section Name
                    </label>
                    <input
                      name="section_name"
                      type="text"
                      placeholder="A"
                      value={form.section_name}
                      onChange={(e) => setForm({ ...form, section_name: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Max Capacity
                    </label>
                    <input
                      name="max_capacity"
                      type="number"
                      min="1"
                      value={form.max_capacity}
                      onChange={(e) => setForm({ ...form, max_capacity: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
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
                    {modalLoading ? 'Saving…' : 'Save Section Slot'}
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
