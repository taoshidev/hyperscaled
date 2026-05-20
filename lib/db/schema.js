import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  serial,
  numeric,
  pgEnum,
  uuid,
  varchar,
  decimal,
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

export const affiliates = pgTable("affiliates", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  useCount: integer("use_count").notNull().default(0),
  parentAffiliateId: integer("parent_affiliate_id").references(
    () => affiliates.id,
    { onDelete: "set null" },
  ),
  entityMinerHotkey: text("entity_miner_hotkey").references(
    () => entityMiners.hotkey,
    { onDelete: "set null" },
  ),
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
    affiliateId: integer("affiliate_id").references(() => affiliates.id),
    kycStatus: text("kyc_status").notNull().default("none"),
    kycApplicantId: text("kyc_applicant_id"),
    kycVerifiedAt: timestamp("kyc_verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_wallet_idx").on(table.wallet)],
);

export const authNonces = pgTable(
  "auth_nonces",
  {
    nonceKey: text("nonce_key").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("auth_nonces_expires_at_idx").on(table.expiresAt)],
);

export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  minerHotkey: text("miner_hotkey")
    .notNull()
    .references(() => entityMiners.hotkey),
  hlAddress: text("hl_address").notNull(),
  payerAddress: text("payer_address"),
  accountSize: integer("account_size").notNull(),
  payoutAddress: text("payout_address"),
  tierIndex: integer("tier_index").notNull(),
  priceUsdc: numeric("price_usdc", { precision: 12, scale: 2 }).notNull(),
  txHash: text("tx_hash"),
  status: text("status").notNull().default("pending"),
  statusDetail: jsonb("status_detail"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("registrations_tx_hash_unique").on(table.txHash),
  index("registrations_payer_address_idx").on(table.payerAddress),
  index("registrations_hl_address_idx").on(table.hlAddress),
]);

export const couponDiscountTypeEnum = pgEnum("coupon_discount_type", [
  "percent",
  "fixed",
]);

export const couponUseTypeEnum = pgEnum("coupon_use_type", [
  "one_time",
  "multi_use",
  "unlimited",
]);

export const commandCenterRoleEnum = pgEnum("command_center_role", [
  "admin",
  "super_admin",
]);

export const coupons = pgTable("coupons", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 255 }).notNull().unique(),
  discountType: couponDiscountTypeEnum("discount_type").notNull(),
  discountValue: decimal("discount_value", {
    precision: 10,
    scale: 2,
  }).notNull(),
  useType: couponUseTypeEnum("use_type").notNull().default("one_time"),
  maxUses: integer("max_uses"),
  allowedEmails: jsonb("allowed_emails"),
  allowedTierIds: jsonb("allowed_tier_ids"),
  validFrom: timestamp("valid_from", { withTimezone: true }),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  createdByWallet: varchar("created_by_wallet", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const couponRedemptions = pgTable("coupon_redemptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  couponId: uuid("coupon_id")
    .notNull()
    .references(() => coupons.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  paymentIntentId: varchar("payment_intent_id", { length: 255 }),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const commandCenterStaff = pgTable(
  "command_center_staff",
  {
    id: serial("id").primaryKey(),
    wallet: text("wallet").notNull(),
    role: commandCenterRoleEnum("role").notNull().default("admin"),
    label: text("label"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("command_center_staff_wallet_idx").on(table.wallet),
  ]
);

export const referralClicks = pgTable(
  "referral_clicks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clickId: uuid("click_id").notNull().unique(),
    affiliateId: integer("affiliate_id").references(() => affiliates.id, {
      onDelete: "set null",
    }),
    entityMinerHotkey: text("entity_miner_hotkey").references(
      () => entityMiners.hotkey,
      { onDelete: "set null" },
    ),
    promoCode: varchar("promo_code", { length: 255 }),
    landingPath: text("landing_path").notNull(),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    ipHash: varchar("ip_hash", { length: 64 }),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("referral_clicks_aff_time_idx").on(table.affiliateId, table.occurredAt),
    index("referral_clicks_miner_time_idx").on(
      table.entityMinerHotkey,
      table.occurredAt,
    ),
    index("referral_clicks_promo_time_idx").on(table.promoCode, table.occurredAt),
  ],
);

export const referralAttributions = pgTable(
  "referral_attributions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    affiliateId: integer("affiliate_id").references(() => affiliates.id, {
      onDelete: "set null",
    }),
    entityMinerHotkey: text("entity_miner_hotkey").references(
      () => entityMiners.hotkey,
      { onDelete: "set null" },
    ),
    promoCode: varchar("promo_code", { length: 255 }),
    clickId: uuid("click_id"),
    firstTouchAt: timestamp("first_touch_at", { withTimezone: true }).notNull(),
    signupAt: timestamp("signup_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("referral_attributions_user_unique").on(table.userId),
    index("referral_attributions_aff_idx").on(table.affiliateId),
    index("referral_attributions_miner_idx").on(table.entityMinerHotkey),
  ],
);

export const registrationAttributions = pgTable(
  "registration_attributions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    registrationId: integer("registration_id")
      .notNull()
      .references(() => registrations.id, { onDelete: "cascade" }),
    attributionId: uuid("attribution_id")
      .notNull()
      .references(() => referralAttributions.id, { onDelete: "cascade" }),
    affiliateId: integer("affiliate_id").references(() => affiliates.id, {
      onDelete: "set null",
    }),
    entityMinerHotkey: text("entity_miner_hotkey").references(
      () => entityMiners.hotkey,
      { onDelete: "set null" },
    ),
    promoCode: varchar("promo_code", { length: 255 }),
    amountUsdc: numeric("amount_usdc", { precision: 12, scale: 2 }).notNull(),
    registeredAt: timestamp("registered_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("registration_attributions_reg_unique").on(table.registrationId),
    index("registration_attributions_aff_time_idx").on(
      table.affiliateId,
      table.registeredAt,
    ),
    index("registration_attributions_miner_time_idx").on(
      table.entityMinerHotkey,
      table.registeredAt,
    ),
  ],
);
