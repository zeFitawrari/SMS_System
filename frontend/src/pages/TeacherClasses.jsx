import { useQuery } from '@apollo/client';
import { apolloClient } from '../lib/apolloClient';
import { useAuthStore } from '../store/authStore';
import { MY_SECTION_COURSES_QUERY } from '../graphql/mySectionCoursesQuery';

/**
 * Teacher Classes — per 06-courses.md (Teacher's own classes):
 *
 *   query MySectionCourses {
 *     section_course_teachers {
 *       id
 *       grade_section_slot { section_name branch_id }
 *       grade_course {
 *         grade_level { name }
 *         course { code name }
 *       }
 *     }
 *   }
 *
 *   Read-only view of a teacher's assigned section courses.
 *   Row-level filters apply by role (teacher sees only their own assignments).
 *
 * Requires Bearer access token attached automatically by Apollo auth link.
 */

const CLASS_ALLOWED_ROLES = [
  'SCHOOL_OWNER',
  'SCHOOL_ADMIN',
  'BRANCH_ADMIN',
  'TEACHER',
  'PROVIDER_ADMIN',
  'SUPER_PROVIDER_ADMIN',
];

export default function TeacherClasses() {
  const { roles } = useAuthStore();

  // ---- Role-based guard ----
  const hasClassAccess = roles.some((r) => CLASS_ALLOWED_ROLES.includes(r));

  const {
    data,
    loading: queryLoading,
    error: queryError,
  } = useQuery(MY_SECTION_COURSES_QUERY, { client: apolloClient });

  const sectionCourses = data?.section_course_teachers || [];

  if (queryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-gray-600">Loading your classes...</span>
        </div>
      </div>
    );
  }

  if (!hasClassAccess) {
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
            My classes requires one of: {CLASS_ALLOWED_ROLES.join(', ')}.
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
            Error loading classes
          </h2>
          <p className="text-red-600 text-sm sm:text-base mb-4">
            {queryError.message}
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              My Classes
            </h1>
            <p className="text-sm text-gray-600">
              Your assigned courses and sections. Each row shows the section,
              grade level, and course you teach.
            </p>
          </div>
        </div>

        {/* Classes Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">
              My Classes ({sectionCourses.length})
            </h2>
          </div>

          <div className="overflow-x-auto sm:overflow-visible">
            {sectionCourses.length === 0 ? (
              <div className="px-5 sm:px-6 py-12 sm:py-16 text-center">
                <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl sm:text-2xl font-bold mb-4 sm:mb-6 mx-auto">
                  📭
                </div>
                <p className="text-gray-500 text-sm sm:text-base">
                  No classes assigned to you.
                </p>
                <p className="text-xs sm:text-sm text-gray-400 mt-2 sm:mt-4">
                  Ask your school administrator to assign you to section
                  courses.
                </p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Section</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Grade Level</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider text-right sm:text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sectionCourses.map((assignment) => {
                    const section = assignment.grade_section_slot || {};
                    const gradeCourse = assignment.grade_course || {};
                    const gradeLevel = gradeCourse.grade_level || {};
                    const course = gradeCourse.course || {};
                    return (
                      <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 font-mono">
                          {section.section_name || '—'}
                        </td>
                        <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                          {gradeLevel.name || '—'}
                        </td>
                        <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-900 font-medium">
                          {course.code} — {course.name || '—'}
                        </td>
                        <td className="px-5 sm:px-6 py-4 sm:py-5 text-right sm:text-right">
                          <button
                            className="text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-all"
                          >
                            View Details
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
    </div>
  );
}
