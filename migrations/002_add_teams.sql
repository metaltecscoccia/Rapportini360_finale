-- Migration: Add Teams System
-- Date: 2026-01-27

-- 1. Create teams table
CREATE TABLE IF NOT EXISTS "teams" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"name" text NOT NULL,
	"team_leader_id" varchar NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- 2. Create team_members table
CREATE TABLE IF NOT EXISTS "team_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);

-- 3. Create team_submissions table
CREATE TABLE IF NOT EXISTS "team_submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"team_id" varchar NOT NULL,
	"team_leader_id" varchar NOT NULL,
	"client_id" varchar NOT NULL,
	"work_order_id" varchar NOT NULL,
	"date" text NOT NULL,
	"hours" numeric NOT NULL,
	"status" text DEFAULT 'In attesa' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- 4. Add new columns to daily_reports (if not exist)
DO $$
BEGIN
    -- Add team_submission_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='daily_reports' AND column_name='team_submission_id') THEN
        ALTER TABLE "daily_reports" ADD COLUMN "team_submission_id" varchar;
    END IF;

    -- Add submitted_by_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='daily_reports' AND column_name='submitted_by_id') THEN
        ALTER TABLE "daily_reports" ADD COLUMN "submitted_by_id" varchar;
    END IF;
END $$;

-- 5. Add foreign key constraints for teams
ALTER TABLE "teams" ADD CONSTRAINT "teams_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "teams" ADD CONSTRAINT "teams_team_leader_id_users_id_fk"
    FOREIGN KEY ("team_leader_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

-- 6. Add foreign key constraints for team_members
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk"
    FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

-- 7. Add foreign key constraints for team_submissions
ALTER TABLE "team_submissions" ADD CONSTRAINT "team_submissions_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "team_submissions" ADD CONSTRAINT "team_submissions_team_id_teams_id_fk"
    FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "team_submissions" ADD CONSTRAINT "team_submissions_team_leader_id_users_id_fk"
    FOREIGN KEY ("team_leader_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "team_submissions" ADD CONSTRAINT "team_submissions_client_id_clients_id_fk"
    FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "team_submissions" ADD CONSTRAINT "team_submissions_work_order_id_work_orders_id_fk"
    FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;

-- 8. Add foreign key constraints for daily_reports new columns
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_team_submission_id_team_submissions_id_fk"
    FOREIGN KEY ("team_submission_id") REFERENCES "public"."team_submissions"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_submitted_by_id_users_id_fk"
    FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

-- 9. Create indexes for teams
CREATE INDEX IF NOT EXISTS "teams_org_idx" ON "teams" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "teams_leader_idx" ON "teams" USING btree ("team_leader_id");

-- 10. Create indexes for team_members
CREATE INDEX IF NOT EXISTS "team_members_team_idx" ON "team_members" USING btree ("team_id");
CREATE INDEX IF NOT EXISTS "team_members_user_idx" ON "team_members" USING btree ("user_id");

-- 11. Create indexes for team_submissions
CREATE INDEX IF NOT EXISTS "team_submissions_org_date_idx" ON "team_submissions" USING btree ("organization_id","date");
CREATE INDEX IF NOT EXISTS "team_submissions_team_idx" ON "team_submissions" USING btree ("team_id");
CREATE INDEX IF NOT EXISTS "team_submissions_team_date_idx" ON "team_submissions" USING btree ("team_id","date");

-- 12. Create index for daily_reports new column
CREATE INDEX IF NOT EXISTS "daily_reports_team_submission_idx" ON "daily_reports" USING btree ("team_submission_id");

-- 13. Add unique constraint for team+date on team_submissions
ALTER TABLE "team_submissions" ADD CONSTRAINT "team_submissions_team_date_unique" UNIQUE ("team_id", "date");
