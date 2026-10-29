/**
 * Stops a commit that contains something that looks like a real secret: API keys for Anthropic,
 * Resend, Meta, AWS/R2 or DETECK itself, private keys, or a filled-in .env file.
 * Usage (lint-staged passes the staged files): node scripts/hooks/no-secrets.js <files…>
 */
import { readFileSync, statSync } from 'node:fs';
import { basename } from 'node:path';

const PATTERNS = [
	['Anthropic API key', /sk-ant-[A-Za-z0-9_-]{20,}/],
	['Resend API key', /\bre_[A-Za-z0-9]{8,}_[A-Za-z0-9]{16,}/],
	['Meta (WhatsApp) access token', /\bEAA[A-Za-z0-9]{60,}/],
	['AWS-style access key', /\bAKIA[0-9A-Z]{16}\b/],
	['DETECK API key', /dtk_live_[a-z0-9]{8}_[A-Za-z0-9_-]{20,}/],
	['Webhook signing secret', /whsec_[A-Za-z0-9_-]{24,}/],
	['Private key', /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/],
	['Sentry DSN with key', /https:\/\/[0-9a-f]{32}@[a-z0-9.-]*ingest[a-z0-9.-]*sentry\.io\//]
];

const problems = [];
for (const file of process.argv.slice(2)) {
	const name = basename(file);
	if (/^\.env(\..+)?$/.test(name) && name !== '.env.example') {
		problems.push(`${file}: environment files hold secrets and must not be committed`);
		continue;
	}
	let text;
	try {
		if (statSync(file).size > 2_000_000) continue;
		text = readFileSync(file, 'utf8');
	} catch {
		continue; // deleted or unreadable: nothing to scan
	}
	for (const [label, pattern] of PATTERNS)
		if (pattern.test(text)) problems.push(`${file}: looks like it contains a secret (${label})`);
}

if (problems.length) {
	console.error('\nCommit stopped: possible secrets found.\n');
	for (const p of problems) console.error(`  ✗ ${p}`);
	console.error(
		'\nMove the value into .env (local) or Render (production). If it is a harmless example, change it so it no longer looks real.\n'
	);
	process.exit(1);
}
