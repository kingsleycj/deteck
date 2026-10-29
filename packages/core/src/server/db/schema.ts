/**
 * DETECK domain schema (decisions.md D-08). Tables marked APPEND-ONLY are
 * protected by database triggers (see drizzle/0001_append_only.sql): rows are
 * never updated or deleted; corrections are new rows.
 */
import { sql } from 'drizzle-orm';
import {
	bigint,
	boolean,
	char,
	customType,
	date,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	real,
	text,
	timestamp,
	uniqueIndex,
	uuid
} from 'drizzle-orm/pg-core';
import { organization, user } from './auth.schema.ts';

export * from './auth.schema.ts';

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
	dataType: () => 'bytea'
});

const createdAt = () => timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
	timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull();

// ---------------------------------------------------------------- manufacturers

export const manufacturerStatus = pgEnum('manufacturer_status', [
	'pending', // application submitted, waiting for a DETECK reviewer
	'info_requested', // reviewer asked for more information
	'rejected',
	'approved', // may upload data; nothing is public yet
	'in_review', // submitted for go-live review
	'changes_requested',
	'live', // records answer public checks
	'suspended' // records paused: checks return "can't be confirmed right now"
]);

export const manufacturer = pgTable(
	'manufacturer',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		organizationId: text('organization_id')
			.notNull()
			.unique()
			.references(() => organization.id, { onDelete: 'restrict' }),
		companyName: text('company_name').notNull(),
		address: text('address').notNull(),
		state: text('state').notNull(),
		factoryTown: text('factory_town'),
		nafdacCompanyReg: text('nafdac_company_reg').notNull(),
		cacRc: text('cac_rc'),
		contactName: text('contact_name').notNull(),
		contactEmail: text('contact_email').notNull(),
		contactPhone: text('contact_phone'),
		status: manufacturerStatus('status').notNull().default('pending'),
		/** The status before suspension, restored on reinstatement. */
		statusBeforeSuspension: manufacturerStatus('status_before_suspension'),
		/** The status note before suspension, restored on reinstatement. */
		reasonBeforeSuspension: text('reason_before_suspension'),
		statusReason: text('status_reason'),
		reviewNote: text('review_note'),
		submittedForReviewAt: timestamp('submitted_for_review_at', { withTimezone: true }),
		submittedForReviewBy: text('submitted_for_review_by').references(() => user.id),
		wentLiveAt: timestamp('went_live_at', { withTimezone: true }),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(t) => [index('manufacturer_status_idx').on(t.status)]
);

export const documentKind = pgEnum('document_kind', [
	'nafdac_certificate',
	'data_sharing_agreement',
	'pcn_premises_licence',
	'cac_certificate',
	'other'
]);

export const document = pgTable(
	'document',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		/** Set for a manufacturer's documents; a pharmacy or distributor's documents use businessId. */
		manufacturerId: uuid('manufacturer_id').references(() => manufacturer.id),
		businessId: uuid('business_id'),
		kind: documentKind('kind').notNull(),
		fileKey: text('file_key').notNull(),
		fileName: text('file_name').notNull(),
		contentType: text('content_type').notNull(),
		sizeBytes: integer('size_bytes').notNull(),
		uploadedBy: text('uploaded_by').references(() => user.id),
		createdAt: createdAt()
	},
	(t) => [index('document_manufacturer_idx').on(t.manufacturerId)]
);

// ---------------------------------------------------------------- products, batches, packs

/** pending_review: a drug a live manufacturer added, waiting for DETECK (audit decision 1). */
export const productStatus = pgEnum('product_status', [
	'active',
	'flagged',
	'deactivated',
	'pending_review',
	/** A new drug DETECK turned down: stays hidden from the public, like pending_review. */
	'rejected'
]);

export const product = pgTable(
	'product',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		manufacturerId: uuid('manufacturer_id')
			.notNull()
			.references(() => manufacturer.id),
		gtin: char('gtin', { length: 14 }).notNull().unique(),
		brandName: text('brand_name').notNull(),
		genericName: text('generic_name').notNull(),
		strength: text('strength').notNull(),
		dosageForm: text('dosage_form').notNull(),
		packSize: text('pack_size').notNull(),
		nafdacRegNo: text('nafdac_reg_no').notNull(),
		/** Where people find the serial on this pack, e.g. "after SN, next to the barcode". */
		serialHint: text('serial_hint'),
		status: productStatus('status').notNull().default('active'),
		statusReason: text('status_reason'),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(t) => [
		index('product_manufacturer_idx').on(t.manufacturerId),
		index('product_nafdac_idx').on(t.nafdacRegNo)
	]
);

