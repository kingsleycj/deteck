// Bootstraps a DETECK staff invite (e.g. the first admin) without the console.
// Usage: pnpm staff:create --email you@example.com --name "Your Name" [--role admin|reviewer]
// Prints the invite link; the person sets their own password and two-step sign-in.
import { configFromEnv } from '../src/server/config.ts';
import { initServerContext } from '../src/server/context.ts';
import { createDb } from '../src/server/db/client.ts';
import { inviteStaff } from '../src/server/team.ts';
import { SYSTEM_ACTOR } from '../src/server/audit.ts';

function arg(name: string) {
	const i = process.argv.indexOf(`--${name}`);
	return i > -1 ? process.argv[i + 1] : undefined;
}

const email = arg('email');
const name = arg('name');
const role = arg('role') ?? 'admin';
if (!email || !name) {
	console.error(
		'Usage: pnpm staff:create --email you@example.com --name "Your Name" [--role admin|reviewer]'
	);
	process.exit(1);
}

const db = createDb(process.env.DATABASE_URL!, { max: 1 });
initServerContext({ db, config: configFromEnv(process.env) });
try {
	const { url } = await inviteStaff(
		{ ...SYSTEM_ACTOR, label: 'DETECK setup' },
		{ email, name, role }
	);
	console.info(
		`\nInvite created for ${name} <${email}> as ${role}.\nOpen this link to create the account (expires in 7 days):\n\n  ${url}\n`
	);
} finally {
	await db.$close();
}
