import catchAsync from '../../utils/catchAsync.js';
import { getRegistrationPaymentQuote } from '../../services/finance/registrationQuote.js';
import { registrarActorCtx } from '../student/registrarContext.js';

export const registrationPaymentQuoteAction = catchAsync(async (req, res) => {
  const input = req.hasuraInput || {};
  const { packages } = await getRegistrationPaymentQuote(input, registrarActorCtx(req));

  res.status(200).json({
    packages: packages.map((p) => ({
      package_code: p.packageCode,
      label: p.label,
      duration_months: p.durationMonths,
      discount_percent: p.discountPercent,
      monthly_fee: p.monthlyFee,
      base_amount: p.baseAmount,
      discount_amount: p.discountAmount,
      final_amount: p.finalAmount,
    })),
  });
});
