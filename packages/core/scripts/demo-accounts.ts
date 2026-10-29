// Creates ready-to-use test accounts for every role on a LOCAL database, with two-step sign-in
// already switched on, so you can try each area without registering each time.
//   pnpm db:seed && pnpm demo:accounts      then      pnpm demo:code   (current sign-in codes)
// Details (passwords, authenticator secrets, backup codes, API keys) are saved to
// .data/demo-accounts.json, which git ignores. It refuses to run against a non-local database.
import { createHmac } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { eq } from 'drizzle-orm';
import { createApiKey } from '../src/server/api-keys.ts';
import { SYSTEM_ACTOR, type Actor } from '../src/server/audit.ts';
import { createAuth } from '../src/server/auth-factory.ts';
import { decideBusiness, registerBusiness } from '../src/server/business.ts';
import { configFromEnv } from '../src/server/config.ts';
import { initServerContext } from '../src/server/context.ts';
import { checkSecrets } from '../src/server/secrets-check.ts';
import { createDb } from '../src/server/db/client.ts';
import { businessAccount, manufacturer, member, user } from '../src/server/db/schema.ts';
import { registerManufacturer } from '../src/server/manufacturers/register.ts';
import { randomId } from '../src/server/crypto.ts';

// DEMO_ACCOUNTS_FILE lets the browser tests keep their own copy.
const DEMO_FILE =
	process.env.DEMO_ACCOUNTS_FILE ??
	fileURLToPath(new URL('../../../.data/demo-accounts.json', import.meta.url));
const PASSWORD = 'Demo-pass-2026!';

interface DemoAccount {
	email: string;
	password: string;
	role: string;
	signsInTo: string;
	totpSecret: string;
	backupCodes: string[];
	apiKey?: string;
}

const databaseUrl = process.env.DATABASE_URL ?? '';
const host = (() => {
	try {
		return new URL(databaseUrl).hostname;
	} catch {
		return '';
	}
})();
const config = configFromEnv(process.env);
if (
	!['localhost', '127.0.0.1'].includes(host) ||
	!/^http:\/\/(localhost|127\.0\.0\.1)/.test(config.origin)
) {
	console.error('demo:accounts only runs against a local database and a localhost ORIGIN.');
	process.exit(1);
}

const db = createDb(databaseUrl, { max: 1 });
initServerContext({ db, config });
// Seeding with a different serial key than the database's would make the demo serials unfindable.
await checkSecrets();
const auth = createAuth({ db, baseURL: config.origin, secret: config.authSecret });
const meta = { ip: '127.0.0.1', userAgent: 'demo-accounts script' };
const staffActor: Actor = { ...SYSTEM_ACTOR, label: 'Demo set-up' };
const pdf = (name: string) => ({
	name,
	type: 'application/pdf',
	bytes: new TextEncoder().encode('%PDF-1.4\n% DETECK demo document\n')
});

const saved: DemoAccount[] = existsSync(DEMO_FILE)
	? (JSON.parse(readFileSync(DEMO_FILE, 'utf8')).accounts as DemoAccount[])
	: [];

async function userId(email: string) {
	const [row] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
	return row?.id ?? null;
}

/** RFC 6238 code from a base32 secret, as an authenticator app shows it. */
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

/** Signs in once and switches on two-step sign-in, exactly as the set-up page does. */
async function turnOnTwoFactor(email: string) {
	const signedIn = await auth.api.signInEmail({
		body: { email, password: PASSWORD },
		asResponse: true
	});
	const cookie = signedIn.headers
		.getSetCookie()
		.map((c) => c.split(';')[0])
		.join('; ');
	const headers = new Headers({ cookie });
	const started = await auth.api.enableTwoFactor({ body: { password: PASSWORD }, headers });
	if (!('totpURI' in started)) throw new Error(`Could not start two-step sign-in for ${email}`);
	const secret = new URL(started.totpURI).searchParams.get('secret')!;
	await auth.api.verifyTOTP({ body: { code: totp(secret) }, headers });
	return { totpSecret: secret, backupCodes: started.backupCodes };
}

async function account(
	email: string,
	role: string,
	signsInTo: string,
	create: () => Promise<void>
): Promise<DemoAccount> {
	const known = saved.find((a) => a.email === email);
	if (known && (await userId(email))) return known;
	if (await userId(email))
		throw new Error(
			`${email} exists but isn't in ${DEMO_FILE}. Reset the database (pnpm db:migrate on a fresh database, then pnpm db:seed) and run this again.`
		);
	await create();
	return { email, password: PASSWORD, role, signsInTo, ...(await turnOnTwoFactor(email)) };
}

async function signUp(email: string, name: string) {
	const created = await auth.api.signUpEmail({ body: { email, name, password: PASSWORD } });
	return created.user.id;
}

async function company(name: string) {
	const [m] = await db.select().from(manufacturer).where(eq(manufacturer.companyName, name));
	if (!m) throw new Error(`"${name}" isn't in the database. Run pnpm db:seed first.`);
	return m;
}

