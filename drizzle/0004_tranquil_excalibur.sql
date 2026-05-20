CREATE TYPE "public"."command_center_role" AS ENUM('admin', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."coupon_discount_type" AS ENUM('percent', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."coupon_use_type" AS ENUM('one_time', 'multi_use', 'unlimited');--> statement-breakpoint
CREATE TABLE "command_center_staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet" text NOT NULL,
	"role" "command_center_role" DEFAULT 'admin' NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"user_id" integer NOT NULL,
	"payment_intent_id" varchar(255),
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(255) NOT NULL,
	"discount_type" "coupon_discount_type" NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"use_type" "coupon_use_type" DEFAULT 'one_time' NOT NULL,
	"max_uses" integer,
	"allowed_emails" jsonb,
	"allowed_tier_ids" jsonb,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"created_by_wallet" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referral_attributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"affiliate_id" integer,
	"entity_miner_hotkey" text,
	"promo_code" varchar(255),
	"click_id" uuid,
	"first_touch_at" timestamp with time zone NOT NULL,
	"signup_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"click_id" uuid NOT NULL,
	"affiliate_id" integer,
	"entity_miner_hotkey" text,
	"promo_code" varchar(255),
	"landing_path" text NOT NULL,
	"referrer" text,
	"user_agent" text,
	"ip_hash" varchar(64),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referral_clicks_click_id_unique" UNIQUE("click_id")
);
--> statement-breakpoint
CREATE TABLE "registration_attributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" integer NOT NULL,
	"attribution_id" uuid NOT NULL,
	"affiliate_id" integer,
	"entity_miner_hotkey" text,
	"promo_code" varchar(255),
	"amount_usdc" numeric(12, 2) NOT NULL,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "affiliates" ADD COLUMN "parent_affiliate_id" integer;--> statement-breakpoint
ALTER TABLE "affiliates" ADD COLUMN "entity_miner_hotkey" text;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "payer_address" text;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_attributions" ADD CONSTRAINT "referral_attributions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_attributions" ADD CONSTRAINT "referral_attributions_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_attributions" ADD CONSTRAINT "referral_attributions_entity_miner_hotkey_entity_miners_hotkey_fk" FOREIGN KEY ("entity_miner_hotkey") REFERENCES "public"."entity_miners"("hotkey") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_clicks" ADD CONSTRAINT "referral_clicks_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_clicks" ADD CONSTRAINT "referral_clicks_entity_miner_hotkey_entity_miners_hotkey_fk" FOREIGN KEY ("entity_miner_hotkey") REFERENCES "public"."entity_miners"("hotkey") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_attributions" ADD CONSTRAINT "registration_attributions_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_attributions" ADD CONSTRAINT "registration_attributions_attribution_id_referral_attributions_id_fk" FOREIGN KEY ("attribution_id") REFERENCES "public"."referral_attributions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_attributions" ADD CONSTRAINT "registration_attributions_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_attributions" ADD CONSTRAINT "registration_attributions_entity_miner_hotkey_entity_miners_hotkey_fk" FOREIGN KEY ("entity_miner_hotkey") REFERENCES "public"."entity_miners"("hotkey") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "command_center_staff_wallet_idx" ON "command_center_staff" USING btree ("wallet");--> statement-breakpoint
CREATE UNIQUE INDEX "referral_attributions_user_unique" ON "referral_attributions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "referral_attributions_aff_idx" ON "referral_attributions" USING btree ("affiliate_id");--> statement-breakpoint
CREATE INDEX "referral_attributions_miner_idx" ON "referral_attributions" USING btree ("entity_miner_hotkey");--> statement-breakpoint
CREATE INDEX "referral_clicks_aff_time_idx" ON "referral_clicks" USING btree ("affiliate_id","occurred_at");--> statement-breakpoint
CREATE INDEX "referral_clicks_miner_time_idx" ON "referral_clicks" USING btree ("entity_miner_hotkey","occurred_at");--> statement-breakpoint
CREATE INDEX "referral_clicks_promo_time_idx" ON "referral_clicks" USING btree ("promo_code","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "registration_attributions_reg_unique" ON "registration_attributions" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "registration_attributions_aff_time_idx" ON "registration_attributions" USING btree ("affiliate_id","registered_at");--> statement-breakpoint
CREATE INDEX "registration_attributions_miner_time_idx" ON "registration_attributions" USING btree ("entity_miner_hotkey","registered_at");--> statement-breakpoint
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_parent_affiliate_id_affiliates_id_fk" FOREIGN KEY ("parent_affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_entity_miner_hotkey_entity_miners_hotkey_fk" FOREIGN KEY ("entity_miner_hotkey") REFERENCES "public"."entity_miners"("hotkey") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "registrations_payer_address_idx" ON "registrations" USING btree ("payer_address");--> statement-breakpoint
CREATE INDEX "registrations_hl_address_idx" ON "registrations" USING btree ("hl_address");