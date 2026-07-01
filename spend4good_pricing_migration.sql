-- =============================================================
-- Spend4Good — Pricing rename to USD plan IDs
-- Safe to re-run. Adds new enum values, then migrates any existing rows.
-- Run this AFTER spend4good_phase1_migration.sql (or on projects that
-- already applied the old enum with 'nonprofit_self' / 'funder_premium').
-- =============================================================

-- 1. Add new enum values if missing
alter type public.subscription_plan add value if not exists 'nonprofit_starter';
alter type public.subscription_plan add value if not exists 'funder_growth';
alter type public.subscription_plan add value if not exists 'funder_unlimited';

-- 2. Migrate any legacy values to the new taxonomy
update public.organizations
   set subscription_plan = 'nonprofit_starter'
 where subscription_plan::text = 'nonprofit_self';

update public.organizations
   set subscription_plan = 'funder_unlimited'
 where subscription_plan::text = 'funder_premium';

update public.subscriptions
   set plan = 'nonprofit_starter'
 where plan::text = 'nonprofit_self';

update public.subscriptions
   set plan = 'funder_unlimited'
 where plan::text = 'funder_premium';

-- Note: PostgreSQL cannot drop enum values in-place. The legacy
-- 'nonprofit_self' / 'funder_premium' labels remain in the type but are
-- no longer written by the application. Recreate the enum only in a
-- maintenance window if you need to remove them entirely.
