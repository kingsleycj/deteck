import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { ctx } from '@deteck/core/server/context.ts';
import { businessAccount, manufacturer, member } from '@deteck/core/server/db/schema.ts';
import { requireUser, staffRole } from '#lib/server/guards.ts';
import { findDocument } from '@deteck/core/server/manufacturers/documents.ts';
import { getObject } from '@deteck/core/server/storage.ts';

/** Company documents: DETECK staff, or members of the company (manufacturer or business) that owns them. */
export const GET: RequestHandler = async (event) => {
	const user = requireUser(event);
	const doc = await findDocument(event.params.id);
	if (!doc) error(404, 'Document not found.');
	if (!staffRole(user)) {
		const { db } = ctx();
		const [owner] = doc.manufacturerId
			? await db
					.select({ org: manufacturer.organizationId })
					.from(manufacturer)
					.where(eq(manufacturer.id, doc.manufacturerId))
			: doc.businessId
				? await db
						.select({ org: businessAccount.organizationId })
						.from(businessAccount)
						.where(eq(businessAccount.id, doc.businessId))
				: [];
		const memberships = await db
			.select({ org: member.organizationId })
			.from(member)
			.where(eq(member.userId, user.id));
		if (!owner || !memberships.some((x) => x.org === owner.org)) error(404, 'Document not found.');
	}
	const body = await getObject(doc.fileKey);
	return new Response(new Uint8Array(body), {
		headers: {
			'content-type': doc.contentType,
			'content-disposition': `inline; filename="${doc.fileName.replace(/[^A-Za-z0-9._-]/g, '_')}"`,
			'cache-control': 'private, no-store',
			'x-content-type-options': 'nosniff',
			// Images can't run anything, but say so; PDFs need the browser's viewer, which a sandbox
			// would block. Only PDF, JPEG and PNG (checked by content at upload) are ever stored.
			...(doc.contentType.startsWith('image/')
				? { 'content-security-policy': "sandbox; default-src 'none'; img-src 'self'" }
				: {})
		}
	});
};
