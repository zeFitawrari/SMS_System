import {
  getHasuraActiveRole,
  getHasuraSchoolId,
  getHasuraUserId,
} from '../../utils/hasuraPayload.js';

export const registrarActorCtx = (req) => {
  const session = req.hasuraSession || req.body?.session_variables || {};
  return {
    actorRole: getHasuraActiveRole(req),
    actorSchoolId: getHasuraSchoolId(req),
    actorBranchId: session['x-hasura-branch-id'] || null,
    actorUserId: getHasuraUserId(req),
  };
};

export const formatRegistrationCompleteOutput = (result) => ({
  registration_type: result.registrationType,
  student_id: result.studentId,
  user_id: result.userId,
  registration_id: result.registrationId,
  enrollment_id: result.enrollmentId,
  section_id: result.sectionId,
  payment_id: result.paymentId,
  payment_status: result.paymentStatus,
  base_amount: result.baseAmount,
  discount_amount: result.discountAmount,
  final_amount: result.finalAmount,
  package_code: result.packageCode,
});
