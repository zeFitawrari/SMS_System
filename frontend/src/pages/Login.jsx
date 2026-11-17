import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { apolloClient } from '../lib/apolloClient';
import { useAuthStore } from '../store/authStore';
import { LOGIN_MUTATION } from '../graphql/loginMutation';

const DEMO_EMAIL = 'provider@smb.local';
const DEMO_PASSWORD = 'ProviderPass123!';

export default function Login() {
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [usePhone, setUsePhone] = useState(false);
  const [inputFocus, setInputFocus] = useState({ email: false, password: false });
  const { setAuth, setLoading, setError, error, loading } = useAuthStore();

  const [loginMutation] = useMutation(LOGIN_MUTATION, {
    client: apolloClient,
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const variables = usePhone
        ? { object: { phone: email, password } }
        : { object: { email, password } };

      const res = await loginMutation({ variables });

      if (res.error) {
        throw new Error(res.error.message || 'Login failed');
      }

      const d = res.data.Login;

      localStorage.setItem('smb_access_token', d.access_token);
      localStorage.setItem('smb_session_token', d.session_token);
      localStorage.setItem('smb_session_id', d.session_id);

      setAuth({
        accessToken: d.access_token,
        sessionToken: d.session_token,
        sessionId: d.session_id,
        user: {
          id: d.id,
          email: d.email,
          phone: d.phone,
          firstName: d.first_name,
          lastName: d.last_name,
        },
        roles: d.roles,
        activeRole: d.active_role,
        schoolId: d.school_id,
      });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setUsePhone(false);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* ==========================================
           BACKGROUND GRADIENT MESH
           Responsive blur sizes for all devices
           ========================================== */}
      <div className="absolute inset-0 z-0">
        {/* Small phones: smaller blur */}
        <div
          className="absolute top-0 left-1/4 w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[60px] sm:blur-[80px] md:blur-[100px] lg:blur-[120px] xl:blur-[140px]"
        ></div>
        {/* Tablet & up: right side glow */}
        <div
          className="hidden sm:block absolute top-0 right-1/4 w-[40%] h-[40%] bg-blue-500/15 rounded-full blur-[60px] md:blur-[80px] lg:blur-[100px] xl:blur-[120px]"
        ></div>
        {/* Desktop: bottom-left purple glow */}
        <div
          className="hidden lg:block absolute bottom-0 left-1/3 w-[35%] h-[35%] bg-purple-500/10 rounded-full blur-[60px] xl:blur-[80px] 2xl:blur-[100px]"
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-white"></div>
      </div>

      {/* ==========================================
           SUBTLE PATTERN OVERLAY
           ========================================== */}
      <div
        className="absolute inset-0 z-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"
      />

      {/* ==========================================
           MAIN CONTAINER
           Responsive padding for all breakpoints
           ========================================== */}
      <div className="relative z-10 flex min-h-screen w-full flex-col justify-center items-center px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="w-full max-w-5xl">
          {/* ==========================================
               MOBILE & TABLET: Centered Card Layout
               Hidden on desktop (lg+) where split-screen takes over
               ========================================== */}
          <div className="hidden md:flex lg:hidden flex-col items-center w-full">
            <div className="w-full max-w-sm sm:max-w-md md:max-w-lg bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 p-6 sm:p-8 lg:p-10">
              <LoginBrand />
              <LoginForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                usePhone={usePhone}
                setUsePhone={setUsePhone}
                inputFocus={inputFocus}
                setInputFocus={setInputFocus}
                handleLogin={handleLogin}
                loading={loading}
                error={error}
              />
              <DemoCredentialsCard onDemoFill={handleDemoFill} />
            </div>
          </div>

          {/* ==========================================
               DESKTOP: Split Screen Layout
               Visible only on lg+ breakpoints
               ========================================== */}
          <div className="hidden lg:flex lg:h-[700px] w-full rounded-3xl shadow-2xl border border-white/50 bg-white/80 backdrop-blur-md overflow-hidden">
            {/* Left: Brand Panel */}
            <div className="relative w-full lg:w-5/12 h-full bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 p-6 sm:p-8 lg:p-12 xl:p-16 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                    <span className="text-xl font-bold">S</span>
                  </div>
                  <span className="text-white font-bold text-xl lg:text-2xl tracking-tight">
                    SMB<span className="text-indigo-300">Admin</span>
                  </span>
                </div>
                <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
                  Welcome back to School Management
                </h2>
                <p className="text-indigo-100 text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed max-w-sm sm:max-w-md lg:max-w-xl">
                  Sign in to your branch-aware school management platform. Manage students, academics,
                  staff, and finance — all in one place.
                </p>
              </div>

              <div className="space-y-4 pt-6 sm:pt-8 lg:pt-10 border-t border-white/10">
                <FeatureItem
                  icon="🎓"
                  title="Student Registration"
                  desc="Enroll new students with full academic placement and payment tracking."
                />
                <FeatureItem
                  icon="📊"
                  title="Academic Configuration"
                  desc="Manage years, grades, sections, and fee structures per school."
                />
                <FeatureItem
                  icon="👥"
                  title="Staff Management"
                  desc="Provision teachers, librarians, and administrative staff."
                />
              </div>
            </div>

            {/* Right: Form Panel */}
            <div className="w-full lg:w-7/12 h-full p-6 sm:p-8 lg:p-12 xl:p-16 flex flex-col justify-center">
              <div className="w-full max-w-md sm:max-w-lg mx-auto">
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
                  <p className="text-gray-500 text-sm sm:text-base">Sign in to your account</p>
                </div>
                <LoginForm
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  usePhone={usePhone}
                  setUsePhone={setUsePhone}
                  inputFocus={inputFocus}
                  setInputFocus={setInputFocus}
                  handleLogin={handleLogin}
                  loading={loading}
                  error={error}
                />
                <DemoCredentialsCard onDemoFill={handleDemoFill} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginBrand() {
  return (
    <div className="text-center mb-6 sm:mb-8">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <span className="text-white font-bold text-lg">S</span>
        </div>
        <span className="text-2xl font-bold text-gray-900 tracking-tight">SMB<span className="text-indigo-600">Admin</span></span>
      </div>
      <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
      <p className="text-gray-500 text-sm mt-1">Sign in to your School Management account</p>
    </div>
  );
}

function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  usePhone,
  setUsePhone,
  inputFocus,
  setInputFocus,
  handleLogin,
  loading,
  error,
}) {
  return (
    <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 p-4 sm:p-5 border border-red-100 shadow-sm flex items-start gap-3 sm:gap-4">
          <span className="text-red-500 flex shrink-0 mt-0.5 sm:mt-0">⚠</span>
          <div>
            <p className="text-sm sm:text-base text-red-800 font-medium">Login failed</p>
            <p className="text-sm text-red-600 mt-1 sm:mt-2">{error}</p>
          </div>
        </div>
      )}

      {/* Email / Phone Field */}
      <div>
        <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3">
          Email or phone
        </label>
        <div className="relative">
          {usePhone ? (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm sm:text-base">+1</span>
          ) : (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm sm:text-base">@</span>
          )}
          <input
            type={usePhone ? 'tel' : 'email'}
            placeholder={usePhone ? 'Phone number' : 'email@example.com'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setInputFocus((p) => ({ ...p, email: true }))}
            onBlur={() => setInputFocus((p) => ({ ...p, email: false }))}
            className={`w-full pl-12 pr-4 py-3 sm:py-3.5 md:py-4 rounded-xl border transition-all duration-200 ${
              inputFocus.email
                ? 'border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none'
                : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none bg-gray-50/50'
            }`}
          />
        </div>
        <button
          type="button"
          onClick={() => setUsePhone(!usePhone)}
          className="mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
        >
          Switch to {usePhone ? 'email' : 'phone'} login
        </button>
      </div>

      {/* Password Field */}
      <div>
        <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3">
          Password
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setInputFocus((p) => ({ ...p, password: true }))}
            onBlur={() => setInputFocus((p) => ({ ...p, password: false }))}
            className={`w-full pl-12 pr-10 py-3 sm:py-3.5 md:py-4 rounded-xl border transition-all duration-200 ${
              inputFocus.password
                ? 'border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none'
                : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none bg-gray-50/50'
            }`}
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 sm:py-4 md:py-5 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg ${
          loading
            ? 'bg-indigo-400 cursor-not-allowed opacity-80'
            : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 active:scale-[0.98]'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          </div>
        ) : (
          'Sign in'
        )}
      </button>
    </form>
  );
}

