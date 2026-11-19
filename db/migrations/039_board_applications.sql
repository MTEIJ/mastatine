-- Applications for the board. One per account: sending the form again replaces the earlier answers.
-- The role columns hold the keys from BOARD in src/content/site.ts, so a role can be renamed without touching the data.
-- mast_photo is an /uploads URL (re-encoded, metadata stripped). Rows go away with the account.
CREATE TABLE IF NOT EXISTS board_applications (
  user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  first_choice TEXT NOT NULL,
  second_choice TEXT,
  motivation TEXT NOT NULL,
  study TEXT NOT NULL DEFAULT '',
  hours_per_week TEXT NOT NULL,
  mast_photo TEXT NOT NULL,
  mast_location TEXT NOT NULL DEFAULT '',
  mast_spirit TEXT NOT NULL,
  crate_hours INTEGER NOT NULL CHECK (crate_hours BETWEEN 0 AND 72),
  superpower TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS board_applications_created_idx ON board_applications (created_at DESC);
