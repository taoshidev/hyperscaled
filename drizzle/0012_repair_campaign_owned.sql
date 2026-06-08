-- Repair migration: 0011_funny_sabretooth was skipped on environments deployed
-- via `db:migrate` because 0007_promotional_campaigns carries a future-dated
-- `when` timestamp in drizzle/meta/_journal.json, which made the drizzle
-- migrator treat every later migration as already-applied. This re-applies the
-- column idempotently. Its journal `when` is set just above the poisoned 0007
-- value so the migrator actually runs it.
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "campaign_owned" boolean DEFAULT false NOT NULL;
