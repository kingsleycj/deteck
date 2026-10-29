// Restores a backup into an EMPTY database (a new Render database, or a local one for the
// monthly restore drill). It refuses to touch a database that already has tables.
//   DATABASE_URL=<empty database> node scripts/restore.ts --dir <backup folder>
//   DATABASE_URL=<empty database> node scripts/restore.ts --s3 backups/<date>/
// After restoring, start the app with the same SERIAL_HMAC_KEY and BETTER_AUTH_SECRET as the
// original: the app refuses to start otherwise (secrets-check.ts).
import { S3Client } from '@aws-sdk/client-s3';
import { restoreDatabase, type BackupTarget } from '../src/server/backup.ts';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const flag = (name: string) => {
	const i = process.argv.indexOf(`--${name}`);
	return i > -1 ? process.argv[i + 1] : undefined;
};

let source: BackupTarget;
if (flag('dir')) source = { kind: 'dir', path: flag('dir')! };
else if (flag('s3')) {
	const env = (key: string) => process.env[`BACKUP_${key}`] || process.env[key] || '';
	source = {
		kind: 's3',
		bucket: process.env.BACKUP_S3_BUCKET ?? '',
		prefix: flag('s3')!.replace(/\/?$/, '/'),
		client: new S3Client({
			region: env('S3_REGION') || 'auto',
			endpoint: env('S3_ENDPOINT') || undefined,
			credentials: {
				accessKeyId: env('S3_ACCESS_KEY_ID'),
				secretAccessKey: env('S3_SECRET_ACCESS_KEY')
			}
		})
	};
} else {
	console.error('Usage: node scripts/restore.ts --dir <backup folder> | --s3 backups/<date>/');
	process.exit(1);
}

const manifest = await restoreDatabase(url, source);
console.info(
	`Restored ${manifest.tables.length} tables from the backup of ${manifest.createdAt}. Every row count matches.`
);
