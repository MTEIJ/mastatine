-- A committee can be hidden from the public pages (overview, its own page, sitemap) without deleting it.
-- Members, activities and minutes keep working. Visible by default.
ALTER TABLE committees ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE;
