import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { apolloClient } from '../lib/apolloClient';
import { useAuthStore } from '../store/authStore';
import {
  CREATE_STUDENT_PROFILE_MUTATION,
} from '../graphql/createStudentProfileMutation';
import {
  SET_STUDENT_GUARDIANS_MUTATION,
} from '../graphql/setStudentGuardiansMutation';
import {
  GET_REGISTRATION_PAYMENT_QUOTE_QUERY,
} from '../graphql/getRegistrationPaymentQuoteQuery';
import {
  COMPLETE_STUDENT_REGISTRATION_MUTATION,
} from '../graphql/completeStudentRegistrationMutation';
import {
  LIST_ACADEMIC_YEARS,
  LIST_GRADE_LEVELS,
  LIST_BRANCHES,
  LIST_SECTIONS,
} from '../graphql/queries';

const STEPS = [
  { key: 'student', label: 'Student Info' },
  { key: 'guardians', label: 'Guardians' },
  { key: 'quote', label: 'Payment Quote' },
  { key: 'registration', label: 'Complete Registration' },
  { key: 'review', label: 'Review & Submit' },
];

const VALID_SEX = ['male', 'female'];
const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER'];
const GUARDIAN_RELATIONSHIPS = [
  'father', 'mother', 'grandfather', 'grandmother',
  'aunt', 'uncle', 'legal_guardian', 'other',
];

