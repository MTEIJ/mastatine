-- Who may use the finance app, set by admins in the admin area. Every grant and revoke is also written to finance_audit
-- (append-only), so the history of who had access cannot be rewritten. Emails in FINANCE_*_EMAILS keep working as a fixed
-- bootstrap list that this table cannot remove.
CREATE TABLE IF NOT EXISTS finance_roles (
  user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('treasurer', 'auditor')),
  granted_by_id TEXT NOT NULL,
  granted_by_name TEXT NOT NULL CHECK (char_length(granted_by_name) <= 120),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
