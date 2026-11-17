import catchAsync from '../../utils/catchAsync.js';
import { manageAcademicYear } from '../../services/academic/manageAcademicYear.js';
import { manageGradeLevel } from '../../services/academic/manageGradeLevel.js';
import { manageGradeMonthlyFee } from '../../services/academic/manageGradeMonthlyFee.js';
import { manageSectionSlot } from '../../services/academic/manageSectionSlot.js';
import { manageSchoolRegistrationPackage } from '../../services/academic/manageSchoolRegistrationPackage.js';
import { updateEnrollmentSection } from '../../services/academic/sections.js';
import { getHasuraActiveRole, getHasuraSchoolId } from '../../utils/hasuraPayload.js';
import {
  formatManageAcademicYearOutput,
  formatManageGradeLevelOutput,
  formatManageGradeMonthlyFeeOutput,
  formatManageSchoolRegistrationPackageOutput,
  formatManageSectionSlotOutput,
} from './formatManageOutput.js';

const actorCtx = (req) => ({
  actorRole: getHasuraActiveRole(req),
  actorSchoolId: getHasuraSchoolId(req),
});

export const manageAcademicYearAction = catchAsync(async (req, res) => {
  const result = await manageAcademicYear(req.hasuraInput || {}, actorCtx(req));
  res.status(200).json(formatManageAcademicYearOutput(result));
});

export const manageGradeLevelAction = catchAsync(async (req, res) => {
  const result = await manageGradeLevel(req.hasuraInput || {}, actorCtx(req));
  res.status(200).json(formatManageGradeLevelOutput(result));
});

export const manageGradeMonthlyFeeAction = catchAsync(async (req, res) => {
  const result = await manageGradeMonthlyFee(req.hasuraInput || {}, actorCtx(req));
  res.status(200).json(formatManageGradeMonthlyFeeOutput(result));
});

export const manageSectionSlotAction = catchAsync(async (req, res) => {
  const result = await manageSectionSlot(req.hasuraInput || {}, actorCtx(req));
  res.status(200).json(formatManageSectionSlotOutput(result));
});

export const manageSchoolRegistrationPackageAction = catchAsync(async (req, res) => {
  const result = await manageSchoolRegistrationPackage(req.hasuraInput || {}, actorCtx(req));
  res.status(200).json(formatManageSchoolRegistrationPackageOutput(result));
});

export const updateEnrollmentSectionAction = catchAsync(async (req, res) => {
  const input = req.hasuraInput || {};
  const session = req.hasuraSession || req.body?.session_variables || {};

  const result = await updateEnrollmentSection(input, {
    ...actorCtx(req),
    actorBranchId: session['x-hasura-branch-id'] || null,
  });

  res.status(200).json({
    enrollment_id: result.enrollmentId,
    section_id: result.sectionId,
    warning: result.warning,
  });
});
