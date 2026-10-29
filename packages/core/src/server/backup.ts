/**
 * Logical backups of the whole database, kept outside Render (Render's own backups last days, but
 * DETECK promises the audit trail for years). Every table in the public schema is copied as a
 * compressed CSV, all from one consistent snapshot, with a manifest of columns and row counts.
 * Restore rebuilds an empty database from the migrations, then loads the tables back.
 */
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { type Readable, type Writable } from 'node:stream';
import { createGunzip, createGzip } from 'node:zlib';
import {
	CompleteMultipartUploadCommand,
	CreateMultipartUploadCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
	UploadPartCommand
} from '@aws-sdk/client-s3';
import postgres from 'postgres';
import { runMigrations } from './db/migrate.ts';

export interface Manifest {
	createdAt: string;
	tables: { name: string; columns: string[]; rows: number }[];
}

export type BackupTarget =
	{ kind: 'dir'; path: string } | { kind: 's3'; client: S3Client; bucket: string; prefix: string };

const PART = 8 * 1024 * 1024;

/**
 * Moves every chunk from a source into a sink, waiting when the sink is full, then ends the sink.
 * Used instead of stream.pipeline, which leaves the database connection waiting after a large
 * COPY (postgres.js), so the next query never runs.
 */
async function pump(
	source: AsyncIterable<Buffer | string> | Iterable<Buffer | string>,
	sink: Writable
) {
	for await (const chunk of source)
		if (!sink.write(chunk)) await new Promise((resolve) => sink.once('drain', resolve));
	await new Promise<void>((resolve, reject) => {
		sink.once('error', reject);
		sink.end(resolve);
	});
}

/** Uploads a stream to S3/R2 in 8 MB parts, so a large table never sits in memory. */
async function uploadStream(
	client: S3Client,
	bucket: string,
	key: string,
	body: AsyncIterable<Buffer | string>
) {
	let buffer = Buffer.alloc(0);
	let uploadId: string | undefined;
	const parts: { ETag: string; PartNumber: number }[] = [];
	const flush = async (final: boolean) => {
		while (buffer.length >= PART || (final && buffer.length > 0)) {
			const chunk = buffer.subarray(0, PART);
			buffer = buffer.subarray(chunk.length);
			if (!uploadId && final && parts.length === 0 && buffer.length === 0) {
				await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: chunk }));
				return;
			}
			uploadId ??= (
				await client.send(new CreateMultipartUploadCommand({ Bucket: bucket, Key: key }))
			).UploadId;
			const number = parts.length + 1;
			const sent = await client.send(
				new UploadPartCommand({
					Bucket: bucket,
					Key: key,
					UploadId: uploadId,
					PartNumber: number,
					Body: chunk
				})
			);
			parts.push({ ETag: sent.ETag!, PartNumber: number });
		}
	};
	for await (const piece of body) {
		buffer = Buffer.concat([buffer, Buffer.from(piece)]);
		await flush(false);
	}
	await flush(true);
	if (uploadId)
		await client.send(
			new CompleteMultipartUploadCommand({
				Bucket: bucket,
				Key: key,
				UploadId: uploadId,
				MultipartUpload: { Parts: parts }
			})
		);
	else if (parts.length === 0 && buffer.length === 0)
		await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: Buffer.alloc(0) }));
}

/** Compresses a stream and writes it to the target. */
async function writeOut(
	target: BackupTarget,
	name: string,
	body: AsyncIterable<Buffer | string> | Iterable<Buffer | string>
) {
	const gzip = createGzip();
	let done: Promise<unknown>;
	if (target.kind === 'dir') {
		await mkdir(target.path, { recursive: true });
		const file = createWriteStream(join(target.path, name));
		done = pump(gzip, file);
	} else done = uploadStream(target.client, target.bucket, `${target.prefix}${name}`, gzip);
	await pump(body, gzip);
	await done;
}

async function readIn(target: BackupTarget, name: string): Promise<Readable> {
	if (target.kind === 'dir') return createReadStream(join(target.path, name));
	const object = await target.client.send(
		new GetObjectCommand({ Bucket: target.bucket, Key: `${target.prefix}${name}` })
	);
	return object.Body as Readable;
}

/** About 8 MB of table storage per COPY. */
const PAGES_PER_PIECE = 1024;

/**
 * A table as CSV, in pieces of a fixed number of storage pages (all from the transaction's
 * snapshot). Each piece is read off the connection at full speed before it's handed on: a COPY
 * stream that's read slowly leaves the postgres.js connection stuck, and a whole table at once
 * could be gigabytes.
 */