function FeatureItem({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-3 sm:gap-4 text-indigo-50">
      <span className="text-xl sm:text-2xl shrink-0">{icon}</span>
      <div>
        <p className="text-sm sm:text-base font-medium text-white">{title}</p>
        <p className="text-xs sm:text-sm mt-0.5 sm:mt-1 text-indigo-100">{desc}</p>
      </div>
    </div>
  );
}

function DemoCredentialsCard({ onDemoFill }) {
  return (
    <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-100/50 bg-indigo-50/40 rounded-xl p-4 sm:p-6 border border-indigo-100/50">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <span className="text-indigo-600 font-medium text-sm sm:text-base">🔑</span>
        <span className="text-xs sm:text-sm font-semibold text-indigo-700 uppercase tracking-wider">
          Demo credentials
        </span>
      </div>
      <div
        className="flex sm:flex-row items-center sm:justify-between bg-white rounded-lg border border-indigo-100 p-3 sm:p-4 shadow-sm"
      >
        {/* Email Column */}
        <div className="w-full sm:w-1/2 pr-0 sm:pr-3 text-left">
          <p className="text-xs sm:text-sm text-indigo-500 font-medium mb-1 sm:mb-2">Email</p>
          <p className="text-xs sm:text-base font-mono text-indigo-800 break-all">{DEMO_EMAIL}</p>
        </div>
        {/* Password Column */}
        <div className="w-full sm:w-1/2 pl-0 sm:pl-3 text-left">
          <p className="text-xs sm:text-sm text-indigo-500 font-medium mb-1 sm:mb-2">Password</p>
          <p className="text-xs sm:text-base font-mono text-indigo-800 break-all">{DEMO_PASSWORD}</p>
        </div>
        {/* Use Button */}
        <button
          onClick={onDemoFill}
          className="mt-4 sm:mt-0 sm:ml-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-white text-indigo-600 text-xs sm:text-sm font-semibold border border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800 transition-all shadow-sm w-full sm:w-auto"
        >
          Use
        </button>
      </div>
    </div>
  );
}
