import { manageUserAction } from '../../controllers/staff/actions.js';
import { hasuraAction } from '../../middlewares/hasuraAction.js';

export const registerStaffHasuraActions = (router) => {
  router.post('/staff/manage-user', ...hasuraAction({ requireUser: true, handler: manageUserAction }));
};