export default function StudentRegistration() {
  const {
    schoolId,
    user,
    setLoading,
    setError,
  } = useAuthStore();

  const [step, setStep] = useState(0);

  // --- Form state (aligned to contract) ---
  const [form, setForm] = useState({
    // CreateStudentProfile fields
    branch_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    date_of_birth: '',
    sex: '',
    email: '',
    phone: '',
    address: {
      address_line: '',
      label: 'home',
      latitude: null,
      longitude: null,
    },
    health: {
      allergies: '',
    },
    // SetStudentGuardians fields
    guardians: [
      {
        full_name: '',
        relationship: '',
        phone: '',
        is_primary_contact: true,
      },
    ],
    // CompleteStudentRegistration fields
    academic_year_id: '',
    grade_level_id: '',
    section_id: '',
    enrollment_date: '',
    payment: {
      package_code: '',
      payment_method: 'CASH',
      transfer_reference: '',
      payment_date: '',
    },
    registration_type: 'NEW',
  });

  // --- Apollo queries & mutations ---
  const [createStudentProfile] = useMutation(CREATE_STUDENT_PROFILE_MUTATION, {
    client: apolloClient,
  });

  const [setStudentGuardians] = useMutation(SET_STUDENT_GUARDIANS_MUTATION, {
    client: apolloClient,
  });

  const [completeStudentRegistration] = useMutation(
    COMPLETE_STUDENT_REGISTRATION_MUTATION,
    { client: apolloClient }
  );

  // --- Quote query (Step 3) ---
  const { data: quoteData, loading: quoteLoading, error: quoteError } = useQuery(
    GET_REGISTRATION_PAYMENT_QUOTE_QUERY,
    {
      client: apolloClient,
      variables: {
        object: {
          academic_year_id: form.academic_year_id || '',
          grade_level_id: form.grade_level_id || '',
          branch_id: form.branch_id || '',
        },
      },
      skip: !form.academic_year_id || !form.grade_level_id || !form.branch_id,
    }
  );

  const paymentPackages = quoteData?.GetRegistrationPaymentQuote?.packages || [];

  // --- List queries for dropdowns ---
  const { data: yearsData, loading: yearsLoading } = useQuery(LIST_ACADEMIC_YEARS, {
    client: apolloClient,
    variables: { schoolId: schoolId || '' },
    skip: !schoolId,
  });

  const { data: branchesData, loading: branchesLoading } = useQuery(LIST_BRANCHES, {
    client: apolloClient,
    variables: { schoolId: schoolId || '' },
    skip: !schoolId,
  });

  const { data: gradesData, loading: gradesLoading } = useQuery(LIST_GRADE_LEVELS, {
    client: apolloClient,
    variables: { schoolId: schoolId || '' },
    skip: !schoolId,
  });

  const { data: sectionsData, loading: sectionsLoading } = useQuery(LIST_SECTIONS, {
    client: apolloClient,
    variables: {
      schoolId: schoolId || '',
      branchId: form.branch_id || '',
      academicYearId: form.academic_year_id || '',
      gradeLevelId: form.grade_level_id || '',
    },
    skip: !schoolId || !form.branch_id || !form.academic_year_id || !form.grade_level_id,
  });

  const academicYears = yearsData?.academic_years || [];
  const branches = branchesData?.branches || [];
  const gradeLevels = gradesData?.grade_levels || [];
  const sections = sectionsData?.grade_section_slots || [];

  // --- Helpers ---
  const isLastStep = step === STEPS.length - 1;
  const currentStep = STEPS[step];

  const nextStep = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const setField = (path, value) => {
    setForm((prev) => {
      const [top, nested] = path.split('.');
      if (nested) {
        return {
          ...prev,
          [top]: { ...prev[top], [nested]: value },
        };
      }
      return { ...prev, [top]: value };
    });
  };

  const addGuardian = () => {
    setForm((prev) => ({
      ...prev,
      guardians: [
        ...prev.guardians,
        {
          full_name: '',
          relationship: '',
          phone: '',
          is_primary_contact: false,
        },
      ],
    }));
  };

  const removeGuardian = (index) => {
    setForm((prev) => ({
      ...prev,
      guardians: prev.guardians.filter((_, i) => i !== index),
    }));
  };

  const setGuardianField = (guardianIndex, field, value) => {
    setForm((prev) => {
      const guardians = [...prev.guardians];
      guardians[guardianIndex] = { ...guardians[guardianIndex], [field]: value };
      return { ...prev, guardians };
    });
  };

  // --- Validation (per contract) ---
  const validateStep = (stepKey) => {
    switch (stepKey) {
      case 'student':
        if (!form.first_name?.trim()) return 'First name is required.';
        if (!form.last_name?.trim()) return 'Last name is required.';
        if (!form.date_of_birth) return 'Date of birth is required.';
        if (!VALID_SEX.includes(form.sex)) return 'Please select a valid sex.';
        return null;
      case 'guardians':
        const validGuardians = form.guardians.filter(
          (g) => g.full_name?.trim() && g.relationship
        );
        if (validGuardians.length === 0) return 'At least one guardian is required.';
        for (const g of validGuardians) {
          if (!g.phone?.trim()) return 'Guardian phone is required.';
        }
        return null;
      case 'quote':
        if (!paymentPackages.length) return 'Unable to load payment packages. Please select academic year, grade level, and branch.';
        return null;
      case 'registration':
        if (!form.branch_id) return 'Please select a branch.';
        if (!form.academic_year_id) return 'Please select an academic year.';
        if (!form.grade_level_id) return 'Please select a grade level.';
        if (!form.enrollment_date) return 'Enrollment date is required.';
        if (!form.payment.package_code) return 'Please select a payment package.';
        if (!PAYMENT_METHODS.includes(form.payment.payment_method)) return 'Invalid payment method.';
        if (form.payment.payment_method === 'BANK_TRANSFER' && !form.payment.transfer_reference?.trim()) {
          return 'Transfer reference is required for bank transfer.';
        }
        return null;
      default:
        return null;
    }
  };

  // --- Submit: Execute contract steps in order ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateStep('registration');
    if (error) {
      setError(error);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: CreateStudentProfile
      const profileRes = await createStudentProfile({
        variables: {
          object: {
            branch_id: form.branch_id,
            first_name: form.first_name?.trim(),
            middle_name: form.middle_name?.trim() || null,
            last_name: form.last_name?.trim(),
            date_of_birth: form.date_of_birth,
            sex: form.sex,
            email: form.email?.trim() || null,
            phone: form.phone?.trim() || null,
            address: form.address.address_line || form.address.latitude != null
              ? {
                  address_line: form.address.address_line || null,
                  label: form.address.label || 'home',
                  latitude: form.address.latitude,
                  longitude: form.address.longitude,
                }
              : null,
            health: form.health.allergies
              ? {
                  allergies: form.health.allergies,
                }
              : null,
          },
        },
      });

      if (profileRes.error) {
        throw new Error(profileRes.error.message || 'Failed to create student profile');
      }

      const profileData = profileRes.data.CreateStudentProfile;
      const studentId = profileData.student_id;

      // Step 2: SetStudentGuardians
      const guardiansRes = await setStudentGuardians({
        variables: {
          object: {
            student_id: studentId,
            guardians: form.guardians.filter((g) => g.full_name?.trim()).map((g) => ({
              full_name: g.full_name?.trim(),
              relationship: g.relationship,
              phone: g.phone?.trim(),
              is_primary_contact: g.is_primary_contact,
            })),
          },
        },
      });

      if (guardiansRes.error) {
        throw new Error(guardiansRes.error.message || 'Failed to set guardians');
      }

      // Step 3: GetRegistrationPaymentQuote (already fetched, just validate)
      if (!paymentPackages.length) {
        throw new Error('No payment packages available. Please check your selection.');
      }

      // Find the selected package from quote
      const selectedPackage = paymentPackages.find((p) => p.package_code === form.payment.package_code);
      if (!selectedPackage) {
        throw new Error('Selected package not found in quote. Please refresh the quote.');
      }

      // Step 4: CompleteStudentRegistration
      const registrationRes = await completeStudentRegistration({
        variables: {
          object: {
            student_id: studentId,
            academic_year_id: form.academic_year_id,
            grade_level_id: form.grade_level_id,
            branch_id: form.branch_id,
            enrollment_date: form.enrollment_date,
            registration_type: form.registration_type,
            payment: {
              package_code: form.payment.package_code,
              payment_method: form.payment.payment_method,
              payment_date: form.payment.payment_date,
              ...(form.payment.payment_method === 'BANK_TRANSFER' && form.payment.transfer_reference?.trim()
                ? { transfer_reference: form.payment.transfer_reference.trim() }
                : {}),
            },
          },
        },
      });

      if (registrationRes.error) {
        throw new Error(registrationRes.error.message || 'Registration failed');
      }

      const d = registrationRes.data.CompleteStudentRegistration;
      setError(null);

      // Go to review step with result
      setStep(STEPS.length - 1);
      setForm((prev) => ({
        ...prev,
        _result: d,
        _profileResult: profileData,
      }));
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const result = form._result;
  const profileResult = form._profileResult;

  return (
    <div className="min-h-screen bg-gray-50">

      {error && (
        <div className="max-w-2xl mx-auto px-4 mb-4">
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-100">
            {error}
          </div>
        </div>
      )}

      {quoteError && (
        <div className="max-w-2xl mx-auto px-4 mb-4">
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-100">
            {quoteError.message}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Progress steps */}
        <div className="flex gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex-1 relative">
              <div className={`flex h-9 items-center justify-center rounded-full text-sm font-medium transition-all ${
                i < step
                  ? 'bg-blue-100 text-blue-700'
                  : i === step
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`absolute -top-1/2 left-1/2 w-full h-px -z-10 transform -translate-x-1/2 ${i < step ? 'bg-blue-300' : 'bg-gray-300'}`} />
              )}
              <span className={`text-xs text-center mt-1 block font-medium ${
                i === step ? 'text-blue-600 font-bold' : 'text-gray-500'
              }`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          {/* Step 1: Student Info */}
          {currentStep.key === 'student' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Student Information</h2>
              <p className="text-gray-600 text-sm mb-6">Enter the student's personal details.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setField('first_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={form.middle_name}
                    onChange={(e) => setField('middle_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setField('last_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) => setField('date_of_birth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sex *</label>
                  <div className="flex gap-4">
                    {VALID_SEX.map((s) => (
                      <label key={s} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value={s}
                          checked={form.sex === s}
                          onChange={() => setField('sex', s)}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    placeholder="e.g. 0912345678"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Address (Optional)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line</label>
                    <input
                      type="text"
                      value={form.address.address_line}
                      onChange={(e) => setField('address.address_line', e.target.value)}
                      placeholder="e.g., Bole"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                    <input
                      type="text"
                      value={form.address.label}
                      onChange={(e) => setField('address.label', e.target.value)}
                      placeholder="e.g., home"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={form.address.latitude || ''}
                      onChange={(e) => setField('address.latitude', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="e.g., 9.0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={form.address.longitude || ''}
                      onChange={(e) => setField('address.longitude', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="e.g., 38.7"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Health (Optional)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                    <input
                      type="text"
                      value={form.health.allergies}
                      onChange={(e) => setField('health.allergies', e.target.value)}
                      placeholder="e.g., None"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Guardians */}
          {currentStep.key === 'guardians' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Guardian Information</h2>
              <p className="text-gray-600 text-sm mb-6">At least one guardian is required.</p>

              <div className="space-y-4">
                {form.guardians.map((g, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900">Guardian {i + 1}</h3>
                      {form.guardians.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeGuardian(i)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input
                          value={g.full_name}
                          onChange={(e) => setGuardianField(i, 'full_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
                        <select
                          value={g.relationship}
                          onChange={(e) => setGuardianField(i, 'relationship', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">Select relationship</option>
                          {GUARDIAN_RELATIONSHIPS.map((r) => (
                            <option key={r} value={r}>
                              {r.charAt(0).toUpperCase() + r.slice(1).replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                        <input
                          type="tel"
                          value={g.phone}
                          onChange={(e) => setGuardianField(i, 'phone', e.target.value)}
                          placeholder="e.g. 0912345678"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={g.is_primary_contact}
                          onChange={() => setGuardianField(i, 'is_primary_contact', !g.is_primary_contact)}
                          className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        Primary Contact
                      </label>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addGuardian}
                  className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-blue-600 hover:bg-blue-50 transition"
                >
                  + Add another guardian
                </button>
              </div>
            </>
          )}

          {/* Step 3: Payment Quote */}
          {currentStep.key === 'quote' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Quote</h2>
              <p className="text-gray-600 text-sm mb-6">
                Review the available payment packages and their pricing before completing registration.
              </p>

              {quoteLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm text-gray-600">Calculating quote...</span>
                  </div>
                </div>
              ) : paymentPackages.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                  <p className="text-amber-600 text-sm">Please select academic year, grade level, and branch in the next step to see payment packages.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Select a payment package for this student:
                  </p>
                  {paymentPackages.map((pkg) => (
                    <div
                      key={pkg.package_code}
                      onClick={() => {
                        setField('payment.package_code', pkg.package_code);
                      }}
                      className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                        form.payment.package_code === pkg.package_code
                          ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-gray-900">{pkg.label}</h3>
                          <span className="font-mono text-sm text-gray-500">{pkg.package_code}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {pkg.duration_months} months • Discount: {pkg.discount_percent}%
                        </p>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-gray-400 text-sm line-through">ETB {pkg.base_amount?.toLocaleString()}</span>
                          <span className="text-lg font-bold text-gray-900">
                            ETB {pkg.final_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                      {form.payment.package_code === pkg.package_code && (
                        <span className="text-blue-600 font-semibold">✓ Selected</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Package Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 uppercase text-xs font-semibold">Package Code</p>
                    <p className="text-gray-900 font-medium">{form.payment.package_code || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 uppercase text-xs font-semibold">Payment Method</p>
                    <p className="text-gray-900 font-medium">
                      {form.payment.payment_method === 'CASH' ? 'Cash' : 'Bank Transfer'}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-gray-500 uppercase text-xs font-semibold">Final Amount</p>
                    <p className="text-gray-900 font-medium">
                      ETB {selectedPackage?.final_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 4: Complete Registration */}
          {currentStep.key === 'registration' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Complete Registration</h2>
              <p className="text-gray-600 text-sm mb-6">Finalize enrollment and payment details.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch *</label>
                  <select
                    value={form.branch_id}
                    onChange={(e) => setField('branch_id', e.target.value)}
                    disabled={branchesLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.is_main ? '(Main) ' : ''}{b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                  {branchesLoading && <p className="text-xs text-gray-500 mt-1">Loading branches…</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                  <select
                    value={form.academic_year_id}
                    onChange={(e) => setField('academic_year_id', e.target.value)}
                    disabled={yearsLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select academic year</option>
                    {academicYears.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.name} ({y.code}) {y.is_current ? ' • Current' : ''}
                      </option>
                    ))}
                  </select>
                  {yearsLoading && <p className="text-xs text-gray-500 mt-1">Loading years…</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level *</label>
                  <select
                    value={form.grade_level_id}
                    onChange={(e) => setField('grade_level_id', e.target.value)}
                    disabled={gradesLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select grade level</option>
                    {gradeLevels.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.code})
                      </option>
                    ))}
                  </select>
                  {gradesLoading && <p className="text-xs text-gray-500 mt-1">Loading grades…</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <select
                    value={form.section_id}
                    onChange={(e) => setField('section_id', e.target.value)}
                    disabled={sectionsLoading || sections.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Auto-assign section</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.section_name} (Slot {s.slot_index}, Capacity: {s.max_capacity})
                      </option>
                    ))}
                  </select>
                  {sectionsLoading && <p className="text-xs text-gray-500 mt-1">Loading sections…</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date *</label>
                  <input
                    type="date"
                    value={form.enrollment_date}
                    onChange={(e) => setField('enrollment_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Payment Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                    <select
                      value={form.payment.payment_method}
                      onChange={(e) => setField('payment.payment_method', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m === 'CASH' ? 'Cash' : 'Bank Transfer'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={form.payment.payment_date}
                      onChange={(e) => setField('payment.payment_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  {form.payment.payment_method === 'BANK_TRANSFER' && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Reference *</label>
                      <input
                        type="text"
                        value={form.payment.transfer_reference}
                        onChange={(e) => setField('payment.transfer_reference', e.target.value)}
                        placeholder="e.g., TXN-12345"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <p className="text-xs text-orange-500 mt-1">Required for bank transfer.</p>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Type</label>
                    <select
                      value={form.registration_type}
                      onChange={(e) => setField('registration_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="NEW">New Registration</option>
                      <option value="PROMOTION">Promotion (Existing Student)</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 5: Review & Submit */}
          {currentStep.key === 'review' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Review & Submit</h2>
              <p className="text-gray-600 text-sm mb-6">Review the registration details before submitting.</p>

              {result && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-green-900 mb-2">✓ Registration Complete</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Student ID</p>
                      <p className="font-medium">{result.student_id}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Registration ID</p>
                      <p className="font-medium">{result.registration_id}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">User ID</p>
                      <p className="font-medium">{result.user_id}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Enrollment ID</p>
                      <p className="font-medium">{result.enrollment_id}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Section ID</p>
                      <p className="font-medium">{result.section_id || 'Auto-assigned'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Payment ID</p>
                      <p className="font-medium">{result.payment_id}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Payment Status</p>
                      <p className="font-medium capitalize">{result.payment_status}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Package Code</p>
                      <p className="font-medium">{result.package_code}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Base Amount</p>
                      <p className="font-medium">{result.base_amount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Discount Amount</p>
                      <p className="font-medium">{result.discount_amount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Final Amount</p>
                      <p className="font-medium">{result.final_amount}</p>
                    </div>
                  </div>
                </div>
              )}

              {!result && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-sm">Student Name</p>
                      <p className="text-gray-900 font-medium break-all">
                        {form.first_name} {form.middle_name || ''} {form.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Date of Birth</p>
                      <p className="text-gray-900 font-medium">{form.date_of_birth}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Sex</p>
                      <p className="text-gray-900 font-medium">{form.sex}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Email</p>
                      <p className="text-gray-900 font-medium break-all">{form.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Phone</p>
                      <p className="text-gray-900 font-medium break-all">{form.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Branch</p>
                      <p className="text-gray-900 font-medium break-all">
                        {branches.find((b) => b.id === form.branch_id)?.name || form.branch_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Academic Year</p>
                      <p className="text-gray-900 font-medium break-all">
                        {academicYears.find((y) => y.id === form.academic_year_id)?.name || form.academic_year_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Grade Level</p>
                      <p className="text-gray-900 font-medium break-all">
                        {gradeLevels.find((g) => g.id === form.grade_level_id)?.name || form.grade_level_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Enrollment Date</p>
                      <p className="text-gray-900 font-medium">{form.enrollment_date}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Guardians</p>
                      <p className="text-gray-900 font-medium">
                        {form.guardians.filter((g) => g.full_name).length}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Payment Package</p>
                      <p className="text-gray-900 font-medium">{form.payment.package_code}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Payment Method</p>
                      <p className="text-gray-900 font-medium capitalize">{form.payment.payment_method}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-gray-500 text-sm">Final Amount (from quote)</p>
                      <p className="text-gray-900 font-medium">
                        ETB {selectedPackage?.final_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            {step > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 text-gray-600 font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Previous
              </button>
            )}

            {!isLastStep && !result && (
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  const err = validateStep(currentStep.key);
                  if (err) {
                    setError(err);
                    return;
                  }
                  nextStep();
                }}
                className="px-6 py-3 text-white font-medium bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Validating…' : 'Next'}
              </button>
            )}

            {isLastStep && !result && (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 text-white font-medium bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Registering…' : 'Register Student'}
              </button>
            )}

            {result && (
              <button
                type="button"
                onClick={() => {
                  setStep(0);
                  setForm({
                    branch_id: '',
                    first_name: '',
                    middle_name: '',
                    last_name: '',
                    date_of_birth: '',
                    sex: '',
                    email: '',
                    phone: '',
                    address: { address_line: '', label: 'home', latitude: null, longitude: null },
                    health: { allergies: '' },
                    guardians: [
                      { full_name: '', relationship: '', phone: '', is_primary_contact: true },
                    ],
                    academic_year_id: '',
                    grade_level_id: '',
                    section_id: '',
                    enrollment_date: '',
                    payment: {
                      package_code: '',
                      payment_method: 'CASH',
                      transfer_reference: '',
                      payment_date: '',
                    },
                    registration_type: 'NEW',
                  });
                }}
                className="px-6 py-3 text-white font-medium bg-green-600 rounded-lg hover:bg-green-700 transition"
              >
                Register Another Student
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
