export const requestMeta = (req) => ({
  userAgent: req.headers['user-agent'],
  clientIp: req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim(),
});
