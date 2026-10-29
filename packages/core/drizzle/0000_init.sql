CREATE TYPE "public"."batch_status" AS ENUM('active', 'recalled', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."check_kind" AS ENUM('serial', 'scan', 'journey', 'packaging');--> statement-breakpoint
CREATE TYPE "public"."custody_event_type" AS ENUM('shipped', 'received');--> statement-breakpoint
CREATE TYPE "public"."custody_level" AS ENUM('pack', 'batch');--> statement-breakpoint
CREATE TYPE "public"."custody_source" AS ENUM('manufacturer_import', 'staff_import');--> statement-breakpoint
CREATE TYPE "public"."document_kind" AS ENUM('nafdac_certificate', 'data_sharing_agreement', 'other');--> statement-breakpoint
CREATE TYPE "public"."import_kind" AS ENUM('products', 'batches_serials', 'distribution');--> statement-breakpoint
CREATE TYPE "public"."import_status" AS ENUM('uploaded', 'validating', 'ready', 'committing', 'committed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."manufacturer_status" AS ENUM('pending', 'info_requested', 'rejected', 'approved', 'in_review', 'changes_requested', 'live', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."packaging_side" AS ENUM('front', 'back', 'left', 'right', 'label', 'security');--> statement-breakpoint
CREATE TYPE "public"."party_role" AS ENUM('manufacturer', 'distributor', 'wholesaler', 'pharmacy', 'hospital', 'other');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('active', 'flagged', 'deactivated');--> statement-breakpoint
CREATE TYPE "public"."reference_status" AS ENUM('draft', 'processing', 'ready', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."scan_status" AS ENUM('collecting', 'queued', 'processing', 'done', 'failed');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_user_id" text,
	"actor_label" text NOT NULL,
	"actor_role" text,
	"manufacturer_id" uuid,
	"on_behalf" boolean DEFAULT false NOT NULL,
	"area" text NOT NULL,
	"action" text NOT NULL,
	"item_type" text NOT NULL,
	"item_id" text,
	"summary" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"ip" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "batch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"lot" text NOT NULL,
	"manufacture_date" date,
	"expiry_date" date NOT NULL,
	"quantity" integer,
	"status" "batch_status" DEFAULT 'active' NOT NULL,
	"status_reason" text,
	"status_source" text,
	"status_effective_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "check_event" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "check_event_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"kind" "check_kind" NOT NULL,
	"result" text NOT NULL,
	"product_id" uuid,
	"batch_id" uuid,
	"serial_key_hmac" "bytea",
	"device_day_hash" "bytea",
	"state" text
);
--> statement-breakpoint
CREATE TABLE "custody_event" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "custody_event_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"manufacturer_id" uuid NOT NULL,
	"level" "custody_level" NOT NULL,
	"pack_id" bigint,
	"batch_id" uuid NOT NULL,
	"from_party_id" uuid,
	"to_party_id" uuid NOT NULL,
	"event_type" "custody_event_type" DEFAULT 'shipped' NOT NULL,
	"event_date" date NOT NULL,
	"source" "custody_source" NOT NULL,
	"import_job_id" uuid,
	"supersedes_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manufacturer_id" uuid NOT NULL,
	"kind" "document_kind" NOT NULL,
	"file_key" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manufacturer_id" uuid NOT NULL,
	"kind" "import_kind" NOT NULL,
	"file_key" text NOT NULL,
	"file_name" text NOT NULL,
	"file_sha256" char(64) NOT NULL,
	"size_bytes" integer NOT NULL,
	"sheet_name" text,
	"headers" jsonb,
	"sample_rows" jsonb,
	"mapping" jsonb,
	"status" "import_status" DEFAULT 'uploaded' NOT NULL,
	"counts" jsonb,
	"problems_key" text,
	"error" text,
	"created_by" text,
	"on_behalf" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"committed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "manufacturer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"company_name" text NOT NULL,
	"address" text NOT NULL,
	"state" text NOT NULL,
	"factory_town" text,
	"nafdac_company_reg" text NOT NULL,
	"cac_rc" text,
	"contact_name" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"status" "manufacturer_status" DEFAULT 'pending' NOT NULL,
	"status_before_suspension" "manufacturer_status",
	"status_reason" text,
	"review_note" text,
	"submitted_for_review_at" timestamp with time zone,
	"submitted_for_review_by" text,
	"went_live_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "manufacturer_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "pack" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pack_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"product_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"serial_exact_hmac" "bytea" NOT NULL,
	"serial_key_hmac" "bytea" NOT NULL,
	"import_job_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pack_serial_exact_hmac_unique" UNIQUE("serial_exact_hmac")
);
--> statement-breakpoint
CREATE TABLE "packaging_image" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_id" uuid NOT NULL,
	"side" "packaging_side" NOT NULL,
	"file_key" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"passed" boolean NOT NULL,
	"fail_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packaging_reference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"effective_from" date NOT NULL,
	"status" "reference_status" DEFAULT 'draft' NOT NULL,
	"rejection_reason" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ready_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "party" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"normalised_name" text NOT NULL,
	"role" "party_role" NOT NULL,
	"state" text,
	"city" text,
	"cac_rc" text,
	"pcn_licence" text,
	"gln" char(13),
	"verified_at" timestamp with time zone,
	"verified_by" text,
	"merged_into_id" uuid,
	"created_by_manufacturer_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manufacturer_id" uuid NOT NULL,
	"gtin" char(14) NOT NULL,
	"brand_name" text NOT NULL,
	"generic_name" text NOT NULL,
	"strength" text NOT NULL,
	"dosage_form" text NOT NULL,
	"pack_size" text NOT NULL,
	"nafdac_reg_no" text NOT NULL,
	"serial_hint" text,
	"status" "product_status" DEFAULT 'active' NOT NULL,
	"status_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_gtin_unique" UNIQUE("gtin")
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limit_key_window_start_pk" PRIMARY KEY("key","window_start")
);
--> statement-breakpoint
CREATE TABLE "scan_session" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"device_day_hash" "bytea",
	"verification_id" text,
	"product_id" uuid,
	"batch_id" uuid,
	"reference_id" uuid,
	"status" "scan_status" DEFAULT 'collecting' NOT NULL,
	"photo_keys" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"outcome" text,
	"categories" jsonb,
	"confidence" real,
	"model" text,
	"retain_consent" boolean DEFAULT false NOT NULL,
	"photos_deleted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "staff_invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"note" text,
	"invited_by" text,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_result" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"result" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL,
	"verified" boolean DEFAULT true,
	"failed_verification_count" integer DEFAULT 0,
	"locked_until" timestamp
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"two_factor_enabled" boolean DEFAULT false,
	"platform_role" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "batch" ADD CONSTRAINT "batch_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custody_event" ADD CONSTRAINT "custody_event_manufacturer_id_manufacturer_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custody_event" ADD CONSTRAINT "custody_event_pack_id_pack_id_fk" FOREIGN KEY ("pack_id") REFERENCES "public"."pack"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custody_event" ADD CONSTRAINT "custody_event_batch_id_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custody_event" ADD CONSTRAINT "custody_event_from_party_id_party_id_fk" FOREIGN KEY ("from_party_id") REFERENCES "public"."party"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custody_event" ADD CONSTRAINT "custody_event_to_party_id_party_id_fk" FOREIGN KEY ("to_party_id") REFERENCES "public"."party"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_manufacturer_id_manufacturer_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_job" ADD CONSTRAINT "import_job_manufacturer_id_manufacturer_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_job" ADD CONSTRAINT "import_job_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturer" ADD CONSTRAINT "manufacturer_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturer" ADD CONSTRAINT "manufacturer_submitted_for_review_by_user_id_fk" FOREIGN KEY ("submitted_for_review_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pack" ADD CONSTRAINT "pack_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pack" ADD CONSTRAINT "pack_batch_id_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packaging_image" ADD CONSTRAINT "packaging_image_reference_id_packaging_reference_id_fk" FOREIGN KEY ("reference_id") REFERENCES "public"."packaging_reference"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packaging_reference" ADD CONSTRAINT "packaging_reference_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packaging_reference" ADD CONSTRAINT "packaging_reference_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party" ADD CONSTRAINT "party_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party" ADD CONSTRAINT "party_created_by_manufacturer_id_manufacturer_id_fk" FOREIGN KEY ("created_by_manufacturer_id") REFERENCES "public"."manufacturer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_manufacturer_id_manufacturer_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_invitation" ADD CONSTRAINT "staff_invitation_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_manufacturer_idx" ON "audit_log" USING btree ("manufacturer_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_log" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "batch_product_lot_uq" ON "batch" USING btree ("product_id","lot");--> statement-breakpoint
CREATE INDEX "check_event_created_idx" ON "check_event" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "check_event_serial_idx" ON "check_event" USING btree ("serial_key_hmac","created_at");--> statement-breakpoint
CREATE INDEX "check_event_product_idx" ON "check_event" USING btree ("product_id","created_at");--> statement-breakpoint
CREATE INDEX "custody_pack_idx" ON "custody_event" USING btree ("pack_id");--> statement-breakpoint
CREATE INDEX "custody_batch_idx" ON "custody_event" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "document_manufacturer_idx" ON "document" USING btree ("manufacturer_id");--> statement-breakpoint
CREATE INDEX "import_job_manufacturer_idx" ON "import_job" USING btree ("manufacturer_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "import_job_file_uq" ON "import_job" USING btree ("manufacturer_id","kind","file_sha256");--> statement-breakpoint
CREATE INDEX "manufacturer_status_idx" ON "manufacturer" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pack_serial_key_idx" ON "pack" USING btree ("serial_key_hmac");--> statement-breakpoint
CREATE INDEX "pack_batch_idx" ON "pack" USING btree ("batch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "packaging_image_side_uq" ON "packaging_image" USING btree ("reference_id","side");--> statement-breakpoint
CREATE UNIQUE INDEX "packaging_reference_version_uq" ON "packaging_reference" USING btree ("product_id","version");--> statement-breakpoint
CREATE INDEX "party_name_idx" ON "party" USING btree ("normalised_name");--> statement-breakpoint
CREATE INDEX "party_cac_idx" ON "party" USING btree ("cac_rc");--> statement-breakpoint
CREATE INDEX "party_pcn_idx" ON "party" USING btree ("pcn_licence");--> statement-breakpoint
CREATE INDEX "party_gln_idx" ON "party" USING btree ("gln");--> statement-breakpoint
CREATE INDEX "product_manufacturer_idx" ON "product" USING btree ("manufacturer_id");--> statement-breakpoint
CREATE INDEX "product_nafdac_idx" ON "product" USING btree ("nafdac_reg_no");--> statement-breakpoint
CREATE INDEX "rate_limit_window_idx" ON "rate_limit" USING btree ("window_start");--> statement-breakpoint
CREATE INDEX "scan_session_expires_idx" ON "scan_session" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "verification_result_expires_idx" ON "verification_result" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitation_organizationId_idx" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "member_organizationId_idx" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "twoFactor_secret_idx" ON "two_factor" USING btree ("secret");--> statement-breakpoint
CREATE INDEX "twoFactor_userId_idx" ON "two_factor" USING btree ("user_id");