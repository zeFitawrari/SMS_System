import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { apolloClient } from './lib/apolloClient';
import { useAuthStore } from './store/authStore';
import Dashboard from './pages/Dashboard';
import StudentRegistration from './pages/StudentRegistration';
import SessionManagement from './pages/SessionManagement';
import ContextSelector from './pages/ContextSelector';
import RoleManagement from './pages/RoleManagement';
import RegisterSchool from './pages/RegisterSchool';
import AcademicYears from './pages/AcademicYears';
import GradeLevels from './pages/GradeLevels';
import GradeMonthlyFees from './pages/GradeMonthlyFees';
import SectionSlots from './pages/SectionSlots';
import RegistrationPackages from './pages/RegistrationPackages';
import AcademicSetupChecklist from './pages/AcademicSetupChecklist';
import EnrollmentSection from './pages/EnrollmentSection';
import EnrollmentsForYear from './pages/EnrollmentsForYear';
import RegistrationPayments from './pages/RegistrationPayments';
import BranchesSchool from './pages/BranchesSchool';
import StudentsList from './pages/StudentsList';
import StudentDetail from './pages/StudentDetail';
import SchoolUsers from './pages/SchoolUsers';
import RoleAssignments from './pages/RoleAssignments';
import StaffManagement from './pages/StaffManagement';
import CourseManagement from './pages/CourseManagement';
import GradeCourseAssignment from './pages/GradeCourseAssignment';
import SectionCourseTeacherAssignment from './pages/SectionCourseTeacherAssignment';
import TeacherClasses from './pages/TeacherClasses';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import { LOGOUT_MUTATION } from './graphql/logoutMutation';

const PAGES = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'register-student', label: 'Register Student', icon: '🎓' },
  { key: 'sessions', label: 'Sessions', icon: '🖥️' },
  { key: 'contexts', label: 'Switch Context', icon: '🏢' },
  { key: 'roles', label: 'Role Management', icon: '👥' },
  { key: 'staff-management', label: 'Staff Management', icon: '👔' },
  { key: 'courses', label: 'Courses', icon: '📖' },
  { key: 'grade-courses', label: 'Grade Courses', icon: '🔗' },
  { key: 'section-teachers', label: 'Section Teachers', icon: '👨‍🏫' },
  { key: 'my-classes', label: 'My Classes', icon: '🏫' },
  { key: 'register-school', label: 'Register School', icon: '🏫' },
  { key: 'academic-years', label: 'Academic Years', icon: '📅' },
  { key: 'grade-levels', label: 'Grade Levels', icon: '📚' },
  { key: 'monthly-fees', label: 'Monthly Fees', icon: '💰' },
  { key: 'section-slots', label: 'Section Slots', icon: '🏫' },
  { key: 'registration-packages', label: 'Packages', icon: '💳' },
  { key: 'academic-setup', label: 'Setup Checklist', icon: '✅' },
  { key: 'enrollment-sections', label: 'Enrollment Sections', icon: '🏫' },
  { key: 'enrollments-year', label: 'Enrollments by Year', icon: '📚' },
  { key: 'branches-school', label: 'Branches & School', icon: '🏢' },
  { key: 'students-list', label: 'Students List', icon: '👨‍🎓' },
  { key: 'student-detail', label: 'Student Detail', icon: '👤' },
  { key: 'registration-payments', label: 'Registration Payments', icon: '💵' },
  { key: 'school-users', label: 'Users Directory', icon: '👥' },
  { key: 'role-assignments', label: 'Role Assignments', icon: '🏷️' },
];

export default function App() {
  const { loading, logout: clearAuth } = useAuthStore();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const [logoutMutation] = useMutation(LOGOUT_MUTATION, {
    client: apolloClient,
  });

  /**
   * Logout (this device) — per 01-auth.md:
   *   mutation Logout {
   *     Logout(object: { session_token: "..." }) { status, message }
   *   }
   *
   * Calls the backend to revoke the current device's session server-side,
   * then clears localStorage and the Zustand auth store.
   */
  async function handleLogout() {
    try {
      const sessionToken = localStorage.getItem('smb_session_token');
      if (sessionToken) {
        await logoutMutation({
          variables: { object: { session_token: sessionToken } },
        });
      }
    } catch (err) {
      // Even if backend logout fails, still clear local state
      console.error('Backend logout error:', err.message);
    } finally {
      localStorage.removeItem('smb_access_token');
      localStorage.removeItem('smb_session_token');
      localStorage.removeItem('smb_session_id');
      clearAuth();
    }
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
                S
              </div>
              <span className="font-bold text-gray-900 text-lg">SMB Admin</span>
            </div>

            <div className="flex gap-1">
              {PAGES.map((page) => (
                <button
                  key={page.key}
                  onClick={() => setCurrentPage(page.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    currentPage === page.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {page.icon} {page.label}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'register-student' && <StudentRegistration />}
          {currentPage === 'sessions' && <SessionManagement />}
          {currentPage === 'contexts' && (
            <ContextSelector onContextSwitched={() => setCurrentPage('dashboard')} />
          )}
          {currentPage === 'roles' && <RoleManagement />}
          {currentPage === 'staff-management' && <StaffManagement />}
          {currentPage === 'courses' && <CourseManagement />}
          {currentPage === 'grade-courses' && <GradeCourseAssignment />}
          {currentPage === 'section-teachers' && <SectionCourseTeacherAssignment />}
          {currentPage === 'my-classes' && <TeacherClasses />}
          {currentPage === 'register-school' && (
            <RegisterSchool onSchoolRegistered={() => setCurrentPage('dashboard')} />
          )}
          {currentPage === 'academic-years' && <AcademicYears />}
          {currentPage === 'grade-levels' && <GradeLevels />}
          {currentPage === 'monthly-fees' && <GradeMonthlyFees />}
          {currentPage === 'section-slots' && <SectionSlots />}
          {currentPage === 'registration-packages' && <RegistrationPackages />}
          {currentPage === 'academic-setup' && <AcademicSetupChecklist />}
          {currentPage === 'enrollment-sections' && <EnrollmentSection />}
          {currentPage === 'enrollments-year' && <EnrollmentsForYear />}
          {currentPage === 'branches-school' && <BranchesSchool />}
          {currentPage === 'students-list' && <StudentsList />}
          {currentPage === 'student-detail' && <StudentDetail />}
          {currentPage === 'registration-payments' && <RegistrationPayments />}
          {currentPage === 'school-users' && <SchoolUsers />}
          {currentPage === 'role-assignments' && <RoleAssignments />}
        </div>
      </div>
    </ProtectedRoute>
  );
}
