import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (value: string | undefined) => (value ? value : undefined);

const secret = (name: string) => (value: string | undefined) => {
	if (!value || value.length < 32) {
		throw new Error(`${name} must be set to at least 32 characters (openssl rand -base64 32)`);
	}
	return value;
};

const oneOf =
	<T extends string>(name: string, allowed: readonly T[], fallback: T) =>
	(value: string | undefined): T => {
		if (!value) return fallback;
		if ((allowed as readonly string[]).includes(value)) return value as T;
		throw new Error(`${name} must be one of: ${allowed.join(', ')}`);
	};

/** A file on this site, e.g. `/media/film.mp4`: the content security policy only plays our own files. */
const sitePath = (name: string) => (value: string | undefined) => {
	if (!value) return undefined;
	if (!value.startsWith('/') || value.startsWith('//'))
		throw new Error(`${name} must be a path on this site, starting with "/"`);
	return value;
};

const positiveInt = (name: string, fallback: number) => (value: string | undefined) => {
	if (!value) return fallback;
	const n = Number(value);
	if (!Number.isInteger(n) || n <= 0) throw new Error(`${name} must be a positive integer`);
	return n;
};

export const variables = defineEnvVars({
	DATABASE_URL: { description: 'Postgres connection string.' },
	JOBS_IN_WEB: {
		description:
			'Run background jobs inside the web app (`true`, the default) or only in the worker (`false`).',
		schema: (v) => v !== 'false'
	},
	ORIGIN: { description: 'Public origin of the app, e.g. `http://localhost:5173`.' },
	BETTER_AUTH_SECRET: {
		description: 'Signs auth tokens. 32+ random characters.',
		schema: secret('BETTER_AUTH_SECRET')
	},
	SERIAL_HMAC_KEY: {
		description: 'Key for HMAC-hashing serials. Never rotate without a re-key migration.',
		schema: secret('SERIAL_HMAC_KEY')
	},
	DEVICE_HASH_SECRET: {
		description: 'Salt for the daily-rotated anonymous device hash.',
		schema: secret('DEVICE_HASH_SECRET')
	},
	STORAGE_DRIVER: {
		description: '`local` (disk) or `s3` (Cloudflare R2).',
		schema: oneOf('STORAGE_DRIVER', ['local', 's3'] as const, 'local')
	},
	STORAGE_LOCAL_DIR: {
		description: 'Folder for uploads when STORAGE_DRIVER is local.',
		schema: (v) => v || '.data/uploads'
	},
	S3_ENDPOINT: { schema: optional },
	S3_REGION: { schema: (v) => v || 'auto' },
	S3_BUCKET: { schema: optional },
	S3_ACCESS_KEY_ID: { schema: optional },
	S3_SECRET_ACCESS_KEY: { schema: optional },
	EMAIL_DRIVER: {
		description: '`log` (console) or `resend`.',
		schema: oneOf('EMAIL_DRIVER', ['log', 'resend'] as const, 'log')
	},
	EMAIL_FROM: { schema: (v) => v || 'DETECK <no-reply@localhost>' },
	RESEND_API_KEY: { schema: optional },
	FEATURE_PACKAGING_AI: {
		description: '`off`, `pilot` or `public`.',
		schema: oneOf('FEATURE_PACKAGING_AI', ['off', 'pilot', 'public'] as const, 'off')
	},
	FEATURE_REPORTS: {
		description: '`on` shows "Report a suspected fake" and the reports pages. `off` for now.',
		schema: oneOf('FEATURE_REPORTS', ['off', 'on'] as const, 'off')
	},
	SHOWREEL_URL: {
		description:
			'The landing page film, e.g. `/media/deteck-film.mp4` (put the file in `apps/web/static/media/`). Unset: the page keeps a placeholder.',
		schema: sitePath('SHOWREEL_URL')
	},
	SHOWREEL_POSTER: {
		description: 'Still image shown before the film plays, e.g. `/media/deteck-film.webp`.',
		schema: sitePath('SHOWREEL_POSTER')
	},
	SHOWREEL_CAPTIONS: {
		description: 'English captions for the film (WebVTT), e.g. `/media/deteck-film.en.vtt`.',
		schema: sitePath('SHOWREEL_CAPTIONS')
	},
	PILOT_ACCESS_CODE: { schema: optional },
	CONTACT_EMAIL: {
		description:
			'Public contact and support inbox (OQ-12). Shown on the landing, privacy and terms pages.',
		schema: optional
	},
	ANTHROPIC_API_KEY: { schema: optional },
	SENTRY_DSN: { description: 'Sentry error tracking. Off when unset.', schema: optional },
	TURNSTILE_SITE_KEY: { schema: optional },
	TURNSTILE_SECRET_KEY: { schema: optional },
	WHATSAPP_ACCESS_TOKEN: { schema: optional },
	WHATSAPP_PHONE_NUMBER_ID: { schema: optional },
	WHATSAPP_API_VERSION: { schema: optional },
	WHATSAPP_APP_SECRET: { schema: optional },
	WHATSAPP_VERIFY_TOKEN: { schema: optional },
	WHATSAPP_TEMPLATE_SUBSCRIBED: { schema: optional },
	WHATSAPP_TEMPLATE_RECALL: { schema: optional },
	WHATSAPP_TEMPLATE_LANGUAGE: { schema: optional },
	API_ANONYMOUS_PER_HOUR: { schema: positiveInt('API_ANONYMOUS_PER_HOUR', 300) },
	LANGUAGES: {
		description:
			'Languages offered on the public pages, e.g. `en,pcm,ha,yo,ig`. Empty: all five locally, English only in production.',
		schema: optional
	},
	EDGE_SECRET: {
		description:
			'A secret Cloudflare adds as the x-deteck-edge header. When set, requests without it are refused.',
		schema: optional
	},
	DATABASE_POOL_MAX: { schema: positiveInt('DATABASE_POOL_MAX', 10) },
	SCAN_MODEL: { schema: (v) => v || 'claude-opus-5-5' },
	RATE_LIMIT_DEVICE_PER_MINUTE: { schema: positiveInt('RATE_LIMIT_DEVICE_PER_MINUTE', 10) },
	RATE_LIMIT_DEVICE_PER_HOUR: { schema: positiveInt('RATE_LIMIT_DEVICE_PER_HOUR', 60) },
	RATE_LIMIT_IP_PER_HOUR: { schema: positiveInt('RATE_LIMIT_IP_PER_HOUR', 300) },
	SCAN_LIMIT_DEVICE_PER_DAY: { schema: positiveInt('SCAN_LIMIT_DEVICE_PER_DAY', 5) },
	SCAN_LIMIT_IP_PER_DAY: { schema: positiveInt('SCAN_LIMIT_IP_PER_DAY', 50) }
});