async function* tablePieces(tx: postgres.TransactionSql, name: string) {
	const [{ pages }] = await tx<{ pages: number }[]>`
		select ceil(pg_relation_size(${name}::regclass) / current_setting('block_size')::numeric)::int as pages`;
	for (let first = 0; first === 0 || first < pages; first += PAGES_PER_PIECE) {
		const range =
			pages > 0
				? `where ctid >= '(${first},0)'::tid and ctid < '(${first + PAGES_PER_PIECE},0)'::tid`
				: '';
		const copy = await tx
			.unsafe(
				`copy (select * from "${name}" ${range}) to stdout with (format csv, header ${first === 0})`
			)
			.readable();
		const chunks: Buffer[] = [];
		for await (const chunk of copy) chunks.push(chunk as Buffer);
		yield Buffer.concat(chunks);
	}
}

/** Copies every table, from one snapshot, to the target. Returns the manifest. */
export async function backupDatabase(url: string, target: BackupTarget): Promise<Manifest> {
	const sql = postgres(url, { max: 1, onnotice: () => {} });
	const manifest: Manifest = { createdAt: new Date().toISOString(), tables: [] };
	try {
		await sql.begin('isolation level repeatable read read only', async (tx) => {
			const tables = await tx<{ name: string }[]>`
				select table_name as name from information_schema.tables
				where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name`;
			for (const { name } of tables) {
				const columns = (
					await tx<{ column: string }[]>`
						select column_name as column from information_schema.columns
						where table_schema = 'public' and table_name = ${name} order by ordinal_position`
				).map((c) => c.column);
				const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n from ${tx(name)}`;
				await writeOut(target, `${name}.csv.gz`, tablePieces(tx, name));
				manifest.tables.push({ name, columns, rows: n });
			}
		});
	} finally {
		await sql.end({ timeout: 5 });
	}
	await writeOut(target, 'manifest.json.gz', [JSON.stringify(manifest, null, '\t')]);
	return manifest;
}

/** Tables in an order where every table comes after the tables it references. */
async function loadOrder(sql: postgres.Sql, names: string[]) {
	const edges = await sql<{ child: string; parent: string }[]>`
		select tc.table_name as child, ccu.table_name as parent
		from information_schema.table_constraints tc
		join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name
		where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'`;
	const ordered: string[] = [];
	const seen = new Set<string>();
	const visit = (name: string, path: Set<string>) => {
		if (seen.has(name) || path.has(name)) return;
		path.add(name);
		for (const e of edges)
			if (e.child === name && e.parent !== name && names.includes(e.parent)) visit(e.parent, path);
		seen.add(name);
		ordered.push(name);
	};
	for (const name of names) visit(name, new Set());
	return ordered;
}

/**
 * Loads a backup into an EMPTY database: builds the tables from the migrations, copies every
 * table back in a safe order, resets the id counters, then checks the row counts.
 */
export async function restoreDatabase(url: string, source: BackupTarget) {
	const chunks: Buffer[] = [];
	for await (const chunk of (await readIn(source, 'manifest.json.gz')).pipe(createGunzip()))
		chunks.push(chunk as Buffer);
	const manifest = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Manifest;
	const check = postgres(url, { max: 1, onnotice: () => {} });
	try {
		const [{ n }] = await check<{ n: number }[]>`
			select count(*)::int as n from information_schema.tables where table_schema = 'public'`;
		if (n > 0) throw new Error('The database to restore into must be empty (no tables in public).');
	} finally {
		await check.end({ timeout: 5 });
	}
	await runMigrations(url);
	const sql = postgres(url, { max: 1, onnotice: () => {} });
	try {
		const byName = new Map(manifest.tables.map((t) => [t.name, t]));
		for (const name of await loadOrder(sql, [...byName.keys()])) {
			const table = byName.get(name)!;
			if (table.rows === 0) continue;
			const columns = table.columns.map((c) => `"${c}"`).join(', ');
			const into = (await sql
				.unsafe(`copy "${name}" (${columns}) from stdin with (format csv, header)`)
				.writable()) as Writable;
			await pump((await readIn(source, `${name}.csv.gz`)).pipe(createGunzip()), into);
		}
		// Identity columns continue after the restored ids.
		const identities = await sql<{ table: string; column: string }[]>`
			select table_name as table, column_name as column from information_schema.columns
			where table_schema = 'public' and is_identity = 'YES'`;
		for (const { table, column } of identities)
			await sql.unsafe(
				`select setval(pg_get_serial_sequence('"${table}"', '${column}'), coalesce((select max("${column}") from "${table}"), 0) + 1, false)`
			);
		const wrong: string[] = [];
		for (const table of manifest.tables) {
			const [{ count }] = await sql<
				{ count: number }[]
			>`select count(*)::int as count from ${sql(table.name)}`;
			if (count !== table.rows) wrong.push(`${table.name}: ${count} rows, expected ${table.rows}`);
		}
		if (wrong.length) throw new Error(`Restore incomplete:\n- ${wrong.join('\n- ')}`);
		return manifest;
	} finally {
		await sql.end({ timeout: 5 });
	}
}
