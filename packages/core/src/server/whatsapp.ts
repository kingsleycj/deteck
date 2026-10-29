/**
 * WhatsApp Cloud API (Meta), used for recall alerts. Messages DETECK starts must use templates
 * that Meta has approved; docs/SETUP-KEYS.md lists the two templates to create.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { ctx } from './context.ts';

export class WhatsAppError extends Error {}

/** Nigerian numbers to international form without the plus: 0803… → 234803…. */
export function normalisePhone(raw: string): string | null {
	const digits = raw.replace(/[^\d+]/g, '');
	let n = digits.startsWith('+') ? digits.slice(1) : digits;
	if (/^0\d{10}$/.test(n)) n = `234${n.slice(1)}`;
	return /^\d{10,15}$/.test(n) ? n : null;
}

export function whatsappEnabled(): boolean {
	return Boolean(ctx().config.whatsapp);
}

/** Sends an approved template with body parameters, in order. */
export async function sendTemplate(to: string, template: string, params: string[]) {
	const wa = ctx().config.whatsapp;
	if (!wa) throw new WhatsAppError('WhatsApp is not set up.');
	const response = await fetch(
		`https://graph.facebook.com/${wa.apiVersion}/${wa.phoneNumberId}/messages`,
		{
			method: 'POST',
			signal: AbortSignal.timeout(10_000),
			headers: {
				Authorization: `Bearer ${wa.accessToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				messaging_product: 'whatsapp',
				to,
				type: 'template',
				template: {
					name: template,
					language: { code: wa.templates.language },
					components: [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }]
				}
			})
		}
	);
	if (!response.ok)
		throw new WhatsAppError(`WhatsApp answered ${response.status}: ${await response.text()}`);
}

/** Checks Meta's X-Hub-Signature-256 header on incoming webhook calls. */
export function verifyMetaSignature(body: string, header: string | null): boolean {
	const secret = ctx().config.whatsapp?.appSecret;
	if (!secret || !header?.startsWith('sha256=')) return false;
	const expected = Buffer.from(`sha256=${createHmac('sha256', secret).update(body).digest('hex')}`);
	const given = Buffer.from(header);
	return expected.length === given.length && timingSafeEqual(expected, given);
}