try {
	const northbridge = await company('Northbridge Pharma Ltd');
	const accounts: DemoAccount[] = [];

	accounts.push(
		await account('admin@deteck.test', 'DETECK admin', '/console', async () => {
			const id = await signUp('admin@deteck.test', 'Ada Admin (demo)');
			await db.update(user).set({ platformRole: 'admin' }).where(eq(user.id, id));
		}),
		await account('reviewer@deteck.test', 'DETECK reviewer', '/console', async () => {
			const id = await signUp('reviewer@deteck.test', 'Remi Reviewer (demo)');
			await db.update(user).set({ platformRole: 'reviewer' }).where(eq(user.id, id));
		})
	);

	for (const [email, name, role, label] of [
		[
			'maker@northbridge.test',
			'Ngozi Admin (demo)',
			'admin',
			'Manufacturer admin, Northbridge Pharma (live)'
		],
		[
			'uploader@northbridge.test',
			'Uche Uploader (demo)',
			'member',
			'Manufacturer uploader, Northbridge Pharma'
		]
	] as const) {
		accounts.push(
			await account(email, label, '/workspace', async () => {
				const id = await signUp(email, name);
				await db.insert(member).values({
					id: randomId(),
					organizationId: northbridge.organizationId,
					userId: id,
					role,
					createdAt: new Date()
				});
			})
		);
	}

	accounts.push(
		await account(
			'apply@kestrel.test',
			'Manufacturer waiting for review (Kestrel Pharmaceuticals)',
			'/workspace',
			async () => {
				const result = await registerManufacturer(
					auth,
					{
						companyName: 'Kestrel Pharmaceuticals',
						address: 'Plot 9, Trans-Amadi Industrial Layout',
						state: 'Rivers',
						factoryTown: 'Port Harcourt',
						nafdacCompanyReg: 'NAF-DEMO-0042',
						cacRc: 'RC 424242',
						contactName: 'Chidi Okafor (demo)',
						contactEmail: 'apply@kestrel.test',
						contactPhone: '0803 000 0042',
						password: PASSWORD
					},
					{ nafdacCertificate: pdf('nafdac-certificate.pdf'), agreement: null },
					meta
				);
				if (!result.ok) throw new Error(JSON.stringify(result.errors));
			}
		)
	);

	const pharmacy = (email: string, name: string, pcn: string) =>
		registerBusiness(
			auth,
			{
				name,
				role: 'pharmacy',
				address: '5 Ring Road, Bodija',
				state: 'Oyo',
				town: 'Ibadan',
				pcnLicence: pcn,
				contactName: `${name} manager (demo)`,
				contactEmail: email,
				password: PASSWORD
			},
			{ pcnLicence: pdf('pcn-licence.pdf') },
			meta
		);

	accounts.push(
		await account(
			'pharmacy@riverside.test',
			'Pharmacy admin, Riverside Pharmacy (approved)',
			'/portal',
			async () => {
				const result = await pharmacy(
					'pharmacy@riverside.test',
					'Riverside Pharmacy',
					'PCN-DEMO-0001'
				);
				if (!result.ok) throw new Error(JSON.stringify(result.errors));
				await decideBusiness(staffActor, result.businessId, 'approve', 'Demo account');
			}
		),
		await account(
			'apply@corner-chemist.test',
			'Pharmacy waiting for review (Corner Chemist)',
			'/portal',
			async () => {
				const result = await pharmacy(
					'apply@corner-chemist.test',
					'Corner Chemist',
					'PCN-DEMO-0002'
				);
				if (!result.ok) throw new Error(JSON.stringify(result.errors));
			}
		)
	);

	// API keys, shown once: one for the manufacturer, one for the pharmacy, one for a partner app.
	const maker = accounts.find((a) => a.email === 'maker@northbridge.test')!;
	maker.apiKey ??= (
		await createApiKey(
			staffActor,
			{ type: 'manufacturer', manufacturerId: northbridge.id },
			{ name: 'Demo ERP', scopes: ['check', 'manufacturer:read', 'manufacturer:write'] },
			northbridge.id
		)
	).key;
	const shop = accounts.find((a) => a.email === 'pharmacy@riverside.test')!;
	if (!shop.apiKey) {
		const [b] = await db
			.select({ id: businessAccount.id })
			.from(businessAccount)
			.where(eq(businessAccount.contactEmail, shop.email));
		shop.apiKey = (
			await createApiKey(
				staffActor,
				{ type: 'business', businessId: b.id },
				{ name: 'Demo pharmacy software', scopes: ['check', 'business:verify', 'business:receive'] }
			)
		).key;
	}
	const partner =
		saved.find((a) => a.role === 'Partner app (API key only)') ??
		({
			email: '-',
			password: '-',
			role: 'Partner app (API key only)',
			signsInTo: '/api/v1',
			totpSecret: '',
			backupCodes: [],
			apiKey: (
				await createApiKey(
					staffActor,
					{ type: 'partner' },
					{ name: 'Demo partner app', scopes: ['check'] }
				)
			).key
		} satisfies DemoAccount);
	accounts.push(partner);

	mkdirSync(dirname(DEMO_FILE), { recursive: true });
	writeFileSync(
		DEMO_FILE,
		JSON.stringify({ createdFor: config.origin, password: PASSWORD, accounts }, null, '\t')
	);

	console.info(`\nDemo accounts (password for all: ${PASSWORD})\n`);
	for (const a of accounts.filter((x) => x.email !== '-'))
		console.info(`  ${a.email.padEnd(28)} ${a.role}  →  ${config.origin}${a.signsInTo}`);
	console.info('\nAPI keys:');
	for (const a of accounts.filter((x) => x.apiKey))
		console.info(`  ${a.role.padEnd(48)} ${a.apiKey}`);
	console.info(
		`\nSign-in codes: run "pnpm demo:code" for the current 6-digit code of every account,\nor add the secrets from ${DEMO_FILE} to an authenticator app.\n`
	);
} finally {
	await db.$close();
}
