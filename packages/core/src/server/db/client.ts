import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.ts';

/** `statementTimeoutMs`: queries running longer are cancelled (used for the reporting pool). */
export function createDb(url: string, options: { max?: number; statementTimeoutMs?: number } = {}) {
	const client = postgres(url, {
		max: options.max ?? 10,
		onnotice: () => {},
		...(options.statementTimeoutMs
			? { connection: { statement_timeout: options.statementTimeoutMs } }
			: {})
	});
	const db = drizzle(client, { schema });
	return Object.assign(db, { $close: () => client.end({ timeout: 5 }) });
}

export type Db = ReturnType<typeof createDb>;
/** A Drizzle transaction, accepted anywhere a Db is. */
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export type DbOrTx = Db | Tx;
