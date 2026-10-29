import { ctx } from '../context.ts';
import { enqueue } from '../jobs.ts';

export interface EmailMessage {
	to: string;
	subject: string;
	text: string;
}

/** Messages written by the `log` driver, kept so tests can read them. */
export const sentEmails: EmailMessage[] = [];

/**
 * Sends an email. With Resend, it goes through the job queue: a slow or failing provider then
 * never holds up the page, and a failed send is retried for about an hour with growing gaps.
 * Finished email jobs are deleted after an hour, since some hold links (password resets, invites).
 * The log driver (development, tests) delivers straight away.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
	if (ctx().config.email.driver === 'log') return deliverEmail(message);
	await enqueue(
		'email.send',
		{ message },
		{ retryLimit: 6, retryDelay: 30, retryBackoff: true, deleteAfterSeconds: 3600 }
	);
}

/** The actual send (the `email.send` job). Throws on failure so the queue retries. */
export async function deliverEmail(message: EmailMessage): Promise<void> {
	const { email, emailFrom } = ctx().config;
	if (email.driver === 'log') {
		sentEmails.push(message);
		if (sentEmails.length > 50) sentEmails.shift();
		if (!process.env.VITEST)
			console.info(`[email] to=${message.to} subject="${message.subject}"\n${message.text}\n`);
		return;
	}
	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		signal: AbortSignal.timeout(10_000),
		headers: { Authorization: `Bearer ${email.apiKey}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			from: emailFrom,
			to: [message.to],
			subject: message.subject,
			text: message.text
		})
	});
	if (!response.ok) {
		throw new Error(`Email provider returned ${response.status}: ${await response.text()}`);
	}
}
