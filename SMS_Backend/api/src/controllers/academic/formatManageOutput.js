export const formatManageAcademicYearOutput = (result) => {
  if (result.deleted) {
    return { deleted: true, id: result.id, school_id: result.schoolId };
  }
  const r = result.row;
  return {
    deleted: false,
    id: r.id,
    school_id: result.schoolId,
    code: r.code,
    name: r.name,
    starts_on: r.starts_on,
    ends_on: r.ends_on,
    is_current: r.is_current,
  };
};

export const formatManageGradeLevelOutput = (result) => {
  if (result.deleted) {
    return { deleted: true, id: result.id, school_id: result.schoolId };
  }
  const r = result.row;
  return {
    deleted: false,
    id: r.id,
    school_id: result.schoolId,
    code: r.code,
    name: r.name,
    level_type: r.level_type,
    sort_order: r.sort_order,
    is_active: r.is_active,
  };
};

export const formatManageGradeMonthlyFeeOutput = (result) => {
  if (result.deleted) {
    return { deleted: true, id: result.id, school_id: result.schoolId };
  }
  const r = result.row;
  return {
    deleted: false,
    id: r.id,
    school_id: result.schoolId,
    academic_year_id: r.academic_year_id,
    grade_level_id: r.grade_level_id,
    monthly_amount: Number(r.monthly_amount),
  };
};

export const formatManageSectionSlotOutput = (result) => {
  if (result.deleted) {
    return { deleted: true, id: result.id, school_id: result.schoolId };
  }
  const r = result.row;
  return {
    deleted: false,
    id: r.id,
    school_id: result.schoolId,
    branch_id: r.branch_id,
    academic_year_id: r.academic_year_id,
    grade_level_id: r.grade_level_id,
    slot_index: r.slot_index,
    section_name: r.section_name,
    max_capacity: r.max_capacity,
  };
};

export const formatManageSchoolRegistrationPackageOutput = (result) => {
  if (result.deleted) {
    return { deleted: true, id: result.id, school_id: result.schoolId };
  }
  const r = result.row;
  return {
    deleted: false,
    id: r.id,
    school_id: result.schoolId,
    package_code: r.package_code,
    is_enabled: r.is_enabled,
  };
};
