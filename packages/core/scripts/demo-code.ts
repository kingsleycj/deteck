// Prints the current two-step sign-in code for the demo accounts made by `pnpm demo:accounts`.
//   pnpm demo:code                 every account
//   pnpm demo:code maker           only accounts whose email contains "maker"
import { createHmac } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// DEMO_ACCOUNTS_FILE lets the browser tests keep their own copy.
const file =
	process.env.DEMO_ACCOUNTS_FILE ??
	fileURLToPath(new URL('../../../.data/demo-accounts.json', import.meta.url));
if (!existsSync(file)) {
	console.error('No demo accounts yet. Run: pnpm db:seed && pnpm demo:accounts');
	process.exit(1);
}

function totp(secret: string, now = Date.now()): string {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
	let bits = '';
	for (const ch of secret.replace(/=+$/, '').toUpperCase())
		bits += alphabet.indexOf(ch).toString(2).padStart(5, '0');
	const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
	const counter = Buffer.alloc(8);
	counter.writeBigUInt64BE(BigInt(Math.floor(now / 30_000)));
	const hmac = createHmac('sha1', key).update(counter).digest();
	const offset = hmac[hmac.length - 1] & 0x0f;
	return String((hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, '0');
}

const filter = process.argv[2]?.toLowerCase() ?? '';
const { accounts } = JSON.parse(readFileSync(file, 'utf8')) as {
	accounts: { email: string; role: string; totpSecret: string }[];
};
const left = 30 - (Math.floor(Date.now() / 1000) % 30);
// Close to the change-over, show the next code too, so there's time to type it.
const soon = left < 8;
console.info(
	`\nSign-in codes (valid for ${left} more seconds${soon ? '; the second column is the next one' : ''}):\n`
);
for (const a of accounts)
	if (a.totpSecret && a.email.includes(filter))
		console.info(
			`  ${totp(a.totpSecret)}${soon ? `  ${totp(a.totpSecret, Date.now() + 30_000)}` : ''}   ${a.email.padEnd(28)} ${a.role}`
		);
console.info('');
