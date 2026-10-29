import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { ctx } from '../context.ts';
import { createAuth } from '../auth-factory.ts';
import { auditLog, document, manufacturer, member, user } from '../db/schema.ts';
import { sentEmails } from '../email/index.ts';
import { SYSTEM_ACTOR } from '../audit.ts';
import { registerManufacturer } from './register.ts';
import {
	decideApplication,
	ReviewError,
	suspendManufacturer,
	reinstateManufacturer
} from './review.ts';
import { resetDb } from '../../../tests/helpers/db.ts';

const auth = () =>
	createAuth({ db: ctx().db, baseURL: 'http://localhost:5173', secret: ctx().config.authSecret });

const pdf = {
	name: 'nafdac-cert.pdf',
	type: 'application/pdf',
	bytes: new TextEncoder().encode('%PDF-1.4 test')
};

const form = {
	companyName: 'Meridian Life Sciences',
	address: 'Plot 4, Industrial Avenue, Ikeja',
	state: 'Lagos',
	factoryTown: 'Ikeja',
	nafdacCompanyReg: 'NAF-CO-12345',
	cacRc: 'RC 123456',
	contactName: 'Funke Adeyemi',
	contactEmail: 'Funke@Meridian.example',
	contactPhone: '+2348000000000',
	password: 'correct horse battery 9!'
};

const meta = { ip: '127.0.0.1', userAgent: 'vitest' };

describe('manufacturer registration (US-05.1)', () => {
	beforeEach(async () => {
		await resetDb();
		sentEmails.length = 0;
	});

	it('creates a pending manufacturer, an admin member and stores the certificate', async () => {
		const r = await registerManufacturer(
			auth(),
			form,
			{ nafdacCertificate: pdf, agreement: null },
			meta
		);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		const { db } = ctx();
		const [m] = await db.select().from(manufacturer).where(eq(manufacturer.id, r.manufacturerId));
		expect(m.status).toBe('pending');
		expect(m.contactEmail).toBe('funke@meridian.example');
		const [mem] = await db.select().from(member).where(eq(member.userId, r.userId));
		expect(mem.role).toBe('admin');
		expect(await db.$count(document, eq(document.manufacturerId, m.id))).toBe(1);
		expect(await db.$count(auditLog, eq(auditLog.action, 'register'))).toBe(1);
		expect(sentEmails.some((e) => e.subject.includes('We received your DETECK application'))).toBe(
			true
		);
	});

	it('requires the NAFDAC certificate and valid fields', async () => {
		const r = await registerManufacturer(
			auth(),
			{ ...form, contactEmail: 'funke@meridian', password: 'short' },
			{ nafdacCertificate: null, agreement: null },
			meta
		);
		expect(r.ok).toBe(false);
		if (r.ok) return;
		expect(Object.keys(r.errors).sort()).toEqual(['contactEmail', 'nafdacCertificate', 'password']);
	});

	it('rejects unsupported document types', async () => {
		const heic = { name: 'nafdac-cert.heic', type: 'image/heic', bytes: new Uint8Array([1, 2]) };
		const r = await registerManufacturer(
			auth(),
			form,
			{ nafdacCertificate: heic, agreement: null },
			meta
		);
		expect(!r.ok && r.errors.nafdacCertificate).toContain('Use a PDF, JPG or PNG');
	});

	it('blocks a second registration with the same company name or email', async () => {
		await registerManufacturer(auth(), form, { nafdacCertificate: pdf, agreement: null }, meta);
		const again = await registerManufacturer(
			auth(),
			{ ...form, contactEmail: 'other@meridian.example' },
			{ nafdacCertificate: pdf, agreement: null },
			meta
		);
		expect(!again.ok && again.errors.companyName).toBeTruthy();
		const sameEmail = await registerManufacturer(
			auth(),
			{ ...form, companyName: 'Other Pharma', nafdacCompanyReg: 'NAF-CO-9' },
			{ nafdacCertificate: pdf, agreement: null },
			meta
		);
		expect(!sameEmail.ok && sameEmail.errors.contactEmail).toBeTruthy();
		expect(await ctx().db.$count(user)).toBe(1);
	});
});

describe('application review (US-06.1)', () => {
	let id: string;
	beforeEach(async () => {
		await resetDb();
		sentEmails.length = 0;
		const r = await registerManufacturer(
			auth(),
			form,
			{ nafdacCertificate: pdf, agreement: null },
			meta
		);
		if (!r.ok) throw new Error('setup failed');
		id = r.manufacturerId;
	});

	const status = async () =>
		(
			await ctx()
				.db.select({ s: manufacturer.status })
				.from(manufacturer)
				.where(eq(manufacturer.id, id))
		)[0].s;

	it('requires a reason for every decision', async () => {
		await expect(decideApplication(SYSTEM_ACTOR, id, 'approve', ' ')).rejects.toBeInstanceOf(
			ReviewError
		);
	});

	it('approves with an email to the manufacturer and an audit entry', async () => {
		await decideApplication(
			SYSTEM_ACTOR,
			id,
			'approve',
			'Certificate checked against the Green Book'
		);
		expect(await status()).toBe('approved');
		expect(
			sentEmails.some((e) => e.subject === 'Meridian Life Sciences is approved on DETECK')
		).toBe(true);
		expect(await ctx().db.$count(auditLog, eq(auditLog.action, 'application_approve'))).toBe(1);
	});

	it('can reopen a rejected application, but not decide an approved one again', async () => {
		await decideApplication(SYSTEM_ACTOR, id, 'reject', 'Certificate does not match the company');
		expect(await status()).toBe('rejected');
		await decideApplication(SYSTEM_ACTOR, id, 'approve', 'Company sent the right certificate');
		expect(await status()).toBe('approved');
		await expect(
			decideApplication(SYSTEM_ACTOR, id, 'reject', 'Changed my mind')
		).rejects.toBeInstanceOf(ReviewError);
	});

	it('suspends and reinstates, restoring the previous status', async () => {
		await decideApplication(SYSTEM_ACTOR, id, 'approve', 'Documents checked');
		await suspendManufacturer(SYSTEM_ACTOR, id, 'Data quality concerns under investigation');
		expect(await status()).toBe('suspended');
		await reinstateManufacturer(SYSTEM_ACTOR, id, 'Investigation closed');
		expect(await status()).toBe('approved');
	});
});
