-- Book years replace the 3-day edit window. A mutation (ledger entry) stays open, and can be corrected or deleted
-- (every change is written to finance_audit), until its book year is closed. A year can only be closed once it has
-- ended. Closing seals all of its mutations into the hash chain, in date order, and nothing in that year can change
-- afterwards: a mistake is then fixed with a reversal, dated in a year that is still open.
--
-- The book year of a mutation is the calendar year of occurred_on.

DROP FUNCTION IF EXISTS finance_seal_due();

CREATE TABLE IF NOT EXISTS finance_book_years (
  year INTEGER PRIMARY KEY CHECK (year BETWEEN 2000 AND 2200),
  closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_by_id TEXT NOT NULL,
  closed_by_name TEXT NOT NULL
);
DROP TRIGGER IF EXISTS finance_book_years_immutable_trg ON finance_book_years;
CREATE TRIGGER finance_book_years_immutable_trg BEFORE UPDATE OR DELETE ON finance_book_years FOR EACH ROW EXECUTE FUNCTION finance_forbid_change();
DROP TRIGGER IF EXISTS finance_book_years_no_truncate_trg ON finance_book_years;
CREATE TRIGGER finance_book_years_no_truncate_trg BEFORE TRUNCATE ON finance_book_years FOR EACH STATEMENT EXECUTE FUNCTION finance_forbid_change();

CREATE OR REPLACE FUNCTION finance_year_closed(d date) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM finance_book_years WHERE year = EXTRACT(YEAR FROM d)::int)
$$;

-- New mutations start open and cannot be dated in a closed year. A reversal cancels a sealed original but takes
-- today's date (or any date in an open year), because the original's year may already be closed.
CREATE OR REPLACE FUNCTION finance_entries_chain() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.seq := NULL;
  NEW.prev_hash := NULL;
  NEW.entry_hash := NULL;
  NEW.created_at := NOW();
  IF finance_year_closed(NEW.occurred_on) THEN
    RAISE EXCEPTION 'the book year of this date is closed' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF NEW.reverses_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM finance_entries o
      WHERE o.id = NEW.reverses_id AND o.seq IS NOT NULL AND o.reverses_id IS NULL AND o.amount_cents = -NEW.amount_cents
        AND o.category = NEW.category AND o.counterparty = NEW.counterparty
        AND o.activity_id IS NOT DISTINCT FROM NEW.activity_id AND o.activity_label = NEW.activity_label
    ) THEN
      RAISE EXCEPTION 'a reversal must mirror a sealed original entry exactly' USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;

-- Sealed mutations cannot change. Open ones can be edited or deleted while their year is open; reversals never.
CREATE OR REPLACE FUNCTION finance_entries_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.seq IS NOT NULL THEN
    RAISE EXCEPTION 'finance_entries is append-only: a sealed entry cannot be changed' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  -- Sealing itself is an update of an open entry, done only by finance_close_year().
  IF TG_OP = 'UPDATE' AND current_setting('finance.sealing', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF OLD.reverses_id IS NOT NULL THEN
    RAISE EXCEPTION 'a reversal cannot be changed or deleted' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF finance_year_closed(OLD.occurred_on) THEN
    RAISE EXCEPTION 'the book year of this entry is closed' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF finance_year_closed(NEW.occurred_on) THEN
      RAISE EXCEPTION 'the book year of this date is closed' USING ERRCODE = 'integrity_constraint_violation';
    END IF;
    IF NEW.id <> OLD.id OR NEW.created_at <> OLD.created_at OR NEW.created_by_id <> OLD.created_by_id OR NEW.created_by_name <> OLD.created_by_name
       OR NEW.reverses_id IS DISTINCT FROM OLD.reverses_id OR NEW.seq IS NOT NULL OR NEW.prev_hash IS NOT NULL OR NEW.entry_hash IS NOT NULL THEN
      RAISE EXCEPTION 'only the details of an open entry can be edited' USING ERRCODE = 'integrity_constraint_violation';
    END IF;
    RETURN NEW;
  END IF;
  RETURN OLD;
END $$;

-- Closes a book year: seals its open mutations into the chain, oldest date first, and records who did it.
-- Only after the year has ended, only once, and only when no earlier year still has open mutations.
CREATE OR REPLACE FUNCTION finance_close_year(p_year integer, p_by_id text, p_by_name text) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  r finance_entries;
  last_row finance_entries;
  sealed integer := 0;
BEGIN
  PERFORM pg_advisory_xact_lock(727275);
  IF p_year >= EXTRACT(YEAR FROM CURRENT_DATE)::int THEN
    RAISE EXCEPTION 'a book year can only be closed after it has ended' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF EXISTS (SELECT 1 FROM finance_book_years WHERE year = p_year) THEN
    RAISE EXCEPTION 'this book year is already closed' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF EXISTS (
    SELECT 1 FROM finance_entries e
    WHERE e.seq IS NULL AND EXTRACT(YEAR FROM e.occurred_on)::int < p_year
  ) THEN
    RAISE EXCEPTION 'close the earlier book years first' USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  PERFORM set_config('finance.sealing', 'on', true);
  FOR r IN
    SELECT * FROM finance_entries WHERE seq IS NULL AND EXTRACT(YEAR FROM occurred_on)::int = p_year ORDER BY occurred_on, created_at, id
  LOOP
    SELECT * INTO last_row FROM finance_entries WHERE seq IS NOT NULL ORDER BY seq DESC LIMIT 1;
    r.seq := COALESCE(last_row.seq, 0) + 1;
    r.prev_hash := COALESCE(last_row.entry_hash, repeat('0', 64));
    r.entry_hash := finance_entry_hash(r);
    UPDATE finance_entries SET seq = r.seq, prev_hash = r.prev_hash, entry_hash = r.entry_hash WHERE id = r.id;
    sealed := sealed + 1;
  END LOOP;
  PERFORM set_config('finance.sealing', 'off', true);

  INSERT INTO finance_book_years (year, closed_by_id, closed_by_name) VALUES (p_year, p_by_id, p_by_name);
  RETURN sealed;
END $$;

DROP FUNCTION IF EXISTS finance_edit_window();
