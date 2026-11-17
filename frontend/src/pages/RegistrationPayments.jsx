import { useQuery } from '@apollo/client';
import { apolloClient } from '../lib/apolloClient';
import { REGISTRATION_PAYMENTS_QUERY } from '../graphql/registrationPaymentsQuery';

export default function RegistrationPayments() {
  const { data } = useQuery(REGISTRATION_PAYMENTS_QUERY, {
    client: apolloClient,
  });
  const payments = data?.registration_payments || [];

  if (!data) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold mx-auto mb-4">
          💵
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
          Registration Payments
        </h2>
        <p className="text-sm text-gray-600">
          View all registration payments with amounts, methods, and status.
        </p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 xl:py-10 max-w-7xl">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              Registration Payments
            </h1>
            <p className="text-sm text-gray-600">
              View all registration payments with amounts, methods, and status.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs sm:text-sm font-bold">
                💳
              </span>
              Registration Payments ({payments.length})
            </h2>
          </div>

          <div className="overflow-x-auto sm:overflow-visible">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Payment ID</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Student ID</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Enrollment ID</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Package Code</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider text-center sm:text-center">Method</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider text-center sm:text-center">Status</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider text-right sm:text-right">Amount</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Paid On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 sm:px-6 py-12 sm:py-16 text-center">
                      <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl sm:text-2xl font-bold mx-auto mb-4">
                        💳
                      </div>
                      <p className="text-gray-500 text-sm sm:text-base">
                        No registration payments found.
                      </p>
                    </td>
                  </tr>
                ) : null}
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-900 font-medium break-all">
                      {payment.id}
                    </td>
                    <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 break-all">
                      {payment.student_id}
                    </td>
                    <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 break-all">
                      {payment.enrollment_id}
                    </td>
                    <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-gray-100 text-gray-700 border border-gray-200">
                        {payment.package_code || '—'}
                      </span>
                    </td>
                    <td className="px-5 sm:px-6 py-4 sm:py-5 text-center sm:text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200">
                        <span className={payment.payment_method === 'CASH' ? 'text-green-800 bg-green-100' : 'text-blue-800 bg-blue-100'}>
                          {payment.payment_method || '—'}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 sm:px-6 py-4 sm:py-5 text-center sm:text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200">
                        <span className={payment.payment_status === 'paid' ? 'text-green-800 bg-green-100' : payment.payment_status === 'pending' ? 'text-yellow-800 bg-yellow-100' : 'text-gray-800 bg-gray-100'}>
                          {payment.payment_status || '—'}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600 text-right sm:text-right">
                      {payment.final_amount != null ? `ETB ${parseFloat(payment.final_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td className="px-5 sm:px-6 py-4 sm:py-5 text-sm text-gray-600">
                      {payment.paid_on || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
          <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs sm:text-sm font-bold">
              💰
            </span>
            Payment Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Payments</p>
              <p className="text-lg sm:text-xl font-semibold text-gray-900">
                {payments.length}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cash Payments</p>
              <p className="text-lg sm:text-xl font-semibold text-gray-900">
                {payments.filter((p) => p.payment_method === 'CASH').length}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bank Transfers</p>
              <p className="text-lg sm:text-xl font-semibold text-gray-900">
                {payments.filter((p) => p.payment_method === 'BANK_TRANSFER').length}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Amount</p>
              <p className="text-lg sm:text-xl font-semibold text-gray-900">
                ETB {payments.reduce((sum, p) => sum + (parseFloat(p.final_amount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
