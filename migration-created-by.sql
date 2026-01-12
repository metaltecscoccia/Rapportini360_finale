-- Migration: Add createdBy field to daily_reports table
-- Date: 2026-01-12
-- Purpose: Track if report was created by employee (mobile app) or admin (dashboard)

-- Add createdBy column with default 'employee' for backward compatibility
ALTER TABLE daily_reports
ADD COLUMN created_by TEXT NOT NULL DEFAULT 'employee';

-- Add comment for documentation
COMMENT ON COLUMN daily_reports.created_by IS
  'Origin of report creation: "employee" (mobile app) or "admin" (dashboard)';

-- Verify the column was added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'daily_reports'
  AND column_name = 'created_by';
