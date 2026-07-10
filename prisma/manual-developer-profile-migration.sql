-- Run in Supabase SQL Editor if `npx prisma db push` cannot connect.
-- Adds birthYear and converts developer languages from text[] to jsonb.

ALTER TABLE developers
  ADD COLUMN IF NOT EXISTS "birthYear" INTEGER;

-- Only run the languages conversion if the column is still text[] (not jsonb yet).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'developers'
      AND column_name = 'languages'
      AND udt_name = '_text'
  ) THEN
    ALTER TABLE developers ALTER COLUMN languages DROP DEFAULT;
    ALTER TABLE developers
      ALTER COLUMN languages TYPE JSONB
      USING COALESCE(to_jsonb(languages), '[]'::jsonb);
    ALTER TABLE developers ALTER COLUMN languages SET DEFAULT '[]'::jsonb;
  END IF;
END $$;