export const batchStatus = pgEnum('batch_status', ['active', 'recalled', 'withdrawn']);

export const batch = pgTable(
	'batch',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		productId: uuid('product_id')
			.notNull()
			.references(() => product.id),
		lot: text('lot').notNull(),
		manufactureDate: date('manufacture_date'),
		expiryDate: date('expiry_date').notNull(),
		quantity: integer('quantity'),
		status: batchStatus('status').notNull().default('active'),
		statusReason: text('status_reason'),
		/** Who reported the recall or withdrawal (e.g. "NAFDAC", "Manufacturer"). */
		statusSource: text('status_source'),
		statusEffectiveAt: date('status_effective_at'),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(t) => [uniqueIndex('batch_product_lot_uq').on(t.productId, t.lot)]
);

/** APPEND-ONLY. Plain serials are never stored, only keyed hashes. */
export const pack = pgTable(
	'pack',
	{
		id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
		productId: uuid('product_id')
			.notNull()
			.references(() => product.id),
		batchId: uuid('batch_id')
			.notNull()
			.references(() => batch.id),
		/** HMAC of GTIN + exact serial. Globally unique: identifies one pack. */
		serialExactHmac: bytea('serial_exact_hmac').notNull().unique(),
		/** HMAC of the normalised serial, for typed lookups. Not unique across products. */
		serialKeyHmac: bytea('serial_key_hmac').notNull(),
		importJobId: uuid('import_job_id'),
		createdAt: createdAt()
	},
	(t) => [
		index('pack_serial_key_idx').on(t.serialKeyHmac),
		index('pack_batch_idx').on(t.batchId),
		// Per-drug counts in the workspace, console and API.
		index('pack_product_idx').on(t.productId)
	]
);

// ---------------------------------------------------------------- supply chain

export const partyRole = pgEnum('party_role', [
	'manufacturer',
	'distributor',
	'wholesaler',
	'pharmacy',
	'hospital',
	'other'
]);

export const party = pgTable(
	'party',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		name: text('name').notNull(),
		normalisedName: text('normalised_name').notNull(),
		role: partyRole('role').notNull(),
		state: text('state'),
		city: text('city'),
		cacRc: text('cac_rc'),
		pcnLicence: text('pcn_licence'),
		gln: char('gln', { length: 13 }),
		verifiedAt: timestamp('verified_at', { withTimezone: true }),
		verifiedBy: text('verified_by').references(() => user.id),
		mergedIntoId: uuid('merged_into_id'),
		createdByManufacturerId: uuid('created_by_manufacturer_id').references(() => manufacturer.id),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(t) => [
		index('party_name_idx').on(t.normalisedName),
		index('party_cac_idx').on(t.cacRc),
		index('party_pcn_idx').on(t.pcnLicence),
		index('party_gln_idx').on(t.gln)
	]
);

export const custodyLevel = pgEnum('custody_level', ['pack', 'batch']);
/** voided: a correction that cancels the record it supersedes. */
export const custodyEventType = pgEnum('custody_event_type', ['shipped', 'received', 'voided']);
export const custodySource = pgEnum('custody_source', [
	'manufacturer_import',
	'staff_import',
	'manufacturer_api',
	'business_receipt',
	'staff_correction'
]);

/** APPEND-ONLY. One recorded hand-off of a pack, or of part of a batch. */
export const custodyEvent = pgTable(
	'custody_event',
	{
		id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
		manufacturerId: uuid('manufacturer_id')
			.notNull()
			.references(() => manufacturer.id),
		level: custodyLevel('level').notNull(),
		packId: bigint('pack_id', { mode: 'number' }).references(() => pack.id),
		batchId: uuid('batch_id')
			.notNull()
			.references(() => batch.id),
		fromPartyId: uuid('from_party_id').references(() => party.id),
		toPartyId: uuid('to_party_id')
			.notNull()
			.references(() => party.id),
		eventType: custodyEventType('event_type').notNull().default('shipped'),
		eventDate: date('event_date').notNull(),
		source: custodySource('source').notNull(),
		importJobId: uuid('import_job_id'),
		supersedesId: bigint('supersedes_id', { mode: 'number' }),
		createdAt: createdAt()
	},
	(t) => [
		index('custody_pack_idx').on(t.packId),
		index('custody_batch_idx').on(t.batchId),
		// A business's receipts and recalled stock.
		index('custody_to_party_idx').on(t.toPartyId),
		// A record can be corrected once; later corrections correct the correction.
		uniqueIndex('custody_supersedes_uq').on(t.supersedesId)
	]
);

