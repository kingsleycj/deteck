import { ctx } from '../../src/server/context.ts';
import { serialExactHmac, serialKeyHmac, randomId } from '../../src/server/crypto.ts';
import {
	batch,
	manufacturer,
	organization,
	pack,
	party,
	product,
	custodyEvent
} from '../../src/server/db/schema.ts';
import { gtinCheckDigit } from '../../src/gs1/gtin.ts';

type ManufacturerStatus = (typeof manufacturer.$inferInsert)['status'];

let gtinCounter = 1000;

/** A new valid GTIN-14 for each call. */
export function nextGtin(): string {
	const body = `0950600${String(gtinCounter++).padStart(6, '0')}`;
	return body + gtinCheckDigit(body);
}

export async function makeManufacturer(
	overrides: Partial<typeof manufacturer.$inferInsert> & { status?: ManufacturerStatus } = {}
) {
	const { db } = ctx();
	const orgId = randomId();
	const name = overrides.companyName ?? `Test Pharma ${orgId.slice(0, 5)}`;
	await db
		.insert(organization)
		.values({ id: orgId, name, slug: `org-${orgId.toLowerCase()}`, createdAt: new Date() });
	const [row] = await db
		.insert(manufacturer)
		.values({
			organizationId: orgId,
			companyName: name,
			address: '1 Industrial Avenue',
			state: 'Ogun',
			factoryTown: 'Ota',
			nafdacCompanyReg: 'NAFDAC-CO-0001',
			contactName: 'Test Contact',
			contactEmail: 'contact@example.com',
			status: 'live',
			...overrides
		})
		.returning();
	return row;
}

export async function makeProduct(
	manufacturerId: string,
	overrides: Partial<typeof product.$inferInsert> = {}
) {
	const [row] = await ctx()
		.db.insert(product)
		.values({
			manufacturerId,
			gtin: nextGtin(),
			brandName: 'Curavyn',
			genericName: 'Paracetamol',
			strength: '500 mg',
			dosageForm: 'Tablets',
			packSize: '20',
			nafdacRegNo: 'A4-0000',
			...overrides
		})
		.returning();
	return row;
}

export async function makeBatch(
	productId: string,
	overrides: Partial<typeof batch.$inferInsert> = {}
) {
	const [row] = await ctx()
		.db.insert(batch)
		.values({
			productId,
			lot: `NB-${Math.floor(Math.random() * 9000 + 1000)}`,
			manufactureDate: '2026-03-01',
			expiryDate: '2028-04-30',
			...overrides
		})
		.returning();
	return row;
}

export async function makePack(p: {
	productId: string;
	gtin: string;
	batchId: string;
	serial: string;
}) {
	const [row] = await ctx()
		.db.insert(pack)
		.values({
			productId: p.productId,
			batchId: p.batchId,
			serialExactHmac: serialExactHmac(p.gtin, p.serial),
			serialKeyHmac: serialKeyHmac(p.serial)
		})
		.returning();
	return row;
}

export async function makeParty(overrides: Partial<typeof party.$inferInsert> = {}) {
	const name = overrides.name ?? 'Lakeside Medical Supply';
	const [row] = await ctx()
		.db.insert(party)
		.values({
			name,
			normalisedName: name.toLowerCase(),
			role: 'distributor',
			state: 'Lagos',
			city: 'Ikeja',
			...overrides
		})
		.returning();
	return row;
}

export async function makeCustodyEvent(
	values: Omit<typeof custodyEvent.$inferInsert, 'source'> & { source?: 'manufacturer_import' }
) {
	const [row] = await ctx()
		.db.insert(custodyEvent)
		.values({ source: 'manufacturer_import', ...values })
		.returning();
	return row;
}

/** A complete live product with one batch and one pack. */
export async function makeLivePack(serial = '7K4M9QX2TB8D', options: { expiryDate?: string } = {}) {
	const m = await makeManufacturer({ companyName: 'Northbridge Pharma Ltd' });
	const p = await makeProduct(m.id);
	const b = await makeBatch(p.id, {
		lot: 'NB-2611',
		expiryDate: options.expiryDate ?? '2028-04-30'
	});
	const k = await makePack({ productId: p.id, gtin: p.gtin, batchId: b.id, serial });
	return { manufacturer: m, product: p, batch: b, pack: k, serial };
}
