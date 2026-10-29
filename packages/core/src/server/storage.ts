import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client
} from '@aws-sdk/client-s3';
import { ctx } from './context.ts';

/**
 * File storage for uploads (documents, import files, packaging photos).
 * `local` writes under STORAGE_LOCAL_DIR for development; `s3` targets any
 * S3-compatible bucket (Cloudflare R2 in production, D-06).
 */

let s3: S3Client | undefined;

function client() {
	const storage = ctx().config.storage;
	if (storage.driver !== 's3') throw new Error('S3 storage is not configured');
	s3 ??= new S3Client({
		region: storage.region,
		endpoint: storage.endpoint,
		credentials: { accessKeyId: storage.accessKeyId, secretAccessKey: storage.secretAccessKey }
	});
	return { s3, bucket: storage.bucket };
}

function localPath(key: string) {
	const storage = ctx().config.storage;
	if (storage.driver !== 'local') throw new Error('Local storage is not configured');
	if (!/^[A-Za-z0-9/_.-]+$/.test(key) || key.includes('..'))
		throw new Error(`Invalid storage key: ${key}`);
	return join(resolve(storage.dir), key);
}

export async function putObject(key: string, body: Uint8Array, contentType: string): Promise<void> {
	if (ctx().config.storage.driver === 'local') {
		const path = localPath(key);
		await mkdir(dirname(path), { recursive: true });
		await writeFile(path, body);
		return;
	}
	const { s3, bucket } = client();
	await s3.send(
		new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType })
	);
}

export async function getObject(key: string): Promise<Buffer> {
	if (ctx().config.storage.driver === 'local') return readFile(localPath(key));
	const { s3, bucket } = client();
	const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
	return Buffer.from(await out.Body!.transformToByteArray());
}

export async function deleteObject(key: string): Promise<void> {
	if (ctx().config.storage.driver === 'local') {
		await rm(localPath(key), { force: true });
		return;
	}
	const { s3, bucket } = client();
	await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/** Builds a storage key like `documents/<manufacturer>/<random>-<safe-name>`. */
export function storageKey(prefix: string, owner: string, fileName: string, id: string): string {
	const safe =
		fileName
			.toLowerCase()
			.replace(/[^a-z0-9.]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(-60) || 'file';
	return `${prefix}/${owner}/${id}-${safe}`;
}
