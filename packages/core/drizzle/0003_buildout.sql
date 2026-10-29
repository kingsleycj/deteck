CREATE TYPE "public"."business_status" AS ENUM('pending', 'info_requested', 'rejected', 'approved', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('new', 'investigating', 'referred', 'closed');--> statement-breakpoint
ALTER TYPE "public"."check_kind" ADD VALUE 'api';--> statement-breakpoint
ALTER TYPE "public"."check_kind" ADD VALUE 'business';--> statement-breakpoint
ALTER TYPE "public"."custody_event_type" ADD VALUE 'voided';--> statement-breakpoint
ALTER TYPE "public"."custody_source" ADD VALUE 'manufacturer_api';--> statement-breakpoint
ALTER TYPE "public"."custody_source" ADD VALUE 'business_receipt';--> statement-breakpoint
ALTER TYPE "public"."custody_source" ADD VALUE 'staff_correction';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE 'pcn_premises_licence' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE 'cac_certificate' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."product_status" ADD VALUE 'pending_review';--> statement-breakpoint
CREATE TABLE "api_key" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"prefix" text NOT NULL,
	"secret_hash" char(64) NOT NULL,
	"owner_type" text NOT NULL,
	"manufacturer_id" uuid,
	"business_id" uuid,
	"scopes" jsonb NOT NULL,
	"rate_limit" integer DEFAULT 120 NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "api_key_prefix_unique" UNIQUE("prefix")
);
--> statement-breakpoint
CREATE TABLE "business_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"party_id" uuid,
	"name" text NOT NULL,
	"role" "party_role" NOT NULL,
	"address" text NOT NULL,
	"state" text NOT NULL,
	"town" text,
	"pcn_licence" text,
	"cac_rc" text,
	"gln" char(13),
	"contact_name" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"status" "business_status" DEFAULT 'pending' NOT NULL,
	"status_reason" text,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_account_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "import_mapping" (
	"manufacturer_id" uuid NOT NULL,
	"kind" "import_kind" NOT NULL,
	"header_signature" text NOT NULL,
	"mapping" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "import_mapping_manufacturer_id_kind_header_signature_pk" PRIMARY KEY("manufacturer_id","kind","header_signature")
);
--> statement-breakpoint
CREATE TABLE "pack_void" (
	"pack_id" bigint PRIMARY KEY NOT NULL,
	"reason" text NOT NULL,
	"voided_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recall_alert" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"address" text NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"confirm_token_hash" char(64),
	"confirmed_at" timestamp with time zone,
	"unsubscribe_token_hash" char(64) NOT NULL,
	"sent_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"result_code" text NOT NULL,
	"manufacturer_id" uuid,
	"product_id" uuid,
	"batch_id" uuid,
	"serial_key_hmac" "bytea",
	"product_description" text,
	"place_name" text,
	"state" text,
	"town" text,
	"bought_on" date,
	"details" text,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"share_consent" boolean DEFAULT false NOT NULL,
	"photo_keys" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"device_day_hash" "bytea",
	"status" "report_status" DEFAULT 'new' NOT NULL,
	"assigned_to" text,
	"resolution" text,
	"closed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_document" (
	"key" text PRIMARY KEY NOT NULL,
	"file_key" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_delivery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"endpoint_id" uuid NOT NULL,
	"event" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_status_code" integer,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "webhook_endpoint" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manufacturer_id" uuid,
	"business_id" uuid,
	"url" text NOT NULL,
	"secret" text NOT NULL,
	"events" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"disabled_reason" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document" ALTER COLUMN "manufacturer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "business_id" uuid;--> statement-breakpoint
ALTER TABLE "import_job" ADD COLUMN "source" text DEFAULT 'upload' NOT NULL;--> statement-breakpoint
ALTER TABLE "import_job" ADD COLUMN "file_deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "manufacturer" ADD COLUMN "reason_before_suspension" text;--> statement-breakpoint
ALTER TABLE "scan_session" ADD COLUMN "review_label" text;--> statement-breakpoint
ALTER TABLE "scan_session" ADD COLUMN "review_note" text;--> statement-breakpoint
ALTER TABLE "scan_session" ADD COLUMN "reviewed_by" text;--> statement-breakpoint
ALTER TABLE "scan_session" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_manufacturer_id_manufacturer_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_business_id_business_account_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_account" ADD CONSTRAINT "business_account_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_account" ADD CONSTRAINT "business_account_party_id_party_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."party"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_mapping" ADD CONSTRAINT "import_mapping_manufacturer_id_manufacturer_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pack_void" ADD CONSTRAINT "pack_void_pack_id_pack_id_fk" FOREIGN KEY ("pack_id") REFERENCES "public"."pack"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pack_void" ADD CONSTRAINT "pack_void_voided_by_user_id_fk" FOREIGN KEY ("voided_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recall_alert" ADD CONSTRAINT "recall_alert_batch_id_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_manufacturer_id_manufacturer_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_batch_id_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_assigned_to_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_document" ADD CONSTRAINT "site_document_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD CONSTRAINT "webhook_delivery_endpoint_id_webhook_endpoint_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."webhook_endpoint"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_endpoint" ADD CONSTRAINT "webhook_endpoint_manufacturer_id_manufacturer_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_endpoint" ADD CONSTRAINT "webhook_endpoint_business_id_business_account_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_endpoint" ADD CONSTRAINT "webhook_endpoint_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_key_manufacturer_idx" ON "api_key" USING btree ("manufacturer_id");--> statement-breakpoint
CREATE INDEX "api_key_business_idx" ON "api_key" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "business_account_status_idx" ON "business_account" USING btree ("status");--> statement-breakpoint
CREATE INDEX "recall_alert_batch_idx" ON "recall_alert" USING btree ("batch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recall_alert_unique" ON "recall_alert" USING btree ("batch_id","channel","address");--> statement-breakpoint
CREATE INDEX "report_status_idx" ON "report" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "report_manufacturer_idx" ON "report" USING btree ("manufacturer_id","created_at");--> statement-breakpoint
CREATE INDEX "webhook_delivery_endpoint_idx" ON "webhook_delivery" USING btree ("endpoint_id","created_at");--> statement-breakpoint
CREATE INDEX "webhook_manufacturer_idx" ON "webhook_endpoint" USING btree ("manufacturer_id");--> statement-breakpoint
CREATE INDEX "webhook_business_idx" ON "webhook_endpoint" USING btree ("business_id");--> statement-breakpoint
ALTER TABLE "scan_session" ADD CONSTRAINT "scan_session_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;