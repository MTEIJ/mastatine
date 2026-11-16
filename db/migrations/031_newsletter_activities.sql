-- How many upcoming activities (with posters) a newsletter issue shows under its message. 0 = none.
ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS activities_count SMALLINT NOT NULL DEFAULT 0 CHECK (activities_count BETWEEN 0 AND 8);
