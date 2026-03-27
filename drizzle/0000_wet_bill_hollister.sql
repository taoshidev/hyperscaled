CREATE TABLE "entity_miners" (
	"hotkey" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"usdc_wallet" text NOT NULL,
	"api_url" text NOT NULL,
	"api_key" text,
	"color" text DEFAULT '#3b82f6' NOT NULL,
	"payout_cadence_days" integer DEFAULT 7 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entity_miners_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "entity_tiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"hotkey" text NOT NULL,
	"account_size" integer NOT NULL,
	"price_usdc" numeric(12, 2) NOT NULL,
	"profit_split" integer DEFAULT 100 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"miner_hotkey" text NOT NULL,
	"hl_address" text NOT NULL,
	"account_size" integer NOT NULL,
	"payout_address" text,
	"tier_index" integer NOT NULL,
	"price_usdc" numeric(12, 2) NOT NULL,
	"tx_hash" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"status_detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet" text NOT NULL,
	"email" text,
	"utm_code" text,
	"kyc_status" text DEFAULT 'none' NOT NULL,
	"kyc_applicant_id" text,
	"kyc_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entity_tiers" ADD CONSTRAINT "entity_tiers_hotkey_entity_miners_hotkey_fk" FOREIGN KEY ("hotkey") REFERENCES "public"."entity_miners"("hotkey") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_miner_hotkey_entity_miners_hotkey_fk" FOREIGN KEY ("miner_hotkey") REFERENCES "public"."entity_miners"("hotkey") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "registrations_tx_hash_unique" ON "registrations" USING btree ("tx_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "users_wallet_idx" ON "users" USING btree ("wallet");