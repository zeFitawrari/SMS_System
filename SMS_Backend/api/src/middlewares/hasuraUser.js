import { getHasuraUserId } from '../utils/hasuraPayload.js';

/** Requires Hasura to forward a valid access JWT (session_variables with user id). */
export const requireHasuraUser = (req, _res, next) => {
  try {
    req.authUserId = getHasuraUserId(req);
    next();
  } catch (err) {
    next(err);
  }
};
