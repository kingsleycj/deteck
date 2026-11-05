/**
 * The public contact form (/contact, B-84). A message goes by email to the contact inbox
 * (CONTACT_EMAIL), or to every DETECK staff member when there isn't one, with Reply-To set to the
 * person who wrote, so answering is just "reply". The website keeps the message only in the email
 * queue, which deletes it an hour after it's sent (a few hours at most, with retries).
 */
import { isNotNull } from 'drizzle-orm';
import { z } from 'zod';
import { en } from '../messages/dict/en.ts';
import { ctx } from './context.ts';
import { user } from './db/schema.ts';
import { sendEmail } from './email/index.ts';
import { consume } from './rate-limit.ts';

export const CONTACT_TOPICS = [
	'general',
	'checking',
	'partnering',
	'developers',
	'press',
	'problem'
] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const MAX_MESSAGE = 3000;

export type ContactProblem = 'name' | 'email' | 'topic' | 'message' | 'too_long' | 'limit';

export class ContactError extends Error {
	readonly code: ContactProblem;
	readonly field?: 'name' | 'email' | 'topic' | 'message';
	constructor(code: ContactProblem, field?: 'name' | 'email' | 'topic' | 'message') {
		super(code);
		this.code = code;
		this.field = field;
	}
}

const schema = z.object({
	name: z.string().trim().min(2).max(100),
	email: z.email().max(200),
	organisation: z.string().trim().max(150),
	topic: z.enum(CONTACT_TOPICS),
	message: z.string().trim().min(10)
});

export interface ContactInput {
	name: string;
	email: string;
	organisation?: string;
	topic: string;
	message: string;
	/** A field people never see. Bots fill it in; their message is dropped without saying so. */
	website?: string;
}

/** One line, so a name can't add lines to the email. */
const oneLine = (value: string) => value.replace(/[\r\n\t]+/g, ' ').trim();

export async function sendContactMessage(
	who: { deviceId: string; ip: string },
	input: ContactInput
): Promise<void> {
	// Browsers send each line break as two characters but count it as one against maxlength.
	const message = (input.message ?? '').replace(/\r\n/g, '\n');
	if (message.trim().length > MAX_MESSAGE) throw new ContactError('too_long', 'message');
	const parsed = schema.safeParse({
		name: oneLine(input.name ?? ''),
		email: (input.email ?? '').trim().toLowerCase(),
		organisation: oneLine(input.organisation ?? '').slice(0, 150),
		topic: input.topic,
		message
	});
	if (!parsed.success) {
		const field = parsed.error.issues[0]?.path[0] as 'name' | 'email' | 'topic' | 'message';
		throw new ContactError(field, field);
	}
	// A few messages an hour per network and per browser: enough for a person, not for a flood.
	const limited = await consume([
		{ key: `contact:ip:${who.ip}:h`, windowSeconds: 3600, max: 5 },
		{ key: `contact:dev:${who.deviceId}:d`, windowSeconds: 86_400, max: 10 }
	]);
	if (!limited.ok) throw new ContactError('limit');
	if (input.website?.trim()) return;

	const m = parsed.data;
	// In English, as the team reads it: the subject sorts the inbox by what each message is about.
	const about = en.contact.topics[m.topic];
	const subject = `DETECK contact: ${about} from ${m.name}`;
	const text = [
		`From: ${m.name} <${m.email}>`,
		m.organisation ? `Organisation: ${m.organisation}` : null,
		`About: ${about}`,
		'',
		m.message,
		'',
		'Sent from the contact form on DETECK. Reply to this email to answer them.'
	]
		.filter((line) => line !== null)
		.join('\n');
	const inbox = ctx().config.contactEmail;
	const to = inbox
		? [inbox]
		: (
				await ctx().db.select({ email: user.email }).from(user).where(isNotNull(user.platformRole))
			).map((s) => s.email);
	// Never tell someone their message arrived when there's nobody to send it to.
	if (to.length === 0) throw new Error('No CONTACT_EMAIL and no DETECK staff to email');
	for (const address of to) await sendEmail({ to: address, subject, text, replyTo: m.email });
}
