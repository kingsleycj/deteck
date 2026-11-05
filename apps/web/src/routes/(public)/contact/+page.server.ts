import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	CONTACT_TOPICS,
	ContactError,
	MAX_MESSAGE,
	sendContactMessage
} from '@deteck/core/server/contact.ts';
import { ctx } from '@deteck/core/server/context.ts';
import { turnstileSiteKey, verifyTurnstile } from '@deteck/core/server/turnstile.ts';
import { messages } from '@deteck/core/messages/i18n.ts';
import { requester } from '#lib/server/requester.ts';

/** `?topic=partnering` (the landing page's "Partner with us") picks the subject in advance. */
export const load: PageServerLoad = ({ url, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });
	const topic = url.searchParams.get('topic') ?? '';
	return {
		topics: CONTACT_TOPICS,
		topic: (CONTACT_TOPICS as readonly string[]).includes(topic) ? topic : '',
		turnstile: turnstileSiteKey(),
		contactEmail: ctx().config.contactEmail ?? null,
		maxMessage: MAX_MESSAGE,
		sent: url.searchParams.get('sent') === '1'
	};
};

export const actions: Actions = {
	default: async (event) => {
		const data = await event.request.formData();
		const value = (key: string) => String(data.get(key) ?? '');
		const values = {
			name: value('name'),
			email: value('email'),
			organisation: value('organisation'),
			topic: value('topic'),
			message: value('message')
		};
		const c = messages(event.locals.lang).contact;
		const who = requester(event);
		if (!(await verifyTurnstile(value('cf-turnstile-response'), who.ip)))
			return fail(400, { message: c.errors.human, field: null, values });
		try {
			await sendContactMessage(
				{ deviceId: who.deviceId, ip: who.ip },
				{ ...values, website: value('website') }
			);
		} catch (error) {
			if (error instanceof ContactError)
				return fail(400, { message: c.errors[error.code], field: error.field ?? null, values });
			console.error('[contact] could not send a message', error);
			return fail(503, { message: c.errors.failed, field: null, values });
		}
		redirect(303, '/contact?sent=1');
	}
};
