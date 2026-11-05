import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ctx } from './context.ts';
import { user } from './db/schema.ts';
import { sentEmails } from './email/index.ts';
import { ContactError, MAX_MESSAGE, sendContactMessage } from './contact.ts';
import { resetDb } from '../../tests/helpers/db.ts';

let n = 0;
const who = () => ({
	deviceId: `contact-device-${++n}`,
	ip: `10.9.${Math.floor(n / 250)}.${n % 250}`
});
const good = {
	name: 'Ada Obi',
	email: 'Ada@Example.com',
	organisation: 'Ada Pharmacy',
	topic: 'partnering',
	message: 'We would like to share our product records with DETECK.'
};

async function codeOf(input: Partial<typeof good> & { website?: string }) {
	try {
		await sendContactMessage(who(), { ...good, ...input });
		return 'sent';
	} catch (error) {
		return error instanceof ContactError ? error.code : String(error);
	}
}

describe('the contact form', () => {
	const config = ctx().config as { contactEmail?: string };
	const inbox = config.contactEmail;

	beforeEach(async () => {
		await resetDb();
		sentEmails.length = 0;
		config.contactEmail = 'help@deteck.test';
	});
	afterEach(() => {
		config.contactEmail = inbox;
	});

	it('emails the contact inbox, with the sender as Reply-To', async () => {
		await sendContactMessage(who(), good);
		expect(sentEmails).toHaveLength(1);
		expect(sentEmails[0]).toMatchObject({ to: 'help@deteck.test', replyTo: 'ada@example.com' });
		expect(sentEmails[0].subject).toBe('DETECK contact: Partnering with DETECK from Ada Obi');
		expect(sentEmails[0].text).toContain('Organisation: Ada Pharmacy');
		expect(sentEmails[0].text).toContain(good.message);
	});

	it('emails every DETECK staff member when there is no contact inbox', async () => {
		config.contactEmail = undefined;
		await ctx()
			.db.insert(user)
			.values([
				{ id: 'staff-1', name: 'Staff One', email: 'one@deteck.test', platformRole: 'admin' },
				{ id: 'biz-1', name: 'Business', email: 'biz@example.com' }
			]);
		await sendContactMessage(who(), good);
		expect(sentEmails.map((e) => e.to)).toEqual(['one@deteck.test']);
		expect(sentEmails[0].replyTo).toBe('ada@example.com');
	});

	it("never says a message arrived when there's nobody to send it to", async () => {
		config.contactEmail = undefined;
		await expect(sendContactMessage(who(), good)).rejects.toThrow(/no DETECK staff/);
		expect(sentEmails).toHaveLength(0);
	});

	it('counts a line break the way the browser does', async () => {
		// 3,000 characters to the browser (each break counts as one), 3,020 as sent (\r\n).
		const half = 'x'.repeat((MAX_MESSAGE - 20) / 2);
		const almostFull = `${half}${'\r\n'.repeat(20)}${half}`;
		expect(await codeOf({ message: almostFull })).toBe('sent');
	});

	it('keeps a name on one line, so it cannot add lines to the email', async () => {
		await sendContactMessage(who(), { ...good, name: 'Ada\nBcc: someone@example.com' });
		expect(sentEmails[0].subject).toBe(
			'DETECK contact: Partnering with DETECK from Ada Bcc: someone@example.com'
		);
		expect(sentEmails[0].text.split('\n')[0]).toBe(
			'From: Ada Bcc: someone@example.com <ada@example.com>'
		);
	});

	it('says what to fix', async () => {
		expect(await codeOf({ name: ' ' })).toBe('name');
		expect(await codeOf({ email: 'ada@example' })).toBe('email');
		expect(await codeOf({ topic: 'lottery' })).toBe('topic');
		expect(await codeOf({ message: 'Hi' })).toBe('message');
		expect(await codeOf({ message: 'x'.repeat(MAX_MESSAGE + 1) })).toBe('too_long');
		expect(sentEmails).toHaveLength(0);
	});

	it('drops what a bot sends, without telling it', async () => {
		expect(await codeOf({ website: 'https://spam.example' })).toBe('sent');
		expect(sentEmails).toHaveLength(0);
	});

	it('limits how many messages one network can send in an hour', async () => {
		const sameNetwork = (i: number) => ({ deviceId: `d-${i}`, ip: '10.8.0.1' });
		for (let i = 0; i < 5; i++) await sendContactMessage(sameNetwork(i), good);
		await expect(sendContactMessage(sameNetwork(5), good)).rejects.toMatchObject({
			code: 'limit'
		});
		expect(sentEmails).toHaveLength(5);
	});
});
