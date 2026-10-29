import { eq } from 'drizzle-orm';
import { ctx } from '@deteck/core/server/context.ts';
import { manufacturer } from '@deteck/core/server/db/schema.ts';
import { createApiImport, ImportError } from '@deteck/core/server/imports/engine.ts';
import type { ImportKind } from '@deteck/core/imports/fields.ts';
import { ApiProblem, body, caller, handler, json } from '#lib/server/api.ts';
import { editBlockedReason } from '#lib/server/guards.ts';

const KINDS: ImportKind[] = ['products', 'batches_serials', 'distribution'];

/**
 * POST /api/v1/manufacturer/imports
 * { "kind": "products" | "batches_serials" | "distribution", "rows": [ … ], "commit": true }
 * Checks the rows like an uploaded file; with "commit": true, imports the ready rows afterwards.
 */
export const POST = handler(async (event) => {
	const { key, actor } = await caller(event, 'manufacturer:write');
	const [m] = await ctx()
		.db.select()
		.from(manufacturer)
		.where(eq(manufacturer.id, key!.manufacturerId!));
	const blocked = editBlockedReason(m.status);
	if (blocked) throw new ApiProblem(403, 'not_allowed_now', blocked);
	const input = await body<{ kind?: string; rows?: unknown; commit?: boolean }>(event);
	if (!KINDS.includes(input.kind as ImportKind))
		throw new ApiProblem(400, 'invalid_kind', `"kind" must be one of ${KINDS.join(', ')}.`);
	try {
		const { job, existing } = await createApiImport(
			actor,
			m.id,
			input.kind as ImportKind,
			input.rows,
			{ commit: input.commit === true }
		);
		return json(
			{
				id: job.id,
				status: job.status,
				duplicate: existing,
				links: { self: `/api/v1/manufacturer/imports/${job.id}` }
			},
			existing ? 200 : 202
		);
	} catch (error) {
		if (error instanceof ImportError) throw new ApiProblem(400, 'invalid_import', error.message);
		throw error;
	}
});
