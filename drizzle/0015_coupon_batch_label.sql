ALTER TABLE "coupons" ADD COLUMN "batch_label" varchar(120);--> statement-breakpoint
CREATE INDEX "coupons_batch_label_idx" ON "coupons" USING btree ("batch_label");