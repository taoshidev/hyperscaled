DROP INDEX "auth_nonces_expires_at_idx";--> statement-breakpoint
CREATE INDEX "auth_nonces_expires_at_idx" ON "auth_nonces" USING btree ("expires_at");