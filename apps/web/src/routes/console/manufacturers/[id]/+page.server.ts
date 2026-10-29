import { error, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { ctx } from '@deteck/core/server/context.ts';
import { manufacturer } from '@deteck/core/server/db/schema.ts';
import { requireStaff } from '#lib/server/guards.ts';
import {
	COMPANY_DETAIL_FIELDS,
	reinstateManufacturer,
	ReviewError,
	suspendManufacturer,
	updateCompanyDetails,
	type DetailField
} from '@deteck/core/server/manufacturers/review.ts';
import {
	checksOfProducts,
	documentsFor,
	manufacturerCounts,
	productRows,
	recentImports
} from '@deteck/core/server/manufacturers/summary.ts';
import { listManufacturerTeam, resetTwoFactor, TeamError } from '@deteck/core/server/team.ts';

export const load: PageServerLoad = async (event) => {
	requireStaff(event);
	const [m] = await ctx()
		.db.select()
		.from(manufacturer)
		.where(eq(manufacturer.id, event.params.id));
	if (!m) error(404, 'Manufacturer not found.');
	const [counts, products, documents, imports, checks, team] = await Promise.all([
		manufacturerCounts(m.id),
		productRows(m.id),
		documentsFor(m.id),
		recentImports(m.id, 8),
		checksOfProducts(m.id),
		listManufacturerTeam(m.organizationId)
	]);
	return {
		m,
		counts,
		products,
		documents,
		imports,
		checks,
		team: team.members,
		detailFields: COMPANY_DETAIL_FIELDS,
		decided: event.url.searchParams.get('decided')
	};
};

export const actions: Actions = {
	reset2fa: async (event) => {
		const { actor } = requireStaff(event, ['admin']);
		const data = await event.request.formData();
		const [m] = await ctx()
			.db.select({ organizationId: manufacturer.organizationId })
			.from(manufacturer)
			.where(eq(manufacturer.id, event.params.id));
		if (!m) error(404, 'Manufacturer not found.');
		try {
			await resetTwoFactor(actor, {
				userId: String(data.get('userId')),
				organizationId: m.organizationId,
				manufacturerId: event.params.id
			});
		} catch (err) {
			if (err instanceof TeamError) return fail(400, { message: err.message });
			throw err;
		}
		return { done: "Two-step sign-in reset. They've been signed out and emailed." };
	},
	details: async (event) => {
		const { actor } = requireStaff(event, ['admin']);
		const data = await event.request.formData();
		const input = Object.fromEntries(
			COMPANY_DETAIL_FIELDS.map((f) => [f.key, String(data.get(f.key) ?? '')])
		) as Record<DetailField, string>;
		try {
			const changed = await updateCompanyDetails(
				actor,
				event.params.id,
				input,
				String(data.get('reason') ?? '')
			);
			return {
				done: changed
					? 'Company details saved and recorded in the audit trail.'
					: 'Nothing changed.'
			};
		} catch (err) {
			if (err instanceof ReviewError) return fail(400, { message: err.message });
			throw err;
		}
	},
	suspend: async (event) => {
		const { actor } = requireStaff(event, ['admin']);
		const data = await event.request.formData();
		try {
			await suspendManufacturer(actor, event.params.id, String(data.get('reason') ?? ''));
		} catch (err) {
			if (err instanceof ReviewError) return fail(400, { message: err.message });
			throw err;
		}
		return {
			done: 'Suspended. Checks of their serials now show "can\'t be confirmed right now". The manufacturer has been emailed.'
		};
	},
	reinstate: async (event) => {
		const { actor } = requireStaff(event, ['admin']);
		const data = await event.request.formData();
		try {
			await reinstateManufacturer(actor, event.params.id, String(data.get('reason') ?? ''));
		} catch (err) {
			if (err instanceof ReviewError) return fail(400, { message: err.message });
			throw err;
		}
		return { done: 'Reinstated. The manufacturer has been emailed.' };
	}
};
