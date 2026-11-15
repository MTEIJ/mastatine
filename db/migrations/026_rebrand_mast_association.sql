-- Rebrand: "S.A. Mastatine" is now "M.A. Mastatine" (Mast Association). Existing migrations keep their original text;
-- this updates the rows they already created. Idempotent: rows without the old name are left alone.
UPDATE committees
SET description = REPLACE(description, 'S.A. Mastatine', 'M.A. Mastatine')
WHERE description LIKE '%S.A. Mastatine%';

UPDATE news_posts
SET title = REPLACE(title, 'S.A. Mastatine', 'M.A. Mastatine'),
    summary = REPLACE(summary, 'S.A. Mastatine', 'M.A. Mastatine'),
    body = REPLACE(body, 'S.A. Mastatine', 'M.A. Mastatine'),
    updated_at = NOW()
WHERE title LIKE '%S.A. Mastatine%'
   OR summary LIKE '%S.A. Mastatine%'
   OR body LIKE '%S.A. Mastatine%';
