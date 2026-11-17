-- Section capacity slots (admin names); physical sections materialize on first assignment.

CREATE TABLE academic.grade_section_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES tenancy.schools(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL,
  academic_year_id UUID NOT NULL REFERENCES academic.academic_years(id) ON DELETE CASCADE,
  grade_level_id UUID NOT NULL REFERENCES academic.grade_levels(id) ON DELETE CASCADE,
  slot_index INT NOT NULL CHECK (slot_index > 0),
  section_name TEXT NOT NULL,
  max_capacity INT NOT NULL CHECK (max_capacity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT grade_section_slots_branch_fk
    FOREIGN KEY (school_id, branch_id)
    REFERENCES tenancy.branches (school_id, id)
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT grade_section_slots_placement_slot_key
    UNIQUE (school_id, branch_id, academic_year_id, grade_level_id, slot_index),
  CONSTRAINT grade_section_slots_placement_name_key
    UNIQUE (school_id, branch_id, academic_year_id, grade_level_id, section_name)
);

CREATE INDEX grade_section_slots_placement_idx
  ON academic.grade_section_slots (school_id, branch_id, academic_year_id, grade_level_id, slot_index);

ALTER TABLE academic.sections
  ADD COLUMN slot_id UUID REFERENCES academic.grade_section_slots(id) ON DELETE SET NULL,
  ADD COLUMN max_capacity INT CHECK (max_capacity IS NULL OR max_capacity > 0);

CREATE UNIQUE INDEX sections_slot_id_key ON academic.sections (slot_id) WHERE slot_id IS NOT NULL;

CREATE INDEX enrollments_section_active_idx
  ON student.enrollments (section_id)
  WHERE status = 'active' AND section_id IS NOT NULL;
