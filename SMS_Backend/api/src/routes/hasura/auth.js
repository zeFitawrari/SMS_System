import { registerSchool } from '../../controllers/auth/registerController.js';
import { login } from '../../controllers/auth/loginController.js';
import { refresh } from '../../controllers/auth/refreshController.js';
import { logout } from '../../controllers/auth/logoutController.js';
import { listMySessions } from '../../controllers/auth/listMySessionsController.js';
import { revokeSession } from '../../controllers/auth/revokeSessionController.js';
import { revokeOtherSessions } from '../../controllers/auth/revokeOtherSessionsController.js';
import { selectContext } from '../../controllers/auth/selectContextController.js';
import { listMyContexts } from '../../controllers/auth/listMyContextsController.js';
import { assignRole } from '../../controllers/auth/assignRoleController.js';
import { revokeRoleAssignment } from '../../controllers/auth/revokeRoleAssignmentController.js';
import { hasuraAction } from '../../middlewares/hasuraAction.js';
import { rateLimit } from '../../middlewares/rateLimit.js';
import {
  loginSafetySchema,
  refreshSessionSafetySchema,
  registerSchoolSafetySchema,
} from '../../validators/hasuraActions.js';

const authRateLimit = rateLimit({ windowMs: 60_000, max: 40, keyPrefix: 'auth' });

/** Paths must match hasura/metadata/actions.yaml handlers under /api/v1 */
export const registerAuthHasuraActions = (router) => {
  router.post(
    '/auth/register-school',
    ...hasuraAction({ safetySchema: registerSchoolSafetySchema, handler: registerSchool })
  );

  router.post(
    '/auth/login',
    authRateLimit,
    ...hasuraAction({ safetySchema: loginSafetySchema, handler: login })
  );

  router.post(
    '/auth/refresh',
    authRateLimit,
    ...hasuraAction({ safetySchema: refreshSessionSafetySchema, handler: refresh })
  );

  router.post('/auth/logout', ...hasuraAction({ handler: logout }));

  router.post(
    '/auth/list-my-sessions',
    ...hasuraAction({ requireUser: true, handler: listMySessions })
  );

  router.post(
    '/auth/revoke-session',
    ...hasuraAction({ requireUser: true, handler: revokeSession })
  );

  router.post(
    '/auth/revoke-other-sessions',
    ...hasuraAction({ requireUser: true, handler: revokeOtherSessions })
  );

  router.post(
    '/auth/list-my-contexts',
    ...hasuraAction({ requireUser: true, handler: listMyContexts })
  );

  router.post(
    '/auth/select-context',
    ...hasuraAction({ requireUser: true, handler: selectContext })
  );

  router.post(
    '/auth/assign-role',
    ...hasuraAction({ requireUser: true, handler: assignRole })
  );

  router.post(
    '/auth/revoke-role-assignment',
    ...hasuraAction({ requireUser: true, handler: revokeRoleAssignment })
  );
};
