import catchAsync from '../../utils/catchAsync.js';
import { loginWithCredentials } from '../../services/auth/login.js';
import { requestMeta } from '../../utils/requestMeta.js';
import { formatLoginOutput } from './formatLoginOutput.js';

export const login = catchAsync(async (req, res) => {
  const { email, phone, password } = req.hasuraInput || {};
  const session = await loginWithCredentials({ email, phone, password }, requestMeta(req));
  res.status(200).json(formatLoginOutput(session));
});
