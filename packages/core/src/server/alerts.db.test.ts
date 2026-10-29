import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import './job-definitions.ts';
import { ctx } from './context.ts';
import { recallAlert } from './db/schema.ts';
import { sentEmails } from './email/index.ts';
import { SYSTEM_ACTOR } from './audit.ts';
import { setBatchStatus } from './catalogue.ts';
import { apiCheck } from './verify/check.ts';
import { clearCoverageCache } from './verify/lookup.ts';
import {
	AlertError,
	confirmAlert,
	purgeAlerts,
	sendRecallAlerts,
	subscribeToRecalls,
	unsubscribeAlert
} from './alerts.ts';
import { resetDb } from '../../tests/helpers/db.ts';
import { makeLivePack } from '../../tests/helpers/fixtures.ts';

const DAY = 86_400_000;

// Emails are told apart by their links, so the tests don't depend on the (translated) wording.
const isConfirm = (text: string) => text.includes('/alerts/confirm/');
const isRecall = (text: string) => text.includes('/alerts/stop/') && !isConfirm(text);

/** The token at the end of a /alerts/<kind>/ link in the last email to this address. */
function linkToken(to: string, kind: 'confirm' | 'stop') {
	const mail = sentEmails.filter((e) => e.to === to).at(-1);
	const match = new RegExp(`/alerts/${kind}/(\\S+)`).exec(mail?.text ?? '');
	if (!match) throw new Error(`no ${kind} link for ${to}`);
	return match[1];
}