// ---------------------------------------------------------------- public checks

/** Short-lived result of a check, addressed by an opaque id so serials never appear in URLs. */
export const verificationResult = pgTable(
	'verification_result',
	{
		id: text('id').primaryKey(),
		createdAt: createdAt(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		result: jsonb('result').notNull()
	},
	(t) => [index('verification_result_expires_idx').on(t.expiresAt)]
);

export const checkKind = pgEnum('check_kind', [
	'serial',
	'scan',
	'journey',
	'packaging',
	'api',
	'business'
]);

/** APPEND-ONLY (except the retention purge). No IP addresses or personal data. */
export const checkEvent = pgTable(
	'check_event',
	{
		id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
		createdAt: createdAt(),
		kind: checkKind('kind').notNull(),
		result: text('result').notNull(),
		productId: uuid('product_id'),
		batchId: uuid('batch_id'),
		serialKeyHmac: bytea('serial_key_hmac'),
		/** Anonymous device hash that changes every day. */
		deviceDayHash: bytea('device_day_hash'),
		/** Approximate state from IP geolocation, when known. */
		state: text('state')
	},
	(t) => [
		index('check_event_created_idx').on(t.createdAt),
		index('check_event_serial_idx').on(t.serialKeyHmac, t.createdAt),
		index('check_event_product_idx').on(t.productId, t.createdAt)
	]
);

// ---------------------------------------------------------------- audit

/** APPEND-ONLY. Every create, update, approval, suspension and import by a business user. */
export const auditLog = pgTable(
	'audit_log',
	{
		id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
		createdAt: createdAt(),
		actorUserId: text('actor_user_id'),
		actorLabel: text('actor_label').notNull(),
		actorRole: text('actor_role'),
		manufacturerId: uuid('manufacturer_id'),
		onBehalf: boolean('on_behalf').notNull().default(false),
		area: text('area').notNull(),
		action: text('action').notNull(),
		itemType: text('item_type').notNull(),
		itemId: text('item_id'),
		summary: text('summary').notNull(),
		before: jsonb('before'),
		after: jsonb('after'),
		ip: text('ip'),
		userAgent: text('user_agent')
	},
	(t) => [
		index('audit_created_idx').on(t.createdAt),
		index('audit_manufacturer_idx').on(t.manufacturerId, t.createdAt),
		index('audit_actor_idx').on(t.actorUserId, t.createdAt),
		index('audit_action_item_idx').on(t.action, t.itemId)
	]
);

// ---------------------------------------------------------------- imports

export const importKind = pgEnum('import_kind', ['products', 'batches_serials', 'distribution']);
export const importStatus = pgEnum('import_status', [
	'uploaded',
	'validating',
	'ready',
	'committing',
	'committed',
	'failed',
	'cancelled'
]);

export const importJob = pgTable(
	'import_job',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		manufacturerId: uuid('manufacturer_id')
			.notNull()
			.references(() => manufacturer.id),
		kind: importKind('kind').notNull(),
		fileKey: text('file_key').notNull(),
		fileName: text('file_name').notNull(),
		fileSha256: char('file_sha256', { length: 64 }).notNull(),
		sizeBytes: integer('size_bytes').notNull(),
		sheetName: text('sheet_name'),
		headers: jsonb('headers').$type<string[]>(),
		sampleRows: jsonb('sample_rows').$type<string[][]>(),
		mapping: jsonb('mapping').$type<Record<string, string>>(),
		status: importStatus('status').notNull().default('uploaded'),
		counts: jsonb('counts').$type<Record<string, number>>(),
		problemsKey: text('problems_key'),
		error: text('error'),
		createdBy: text('created_by').references(() => user.id),
		onBehalf: boolean('on_behalf').notNull().default(false),
		createdAt: createdAt(),
		updatedAt: updatedAt(),
		committedAt: timestamp('committed_at', { withTimezone: true }),
		/** Where the rows came from: an uploaded file or the manufacturer data API. */
		source: text('source').notNull().default('upload'),
		/** Uploaded files are deleted after 90 days; the counts and problem rows stay. */
		fileDeletedAt: timestamp('file_deleted_at', { withTimezone: true })
	},
	(t) => [
		index('import_job_manufacturer_idx').on(t.manufacturerId, t.createdAt),
		uniqueIndex('import_job_file_uq').on(t.manufacturerId, t.kind, t.fileSha256)
	]
);

