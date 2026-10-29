import { existsSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { parseLanguages, type Locale } from '../messages/i18n.ts';
/** Runtime configuration shared by server modules, scripts and tests. */
export interface ServerConfig {
	origin: string;
	authSecret: string;
	serialHmacKey: string;
	deviceHashSecret: string;
	storage:
		| { driver: 'local'; dir: string }
		| {
				driver: 's3';
				endpoint?: string;
				region: string;
				bucket: string;
				accessKeyId: string;
				secretAccessKey: string;
		  };
	email: { driver: 'log' } | { driver: 'resend'; apiKey: string; from: string };
	emailFrom: string;
	packagingAi: 'off' | 'pilot' | 'public';
	pilotAccessCode?: string;
	contactEmail?: string;
	anthropicApiKey?: string;
	scanModel: string;
	/** Error tracking (Sentry). Off when unset. */
	sentryDsn?: string;
	/** Cloudflare Turnstile, the "are you human" check shown after limits are hit. Off when unset. */
	turnstile?: { siteKey: string; secretKey: string };
	/** WhatsApp Cloud API for recall alerts. Off when unset. */
	whatsapp?: {
		accessToken: string;
		phoneNumberId: string;
		apiVersion: string;
		appSecret?: string;
		verifyToken?: string;
		templates: { subscribed: string; recall: string; language: string };
	};
	/** Public API: anonymous requests per IP per hour (a key raises this). */
	apiAnonymousPerHour: number;
	/** Languages offered on the public pages. English is always first. */
	languages: Locale[];
	/** NODE_ENV=production: development fallbacks are refused at start. */
	production: boolean;
	/**
	 * A secret Cloudflare adds to every request (a Transform Rule). When set, requests without it
	 * are refused, so nobody can reach the server directly and fake their IP address.
	 */
	edgeSecret?: string;
	/** Database connections each process may open (web and worker each have their own pool). */
	databasePoolMax: number;
	rateLimits: {
		devicePerMinute: number;
		devicePerHour: number;
		ipPerHour: number;
		scansPerDevicePerDay: number;
		scansPerIpPerDay: number;
	};
}

type EnvLike = Record<string, unknown>;

/**
 * The repo root (the folder with pnpm-workspace.yaml), so a relative path such as
 * STORAGE_LOCAL_DIR means the same folder for the web app, the worker and scripts.
 */
function repoRoot(start = process.cwd()): string {
	let dir = resolve(start);
	for (;;) {
		if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
		const up = dirname(dir);
		if (up === dir) return resolve(start);
		dir = up;
	}
}

const fromRoot = (path: string) => (isAbsolute(path) ? path : join(repoRoot(), path));

/**
 * Builds the config from plain environment values (used by scripts and tests). `building`: the
 * app is only being built (the build loads server code but serves nothing), so production
 * settings aren't required yet; they're checked when the server starts.
 */
export function configFromEnv(env: EnvLike, options: { building?: boolean } = {}): ServerConfig {
	const str = (key: string, fallback?: string) => {
		const value = env[key];
		if (value === undefined || value === '') {
			if (fallback !== undefined) return fallback;
			throw new Error(`${key} is not set`);
		}
		return String(value);
	};
	const num = (key: string, fallback: number) => {
		const value = env[key];
		return value === undefined || value === '' ? fallback : Number(value);
	};
	const production = (env.NODE_ENV ?? process.env.NODE_ENV) === 'production';
	const storageDriver = str('STORAGE_DRIVER', 'local');
	const emailDriver = str('EMAIL_DRIVER', 'log');
	const emailFrom = str('EMAIL_FROM', 'DETECK <no-reply@localhost>');
	if (production && !options.building) {
		// On a live server, a development fallback would fail quietly (emails printed to a log,
		// files on a disk that's wiped on deploy, links to localhost). Refuse to start instead,
		// listing everything that needs setting.
		const problems: string[] = [];
		const origin = str('ORIGIN', '');
		if (!/^https:\/\//.test(origin))
			problems.push('ORIGIN must be the https:// address of the site');
		if (storageDriver !== 's3') problems.push('STORAGE_DRIVER must be s3 (Cloudflare R2)');
		if (emailDriver !== 'resend') problems.push('EMAIL_DRIVER must be resend');
		if (/localhost/i.test(emailFrom))
			problems.push('EMAIL_FROM must be an address on your verified sending domain');
		if (str('FEATURE_PACKAGING_AI', 'off') !== 'off' && !str('ANTHROPIC_API_KEY', ''))
			problems.push('FEATURE_PACKAGING_AI is on but ANTHROPIC_API_KEY is empty');
		if (problems.length)
			throw new Error(`Production settings are incomplete:\n- ${problems.join('\n- ')}`);
	}
	return {
		origin: str('ORIGIN', 'http://localhost:5173').replace(/\/$/, ''),
		authSecret: str('BETTER_AUTH_SECRET'),
		serialHmacKey: str('SERIAL_HMAC_KEY'),
		deviceHashSecret: str('DEVICE_HASH_SECRET'),
		storage:
			storageDriver === 's3'
				? {
						driver: 's3',
						endpoint: str('S3_ENDPOINT', '') || undefined,
						region: str('S3_REGION', 'auto'),
						bucket: str('S3_BUCKET'),
						accessKeyId: str('S3_ACCESS_KEY_ID'),
						secretAccessKey: str('S3_SECRET_ACCESS_KEY')
					}
				: { driver: 'local', dir: fromRoot(str('STORAGE_LOCAL_DIR', '.data/uploads')) },
		email:
			emailDriver === 'resend'
				? { driver: 'resend', apiKey: str('RESEND_API_KEY'), from: emailFrom }
				: { driver: 'log' },
		emailFrom,
		packagingAi: str('FEATURE_PACKAGING_AI', 'off') as ServerConfig['packagingAi'],
		pilotAccessCode: str('PILOT_ACCESS_CODE', '') || undefined,
		contactEmail: str('CONTACT_EMAIL', '') || undefined,
		anthropicApiKey: str('ANTHROPIC_API_KEY', '') || undefined,
		scanModel: str('SCAN_MODEL', 'claude-opus-5-5'),
		sentryDsn: str('SENTRY_DSN', '') || undefined,
		turnstile:
			str('TURNSTILE_SITE_KEY', '') && str('TURNSTILE_SECRET_KEY', '')
				? { siteKey: str('TURNSTILE_SITE_KEY'), secretKey: str('TURNSTILE_SECRET_KEY') }
				: undefined,
		whatsapp:
			str('WHATSAPP_ACCESS_TOKEN', '') && str('WHATSAPP_PHONE_NUMBER_ID', '')
				? {
						accessToken: str('WHATSAPP_ACCESS_TOKEN'),
						phoneNumberId: str('WHATSAPP_PHONE_NUMBER_ID'),
						apiVersion: str('WHATSAPP_API_VERSION', 'v23.0'),
						appSecret: str('WHATSAPP_APP_SECRET', '') || undefined,
						verifyToken: str('WHATSAPP_VERIFY_TOKEN', '') || undefined,
						templates: {
							subscribed: str('WHATSAPP_TEMPLATE_SUBSCRIBED', 'deteck_alert_subscribed'),
							recall: str('WHATSAPP_TEMPLATE_RECALL', 'deteck_recall_alert'),
							language: str('WHATSAPP_TEMPLATE_LANGUAGE', 'en')
						}
					}
				: undefined,
		apiAnonymousPerHour: num('API_ANONYMOUS_PER_HOUR', 300),
		// Unreviewed translations stay off in production unless LANGUAGES lists them.
		languages: parseLanguages(str('LANGUAGES', production ? 'en' : 'en,pcm,ha,yo,ig')),
		production,
		edgeSecret: str('EDGE_SECRET', '') || undefined,
		databasePoolMax: num('DATABASE_POOL_MAX', 10),
		rateLimits: {
			devicePerMinute: num('RATE_LIMIT_DEVICE_PER_MINUTE', 10),
			devicePerHour: num('RATE_LIMIT_DEVICE_PER_HOUR', 60),
			ipPerHour: num('RATE_LIMIT_IP_PER_HOUR', 300),
			scansPerDevicePerDay: num('SCAN_LIMIT_DEVICE_PER_DAY', 5),
			scansPerIpPerDay: num('SCAN_LIMIT_IP_PER_DAY', 50)
		}
	};
}
