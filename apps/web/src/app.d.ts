import type { Auth } from '@deteck/core/server/auth-factory.ts';

type AuthSession = Auth['$Infer']['Session'];

// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Locals {
			user?: AuthSession['user'];
			session?: AuthSession['session'];
			/** The public pages' language (business areas are always English). */
			lang: import('@deteck/core/messages/i18n.ts').Locale;
		}
		interface Error {
			message: string;
			status: number;
		}
	}
}

export {};
