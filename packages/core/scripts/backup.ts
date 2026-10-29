// Backs up the whole database (Render runs this nightly as a cron job; see render.yaml).
//   node scripts/backup.ts                 to the backup bucket (BACKUP_S3_BUCKET)
//   node scripts/backup.ts --dir <folder>  to a folder on this computer
// The backup bucket should be separate from the uploads bucket, with object versioning or a lock
// turned on, so nothing (and nobody with the app's keys) can delete old backups.
import { S3Client } from '@aws-sdk/client-s3';
import { backupDatabase, type BackupTarget } from '../src/server/backup.ts';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const dirFlag = process.argv.indexOf('--dir');
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

let target: BackupTarget;
if (dirFlag > -1) {
	target = { kind: 'dir', path: `${process.argv[dirFlag + 1]}/${stamp}` };
} else {
	const env = (key: string) => process.env[`BACKUP_${key}`] || process.env[key] || '';
	const bucket = process.env.BACKUP_S3_BUCKET;
	if (!bucket) throw new Error('BACKUP_S3_BUCKET is not set (or use --dir <folder>)');
	target = {
		kind: 's3',
		bucket,
		prefix: `backups/${stamp}/`,
		client: new S3Client({
			region: env('S3_REGION') || 'auto',
			endpoint: env('S3_ENDPOINT') || undefined,
			credentials: {
				accessKeyId: env('S3_ACCESS_KEY_ID'),
				secretAccessKey: env('S3_SECRET_ACCESS_KEY')
			}
		})
	};
}

const started = Date.now();
const manifest = await backupDatabase(url, target);
const rows = manifest.tables.reduce((n, t) => n + t.rows, 0);
console.info(
	`Backup done: ${manifest.tables.length} tables, ${rows.toLocaleString('en-NG')} rows, ${((Date.now() - started) / 1000).toFixed(1)} s → ${target.kind === 'dir' ? target.path : `${target.bucket}/${target.prefix}`}`
);
