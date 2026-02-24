ALTER TABLE "agenda_items" ADD COLUMN IF NOT EXISTS "recurrence_interval" integer DEFAULT 1;
