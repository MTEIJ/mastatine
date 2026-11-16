-- Finance: an append-only, hash-chained ledger of money in and out, activity budgets, receipts and an audit trail.
--
-- Safety model:
--   * Ledger rows can never be updated, deleted or truncated (triggers). A mistake is fixed with a reversing row.
--   * Every row stores the hash of the row before it, so a change made behind the app's back breaks the chain and
--     shows up on the "Verify" check. Amounts are integer cents, never floats.
--   * Rows keep a snapshot of who made them and which activity they belong to, with no foreign keys to mutable
--     tables, so deleting a user or an activity can never touch (or be blocked by) a ledger row.

CREATE OR REPLACE FUNCTION finance_forbid_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% is append-only: % is not allowed', TG_TABLE_NAME, TG_OP USING ERRCODE = 'integrity_constraint_violation';
END $$;

CREATE TABLE IF NOT EXISTS finance_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seq BIGINT NOT NULL UNIQUE,
  occurred_on DATE NOT NULL,
  -- Positive = money in, negative = money out.
  amount_cents BIGINT NOT NULL CHECK (amount_cents <> 0 AND abs(amount_cents) <= 10000000000),
  category TEXT NOT NULL CHECK (category IN ('donation', 'membership', 'sponsorship', 'merch', 'activity_income', 'activity_cost', 'supplies', 'fees', 'other')),
  counterparty TEXT NOT NULL DEFAULT '' CHECK (char_length(counterparty) <= 120),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 300),
  -- A plain id (no foreign key) plus the name at the time, so the history survives the activity being deleted.
  activity_id UUID,
  activity_label TEXT NOT NULL DEFAULT '' CHECK (char_length(activity_label) <= 120),
  -- Bank or payment-provider reference. Unique, so importing the same statement twice cannot double-count.
  external_ref TEXT CHECK (external_ref IS NULL OR char_length(external_ref) BETWEEN 1 AND 120),
  reverses_id UUID UNIQUE REFERENCES finance_entries(id),
  created_by_id TEXT NOT NULL,
  created_by_name TEXT NOT NULL CHECK (char_length(created_by_name) <= 120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  prev_hash TEXT NOT NULL,
  entry_hash TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS finance_entries_external_ref_idx ON finance_entries (external_ref) WHERE external_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS finance_entries_date_idx ON finance_entries (occurred_on DESC, seq DESC);
CREATE INDEX IF NOT EXISTS finance_entries_activity_idx ON finance_entries (activity_id) WHERE activity_id IS NOT NULL;

-- The hash of a row. jsonb text is unambiguous (no delimiter tricks) and handles NULLs.
CREATE OR REPLACE FUNCTION finance_entry_hash(e finance_entries) RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT encode(sha256(convert_to(jsonb_build_array(
    e.seq, e.id, e.occurred_on, e.amount_cents, e.category, e.counterparty, e.description, e.activity_id, e.activity_label,
    e.external_ref, e.reverses_id, e.created_by_id, e.created_by_name,
    to_char(e.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'), e.prev_hash
  )::text, 'UTF8')), 'hex')
$$;

CREATE OR REPLACE FUNCTION finance_entries_chain() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE last_row finance_entries;
BEGIN
  -- One writer at a time, so the chain has a single, gap-free order.
  PERFORM pg_advisory_xact_lock(727275);
  SELECT * INTO last_row FROM finance_entries ORDER BY seq DESC LIMIT 1;
  NEW.seq := COALESCE(last_row.seq, 0) + 1;
  NEW.prev_hash := COALESCE(last_row.entry_hash, repeat('0', 64));
  NEW.created_at := NOW();
  NEW.entry_hash := finance_entry_hash(NEW);
  IF NEW.reverses_id IS NOT NULL THEN
    -- A reversal must exactly cancel the row it reverses, and a reversal cannot itself be reversed.
    IF NOT EXISTS (SELECT 1 FROM finance_entries o WHERE o.id = NEW.reverses_id AND o.reverses_id IS NULL AND o.amount_cents = -NEW.amount_cents) THEN
      RAISE EXCEPTION 'a reversal must cancel an original entry exactly' USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS finance_entries_chain_trg ON finance_entries;
CREATE TRIGGER finance_entries_chain_trg BEFORE INSERT ON finance_entries FOR EACH ROW EXECUTE FUNCTION finance_entries_chain();
DROP TRIGGER IF EXISTS finance_entries_immutable_trg ON finance_entries;
CREATE TRIGGER finance_entries_immutable_trg BEFORE UPDATE OR DELETE ON finance_entries FOR EACH ROW EXECUTE FUNCTION finance_forbid_change();
DROP TRIGGER IF EXISTS finance_entries_no_truncate_trg ON finance_entries;
CREATE TRIGGER finance_entries_no_truncate_trg BEFORE TRUNCATE ON finance_entries FOR EACH STATEMENT EXECUTE FUNCTION finance_forbid_change();

-- Receipts and invoices: files live outside the public uploads folder; the hash proves the file was not swapped.
CREATE TABLE IF NOT EXISTS finance_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES finance_entries(id),
  filename TEXT NOT NULL UNIQUE CHECK (filename ~ '^[a-z0-9-]+\.(webp|pdf)$'),
  original_name TEXT NOT NULL CHECK (char_length(original_name) <= 200),
  content_type TEXT NOT NULL CHECK (content_type IN ('image/webp', 'application/pdf')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  sha256 TEXT NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  uploaded_by_id TEXT NOT NULL,
  uploaded_by_name TEXT NOT NULL CHECK (char_length(uploaded_by_name) <= 120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS finance_receipts_entry_idx ON finance_receipts (entry_id);
DROP TRIGGER IF EXISTS finance_receipts_immutable_trg ON finance_receipts;
CREATE TRIGGER finance_receipts_immutable_trg BEFORE UPDATE OR DELETE ON finance_receipts FOR EACH ROW EXECUTE FUNCTION finance_forbid_change();

-- What each activity is expected to cost and bring in. Editable, but every change is written to finance_audit.
CREATE TABLE IF NOT EXISTS activity_budgets (
  activity_id UUID PRIMARY KEY REFERENCES activities(id) ON DELETE CASCADE,
  planned_expense_cents BIGINT NOT NULL DEFAULT 0 CHECK (planned_expense_cents BETWEEN 0 AND 10000000000),
  planned_income_cents BIGINT NOT NULL DEFAULT 0 CHECK (planned_income_cents BETWEEN 0 AND 10000000000),
  updated_by_id TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Who changed what and when (budgets, exports, verifications). Append-only like the ledger.
CREATE TABLE IF NOT EXISTS finance_audit (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL CHECK (char_length(actor_name) <= 120),
  action TEXT NOT NULL CHECK (char_length(action) <= 60),
  detail JSONB NOT NULL DEFAULT '{}'::jsonb
);
DROP TRIGGER IF EXISTS finance_audit_immutable_trg ON finance_audit;
CREATE TRIGGER finance_audit_immutable_trg BEFORE UPDATE OR DELETE ON finance_audit FOR EACH ROW EXECUTE FUNCTION finance_forbid_change();
DROP TRIGGER IF EXISTS finance_audit_no_truncate_trg ON finance_audit;
CREATE TRIGGER finance_audit_no_truncate_trg BEFORE TRUNCATE ON finance_audit FOR EACH STATEMENT EXECUTE FUNCTION finance_forbid_change();
