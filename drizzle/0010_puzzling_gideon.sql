ALTER TABLE "promotional_campaigns" DROP CONSTRAINT "promotional_campaigns_entity_miner_hotkey_entity_miners_hotkey_fk";
--> statement-breakpoint
DROP INDEX "promotional_campaigns_active_unique_per_tenant";--> statement-breakpoint
DROP INDEX "promotional_campaigns_miner_idx";--> statement-breakpoint
ALTER TABLE "promotional_campaigns" DROP COLUMN "entity_miner_hotkey";