import {
  registerStudentAction,
  createStudentProfileAction,
  setStudentGuardiansAction,
  completeStudentRegistrationAction,
} from '../../controllers/student/actions.js';
import { hasuraAction } from '../../middlewares/hasuraAction.js';

export const registerStudentHasuraActions = (router) => {
  router.post(
    '/students/register',
    ...hasuraAction({ requireUser: true, handler: registerStudentAction })
  );
  router.post(
    '/students/create-profile',
    ...hasuraAction({ requireUser: true, handler: createStudentProfileAction })
  );
  router.post(
    '/students/set-guardians',
    ...hasuraAction({ requireUser: true, handler: setStudentGuardiansAction })
  );
  router.post(
    '/students/complete-registration',
    ...hasuraAction({ requireUser: true, handler: completeStudentRegistrationAction })
  );
};
