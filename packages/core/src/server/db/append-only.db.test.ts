import { beforeEach, describe, expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { ctx } from '../context.ts';
import { auditLog, checkEvent, pack } from './schema.ts';
import { resetDb } from '../../../tests/helpers/db.ts';
import { makeLivePack } from '../../../tests/helpers/fixtures.ts';

/** Drizzle wraps driver errors; the trigger's message is on `cause`. */
function blockedByTrigger(error: unknown): boolean {
	const cause = (error as { cause?: { message?: string } }).cause;
	return /append-only/.test(cause?.message ?? '');
}

describe('append-only tables', () => {
	beforeEach(resetDb);

	it('blocks UPDATE and DELETE on packs', async () => {
		const { db } = ctx();
		const { pack: row } = await makeLivePack();
		await expect(
			db.update(pack).set({ importJobId: null }).where(eq(pack.id, row.id))
		).rejects.toSatisfy(blockedByTrigger);
		await expect(db.delete(pack).where(eq(pack.id, row.id))).rejects.toSatisfy(blockedByTrigger);
	});

	it('blocks UPDATE and DELETE on the audit log', async () => {
		const { db } = ctx();
		const [row] = await db
			.insert(auditLog)
			.values({
				actorLabel: 'Test',
				area: 'test',
				action: 'create',
				itemType: 'thing',
				summary: 'Created a thing'
			})
			.returning();
		await expect(
			db.update(auditLog).set({ summary: 'changed' }).where(eq(auditLog.id, row.id))
		).rejects.toSatisfy(blockedByTrigger);
		await expect(db.delete(auditLog).where(eq(auditLog.id, row.id))).rejects.toSatisfy(
			blockedByTrigger
		);
	});

	it('allows the retention purge to delete check events only inside a purge transaction', async () => {
		const { db } = ctx();
		await db.insert(checkEvent).values({ kind: 'serial', result: 'VALID' });
		await expect(db.delete(checkEvent)).rejects.toSatisfy(blockedByTrigger);
		await db.transaction(async (tx) => {
			await tx.execute(sql`SET LOCAL deteck.allow_purge = 'on'`);
			await tx.delete(checkEvent);
		});
		expect(await db.$count(checkEvent)).toBe(0);
	});
});
