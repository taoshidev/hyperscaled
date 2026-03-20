import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  serial,
  numeric,
} from "drizzle-orm/pg-core";

export const entityMiners = pgTable("entity_miners", {
  hotkey: text("hotkey").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  usdcWallet: text("usdc_wallet").notNull(),
  apiUrl: text("api_url").notNull(),
  apiKey: text("api_key"),
  color: text("color").notNull().default("#3b82f6"),
  payoutCadenceDays: integer("payout_cadence_days").notNull().default(7),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const entityTiers = pgTable("entity_tiers", {
  id: serial("id").primaryKey(),
  hotkey: text("hotkey")
    .notNull()
    .references(() => entityMiners.hotkey),
  accountSize: integer("account_size").notNull(),
  priceUsdc: numeric("price_usdc", { precision: 12, scale: 2 }).notNull(),
  profitSplit: integer("profit_split").notNull().default(100),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    wallet: text("wallet").notNull(),
    email: text("email"),
    utmCode: text("utm_code"),
    kycStatus: text("kyc_status").notNull().default("none"),
    kycApplicantId: text("kyc_applicant_id"),
    kycVerifiedAt: timestamp("kyc_verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_wallet_idx").on(table.wallet)],
);

export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  minerHotkey: text("miner_hotkey")
    .notNull()
    .references(() => entityMiners.hotkey),
  hlAddress: text("hl_address").notNull(),
  accountSize: integer("account_size").notNull(),
  payoutAddress: text("payout_address"),
  tierIndex: integer("tier_index").notNull(),
  priceUsdc: numeric("price_usdc", { precision: 12, scale: 2 }).notNull(),
  txHash: text("tx_hash"),
  status: text("status").notNull().default("pending"),
  statusDetail: jsonb("status_detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
