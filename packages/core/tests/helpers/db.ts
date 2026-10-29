import { sql } from 'drizzle-orm';
import { ctx } from '../../src/server/context.ts';

/** Empties every table. TRUNCATE does not fire the append-only row triggers. */
export async function resetDb() {
	const { db } = ctx();
	const rows = await db.execute<{ tablename: string }>(
		sql`select tablename from pg_tables where schemaname = 'public'`
	);
	const names = rows.map((r) => `"${r.tablename}"`).join(', ');
	if (names) await db.execute(sql.raw(`TRUNCATE ${names} RESTART IDENTITY CASCADE`));
}
