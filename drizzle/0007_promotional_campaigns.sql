CREATE TYPE "public"."promotional_campaign_status" AS ENUM('draft', 'scheduled', 'active', 'ended');--> statement-breakpoint
CREATE TABLE "promotional_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"status" "promotional_campaign_status" DEFAULT 'draft' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"coupon_id" uuid NOT NULL,
	"banner_enabled" boolean DEFAULT true NOT NULL,
	"banner_text" text,
	"tier_price_overrides" jsonb,
	"entity_miner_hotkey" text,
	"created_by_wallet" varchar(64),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promotional_campaigns_slug_unique" UNIQUE("slug")
);--> statement-breakpoint
ALTER TABLE "promotional_campaigns" ADD CONSTRAINT "promotional_campaigns_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotional_campaigns" ADD CONSTRAINT "promotional_campaigns_entity_miner_hotkey_entity_miners_hotkey_fk" FOREIGN KEY ("entity_miner_hotkey") REFERENCES "public"."entity_miners"("hotkey") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "promotional_campaigns_active_unique_per_tenant" ON "promotional_campaigns" USING btree (coalesce("entity_miner_hotkey", '__global__')) WHERE "promotional_campaigns"."status" = 'active';--> statement-breakpoint
CREATE INDEX "promotional_campaigns_status_idx" ON "promotional_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "promotional_campaigns_window_idx" ON "promotional_campaigns" USING btree ("starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "promotional_campaigns_coupon_id_idx" ON "promotional_campaigns" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "promotional_campaigns_miner_idx" ON "promotional_campaigns" USING btree ("entity_miner_hotkey");