describe('recall alerts', () => {
	let verificationId: string;
	let batchId: string;

	beforeEach(async () => {
		await resetDb();
		clearCoverageCache();
		sentEmails.length = 0;
		const live = await makeLivePack('ALERTPACK001');
		batchId = live.batch.id;
		const checked = await apiCheck('ALERTPACK001');
		if (!checked.ok || checked.result.code !== 'VALID') throw new Error('setup failed');
		verificationId = checked.id;
	});

	const subscribe = (address: string) =>
		subscribeToRecalls({ verificationId, channel: 'email', address });

	const recall = () =>
		setBatchStatus(SYSTEM_ACTOR, batchId, {
			status: 'recalled',
			reason: 'Failed dissolution testing',
			source: 'NAFDAC'
		});

	it('emails a confirmation link, and alerts each confirmed subscriber once on recall', async () => {
		expect(await subscribe(' Ada@Example.com ')).toEqual({
			channel: 'email',
			alreadySubscribed: false
		});
		await subscribe('bola@example.com');
		await subscribe('chidi@example.com');
		expect(sentEmails.map((e) => isConfirm(e.text))).toEqual([true, true, true]);
		expect(sentEmails[0].to).toBe('ada@example.com');
		expect(sentEmails[0].subject).toContain('Curavyn 500 mg');

		expect(await confirmAlert(linkToken('ada@example.com', 'confirm'))).toEqual({
			drug: 'Curavyn 500 mg',
			lot: 'NB-2611'
		});
		await confirmAlert(linkToken('chidi@example.com', 'confirm'));
		expect(await sendRecallAlerts(batchId)).toBe(0);

		sentEmails.length = 0;
		await recall();
		const alerts = sentEmails.filter((e) => isRecall(e.text));
		expect(alerts.map((e) => e.to).sort()).toEqual(['ada@example.com', 'chidi@example.com']);
		expect(alerts[0].subject).toContain('Curavyn 500 mg');
		expect(alerts[0].subject).toContain('NB-2611');
		expect(alerts[0].text).toContain('NAFDAC');
		expect(alerts[0].text).toContain('Failed dissolution testing');

		expect(await sendRecallAlerts(batchId)).toBe(0);
		expect(sentEmails).toHaveLength(2);
		const rows = await ctx().db.select().from(recallAlert);
		expect(
			rows
				.filter((r) => r.sentAt)
				.map((r) => r.address)
				.sort()
		).toEqual(['ada@example.com', 'chidi@example.com']);
	});

	it('uses "<id>.<signature>" tokens and rejects tampered or misused ones', async () => {
		await subscribe('ada@example.com');
		const confirm = linkToken('ada@example.com', 'confirm');
		const stop = linkToken('ada@example.com', 'stop');
		const [row] = await ctx().db.select().from(recallAlert);
		const [id, sig] = confirm.split('.');
		expect(id).toBe(row.id);
		expect(sig).toMatch(/^[A-Za-z0-9_-]{32}$/);

		const flipped = sig.slice(0, -1) + (sig.endsWith('A') ? 'B' : 'A');
		expect(await confirmAlert(`${id}.${flipped}`)).toBeNull();
		expect(await confirmAlert(id)).toBeNull();
		expect(await confirmAlert(`${id}.${sig}x`)).toBeNull();
		expect(await confirmAlert(stop)).toBeNull();
		expect(await unsubscribeAlert(confirm)).toBeNull();
		expect(await unsubscribeAlert('not-a-token')).toBeNull();
		const [still] = await ctx().db.select().from(recallAlert);
		expect(still.confirmedAt).toBeNull();
	});

	it('resends the confirmation until confirmed, then reports the existing subscription', async () => {
		await subscribe('ada@example.com');
		expect(await subscribe('ADA@example.com')).toEqual({
			channel: 'email',
			alreadySubscribed: false
		});
		expect(sentEmails).toHaveLength(2);
		expect(await ctx().db.$count(recallAlert)).toBe(1);
		await confirmAlert(linkToken('ada@example.com', 'confirm'));
		expect(await subscribe('ada@example.com')).toEqual({
			channel: 'email',
			alreadySubscribed: true
		});
		expect(sentEmails).toHaveLength(2);
	});

	it('unsubscribes with the stop link', async () => {
		await subscribe('ada@example.com');
		await confirmAlert(linkToken('ada@example.com', 'confirm'));
		const stop = linkToken('ada@example.com', 'stop');
		expect(await unsubscribeAlert(stop)).toEqual({ drug: 'Curavyn 500 mg', lot: 'NB-2611' });
		expect(await ctx().db.$count(recallAlert)).toBe(0);
		expect(await unsubscribeAlert(stop)).toEqual({ drug: null, lot: null });
		sentEmails.length = 0;
		await recall();
		expect(sentEmails.filter((e) => isRecall(e.text))).toHaveLength(0);
	});

	it('refuses expired results, bad addresses and WhatsApp when it is not set up', async () => {
		await expect(
			subscribeToRecalls({ verificationId: 'missingresult1', channel: 'email', address: 'a@b.ng' })
		).rejects.toBeInstanceOf(AlertError);
		const unknown = await apiCheck('NOSUCHPACK99');
		if (!unknown.ok) throw new Error();
		await expect(
			subscribeToRecalls({ verificationId: unknown.id, channel: 'email', address: 'a@b.ng' })
		).rejects.toThrow('This result has expired');
		await expect(subscribe('ada@example')).rejects.toThrow('missing something');
		await expect(
			subscribeToRecalls({ verificationId, channel: 'whatsapp', address: '0803 123 4567' })
		).rejects.toThrow('WhatsApp alerts are not available yet.');
		expect(await ctx().db.$count(recallAlert)).toBe(0);
	});

	it('purges alerts past their expiry and email sign-ups not confirmed within 7 days', async () => {
		await subscribe('expired@example.com');
		await subscribe('stale@example.com');
		await subscribe('fresh@example.com');
		await subscribe('kept@example.com');
		await confirmAlert(linkToken('expired@example.com', 'confirm'));
		await confirmAlert(linkToken('kept@example.com', 'confirm'));
		const now = new Date();
		const set = (address: string, values: Partial<typeof recallAlert.$inferInsert>) =>
			ctx().db.update(recallAlert).set(values).where(eq(recallAlert.address, address));
		await set('expired@example.com', { expiresAt: new Date(now.getTime() - DAY) });
		await set('stale@example.com', { createdAt: new Date(now.getTime() - 8 * DAY) });
		await set('fresh@example.com', { createdAt: new Date(now.getTime() - 6 * DAY) });
		await set('kept@example.com', { createdAt: new Date(now.getTime() - 60 * DAY) });

		await purgeAlerts(now);
		const left = (await ctx().db.select({ a: recallAlert.address }).from(recallAlert))
			.map((r) => r.a)
			.sort();
		expect(left).toEqual(['fresh@example.com', 'kept@example.com']);
	});
});
