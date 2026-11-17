import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { apolloClient } from '../lib/apolloClient';
import { ENROLLMENTS_FOR_YEAR_QUERY } from '../graphql/enrollmentsForYearQuery';

export default function EnrollmentsForYear() {
  const [academicYearId, setAcademicYearId] = useState('');

  const {
    data,
    loading: queryLoading,
    error: queryError,
    refetch: refetchEnrollments,
  } = useQuery(ENROLLMENTS_FOR_YEAR_QUERY, {
    client: apolloClient,
    variables: { academicYearId },
    skip: !academicYearId,
  });

  const enrollments = data?.enrollments || [];

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

  if (!academicYearId) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold mx-auto mb-4">
          📅
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
          Enter an Academic Year ID
        </h2>
        <p className="text-sm text-gray-600">
          Type an academic year ID above to view all enrollments for that year.
        </p>
      </div>
    );
  }

  if (data && enrollments.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xl mx-auto mb-4">
          ⚠️
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
          No Enrollments Found
        </h2>
        <p className="text-sm text-amber-600">
          No enrollments found for academic year ID {academicYearId}.
          Please check the ID and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 xl:py-10 max-w-4xl">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              Enrollments For Year
            </h1>
            <p className="text-sm text-gray-600">
              View all enrollments for a specific academic year.
            </p>
          </div>
          <div className="flex items-end gap-3">
            <input
              type="text"
              placeholder="Enter Academic Year ID (UUID)"
              value={academicYearId}
              onChange={(e) => setAcademicYearId(e.target.value.trim())}
              className="w-full sm:w-64 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              disabled={queryLoading}
            />
            <button
              onClick={() => refetchEnrollments()}
              disabled={queryLoading || !academicYearId}
              className="px-4 py-2.5 rounded-lg font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md"
            >
              {queryLoading ? 'Loading…' : 'Search'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs sm:text-sm font-bold">
                📚
              </span>
              Enrollments ({enrollments.length})
            </h2>
          </div>

          <div className="overflow-x-auto sm:overflow-visible">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Enrollment ID</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Student ID</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Grade Level ID</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Section ID</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Enrolled On</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-900 font-medium break-all">
                      {enrollment.id}
                    </td>
                    <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 break-all">
                      {enrollment.student_id}
                    </td>
                    <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 break-all">
                      {enrollment.grade_level_id || '—'}
                    </td>
                    <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 break-all">
                      {enrollment.section_id || '—'}
                    </td>
                    <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                      {enrollment.enrolled_on || '—'}
                    </td>
                    <td className="px-5 sm:px-6 py-4 sm:py-5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200">
                        <span className={enrollment.status === 'active'
                          ? 'text-green-800 bg-green-100'
                          : 'text-gray-600 bg-gray-100'}>
                          {enrollment.status || '—'}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
