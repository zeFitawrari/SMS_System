import catchAsync from '../../utils/catchAsync.js';
import { manageUser } from '../../services/staff/manageUser.js';
import { registrarActorCtx } from '../student/registrarContext.js';

export const manageUserAction = catchAsync(async (req, res) => {
  const input = req.hasuraInput || {};
  const result = await manageUser(input, registrarActorCtx(req));

  if (result.deleted) {
    res.status(200).json({
      deleted: true,
      id: result.id,
      user_id: result.userId,
      school_id: result.schoolId,
    });
    return;
  }

  res.status(200).json({
    deleted: false,
    id: result.id,
    user_id: result.userId,
    school_id: result.schoolId,
    branch_id: result.branchId,
    role_id: result.roleId,
    scope_type: result.scopeType,
    scope_branch_id: result.assignmentBranchId,
    first_name: result.firstName,
    middle_name: result.middleName,
    last_name: result.lastName,
    email: result.email,
    phone: result.phone,
    employee_code: result.employeeCode,
    job_title: result.jobTitle,
    hired_on: result.hiredOn,
    status: result.status,
    teacher: result.teacher
      ? {
          education_level: result.teacher.educationLevel,
          field_of_study: result.teacher.fieldOfStudy,
          academic_background: result.teacher.academicBackground,
          years_of_experience: result.teacher.yearsOfExperience,
          teaching_license_number: result.teacher.teachingLicenseNumber,
          employment_type: result.teacher.employmentType,
        }
      : null,
  });
});
