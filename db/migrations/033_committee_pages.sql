-- Every committee gets its own public page (/committees/<slug>) with an optional banner,
-- and members can ask to join a committee; an admin approves or declines.
ALTER TABLE committees ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE committees ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Backfill: lowercase, runs of non-alphanumerics become one dash; a numeric suffix resolves clashes.
WITH base AS (
  SELECT id, COALESCE(NULLIF(trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), ''), 'committee') AS s,
         created_at
  FROM committees WHERE slug IS NULL
), ranked AS (
  SELECT id, s, row_number() OVER (PARTITION BY s ORDER BY created_at, id) AS n FROM base
)
UPDATE committees c SET slug = CASE WHEN r.n = 1 THEN r.s ELSE r.s || '-' || r.n END
FROM ranked r WHERE c.id = r.id;

ALTER TABLE committees ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS committees_slug_idx ON committees (slug);

CREATE TABLE IF NOT EXISTS committee_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  message TEXT NOT NULL DEFAULT '' CHECK (char_length(message) <= 1000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);
-- One open request per person per committee.
CREATE UNIQUE INDEX IF NOT EXISTS committee_join_requests_pending_idx
  ON committee_join_requests (committee_id, user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS committee_join_requests_user_idx ON committee_join_requests (user_id);
