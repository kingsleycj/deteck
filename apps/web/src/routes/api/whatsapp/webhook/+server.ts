import type { RequestHandler } from './$types';
import { confirmWhatsApp, unsubscribeWhatsApp } from '@deteck/core/server/alerts.ts';
import { ctx } from '@deteck/core/server/context.ts';
import { verifyMetaSignature } from '@deteck/core/server/whatsapp.ts';

/** Meta's set-up check: echo the challenge when the verify token matches. */
export const GET: RequestHandler = ({ url }) => {
	const expected = ctx().config.whatsapp?.verifyToken;
	if (
		expected &&
		url.searchParams.get('hub.mode') === 'subscribe' &&
		url.searchParams.get('hub.verify_token') === expected
	)
		return new Response(url.searchParams.get('hub.challenge') ?? '', { status: 200 });
	return new Response('Forbidden', { status: 403 });
};

interface MetaPayload {
	entry?: {
		changes?: {
			value?: { messages?: { from?: string; type?: string; text?: { body?: string } }[] };
		}[];
	}[];
}

/** Incoming WhatsApp messages: "YES" confirms pending sign-ups, "STOP" removes every alert. */
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.text();
	if (!verifyMetaSignature(body, request.headers.get('x-hub-signature-256')))
		return new Response('Invalid signature', { status: 401 });
	const payload = JSON.parse(body) as MetaPayload;
	for (const entry of payload.entry ?? [])
		for (const change of entry.changes ?? [])
			for (const message of change.value?.messages ?? []) {
				const text = (message.text?.body ?? '').trim();
				if (!message.from) continue;
				if (/^(stop|unsubscribe|cancel)$/i.test(text)) await unsubscribeWhatsApp(message.from);
				else if (/^(yes|y|ok|okay|confirm)\.?$/i.test(text)) await confirmWhatsApp(message.from);
			}
	return new Response('OK');
};
