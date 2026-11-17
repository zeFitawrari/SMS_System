import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { apolloClient } from '../lib/apolloClient';
import { useAuthStore } from '../store/authStore';
import { REGISTER_SCHOOL_MUTATION } from '../graphql/registerSchoolMutation';

/**
 * Register School — per 01-auth.md (lines 255-277):
 * Provider admin only. Requires Bearer access token.
 */

export default function RegisterSchool({ onSchoolRegistered }) {
  const {
    setAuth,
    setLoading,
    setError,
  } = useAuthStore();

  const [registerSchoolMutation] = useMutation(REGISTER_SCHOOL_MUTATION, {
    client: apolloClient,
  });

  const [registering, setRegistering] = useState(false);
  const [error, setErrorState] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleRegisterSchool = async (e) => {
    e.preventDefault();
    setRegistering(true);
    setErrorState(null);
    setSuccess(null);

    const formData = new FormData(e.target);

    const variables = {
      object: {
        school_name: formData.get('school_name'),
        school_address: formData.get('school_address'),
        admin_email: formData.get('admin_email'),
        admin_phone: formData.get('admin_phone'),
        admin_password: formData.get('admin_password'),
        admin_first_name: formData.get('admin_first_name'),
        admin_last_name: formData.get('admin_last_name'),
      },
    };

    try {
      const res = await registerSchoolMutation({ variables });

      if (res.error) {
        throw new Error(res.error.message || 'Failed to register school');
      }

      const d = res.data.RegisterSchool;

      localStorage.setItem('smb_access_token', d.access_token);
      localStorage.setItem('smb_session_token', d.session_token);
      localStorage.setItem('smb_session_id', d.session_id);

      setAuth({
        accessToken: d.access_token,
        sessionToken: d.session_token,
        sessionId: d.session_id,
        activeRole: d.active_role,
        schoolId: d.school_id,
        roles: d.roles,
      });

      setSuccess(
        `School "${d.school_id}" registered successfully. Admin ID: ${d.admin_id}`
      );

      if (onSchoolRegistered) {
        onSchoolRegistered();
      }
    } catch (err) {
      setErrorState(err.message || 'Failed to register school. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Responsive container */}
      <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 xl:py-10 max-w-2xl sm:max-w-3xl lg:max-w-4xl">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 sm:mb-0 sm:mb-4">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                  S
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                    Register School
                  </h1>
                  <p className="text-sm text-blue-600 font-medium">Provider Admin Only</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Create a new school with its main branch and admin account.
              </p>
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-xl bg-red-50 p-4 sm:p-5 border border-red-100 shadow-sm mb-6 sm:mb-8 flex items-start gap-3 sm:gap-4">
            <span className="text-red-500 flex shrink-0 mt-0.5 sm:mt-0">⚠</span>
            <div>
              <p className="text-sm text-red-800 font-medium">Registration Failed</p>
              <p className="text-sm text-red-600 mt-1 sm:mt-2">{error}</p>
            </div>
          </div>
        )}

        {/* Success state */}
        {success && (
          <div className="rounded-xl bg-green-50 p-4 sm:p-5 border border-green-100 shadow-sm mb-6 sm:mb-8 flex items-start gap-3 sm:gap-4">
            <span className="text-green-500 flex shrink-0 mt-0.5 sm:mt-0">✓</span>
            <div>
              <p className="text-sm text-green-800 font-medium">School Registered</p>
              <p className="text-sm text-green-600 mt-1 sm:mt-2">{success}</p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {registering ? (
          <div className="flex items-center justify-center py-12 sm:py-16">
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <svg className="animate-spin h-6 sm:h-8 w-6 sm:w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm sm:text-base text-gray-600">Registering school...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegisterSchool} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-8 space-y-5 sm:space-y-7">
            {/* School Information */}
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-sm sm:text-base font-bold">
                  🏫
                </span>
                School Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    School Name *
                  </label>
                  <input
                    name="school_name"
                    type="text"
                    placeholder="e.g., Demo School"
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    School Address *
                  </label>
                  <input
                    name="school_address"
                    type="text"
                    placeholder="e.g., Bole"
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Admin Account */}
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 mt-8 sm:mt-10 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-sm sm:text-base font-bold">
                  👤
                </span>
                Admin Account
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Admin First Name *
                  </label>
                  <input
                    name="admin_first_name"
                    type="text"
                    placeholder="e.g., Admin"
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Admin Last Name *
                  </label>
                  <input
                    name="admin_last_name"
                    type="text"
                    placeholder="e.g., User"
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Admin Email *
                  </label>
                  <input
                    name="admin_email"
                    type="email"
                    placeholder="e.g., admin@demo.local"
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Admin Phone *
                  </label>
                  <input
                    name="admin_phone"
                    type="tel"
                    placeholder="e.g., 251911223344"
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="mt-4 sm:mt-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Admin Password *
                </label>
                <input
                  name="admin_password"
                  type="password"
                  placeholder="e.g., ChangeMeNow123!"
                  required
                  minLength="8"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Minimum 8 characters.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={registering}
              className="w-full py-3.5 sm:py-4 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md"
            >
              {registering ? 'Registering…' : 'Register School'}
            </button>
          </form>
        )}

        {/* Result summary */}
        {success && (
          <div className="mt-8 sm:mt-10 bg-blue-50 border border-blue-200 rounded-xl p-5 sm:p-6">
            <h3 className="text-sm sm:text-base font-semibold text-blue-900 mb-3 sm:mb-4 flex items-center gap-2">
              <span className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs sm:text-sm font-bold">
                📋
              </span>
              Next Steps
            </h3>
            <ul className="text-sm sm:text-base text-blue-800 space-y-2 sm:space-y-3 list-disc pl-5 sm:pl-6">
              <li>
                The school has been created with a main branch automatically.
              </li>
              <li>
                The admin account has been created and you are now logged in
                with the new school's context.
              </li>
              <li>
                Use <strong>Switch Context</strong> if you need to change
                roles or branches.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
