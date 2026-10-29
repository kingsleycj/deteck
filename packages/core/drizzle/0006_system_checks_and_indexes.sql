CREATE TABLE "system_check" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "audit_action_item_idx" ON "audit_log" USING btree ("action","item_id");--> statement-breakpoint
CREATE INDEX "custody_to_party_idx" ON "custody_event" USING btree ("to_party_id");--> statement-breakpoint
CREATE INDEX "pack_product_idx" ON "pack" USING btree ("product_id");--> statement-breakpoint
-- Text search in the audit trail ("ilike '%…%'") uses this instead of reading every row.
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_summary_trgm_idx" ON "audit_log" USING gin ("summary" gin_trgm_ops);
