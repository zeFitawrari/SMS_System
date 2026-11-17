import { Router } from 'express';
import hasuraActionRouter from './hasura/index.js';
import { hasuraAuthHook } from '../controllers/auth/hasuraAuthHookController.js';

const router = Router();

/** Hasura authentication webhook (session + JWT enforcement). */
router.post('/auth/hasura-webhook', hasuraAuthHook);

/** Hasura action webhooks only — clients use GraphQL, not these URLs. */
router.use(hasuraActionRouter);

export default router;
