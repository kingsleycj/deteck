/**
 * Guards the two keys DETECK can't recover from losing:
 * - SERIAL_HMAC_KEY: every stored serial is a code made with it. A different key makes every
 *   check answer "Unrecognised", with no error anywhere.
 * - BETTER_AUTH_SECRET: two-step sign-in secrets are encrypted with it. A different key locks
 *   every business and staff account out.
 * The first start stores a one-way fingerprint of each; every later start compares and refuses
 * to run on a mismatch, so a wrong key fails loudly instead of quietly giving wrong answers.
 */
import { createHmac } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { ctx } from './context.ts';
import { systemCheck } from './db/schema.ts';

const fingerprint = (secret: string, purpose: string) =>
	createHmac('sha256', secret).update(`deteck-key-check:${purpose}`).digest('hex');

export class SecretMismatch extends Error {}

export async function checkSecrets() {
	const { db, config } = ctx();
	const wanted = {
		serial_hmac_key: {
			value: fingerprint(config.serialHmacKey, 'serial'),
			name: 'SERIAL_HMAC_KEY',
			effect: 'every check would answer "Unrecognised"'
		},
		better_auth_secret: {
			value: fingerprint(config.authSecret, 'auth'),
			name: 'BETTER_AUTH_SECRET',
			effect: 'nobody could complete two-step sign-in'
		}
	};
	for (const [key, w] of Object.entries(wanted)) {
		const [stored] = await db.select().from(systemCheck).where(eq(systemCheck.key, key));
		if (!stored) {
			await db.insert(systemCheck).values({ key, value: w.value }).onConflictDoNothing();
			continue;
		}
		if (stored.value !== w.value)
			throw new SecretMismatch(
				`${w.name} is not the one this database was set up with, so ${w.effect}. ` +
					`Put back the original ${w.name} (from your password manager). ` +
					'On a local test database you can instead start over with pnpm db:reset --yes.'
			);
	}
}