// ---------------------------------------------------------------- packaging references and scans

export const referenceStatus = pgEnum('reference_status', [
	'draft',
	'processing',
	'ready',
	'rejected'
]);
export const packagingSide = pgEnum('packaging_side', [
	'front',
	'back',
	'left',
	'right',
	'label',
	'security'
]);

export const packagingReference = pgTable(
	'packaging_reference',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		productId: uuid('product_id')
			.notNull()
			.references(() => product.id),
		version: integer('version').notNull(),
		/** Batches manufactured on or after this date are compared with this version (G-09). */
		effectiveFrom: date('effective_from').notNull(),
		status: referenceStatus('status').notNull().default('draft'),
		rejectionReason: text('rejection_reason'),
		createdBy: text('created_by').references(() => user.id),
		createdAt: createdAt(),
		readyAt: timestamp('ready_at', { withTimezone: true })
	},
	(t) => [uniqueIndex('packaging_reference_version_uq').on(t.productId, t.version)]
);

export const packagingImage = pgTable(
	'packaging_image',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		referenceId: uuid('reference_id')
			.notNull()
			.references(() => packagingReference.id),
		side: packagingSide('side').notNull(),
		fileKey: text('file_key').notNull(),
		width: integer('width').notNull(),
		height: integer('height').notNull(),
		passed: boolean('passed').notNull(),
		failReason: text('fail_reason'),
		createdAt: createdAt()
	},
	(t) => [uniqueIndex('packaging_image_side_uq').on(t.referenceId, t.side)]
);

export const scanStatus = pgEnum('scan_status', [
	'collecting',
	'queued',
	'processing',
	'done',
	'failed'
]);

