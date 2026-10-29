// Seeds clearly fictional demo data (decisions-for-review B-08).
// Usage: pnpm db:seed [--packs 2000]   (extra random packs per batch)
//
// Demo GTINs use GS1's example prefix 0950600, so they never collide with
// real products. Company and product names come from the UI artifacts.
import { randomInt } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { configFromEnv } from '../src/server/config.ts';
import { initServerContext } from '../src/server/context.ts';
import { checkSecrets } from '../src/server/secrets-check.ts';
import { createDb } from '../src/server/db/client.ts';
import { serialExactHmac, serialKeyHmac, randomId } from '../src/server/crypto.ts';
import { putObject, storageKey } from '../src/server/storage.ts';
import {
	batch,
	custodyEvent,
	document,
	manufacturer,
	organization,
	pack,
	party,
	product
} from '../src/server/db/schema.ts';
import { gtinCheckDigit } from '../src/gs1/gtin.ts';

const extraIndex = process.argv.indexOf('--packs');
const extraPerBatch = extraIndex > -1 ? Number(process.argv[extraIndex + 1]) : 500;

const db = createDb(process.env.DATABASE_URL!, { max: 4 });
initServerContext({ db, config: configFromEnv(process.env) });
// Seeding with a different serial key than the database's would make the demo serials unfindable.
await checkSecrets();

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const randomSerial = () => Array.from({ length: 12 }, () => CROCKFORD[randomInt(32)]).join('');
const gtin = (n: number) => {
	const body = `0950600099${String(n).padStart(3, '0')}`;
	return body + gtinCheckDigit(body);
};

async function alreadySeeded() {
	const [row] = await db
		.select({ n: sql<number>`count(*)::int` })
		.from(manufacturer)
		.where(eq(manufacturer.companyName, 'Northbridge Pharma Ltd'));
	return row.n > 0;
}

async function makeManufacturer(
	name: string,
	state: string,
	town: string,
	status: 'live' | 'approved' | 'suspended'
) {
	const orgId = randomId();
	await db.insert(organization).values({
		id: orgId,
		name,
		slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
		createdAt: new Date()
	});
	const [m] = await db
		.insert(manufacturer)
		.values({
			organizationId: orgId,
			companyName: name,
			address: `Plot 1, Industrial Estate, ${town}`,
			state,
			factoryTown: town,
			nafdacCompanyReg: `DEMO-${randomInt(10000, 99999)}`,
			cacRc: `RC ${randomInt(100000, 999999)}`,
			contactName: 'Demo Contact',
			contactEmail: `data@${name.toLowerCase().replace(/[^a-z]+/g, '')}.example`,
			status,
			// The demo suspension happened after going live, so its checks show "can't confirm".
			statusBeforeSuspension: status === 'suspended' ? 'live' : null,
			wentLiveAt: status !== 'approved' ? new Date('2026-03-20') : null
		})
		.returning();
	// Every demo company has its NAFDAC certificate and signed agreement on file, as real ones
	// must before importing serials.
	for (const [kind, fileName] of [
		['nafdac_certificate', 'nafdac-certificate-demo.pdf'],
		['data_sharing_agreement', 'data-sharing-agreement-demo.pdf']
	] as const) {
		const bytes = new TextEncoder().encode(
			`%PDF-1.4\n% DETECK demo document: ${fileName}\n%%EOF\n`
		);
		const fileKey = storageKey('documents', m.id, fileName, randomId(6));
		await putObject(fileKey, bytes, 'application/pdf');
		await db.insert(document).values({
			manufacturerId: m.id,
			kind,
			fileKey,
			fileName,
			contentType: 'application/pdf',
			sizeBytes: bytes.length
		});
	}
	return m;
}

async function makeProduct(
	manufacturerId: string,
	n: number,
	v: Omit<typeof product.$inferInsert, 'manufacturerId' | 'gtin'>
) {
	const [p] = await db
		.insert(product)
		.values({ manufacturerId, gtin: gtin(n), ...v })
		.returning();
	return p;
}

async function makeBatch(productId: string, v: Omit<typeof batch.$inferInsert, 'productId'>) {
	const [b] = await db
		.insert(batch)
		.values({ productId, ...v })
		.returning();
	return b;
}

async function addPacks(p: { id: string; gtin: string }, b: { id: string }, serials: string[]) {
	const rows = serials.map((s) => ({
		productId: p.id,
		batchId: b.id,
		serialExactHmac: serialExactHmac(p.gtin, s),
		serialKeyHmac: serialKeyHmac(s)
	}));
	const ids: number[] = [];
	for (let i = 0; i < rows.length; i += 2000) {
		const inserted = await db
			.insert(pack)
			.values(rows.slice(i, i + 2000))
			.returning({ id: pack.id });
		ids.push(...inserted.map((r) => r.id));
	}
	return ids;
}

