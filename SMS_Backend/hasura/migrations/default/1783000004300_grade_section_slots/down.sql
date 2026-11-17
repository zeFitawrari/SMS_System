DROP INDEX IF EXISTS student.enrollments_section_active_idx;

DROP INDEX IF EXISTS academic.sections_slot_id_key;

ALTER TABLE academic.sections
  DROP COLUMN IF EXISTS max_capacity,
  DROP COLUMN IF EXISTS slot_id;

DROP TABLE IF EXISTS academic.grade_section_slots;