export const scanSession = pgTable(
	'scan_session',
	{
		id: text('id').primaryKey(),
		createdAt: createdAt(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		deviceDayHash: bytea('device_day_hash'),
		verificationId: text('verification_id'),
		productId: uuid('product_id'),
		batchId: uuid('batch_id'),
		referenceId: uuid('reference_id'),
		status: scanStatus('status').notNull().default('collecting'),
		photoKeys: jsonb('photo_keys')
			.$type<Record<string, string>>()
			.notNull()
			.default(sql`'{}'::jsonb`),
		outcome: text('outcome'),
		categories: jsonb('categories').$type<{ category: string; detail: string }[]>(),
		confidence: real('confidence'),
		model: text('model'),
		retainConsent: boolean('retain_consent').notNull().default(false),
		photosDeletedAt: timestamp('photos_deleted_at', { withTimezone: true }),
		completedAt: timestamp('completed_at', { withTimezone: true }),
		error: text('error'),
		/** A DETECK reviewer's verdict on the AI answer, used to measure accuracy (D-10). */
		reviewLabel: text('review_label'),
		reviewNote: text('review_note'),
		reviewedBy: text('reviewed_by').references(() => user.id),
		reviewedAt: timestamp('reviewed_at', { withTimezone: true })
	},
	(t) => [index('scan_session_expires_idx').on(t.expiresAt)]
);

// ---------------------------------------------------------------- DETECK staff

export const staffInvitation = pgTable('staff_invitation', {
	id: text('id').primaryKey(),
	email: text('email').notNull(),
	name: text('name').notNull(),
	role: text('role').notNull(),
	note: text('note'),
	invitedBy: text('invited_by').references(() => user.id),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	acceptedAt: timestamp('accepted_at', { withTimezone: true }),
	cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
	createdAt: createdAt()
});

// ---------------------------------------------------------------- rate limits

export const rateLimit = pgTable(
	'rate_limit',
	{
		key: text('key').notNull(),
		windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
		count: integer('count').notNull().default(0)
	},
	(t) => [
		primaryKey({ columns: [t.key, t.windowStart] }),
		index('rate_limit_window_idx').on(t.windowStart)
	]
);

// ---------------------------------------------------------------- corrections

/** A serial recorded in error. Packs are append-only, so voiding is a separate record. */
export const packVoid = pgTable('pack_void', {
	packId: bigint('pack_id', { mode: 'number' })
		.primaryKey()
		.references(() => pack.id),
	reason: text('reason').notNull(),
	voidedBy: text('voided_by').references(() => user.id),
	voidedAt: createdAt()
});

// ---------------------------------------------------------------- site documents and saved mappings

/** Files DETECK publishes to business users, such as the data-sharing agreement template. */
export const siteDocument = pgTable('site_document', {
	key: text('key').primaryKey(),
	fileKey: text('file_key').notNull(),
	fileName: text('file_name').notNull(),
	contentType: text('content_type').notNull(),
	sizeBytes: integer('size_bytes').notNull(),
	uploadedBy: text('uploaded_by').references(() => user.id),
	uploadedAt: createdAt()
});

/** The column matching a manufacturer last used for files with the same headers. */
export const importMapping = pgTable(
	'import_mapping',
	{
		manufacturerId: uuid('manufacturer_id')
			.notNull()
			.references(() => manufacturer.id),
		kind: importKind('kind').notNull(),
		headerSignature: text('header_signature').notNull(),
		mapping: jsonb('mapping').$type<Record<string, string>>().notNull(),
		updatedAt: updatedAt()
	},
	(t) => [primaryKey({ columns: [t.manufacturerId, t.kind, t.headerSignature] })]
);

// ---------------------------------------------------------------- pharmacies, hospitals, distributors

export const businessStatus = pgEnum('business_status', [
	'pending',
	'info_requested',
	'rejected',
	'approved',
	'suspended'
]);

/**
 * A pharmacy, hospital, distributor or wholesaler with its own DETECK account. It is linked to
 * its supply chain record (party), which becomes "Verified by DETECK" once approved.
 */
export const businessAccount = pgTable(
	'business_account',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		organizationId: text('organization_id')
			.notNull()
			.unique()
			.references(() => organization.id, { onDelete: 'restrict' }),
		partyId: uuid('party_id').references(() => party.id),
		name: text('name').notNull(),
		role: partyRole('role').notNull(),
		address: text('address').notNull(),
		state: text('state').notNull(),
		town: text('town'),
		pcnLicence: text('pcn_licence'),
		cacRc: text('cac_rc'),
		gln: char('gln', { length: 13 }),
		contactName: text('contact_name').notNull(),
		contactEmail: text('contact_email').notNull(),
		contactPhone: text('contact_phone'),
		status: businessStatus('status').notNull().default('pending'),
		statusReason: text('status_reason'),
		reviewNote: text('review_note'),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(t) => [index('business_account_status_idx').on(t.status)]
);

// ---------------------------------------------------------------- API keys and webhooks

/**
 * A key for the REST API. Only a hash of the secret is stored; the full key is shown once.
 * Owned by a manufacturer, a business, or a partner app registered by DETECK.
 */
export const apiKey = pgTable(
	'api_key',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		name: text('name').notNull(),
		/** The visible start of the key, e.g. "dtk_live_ab12cd34". */
		prefix: text('prefix').notNull().unique(),
		secretHash: char('secret_hash', { length: 64 }).notNull(),
		ownerType: text('owner_type').notNull(),
		manufacturerId: uuid('manufacturer_id').references(() => manufacturer.id),
		businessId: uuid('business_id').references(() => businessAccount.id),
		scopes: jsonb('scopes').$type<string[]>().notNull(),
		/** Requests per minute this key may make. */
		rateLimit: integer('rate_limit').notNull().default(120),
		createdBy: text('created_by').references(() => user.id),
		createdAt: createdAt(),
		lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
		revokedAt: timestamp('revoked_at', { withTimezone: true })
	},
	(t) => [
		index('api_key_manufacturer_idx').on(t.manufacturerId),
		index('api_key_business_idx').on(t.businessId)
	]
);

