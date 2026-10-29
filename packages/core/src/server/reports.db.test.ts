import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { ctx } from './context.ts';
import { auditLog, report } from './db/schema.ts';
import { sentEmails } from './email/index.ts';
import type { Actor } from './audit.ts';
import { getObject } from './storage.ts';
import { apiCheck } from './verify/check.ts';
import { clearCoverageCache } from './verify/lookup.ts';
import {
	createReport,
	listReports,
	purgeClosedReports,
	reportForManufacturer,
	ReportError,
	updateReport
} from './reports.ts';
import { resetDb } from '../../tests/helpers/db.ts';
import { makeLivePack, makeManufacturer } from '../../tests/helpers/fixtures.ts';
import { packPhoto } from '../../tests/helpers/photos.ts';

const STAFF: Actor = { userId: null, label: 'Kemi (DETECK)', role: 'DETECK reviewer' };
const DAY = 86_400_000;

let device = 0;
const who = () => ({ deviceId: `device-${++device}`, ip: `10.0.0.${device % 250}` });

const minimal = { productDescription: 'Curavyn 500 mg', placeName: 'Mile 12 market' };

describe('reports of suspected fakes', () => {
	let manufacturerId: string;
	let verificationId: string;

	beforeEach(async () => {
		await resetDb();
		clearCoverageCache();
		sentEmails.length = 0;
		const live = await makeLivePack('REPORTPACK01');
		manufacturerId = live.manufacturer.id;
		const checked = await apiCheck('REPORTPACK01');
		if (!checked.ok) throw new Error('setup failed');
		verificationId = checked.id;
	});

	it('explains what is missing', async () => {
		await expect(createReport(who(), { placeName: 'Mile 12 market' }, [])).rejects.toThrow(
			'Say which medicine this is'
		);
		await expect(
			createReport(who(), { productDescription: 'Curavyn', placeName: '   ' }, [])
		).rejects.toThrow('Say where you bought it');
		await expect(
			createReport(who(), { ...minimal, contactEmail: 'ada@example' }, [])
		).rejects.toThrow('That email address is missing something');
		await expect(createReport(who(), { ...minimal, state: 'Atlantis' }, [])).rejects.toThrow(
			'Choose a state.'
		);
		await expect(
			createReport(who(), minimal, [
				{ name: 'notes.txt', type: 'image/jpeg', bytes: new Uint8Array([1, 2, 3]) }
			])
		).rejects.toThrow("notes.txt isn't a photo we can open.");
		expect(await ctx().db.$count(report)).toBe(0);
	});

	it('takes the drug from the check result and works without one', async () => {
		const { id } = await createReport(
			who(),
			{
				verificationId,
				placeName: 'MedPlus Ikeja',
				state: 'Lagos State',
				contactEmail: 'ADA@Example.com'
			},
			[]
		);
		const [row] = await ctx().db.select().from(report).where(eq(report.id, id));
		expect(row).toMatchObject({
			resultCode: 'VALID',
			manufacturerId,
			productDescription: 'Curavyn 500 mg',
			state: 'Lagos',
			contactEmail: 'ada@example.com',
			shareConsent: false
		});
		expect(row.serialKeyHmac).toBeInstanceOf(Buffer);

		const { id: plain } = await createReport(who(), minimal, []);
		const [other] = await ctx().db.select().from(report).where(eq(report.id, plain));
		expect(other).toMatchObject({ resultCode: 'NO_CHECK', manufacturerId: null });
	});

	it('allows 5 reports a day from one device', async () => {
		const me = who();
		for (let i = 0; i < 5; i++) await createReport(me, minimal, []);
		await expect(createReport(me, minimal, [])).rejects.toThrow('several reports today');
		await expect(createReport(who(), minimal, [])).resolves.toHaveProperty('id');
		expect(await ctx().db.$count(report)).toBe(6);
	});

	it('shows a manufacturer only shared reports, without contact details', async () => {
		const shared = await createReport(
			who(),
			{
				verificationId,
				placeName: 'MedPlus Ikeja',
				contactName: 'Ada Obi',
				contactEmail: 'ada@example.com',
				contactPhone: '0803 123 4567',
				shareConsent: true
			},
			[]
		);
		expect(sentEmails.some((e) => e.subject === 'Suspected fake reported: Curavyn 500 mg')).toBe(
			true
		);
		sentEmails.length = 0;
		const notShared = await createReport(
			who(),
			{ verificationId, placeName: 'Somewhere', contactEmail: 'bola@example.com' },
			[]
		);
		expect(sentEmails.some((e) => e.subject.startsWith('Suspected fake reported'))).toBe(false);

		expect((await listReports({ manufacturerId })).map((r) => r.id)).toEqual([shared.id]);
		expect(await listReports()).toHaveLength(2);

		const view = await reportForManufacturer(shared.id, manufacturerId);
		expect(view).not.toBeNull();
		for (const field of ['contactName', 'contactEmail', 'contactPhone', 'deviceDayHash'])
			expect(view!.report).not.toHaveProperty(field);
		expect(view!.report.placeName).toBe('MedPlus Ikeja');
		expect(await reportForManufacturer(notShared.id, manufacturerId)).toBeNull();
		const other = await makeManufacturer({ companyName: 'Other Pharma' });
		expect(await reportForManufacturer(shared.id, other.id)).toBeNull();
	});

	it('needs a resolution to close a report', async () => {
		const { id } = await createReport(who(), minimal, []);
		await expect(updateReport(STAFF, id, { status: 'closed' })).rejects.toBeInstanceOf(ReportError);
		await expect(updateReport(STAFF, id, { status: 'done' })).rejects.toThrow('Choose a status.');
		await updateReport(STAFF, id, { status: 'investigating' });
		await updateReport(STAFF, id, { status: 'closed', resolution: 'Genuine pack, old design.' });
		const [row] = await ctx().db.select().from(report).where(eq(report.id, id));
		expect(row).toMatchObject({ status: 'closed', resolution: 'Genuine pack, old design.' });
		expect(row.closedAt).toBeInstanceOf(Date);
		expect(await ctx().db.$count(auditLog, eq(auditLog.action, 'report_update'))).toBe(2);
	});

	it('clears contact details and photos 12 months after closing', async () => {
		const photo = await packPhoto({ width: 640, height: 480 });
		const contact = {
			contactName: 'Ada Obi',
			contactEmail: 'ada@example.com',
			contactPhone: '0803'
		};
		const old = await createReport(who(), { ...minimal, ...contact }, [photo, photo]);
		const recent = await createReport(who(), { ...minimal, ...contact }, [photo]);
		const open = await createReport(who(), { ...minimal, ...contact }, [photo]);
		const [oldRow] = await ctx().db.select().from(report).where(eq(report.id, old.id));
		expect(oldRow.photoKeys).toHaveLength(2);
		await getObject(oldRow.photoKeys[0]);

		const now = new Date();
		await ctx()
			.db.update(report)
			.set({ status: 'closed', resolution: 'Fake', closedAt: new Date(now.getTime() - 366 * DAY) })
			.where(eq(report.id, old.id));
		await ctx()
			.db.update(report)
			.set({ status: 'closed', resolution: 'Fake', closedAt: new Date(now.getTime() - 300 * DAY) })
			.where(eq(report.id, recent.id));

		expect(await purgeClosedReports(now)).toBe(1);
		const rows = new Map((await ctx().db.select().from(report)).map((r) => [r.id, r]));
		expect(rows.get(old.id)).toMatchObject({
			photoKeys: [],
			contactName: null,
			contactEmail: null,
			contactPhone: null,
			resolution: 'Fake'
		});
		await expect(getObject(oldRow.photoKeys[0])).rejects.toThrow();
		await expect(getObject(oldRow.photoKeys[1])).rejects.toThrow();
		for (const id of [recent.id, open.id]) {
			expect(rows.get(id)).toMatchObject({ contactEmail: 'ada@example.com' });
			expect(rows.get(id)!.photoKeys).toHaveLength(1);
		}
	});
});
