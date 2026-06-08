ALTER TABLE "promotional_campaigns" ADD COLUMN "entity_miner_hotkeys" text[];--> statement-breakpoint
-- Backfill the new multi-tenant array from the legacy single-hotkey column.
-- A NULL hotkey was the site-wide ("all brands") sentinel and stays NULL here.
UPDATE "promotional_campaigns" SET "entity_miner_hotkeys" = ARRAY["entity_miner_hotkey"] WHERE "entity_miner_hotkey" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "promotional_campaigns_tenants_idx" ON "promotional_campaigns" USING gin ("entity_miner_hotkeys");