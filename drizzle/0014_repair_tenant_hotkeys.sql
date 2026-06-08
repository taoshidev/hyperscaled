-- Repair migration: 0009_supreme_slipstream and 0010_puzzling_gideon were
-- skipped on environments deployed via `db:migrate` for the same reason as
-- 0011/0008 (see 0012_repair_campaign_owned) -- the future-dated
-- 0007_promotional_campaigns `when` timestamp shadowed every later migration.
-- This brings `promotional_campaigns` to the final multi-tenant shape
-- idempotently, so it is a no-op on environments where 0009/0010 did apply.

-- 0009: add the multi-tenant array column.
ALTER TABLE "promotional_campaigns" ADD COLUMN IF NOT EXISTS "entity_miner_hotkeys" text[];--> statement-breakpoint
-- 0009: backfill from the legacy single-hotkey column, but only while it still
-- exists (it is dropped further down / by the original 0010). A NULL hotkey was
-- the site-wide ("all brands") sentinel and intentionally stays NULL.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promotional_campaigns'
      AND column_name = 'entity_miner_hotkey'
  ) THEN
    UPDATE "promotional_campaigns"
    SET "entity_miner_hotkeys" = ARRAY["entity_miner_hotkey"]
    WHERE "entity_miner_hotkey" IS NOT NULL
      AND "entity_miner_hotkeys" IS NULL;
  END IF;
END $$;--> statement-breakpoint
-- 0009: gin index over the tenant array.
CREATE INDEX IF NOT EXISTS "promotional_campaigns_tenants_idx" ON "promotional_campaigns" USING gin ("entity_miner_hotkeys");--> statement-breakpoint
-- 0010: drop the legacy single-hotkey column and its dependents.
ALTER TABLE "promotional_campaigns" DROP CONSTRAINT IF EXISTS "promotional_campaigns_entity_miner_hotkey_entity_miners_hotkey_fk";--> statement-breakpoint
DROP INDEX IF EXISTS "promotional_campaigns_active_unique_per_tenant";--> statement-breakpoint
DROP INDEX IF EXISTS "promotional_campaigns_miner_idx";--> statement-breakpoint
ALTER TABLE "promotional_campaigns" DROP COLUMN IF EXISTS "entity_miner_hotkey";
