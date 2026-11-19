-- Board application form changes: "If you were a mast, which one would you be?" and "How many hours can you sit on a
-- crate?" were taken off, and a question about the applicant's ambitions for their board year was added.
-- Applications sent before this have no ambitions yet, so the column defaults to empty.
ALTER TABLE board_applications DROP COLUMN IF EXISTS mast_spirit;
ALTER TABLE board_applications DROP COLUMN IF EXISTS crate_hours;
ALTER TABLE board_applications ADD COLUMN IF NOT EXISTS ambitions TEXT NOT NULL DEFAULT '';