export const webhookEndpoint = pgTable(
	'webhook_endpoint',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		manufacturerId: uuid('manufacturer_id').references(() => manufacturer.id),
		businessId: uuid('business_id').references(() => businessAccount.id),
		url: text('url').notNull(),
		/** Signs every delivery (HMAC-SHA256), so the receiver can trust it came from DETECK. */
		secret: text('secret').notNull(),
		events: jsonb('events').$type<string[]>().notNull(),
		active: boolean('active').notNull().default(true),
		disabledReason: text('disabled_reason'),
		createdBy: text('created_by').references(() => user.id),
		createdAt: createdAt()
	},
	(t) => [
		index('webhook_manufacturer_idx').on(t.manufacturerId),
		index('webhook_business_idx').on(t.businessId)
	]
);

export const webhookDelivery = pgTable(
	'webhook_delivery',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		endpointId: uuid('endpoint_id')
			.notNull()
			.references(() => webhookEndpoint.id),
		event: text('event').notNull(),
		payload: jsonb('payload').notNull(),
		status: text('status').notNull().default('pending'),
		attempts: integer('attempts').notNull().default(0),
		lastStatusCode: integer('last_status_code'),
		lastError: text('last_error'),
		createdAt: createdAt(),
		deliveredAt: timestamp('delivered_at', { withTimezone: true })
	},
	(t) => [index('webhook_delivery_endpoint_idx').on(t.endpointId, t.createdAt)]
);

// ---------------------------------------------------------------- reports of suspected fakes

export const reportStatus = pgEnum('report_status', ['new', 'investigating', 'referred', 'closed']);

/** Someone reports a pack they think is fake. Contact details are optional and never public. */
export const report = pgTable(
	'report',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		createdAt: createdAt(),
		/** What the check said when they reported, e.g. "UNRECOGNISED" or "VALID:EXPIRED". */
		resultCode: text('result_code').notNull(),
		manufacturerId: uuid('manufacturer_id').references(() => manufacturer.id),
		productId: uuid('product_id').references(() => product.id),
		batchId: uuid('batch_id').references(() => batch.id),
		serialKeyHmac: bytea('serial_key_hmac'),
		productDescription: text('product_description'),
		placeName: text('place_name'),
		state: text('state'),
		town: text('town'),
		boughtOn: date('bought_on'),
		details: text('details'),
		contactName: text('contact_name'),
		contactEmail: text('contact_email'),
		contactPhone: text('contact_phone'),
		/** The person agreed DETECK may share the report and photos with the manufacturer and NAFDAC. */
		shareConsent: boolean('share_consent').notNull().default(false),
		photoKeys: jsonb('photo_keys')
			.$type<string[]>()
			.notNull()
			.default(sql`'[]'::jsonb`),
		deviceDayHash: bytea('device_day_hash'),
		status: reportStatus('status').notNull().default('new'),
		assignedTo: text('assigned_to').references(() => user.id),
		resolution: text('resolution'),
		closedAt: timestamp('closed_at', { withTimezone: true }),
		updatedAt: updatedAt()
	},
	(t) => [
		index('report_status_idx').on(t.status, t.createdAt),
		index('report_manufacturer_idx').on(t.manufacturerId, t.createdAt)
	]
);

// ---------------------------------------------------------------- recall alerts

/**
 * Someone asks to be told if a batch they checked is recalled. Deleted 30 days after the batch
 * expires, or as soon as they unsubscribe.
 */
export const recallAlert = pgTable(
	'recall_alert',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		batchId: uuid('batch_id')
			.notNull()
			.references(() => batch.id),
		channel: text('channel').notNull(),
		address: text('address').notNull(),
		locale: text('locale').notNull().default('en'),
		confirmTokenHash: char('confirm_token_hash', { length: 64 }),
		confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
		unsubscribeTokenHash: char('unsubscribe_token_hash', { length: 64 }).notNull(),
		sentAt: timestamp('sent_at', { withTimezone: true }),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		createdAt: createdAt()
	},
	(t) => [
		index('recall_alert_batch_idx').on(t.batchId),
		uniqueIndex('recall_alert_unique').on(t.batchId, t.channel, t.address)
	]
);

/** One-way fingerprints of the keys the data depends on (secrets-check.ts). */
export const systemCheck = pgTable('system_check', {
	key: text('key').primaryKey(),
	value: text('value').notNull(),
	createdAt: createdAt()
});
