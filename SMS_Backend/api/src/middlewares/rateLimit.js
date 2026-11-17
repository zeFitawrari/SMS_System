const buckets = new Map();

/** In-process sliding window limiter (single instance; use Redis for horizontal scale). */
export const rateLimit = ({ windowMs = 60_000, max = 30, keyPrefix = 'rl' } = {}) => {
  return (req, res, next) => {
    const ip = req.ip || 'unknown';
    const key = `${keyPrefix}:${ip}:${req.path}`;
    const now = Date.now();
    let entry = buckets.get(key);
    if (!entry || now - entry.start >= windowMs) {
      entry = { start: now, count: 0 };
      buckets.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.status(429).json({
        message: 'Too many requests. Try again later.',
        code: 'RATE_LIMITED',
      });
      return;
    }
    next();
  };
};
