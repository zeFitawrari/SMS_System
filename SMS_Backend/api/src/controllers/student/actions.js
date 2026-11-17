import catchAsync from '../../utils/catchAsync.js';
import { registerStudent } from '../../services/student/registerStudent.js';
import { createStudentProfile } from '../../services/student/registration/createStudentProfile.js';
import { setStudentGuardians } from '../../services/student/registration/setStudentGuardians.js';
import { completeStudentRegistration } from '../../services/student/registration/completeStudentRegistration.js';
import { formatRegistrationCompleteOutput, registrarActorCtx } from './registrarContext.js';

export const registerStudentAction = catchAsync(async (req, res) => {
  const input = req.hasuraInput || {};
  const result = await registerStudent(input, registrarActorCtx(req));
  res.status(200).json(formatRegistrationCompleteOutput(result));
});

export const createStudentProfileAction = catchAsync(async (req, res) => {
  const input = req.hasuraInput || {};
  const result = await createStudentProfile(input, registrarActorCtx(req));
  res.status(200).json({
    student_id: result.studentId,
    user_id: result.userId,
    registration_id: result.registrationId,
    school_id: result.schoolId,
    branch_id: result.branchId,
  });
});

export const setStudentGuardiansAction = catchAsync(async (req, res) => {
  const input = req.hasuraInput || {};
  const result = await setStudentGuardians(input, registrarActorCtx(req));
  res.status(200).json({
    student_id: result.studentId,
    guardian_count: result.guardianCount,
    school_id: result.schoolId,
    branch_id: result.branchId,
  });
});

export const completeStudentRegistrationAction = catchAsync(async (req, res) => {
  const input = req.hasuraInput || {};
  const result = await completeStudentRegistration(input, registrarActorCtx(req));
  res.status(200).json(formatRegistrationCompleteOutput(result));
});
