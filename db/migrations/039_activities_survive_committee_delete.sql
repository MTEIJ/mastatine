-- Deleting a committee no longer deletes the activities it organised (with their sign-ups, events and plugin data).
-- They stay, without a committee, until an admin gives them a new one.
ALTER TABLE activities ALTER COLUMN committee_id DROP NOT NULL;
ALTER TABLE activities DROP CONSTRAINT activities_committee_id_fkey;
ALTER TABLE activities ADD CONSTRAINT activities_committee_id_fkey FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE SET NULL;
