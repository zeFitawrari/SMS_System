import { validateHasuraAction } from './validate.js';
import { requireHasuraUser } from './hasuraUser.js';

/**
 * Builds per-action middleware chain (after router-level verifyHasuraWebhook).
 * @param {{ handler: import('express').RequestHandler, safetySchema?: import('joi').Schema, requireUser?: boolean }} config
 * @returns {import('express').RequestHandler[]}
 */
export const hasuraAction = ({ handler, safetySchema = null, requireUser = false }) => {
  const chain = [];
  if (safetySchema) {
    chain.push(validateHasuraAction(safetySchema));
  }
  if (requireUser) {
    chain.push(requireHasuraUser);
  }
  chain.push(handler);
  return chain;
};
