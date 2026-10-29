/** Registers every background job. Imported once by the app and by tests. */
import type { Actor } from './audit.ts';
import { runApiImport, runImport } from './imports/engine.ts';
import { defineJob } from './jobs.ts';
import { runMaintenance } from './maintenance.ts';
import { processReference } from './packaging.ts';
import { runScanComparison } from './scan/session.ts';
import { deliverWebhook } from './webhooks.ts';
import { sendRecallAlerts, sendRecallLiftedAlerts } from './alerts.ts';
import { deliverEmail, type EmailMessage } from './email/index.ts';

defineJob('import.check', async (data) => {
	await runImport(String(data.jobId), 'dry_run');
});

defineJob('import.api', async (data) => {
	await runApiImport(String(data.jobId), Boolean(data.commit), data.actor as Actor | undefined);
});

defineJob('import.commit', async (data) => {
	await runImport(String(data.jobId), 'commit', data.actor as Actor | undefined);
});

defineJob('packaging.process', async (data) => {
	await processReference(String(data.referenceId));
});

// Several people may wait on a comparison at once; each AI call can take up to 12 seconds.
defineJob(
	'scan.compare',
	async (data) => {
		await runScanComparison(String(data.sessionId), (data.state as string | null) ?? null);
	},
	{ concurrency: 4 }
);

defineJob('alerts.recall', async (data) => {
	await sendRecallAlerts(String(data.batchId));
});

defineJob('alerts.lifted', async (data) => {
	await sendRecallLiftedAlerts(String(data.batchId));
});

defineJob(
	'webhook.deliver',
	async (data) => {
		await deliverWebhook(String(data.deliveryId));
	},
	{ concurrency: 4 }
);

defineJob(
	'maintenance.hourly',
	async () => {
		await runMaintenance();
	},
	{ cron: '17 * * * *' }
);

defineJob(
	'email.send',
	async (data) => {
		await deliverEmail(data.message as EmailMessage);
	},
	{ concurrency: 4 }
);
