-- Entries stay open for 3 days: they can be corrected or deleted (every change is written to finance_audit).
-- After that they are sealed into the hash chain and become permanent; only a reversal can fix them then.
--
-- How it keeps the chain sound: a new entry has no seq or hash yet. finance_seal_due() gives every entry older than
-- the window the next seq and hash, in the order they were entered. Only sealed entries are in the chain, so changing
-- an open entry never invalidates anything. Sealed entries stay fully append-only (trigger).
-- All entries that exist today are already part of the chain, so they are sealed.

CREATE OR REPLACE FUNCTION finance_edit_window() RETURNS interval LANGUAGE sql IMMUTABLE AS $$ SELECT interval '3 days' $$;

ALTER TABLE finance_entries ALTER COLUMN seq DROP NOT NULL;
ALTER TABLE finance_entries ALTER COLUMN prev_hash DROP NOT NULL;
ALTER TABLE finance_entries ALTER COLUMN entry_hash DROP NOT NULL;

-- New entries start open. A reversal may only cancel a sealed original (an open one is simply deleted instead).
CREATE OR REPLACE FUNCTION finance_entries_chain() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.seq := NULL;
  NEW.prev_hash := NULL;
  NEW.entry_hash := NULL;
  NEW.created_at := NOW();
  IF NEW.reverses_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM finance_entries o
      WHERE o.id = NEW.reverses_id AND o.seq IS NOT NULL AND o.reverses_id IS NULL AND o.amount_cents = -NEW.amount_cents
        AND o.occurred_on = NEW.occurred_on AND o.category = NEW.category AND o.counterparty = NEW.counterparty
        AND o.activity_id IS NOT DISTINCT FROM NEW.activity_id AND o.activity_label = NEW.activity_label
    ) THEN
      RAISE EXCEPTION 'a reversal must mirror a sealed original entry exactly' USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;

-- Sealed entries cannot change. Open ones can be edited or deleted until the window ends; reversals never.
CREATE OR REPLACE FUNCTION finance_entries_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.seq IS NOT NULL THEN
    RAISE EXCEPTION 'finance_entries is append-only: a sealed entry cannot be changed' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  -- Sealing itself is an update of an open entry, done only by finance_seal_due().
  IF TG_OP = 'UPDATE' AND current_setting('finance.sealing', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF OLD.reverses_id IS NOT NULL THEN
    RAISE EXCEPTION 'a reversal cannot be changed or deleted' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF OLD.created_at <= NOW() - finance_edit_window() THEN
    RAISE EXCEPTION 'the edit window for this entry has ended' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.id <> OLD.id OR NEW.created_at <> OLD.created_at OR NEW.created_by_id <> OLD.created_by_id OR NEW.created_by_name <> OLD.created_by_name
       OR NEW.reverses_id IS DISTINCT FROM OLD.reverses_id OR NEW.seq IS NOT NULL OR NEW.prev_hash IS NOT NULL OR NEW.entry_hash IS NOT NULL THEN
      RAISE EXCEPTION 'only the details of an open entry can be edited' USING ERRCODE = 'integrity_constraint_violation';
    END IF;
    RETURN NEW;
  END IF;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS finance_entries_immutable_trg ON finance_entries;
CREATE TRIGGER finance_entries_immutable_trg BEFORE UPDATE OR DELETE ON finance_entries FOR EACH ROW EXECUTE FUNCTION finance_entries_guard();

-- Seals every entry whose window has ended, oldest first. Safe to call at any time and from any number of requests.
CREATE OR REPLACE FUNCTION finance_seal_due() RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  r finance_entries;
  last_row finance_entries;
  sealed integer := 0;
BEGIN
  PERFORM pg_advisory_xact_lock(727275);
  PERFORM set_config('finance.sealing', 'on', true);
  FOR r IN
    SELECT * FROM finance_entries WHERE seq IS NULL AND created_at <= NOW() - finance_edit_window() ORDER BY created_at, id
  LOOP
    SELECT * INTO last_row FROM finance_entries WHERE seq IS NOT NULL ORDER BY seq DESC LIMIT 1;
    r.seq := COALESCE(last_row.seq, 0) + 1;
    r.prev_hash := COALESCE(last_row.entry_hash, repeat('0', 64));
    r.entry_hash := finance_entry_hash(r);
    UPDATE finance_entries SET seq = r.seq, prev_hash = r.prev_hash, entry_hash = r.entry_hash WHERE id = r.id;
    sealed := sealed + 1;
  END LOOP;
  PERFORM set_config('finance.sealing', 'off', true);
  RETURN sealed;
END $$;
