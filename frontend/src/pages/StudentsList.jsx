import { useQuery } from '@apollo/client';
import { apolloClient } from '../lib/apolloClient';
import { STUDENTS_LIST_QUERY } from '../graphql/studentsListQuery';

/**
 * Students List — per 05-data-reads.md (lines 38-60):
 *
 *   query StudentsList {
 *     students(limit: 50, order_by: { created_at: desc }) {
 *       id
 *       registration_id
 *       branch_id
 *       date_of_birth
 *       sex
 *       user {
 *         first_name
 *         middle_name
 *         last_name
 *         email
 *         phone
 *       }
 *       enrollments {
 *         id
 *         academic_year_id
 *         grade_level_id
 *         section_id
 *         enrolled_on
 *         status
 *       }
 *     }
 *   }
 *
 * Requires Bearer access token. Row-level filters apply by school_id/branch_id.
 */

export default function StudentsList() {
  const {
    data,
    loading: queryLoading,
    error: queryError,
    refetch: refetchStudents,
  } = useQuery(STUDENTS_LIST_QUERY, { client: apolloClient });

  const students = data?.students || [];

  if (queryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-gray-600">Loading students...</span>
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
            onClick={() => refetchStudents()}
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
        {/* Page Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              Students List
            </h1>
            <p className="text-sm text-gray-600">
              View all registered students with their enrollment details.
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
            data?.students?.length > 0 ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
          }`}>
            <span className={data?.students?.length > 0 ? 'text-green-600' : 'text-blue-600'}>{data?.students?.length > 0 ? '✓' : '○'}</span>
            <span className="text-sm sm:text-base font-medium">
              {students.length} student{students.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">
              Registered Students ({students.length})
            </h2>
          </div>

          <div className="overflow-x-auto sm:overflow-visible">
            {students.length === 0 ? (
              <div className="px-5 sm:px-6 py-12 sm:py-16 text-center">
                <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl sm:text-2xl font-bold mb-4 sm:mb-6 mx-auto">
                  👨‍🎓
                </div>
                <p className="text-gray-500 text-sm sm:text-base">
                  No students found.
                </p>
                <p className="text-xs sm:text-sm text-gray-400 mt-2 sm:mt-4">
                  Register a new student to see them listed here.
                </p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Student Name</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Registration ID</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Date of Birth</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Sex</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider text-center sm:text-center">Branch ID</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider text-right sm:text-right">Enrollments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 sm:px-6 py-4 sm:py-5">
                        <div className="text-sm text-gray-900 font-medium break-all">
                          {student.user?.first_name} {student.user?.middle_name || ''} {student.user?.last_name}
                        </div>
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 break-all">
                        {student.registration_id || '—'}
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 break-all">
                        {student.user?.email || '—'}
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 break-all">
                        {student.user?.phone || '—'}
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                        {student.date_of_birth || '—'}
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                        {student.sex || '—'}
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 break-all text-center sm:text-center">
                        {student.branch_id || '—'}
                      </td>
                      <td className="px-5 sm:px-6 py-4 sm:py-5 text-right sm:text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          {student.enrollments?.length || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Enrollment Details Section */}
        {students.length > 0 && (
          <div className="mt-8 sm:mt-10 bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-5 sm:w-6 h-5 sm:h-6 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-xs sm:text-sm font-bold">
                📚
              </span>
              Enrollment Details
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-4">
              Each student's enrollment records showing academic year, grade level, section, and enrollment date.
            </p>
            <div className="overflow-x-auto sm:overflow-visible">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Enrollment ID</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Academic Year</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Grade Level</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Section</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Enrolled On</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.flatMap((student) =>
                    (student.enrollments || []).map((enrollment) => (
                      <tr key={enrollment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 sm:px-6 py-3 sm:py-4 text-sm text-gray-600">
                          {student.user?.first_name} {student.user?.last_name}
                        </td>
                        <td className="px-5 sm:px-6 py-3 sm:py-4 text-sm text-gray-600 break-all">
                          {enrollment.id}
                        </td>
                        <td className="px-5 sm:px-6 py-3 sm:py-4 text-sm text-gray-600">
                          {enrollment.academic_year_id || '—'}
                        </td>
                        <td className="px-5 sm:px-6 py-3 sm:py-4 text-sm text-gray-600">
                          {enrollment.grade_level_id || '—'}
                        </td>
                        <td className="px-5 sm:px-6 py-3 sm:py-4 text-sm text-gray-600">
                          {enrollment.section_id || '—'}
                        </td>
                        <td className="px-5 sm:px-6 py-3 sm:py-4 text-sm text-gray-600">
                          {enrollment.enrolled_on || '—'}
                        </td>
                        <td className="px-5 sm:px-6 py-3 sm:py-4 text-sm">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            enrollment.status === 'active'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>
                            {enrollment.status || '—'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
