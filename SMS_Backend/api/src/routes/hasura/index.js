import { Router } from 'express';
import { verifyHasuraWebhook } from '../../middlewares/hasuraWebhook.js';
import { registerAuthHasuraActions } from './auth.js';
import { registerAcademicHasuraActions } from './academic.js';
import { registerFinanceHasuraActions } from './finance.js';
import { registerStudentHasuraActions } from './students.js';
import { registerStaffHasuraActions } from './staff.js';

const hasuraActionRouter = Router();

hasuraActionRouter.use(verifyHasuraWebhook);

registerAuthHasuraActions(hasuraActionRouter);
registerAcademicHasuraActions(hasuraActionRouter);
registerFinanceHasuraActions(hasuraActionRouter);
registerStudentHasuraActions(hasuraActionRouter);
registerStaffHasuraActions(hasuraActionRouter);

export default hasuraActionRouter;
