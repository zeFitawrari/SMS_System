import {
  manageAcademicYearAction,
  manageGradeLevelAction,
  manageGradeMonthlyFeeAction,
  manageSchoolRegistrationPackageAction,
  manageSectionSlotAction,
  updateEnrollmentSectionAction,
} from '../../controllers/academic/actions.js';
import { hasuraAction } from '../../middlewares/hasuraAction.js';

export const registerAcademicHasuraActions = (router) => {
  router.post(
    '/academic/manage-academic-year',
    ...hasuraAction({ requireUser: true, handler: manageAcademicYearAction })
  );
  router.post(
    '/academic/manage-grade-level',
    ...hasuraAction({ requireUser: true, handler: manageGradeLevelAction })
  );
  router.post(
    '/academic/manage-grade-monthly-fee',
    ...hasuraAction({ requireUser: true, handler: manageGradeMonthlyFeeAction })
  );
  router.post(
    '/academic/manage-section-slot',
    ...hasuraAction({ requireUser: true, handler: manageSectionSlotAction })
  );
  router.post(
    '/academic/manage-registration-package',
    ...hasuraAction({ requireUser: true, handler: manageSchoolRegistrationPackageAction })
  );
  router.post(
    '/academic/update-enrollment-section',
    ...hasuraAction({ requireUser: true, handler: updateEnrollmentSectionAction })
  );
};
