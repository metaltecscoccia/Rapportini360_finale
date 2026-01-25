-- Migration: Add subscription fields to organizations table
-- Purpose: Enable SaaS multi-tenant functionality with Stripe payments
-- Date: 2026-01-25

-- Add subscription-related columns to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) NOT NULL DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) NOT NULL DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS billing_email TEXT,
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP,
ADD COLUMN IF NOT EXISTS max_employees INTEGER DEFAULT 5;

-- Grandfathering: Set existing organization (Metaltec) to premium with no limits
-- This ensures the production app continues working without interruption
UPDATE organizations
SET subscription_status = 'active',
    subscription_plan = 'premium_yearly',
    max_employees = 999,
    trial_end_date = NULL,
    subscription_current_period_end = NULL
WHERE name = 'Metaltec'
  AND stripe_customer_id IS NULL;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_orgs_subscription_status ON organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_orgs_stripe_customer_id ON organizations(stripe_customer_id);

-- Add comments for documentation
COMMENT ON COLUMN organizations.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN organizations.subscription_status IS 'Status: trial, active, past_due, canceled, incomplete, paused';
COMMENT ON COLUMN organizations.subscription_plan IS 'Plan: free, premium_monthly, premium_yearly';
COMMENT ON COLUMN organizations.subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN organizations.trial_end_date IS 'End date of 30-day trial period';
COMMENT ON COLUMN organizations.billing_email IS 'Email for billing notifications';
COMMENT ON COLUMN organizations.subscription_current_period_end IS 'End of current billing period';
COMMENT ON COLUMN organizations.max_employees IS 'Maximum number of employees allowed';
