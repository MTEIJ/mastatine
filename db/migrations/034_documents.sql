-- Official association documents (statutes, house rules, policies, reports). PDFs live in a private folder and are
-- only served through a checked route; by default a document needs a signed-in member.
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN (
    'statutes', 'house_rules', 'privacy', 'code_of_conduct', 'complaints', 'policy_plan', 'annual_report',
    'financial', 'gmm', 'other'
  )),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 600),
  version_label TEXT NOT NULL DEFAULT '' CHECK (char_length(version_label) <= 40),
  document_date DATE NOT NULL DEFAULT CURRENT_DATE,
  visibility TEXT NOT NULL DEFAULT 'members' CHECK (visibility IN ('members', 'public')),
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  sha256 TEXT NOT NULL,
  uploaded_by_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS documents_category_idx ON documents (category, document_date DESC);
