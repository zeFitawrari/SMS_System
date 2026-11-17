import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { apolloClient } from '../lib/apolloClient';
import { STUDENT_BY_ID_QUERY } from '../graphql/studentByIdQuery';

/**
 * Student Detail — per 05-data-reads.md (lines 67-93):
 *
 *   query StudentById($id: uuid!) {
 *     student(id: $id) {
 *       registration_id
 *       date_of_birth
 *       sex
 *       user {
 *         first_name
 *         last_name
 *       }
 *       student_guardians {
 *         relationship
 *         is_primary_contact
 *         guardian {
 *           full_name
 *           phone
 *         }
 *       }
 *       health {
 *         allergies
 *         medical_conditions
 *       }
 *       address {
 *         address_line
 *         latitude
 *         longitude
 *       }
 *     }
 *   }
 *
 * Requires Bearer access token. Row-level filters apply by school_id/branch_id.
 */

export default function StudentDetail() {
  const [studentId, setStudentId] = useState('');

  const {
    data,
    loading: queryLoading,
    error: queryError,
    refetch: refetchStudent,
  } = useQuery(STUDENT_BY_ID_QUERY, {
    client: apolloClient,
    variables: { id: studentId },
    skip: !studentId,
  });

  const student = data?.student;

  if (queryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-gray-600">Loading student details...</span>
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
            onClick={() => refetchStudent()}
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
      <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 xl:py-10 max-w-3xl">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              Student Detail
            </h1>
            <p className="text-sm text-gray-600">
              View detailed information about a specific student.
            </p>
          </div>
          <div className="flex items-end gap-3">
            <input
              type="text"
              placeholder="Enter Student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.trim())}
              className="w-full sm:w-64 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              disabled={queryLoading}
            />
            <button
              onClick={() => refetchStudent()}
              disabled={queryLoading || !studentId}
              className="px-4 py-2.5 rounded-lg font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md"
            >
              {queryLoading ? 'Loading…' : 'Search'}
            </button>
          </div>
        </div>

        {!studentId && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold mx-auto mb-4">
              🔍
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              Enter a Student ID
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Type a student ID above to view their detailed information,
              including guardians, health, and address.
            </p>
          </div>
        )}

        {studentId && !student && !queryError && !queryLoading && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xl mx-auto mb-4">
              ⚠️
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              Student Not Found
            </h2>
            <p className="text-sm text-amber-600">
              No student found with ID "{studentId}". Please check the ID and try again.
            </p>
          </div>
        )}

        {student && (
          <div className="space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    {student.user?.first_name} {student.user?.last_name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Registration ID: <span className="font-mono text-sm text-gray-900">{student.registration_id || '—'}</span>
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                  student.sex === 'male' || student.sex === 'female'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  {student.sex ? student.sex.charAt(0).toUpperCase() + student.sex.slice(1) : '—'}
                </span>
              </div>
              <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Registration ID</p>
                  <p className="text-sm font-semibold text-gray-900 break-all">{student.registration_id || '—'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date of Birth</p>
                  <p className="text-sm font-semibold text-gray-900 break-all">{student.date_of_birth || '—'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sex</p>
                  <p className="text-sm font-semibold text-gray-900 break-all">
                    {student.sex ? student.sex.charAt(0).toUpperCase() + student.sex.slice(1) : '—'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">User ID</p>
                  <p className="text-sm font-semibold text-gray-900 break-all">{student.user?.id || '—'}</p>
                </div>
              </div>
            </div>

            {/* Guardians */}
            {student.student_guardians && student.student_guardians.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
                  <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-5 sm:w-6 h-5 sm:h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs sm:text-sm font-bold">
                      👨‍👩‍👧‍👦
                    </span>
                    Guardians ({student.student_guardians.length})
                  </h2>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Guardian Name</th>
                      <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Relationship</th>
                      <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider text-center sm:text-center">Primary Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {student.student_guardians.map((guardian) => (
                      <tr key={guardian.guardian?.full_name + guardian.relationship} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-900 font-medium">
                          {guardian.guardian?.full_name || '—'}
                        </td>
                        <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 capitalize">
                          {guardian.relationship || '—'}
                        </td>
                        <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 break-all">
                          {guardian.guardian?.phone || '—'}
                        </td>
                        <td className="px-5 sm:px-6 py-4 sm:py-5 text-center sm:text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            guardian.is_primary_contact
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>
                            {guardian.is_primary_contact ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Health */}
            {student.health && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
                  <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-5 sm:w-6 h-5 sm:h-6 rounded-lg bg-red-100 flex items-center justify-center text-red-600 text-xs sm:text-sm font-bold">
                      🏥
                    </span>
                    Health Information
                  </h2>
                </div>
                <div className="px-5 sm:px-6 py-4 sm:py-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Allergies</p>
                      <p className="text-sm font-medium text-gray-900 break-all">
                        {student.health.allergies || '—'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Medical Conditions</p>
                      <p className="text-sm font-medium text-gray-900 break-all">
                        {student.health.medical_conditions || '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Address */}
            {student.address && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
                  <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-5 sm:w-6 h-5 sm:h-6 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-xs sm:text-sm font-bold">
                      📍
                    </span>
                    Address
                  </h2>
                </div>
                <div className="px-5 sm:px-6 py-4 sm:py-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Address Line</p>
                      <p className="text-sm font-medium text-gray-900 break-all">
                        {student.address.address_line || '—'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Latitude</p>
                      <p className="text-sm font-medium text-gray-900 break-all">
                        {student.address.latitude?.toString() || '—'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Longitude</p>
                      <p className="text-sm font-medium text-gray-900 break-all">
                        {student.address.longitude?.toString() || '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
