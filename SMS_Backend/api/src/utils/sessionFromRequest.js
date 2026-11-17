import { getHasuraSessionId } from './hasuraPayload.js';

/** Prefer explicit GraphQL input; fall back to JWT session claim (cannot be spoofed via action input alone). */
export const resolveCurrentSessionId = (req, inputSessionId) => {
  if (inputSessionId) return String(inputSessionId);
  try {
    return getHasuraSessionId(req);
  } catch {
    return null;
  }
};