async function makeParty(
	name: string,
	role: (typeof party.$inferInsert)['role'],
	city: string,
	state: string,
	verified = false
) {
	const [row] = await db
		.insert(party)
		.values({
			name,
			normalisedName: name.toLowerCase(),
			role,
			city,
			state,
			verifiedAt: verified ? new Date() : null
		})
		.returning();
	return row;
}

async function seed() {
	if (await alreadySeeded()) {
		console.info('Demo data already present. Nothing to do.');
		return;
	}

	const northbridge = await makeManufacturer('Northbridge Pharma Ltd', 'Ogun', 'Ota', 'live');
	const sunvale = await makeManufacturer('Sunvale Laboratories', 'Lagos', 'Ikeja', 'live');
	const harbour = await makeManufacturer(
		'Harbour Drugs Ltd',
		'Rivers',
		'Port Harcourt',
		'suspended'
	);
	const meridian = await makeManufacturer('Meridian Life Sciences', 'Lagos', 'Lagos', 'approved');

	const curavyn = await makeProduct(northbridge.id, 1, {
		brandName: 'Curavyn',
		genericName: 'Paracetamol',
		strength: '500 mg',
		dosageForm: 'Tablets',
		packSize: '20 tablets',
		nafdacRegNo: 'A4-0000',
		serialHint: 'After SN, next to the barcode on the back of the pack'
	});
	const malarex = await makeProduct(northbridge.id, 2, {
		brandName: 'Malarex-AL',
		genericName: 'Artemether/Lumefantrine',
		strength: '80/480 mg',
		dosageForm: 'Tablets',
		packSize: '6 tablets',
		nafdacRegNo: 'A4-0001'
	});
	const paxolin = await makeProduct(northbridge.id, 3, {
		brandName: 'Paxolin Syrup',
		genericName: 'Ibuprofen',
		strength: '100 mg/5 ml',
		dosageForm: 'Suspension',
		packSize: '100 ml',
		nafdacRegNo: 'A4-0002'
	});
	const amoxinor = await makeProduct(sunvale.id, 4, {
		brandName: 'Amoxinor',
		genericName: 'Amoxicillin',
		strength: '500 mg',
		dosageForm: 'Capsules',
		packSize: '21 capsules',
		nafdacRegNo: 'B4-1203'
	});
	const harbourDrug = await makeProduct(harbour.id, 5, {
		brandName: 'Harbocef',
		genericName: 'Cefuroxime',
		strength: '500 mg',
		dosageForm: 'Tablets',
		packSize: '10 tablets',
		nafdacRegNo: 'C4-2210'
	});
	const meridianDrug = await makeProduct(meridian.id, 6, {
		brandName: 'Meritone',
		genericName: 'Metformin',
		strength: '500 mg',
		dosageForm: 'Tablets',
		packSize: '30 tablets',
		nafdacRegNo: 'D4-3301'
	});

	const nb2611 = await makeBatch(curavyn.id, {
		lot: 'NB-2611',
		manufactureDate: '2026-03-12',
		expiryDate: '2028-04-30',
		quantity: 420000
	});
	const nb2309 = await makeBatch(malarex.id, {
		lot: 'NB-2309',
		manufactureDate: '2023-04-10',
		expiryDate: '2025-04-30',
		quantity: 90000
	});
	const ml2604 = await makeBatch(malarex.id, {
		lot: 'ML-2604',
		manufactureDate: '2026-04-02',
		expiryDate: '2028-03-31',
		quantity: 120000
	});
	const px0412 = await makeBatch(paxolin.id, {
		lot: 'PX-0412',
		manufactureDate: '2026-02-05',
		expiryDate: '2028-02-29',
		quantity: 96000
	});
	const ax2602 = await makeBatch(amoxinor.id, {
		lot: 'AX-2602',
		manufactureDate: '2026-02-01',
		expiryDate: '2028-01-31',
		quantity: 80000,
		status: 'recalled',
		statusReason: 'Failed a dissolution test',
		statusSource: 'NAFDAC',
		statusEffectiveAt: '2026-09-15'
	});
	const hb2601 = await makeBatch(harbourDrug.id, {
		lot: 'HB-2601',
		manufactureDate: '2026-01-10',
		expiryDate: '2027-12-31'
	});
	const md2605 = await makeBatch(meridianDrug.id, {
		lot: 'MD-2605',
		manufactureDate: '2026-05-01',
		expiryDate: '2028-05-31'
	});

	const demo = {
		toRetail: '7K4M9QX2TB8D',
		endsAtDistributor: 'H2R5W8C1N6PZ',
		gap: 'G6A3P9J2Y5RN',
		batchLevel: 'Q9T3V6B2M8KD',
		noJourney: 'P4X7J2N9R5WC',
		expired: '3M8P41KD7Q2X',
		recalled: 'A7R2C9L4E1DX',
		suspended: 'S5U8S1P4N7DX',
		notLive: 'M3R1D1ANX9Q2',
		sharedSerial: 'TW1N2026PACK'
	};

	const [toRetail, endsAtDistributor, gapPack] = await addPacks(curavyn, nb2611, [
		demo.toRetail,
		demo.endsAtDistributor,
		demo.gap
	]);
	await addPacks(malarex, ml2604, [demo.batchLevel, demo.sharedSerial]);
	await addPacks(paxolin, px0412, [demo.noJourney, demo.sharedSerial]);
	await addPacks(malarex, nb2309, [demo.expired]);
	await addPacks(amoxinor, ax2602, [demo.recalled]);
	await addPacks(harbourDrug, hb2601, [demo.suspended]);
	await addPacks(meridianDrug, md2605, [demo.notLive]);

	for (const [p, b] of [
		[curavyn, nb2611],
		[malarex, ml2604],
		[paxolin, px0412],
		[amoxinor, ax2602]
	] as const) {
		await addPacks(p, b, Array.from({ length: extraPerBatch }, randomSerial));
	}

	const lakeside = await makeParty(
		'Lakeside Medical Supply',
		'distributor',
		'Ikeja',
		'Lagos',
		true
	);
	const northern = await makeParty(
		'Northern Distributors Ltd',
		'distributor',
		'Kano',
		'Kano',
		true
	);
	const kanoHub = await makeParty('Kano Wholesale Hub', 'wholesaler', 'Kano', 'Kano');
	const riverside = await makeParty(
		'Riverside Pharmacy',
		'pharmacy',
		'Bodija, Ibadan',
		'Oyo',
		true
	);
	const crescent = await makeParty('Crescent Hospital', 'hospital', 'Wuse', 'FCT');

	const ev = (v: Omit<typeof custodyEvent.$inferInsert, 'source'>) => ({
		source: 'manufacturer_import' as const,
		...v
	});
	await db.insert(custodyEvent).values([
		ev({
			manufacturerId: northbridge.id,
			level: 'pack',
			packId: toRetail,
			batchId: nb2611.id,
			toPartyId: lakeside.id,
			eventDate: '2026-03-28'
		}),
		ev({
			manufacturerId: northbridge.id,
			level: 'pack',
			packId: toRetail,
			batchId: nb2611.id,
			fromPartyId: lakeside.id,
			toPartyId: riverside.id,
			eventDate: '2026-04-09'
		}),
		ev({
			manufacturerId: northbridge.id,
			level: 'pack',
			packId: endsAtDistributor,
			batchId: nb2611.id,
			toPartyId: lakeside.id,
			eventDate: '2026-03-28'
		}),
		ev({
			manufacturerId: northbridge.id,
			level: 'pack',
			packId: gapPack,
			batchId: nb2611.id,
			toPartyId: northern.id,
			eventDate: '2026-03-30'
		}),
		ev({
			manufacturerId: northbridge.id,
			level: 'pack',
			packId: gapPack,
			batchId: nb2611.id,
			fromPartyId: kanoHub.id,
			toPartyId: crescent.id,
			eventDate: '2026-04-20'
		}),
		ev({
			manufacturerId: northbridge.id,
			level: 'batch',
			batchId: ml2604.id,
			toPartyId: lakeside.id,
			eventDate: '2026-04-15'
		}),
		ev({
			manufacturerId: northbridge.id,
			level: 'batch',
			batchId: ml2604.id,
			toPartyId: northern.id,
			eventDate: '2026-04-18'
		}),
		ev({
			manufacturerId: northbridge.id,
			level: 'batch',
			batchId: nb2309.id,
			toPartyId: lakeside.id,
			eventDate: '2023-05-02'
		})
	]);

	console.info('\nDemo data created. Try these serials on the checker:\n');
	const rows: [string, string][] = [
		['Valid, journey reaches a pharmacy', demo.toRetail],
		['Valid, records end at a distributor', demo.endsAtDistributor],
		['Valid, journey with a missing step', demo.gap],
		['Valid, batch-level journey', demo.batchLevel],
		['Valid, no journey recorded', demo.noJourney],
		['Valid but expired', demo.expired],
		['Recalled batch', demo.recalled],
		["Suspended manufacturer (can't confirm)", demo.suspended],
		['Manufacturer not live yet (unrecognised)', demo.notLive],
		['Serial on two products (asks for batch: ML-2604 or PX-0412)', demo.sharedSerial]
	];
	for (const [label, serial] of rows) console.info(`  ${serial}  ${label}`);
	console.info(
		`\n  Scanned code example: (01)${curavyn.gtin}(17)280430(10)NB-2611(21)${demo.toRetail}\n`
	);
}

try {
	await seed();
} finally {
	await db.$close();
}
