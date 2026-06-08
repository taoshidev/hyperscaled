-- Repair migration: 0008_woozy_roxanne_simpson was skipped for the same reason
-- as 0011 (see 0012_repair_campaign_owned). Re-add the 'paused' enum value
-- idempotently.
ALTER TYPE "public"."promotional_campaign_status" ADD VALUE IF NOT EXISTS 'paused' BEFORE 'ended';
