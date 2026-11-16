-- A reversal must mirror the entry it cancels exactly (date, category, counterparty, activity), not just its amount, so a
-- reversal cannot be used to move money between activities or categories. Replaces the trigger function from 028.
CREATE OR REPLACE FUNCTION finance_entries_chain() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE last_row finance_entries;
BEGIN
  PERFORM pg_advisory_xact_lock(727275);
  SELECT * INTO last_row FROM finance_entries ORDER BY seq DESC LIMIT 1;
  NEW.seq := COALESCE(last_row.seq, 0) + 1;
  NEW.prev_hash := COALESCE(last_row.entry_hash, repeat('0', 64));
  NEW.created_at := NOW();
  NEW.entry_hash := finance_entry_hash(NEW);
  IF NEW.reverses_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM finance_entries o
      WHERE o.id = NEW.reverses_id AND o.reverses_id IS NULL AND o.amount_cents = -NEW.amount_cents
        AND o.occurred_on = NEW.occurred_on AND o.category = NEW.category AND o.counterparty = NEW.counterparty
        AND o.activity_id IS NOT DISTINCT FROM NEW.activity_id AND o.activity_label = NEW.activity_label
    ) THEN
      RAISE EXCEPTION 'a reversal must mirror an original entry exactly' USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;
