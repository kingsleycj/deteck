/**
 * DETECK's background worker. Runs the jobs the web app queues (imports, packaging
 * processing, AI comparisons, webhooks, alerts) and the hourly clean-up, in its own
 * process so heavy work never slows the website. Start it with `pnpm worker`.
 */
import { configFromEnv } from '@deteck/core/server/config.ts';
import { initServerContext } from '@deteck/core/server/context.ts';
import { createDb } from '@deteck/core/server/db/client.ts';
import '@deteck/core/server/job-definitions.ts';
import { recoverInterruptedImports } from '@deteck/core/server/imports/engine.ts';
import { startJobs, stopJobs } from '@deteck/core/server/jobs.ts';
import { checkSecrets } from '@deteck/core/server/secrets-check.ts';
import { flushErrors, initErrorTracking } from '@deteck/core/server/monitoring.ts';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set (see .env.example)');

const config = configFromEnv(process.env);
const db = createDb(url, { max: config.databasePoolMax });
initServerContext({ db, config });
initErrorTracking(config.sentryDsn, 'worker');
await checkSecrets();

await recoverInterruptedImports();
await startJobs(url, { work: true });
console.info('[worker] running background jobs');

async function shutdown(signal: string) {
	console.info(`[worker] ${signal}: finishing the current jobs, then stopping`);
	await stopJobs();
	await db.$close();
	await flushErrors();
	process.exit(0);
}
process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
