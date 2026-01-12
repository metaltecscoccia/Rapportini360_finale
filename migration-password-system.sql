-- Migration: Add mustResetPassword and remove plainPassword
-- Date: 2026-01-12

-- Step 1: Add mustResetPassword column (default false for existing users)
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_reset_password BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Drop plainPassword column (Google Play compliance)
ALTER TABLE users DROP COLUMN IF EXISTS plain_password;

-- Verification query (optional - run this to check the schema)
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'users'
-- ORDER BY ordinal_position;
