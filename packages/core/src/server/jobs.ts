/**
 * Background jobs (D-05: pg-boss, in Postgres, no Redis). In the app the
 * queue runs inside the web process; in scripts and tests, when the queue
 * isn't started, jobs run in-line so behaviour is easy to test.
 */
import { PgBoss } from 'pg-boss';
import { captureError } from './monitoring.ts';

type Handler = (data: Record<string, unknown>) => Promise<void>;

const handlers = new Map<string, Handler>();
const schedules: { name: string; cron: string }[] = [];
let boss: PgBoss | undefined;

const concurrency = new Map<string, number>();

export function defineJob(
	name: string,
	handler: Handler,
	options: { cron?: string; concurrency?: number } = {}
) {
	handlers.set(name, handler);
	if (options.concurrency) concurrency.set(name, options.concurrency);
	if (options.cron) schedules.push({ name, cron: options.cron });
}

/**
 * Connects the queue. With `work: true` (the worker, or the web app when JOBS_IN_WEB is on)
 * this process also runs jobs and the schedules; with `work: false` it only sends jobs.
 */
export async function startJobs(
	connectionString: string,
	options: { work: boolean } = { work: true }
) {
	if (boss) return;
	const instance = new PgBoss({
		connectionString,
		schema: 'pgboss',
		max: 4,
		application_name: options.work ? 'deteck-worker' : 'deteck-web'
	});
	instance.on('error', (error) => console.error('[jobs]', error));
	await instance.start();
	for (const name of handlers.keys()) await instance.createQueue(name).catch(() => undefined);
	if (!options.work) {
		boss = instance;
		return;
	}
	for (const [name, handler] of handlers) {
		const localConcurrency = concurrency.get(name) ?? 1;
		await instance.work(
			name,
			{ localConcurrency, pollingIntervalSeconds: 1, includeMetadata: true },
			async (jobs) => {
				for (const job of jobs) {
					try {
						await handler((job.data ?? {}) as Record<string, unknown>);
					} catch (error) {
						// Re-thrown so the queue retries the job. Reported to error tracking once, on the
						// last try: a customer's broken webhook shouldn't flood it with every attempt.
						if (job.retryCount >= job.retryLimit)
							captureError(error, { job: name, tries: job.retryCount + 1 });
						else
							console.warn(
								`[jobs] ${name} failed on try ${job.retryCount + 1}, will retry:`,
								error instanceof Error ? error.message : error
							);
						throw error;
					}
				}
			}
		);
	}
	for (const s of schedules) await instance.schedule(s.name, s.cron, {}, { tz: 'Africa/Lagos' });
	boss = instance;
}

/**
 * Stops taking jobs and waits for running ones (up to 4.5 minutes: an import may be committing).
 * On Render's paid plans the shutdown window is set to 5 minutes to match. The free plan the
 * website is on for now stops it after 30 seconds, however long this waits (render.yaml).
 */
export async function stopJobs() {
	await boss?.stop({ graceful: true, timeout: 270_000 });
	boss = undefined;
}

export interface EnqueueOptions {
	/** How many times to retry after a failure (default 1). */
	retryLimit?: number;
	/** Seconds before the first retry (default 30); doubles each time with `retryBackoff`. */
	retryDelay?: number;
	retryBackoff?: boolean;
	/** How long one run may take before the queue gives up on it and retries (default 1 hour). */
	expireInSeconds?: number;
	/** Delete the finished job after this long (default: the queue's), e.g. emails holding links. */
	deleteAfterSeconds?: number;
}

/** Queues a job, or runs it now when the queue isn't running (scripts, tests). */
export async function enqueue(
	name: string,
	data: Record<string, unknown>,
	options: EnqueueOptions = {}
) {
	const handler = handlers.get(name);
	if (!handler) throw new Error(`Unknown job: ${name}`);
	if (boss) {
		await boss.send(name, data, {
			retryLimit: options.retryLimit ?? 1,
			retryDelay: options.retryDelay ?? 30,
			retryBackoff: options.retryBackoff ?? false,
			expireInSeconds: options.expireInSeconds ?? 60 * 60,
			...(options.deleteAfterSeconds ? { deleteAfterSeconds: options.deleteAfterSeconds } : {})
		});
		return;
	}
	await handler(data);
}
