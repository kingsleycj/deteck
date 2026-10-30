import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { totp } from './totp.ts';
import { packPhoto } from '@deteck/core/tests/helpers/photos.ts';
import { audit } from './axe.ts';

const state = JSON.parse(readFileSync('tests/e2e/.state.json', 'utf8')) as { staffInvite: string };
const secrets: Record<string, string> = {};

const STAFF = { email: 'ada@deteck.test', password: 'Staff-pass-2026!' };
const MAKER = { email: 'funke@meridian-e2e.test', password: 'Maker-pass-2026!' };

async function setUpTwoFactor(page: Page, email: string, password: string) {
	await expect(page).toHaveURL(/\/business\/setup-2fa/);
	await page.getByLabel('Confirm your password').fill(password);
	await page.getByRole('button', { name: 'Continue' }).click();
	const key = (await page.locator('.mono').first().textContent())!.trim();
	secrets[email] = key;
	await expect(page.locator('.backup-codes span')).toHaveCount(10);
	await page.getByLabel(/Enter the 6-digit code/).fill(totp(key));
	await page.getByRole('button', { name: 'Turn on two-step sign-in' }).click();
}

async function signIn(page: Page, email: string, password: string) {
	await page.goto('/business/sign-in');
	await page.getByLabel('Work email').fill(email);
	await page.getByLabel('Password', { exact: true }).fill(password);
	await page.getByRole('button', { name: 'Sign in' }).click();
}

async function signInWithCode(page: Page, email: string, password: string) {
	await signIn(page, email, password);
	await expect(page).toHaveURL(/\/business\/sign-in\/code/);
	await page.getByLabel('Sign-in code').fill(totp(secrets[email]));
	await page.getByRole('button', { name: 'Verify and sign in' }).click();
}

test.describe.configure({ mode: 'serial' });

test('a DETECK admin accepts the invite and must set up two-step sign-in', async ({ page }) => {
	await page.goto(state.staffInvite);
	await page.getByLabel('Password', { exact: true }).fill(STAFF.password);
	await page.getByLabel('Confirm password').fill(STAFF.password);
	await page.getByRole('button', { name: 'Create account' }).click();
	await expect(page.getByText('Your account is ready')).toBeVisible();
	await signIn(page, STAFF.email, STAFF.password);
	await setUpTwoFactor(page, STAFF.email, STAFF.password);
	await expect(page).toHaveURL(/\/console$/);
	await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
});

test('a state picked before the page script loads stays picked, and survives an error', async ({
	page
}) => {
	// Hold the script back, as a slow phone does, and pick the state in the meantime.
	await page.route(/\/_app\/immutable\/.*\.js$/, async (route) => {
		await new Promise((r) => setTimeout(r, 1500));
		await route.continue();
	});
	await page.goto('/business/register', { waitUntil: 'domcontentloaded' });
	const stateSelect = page.getByLabel('State');
	await stateSelect.selectOption('Kano');
	await expect(page.getByRole('button', { name: 'Show password' }).first()).toBeVisible();
	await expect(stateSelect).toHaveValue('Kano');
	await page.unrouteAll();

	// Sent with problems: the form comes back with the same state still chosen.
	await page.getByRole('button', { name: 'Submit application' }).click();
	await expect(page.getByText(/things? to fix/)).toBeVisible();
	await expect(stateSelect).toHaveValue('Kano');
});

test('a manufacturer registers and waits for review', async ({ page }) => {
	await page.goto('/business/register');
	await page.getByLabel('Manufacturer name').fill('Meridian E2E Life Sciences');
	await page.getByLabel('Address').fill('Plot 4, Industrial Avenue, Ikeja');
	await page.getByLabel('State').selectOption('Lagos');
	await page.getByLabel('NAFDAC company reg. no.').fill('NAF-E2E-0001');
	await page.getByLabel('Full name').fill('Funke Adeyemi');
	await page.getByLabel('Work email').fill(MAKER.email);
	await page.getByLabel('Password', { exact: true }).fill(MAKER.password);
	await page.getByLabel('Confirm password').fill(MAKER.password);
	await page.getByLabel('NAFDAC certificate').setInputFiles({
		name: 'nafdac-cert.pdf',
		mimeType: 'application/pdf',
		buffer: Buffer.from('%PDF-1.4 e2e')
	});
	await page.getByRole('checkbox', { name: /authorised to register/ }).check();
	await page.getByRole('button', { name: 'Submit application' }).click();
	await expect(page.getByText('Application received')).toBeVisible();

	await signIn(page, MAKER.email, MAKER.password);
	await setUpTwoFactor(page, MAKER.email, MAKER.password);
	await expect(page).toHaveURL(/\/workspace$/);
	await expect(page.getByText('Your application is with a DETECK reviewer.')).toBeVisible();
});

test('a manufacturer cannot open the DETECK console', async ({ page }) => {
	await signInWithCode(page, MAKER.email, MAKER.password);
	const response = await page.goto('/console');
	expect(response?.status()).toBe(403);
});

test('DETECK approves the application with a reason', async ({ page }) => {
	await signInWithCode(page, STAFF.email, STAFF.password);
	await page.goto('/console/applications');
	await page
		.getByRole('listitem')
		.filter({ hasText: 'Meridian E2E Life Sciences' })
		.getByRole('link', { name: 'Review' })
		.click();
	await page.getByLabel('Approve: they can add data').check();
	await page.getByLabel(/Reason/).fill('Certificate checked against the Green Book');
	await page.getByRole('button', { name: 'Save decision' }).click();
	await expect(page.getByText('Approved. The manufacturer has been emailed.')).toBeVisible();
});

test('the manufacturer sees the approval', async ({ page }) => {
	await signInWithCode(page, MAKER.email, MAKER.password);
	await expect(page).toHaveURL(/\/workspace$/);
	await expect(page.getByText('Approved · adding data')).toBeVisible();
});

// ---------------------------------------------------------------- Phase 4 and 5: data, go-live, console

const GTIN = '09506000998886';
const csvFile = (name: string, rows: string[][]) => ({
	name,
	mimeType: 'text/csv',
	buffer: Buffer.from(rows.map((r) => r.join(',')).join('\n'))
});

async function upload(page: Page, kind: RegExp, file: ReturnType<typeof csvFile>) {
	await page.goto('/workspace/import');
	await page.getByLabel(kind).check();
	await page.locator('input[name=file]').setInputFiles(file);
	await page.getByRole('button', { name: 'Upload and match columns' }).click();
	await page.getByRole('button', { name: 'Check the file' }).click();
	await expect(page.getByText('Ready to import')).toBeVisible({ timeout: 20_000 });
}

async function commit(page: Page) {
	await page.getByRole('button', { name: /^Import \d+ rows?$/ }).click();
	await expect(page.getByText('SUCCESS')).toBeVisible({ timeout: 20_000 });
}

test('the manufacturer imports drugs, serials and supply chain records', async ({ page }) => {
	await signInWithCode(page, MAKER.email, MAKER.password);
	await page.goto('/workspace/company');
	await page.getByLabel('Type of document').selectOption('data_sharing_agreement');
	await page.locator('input[name=file]').setInputFiles({
		name: 'agreement.pdf',
		mimeType: 'application/pdf',
		buffer: Buffer.from('%PDF-1.4 agreement')
	});
	await page.getByRole('button', { name: 'Upload' }).click();
	await expect(page.getByText('Document uploaded')).toBeVisible();

	await upload(
		page,
		/Drugs \(product list\)/,
		csvFile('drugs.csv', [
			['GTIN', 'Brand name', 'Generic name', 'Strength', 'Dosage form', 'Pack size', 'NAFDAC no'],
			[GTIN, 'Meritone', 'Metformin', '500 mg', 'Tablets', '30', 'E2E-0001']
		])
	);
	await commit(page);

	await upload(
		page,
		/Batches and serial numbers/,
		csvFile('serials.csv', [
			['GTIN', 'Batch number', 'Manufacture date', 'Expiry date', 'Serial number'],
			[GTIN, 'ME-2601', '2026-01-05', '2028-01-31', 'E2EPACK00001'],
			[GTIN, 'ME-2601', '2026-01-05', '2028-01-31', 'E2EPACK00002'],
			[GTIN, 'ME-2601', '2026-01-05', '2028-01-31', 'E2EPACK00002']
		])
	);
	await expect(page.getByText('Problems found')).toBeVisible();
	await commit(page);

	await upload(
		page,
		/Supply chain records/,
		csvFile('supply.csv', [
			[
				'GTIN',
				'Batch number',
				'Serial number',
				'Receiving business',
				'Role',
				'State',
				'City',
				'Date shipped'
			],
			[
				GTIN,
				'ME-2601',
				'E2EPACK00001',
				'Crescent Pharmacy',
				'Pharmacy',
				'FCT',
				'Wuse',
				'2026-02-10'
			]
		])
	);
	await commit(page);

	await page.goto('/workspace/review');
	await page.getByRole('button', { name: 'Submit for go-live review' }).click();
	// With items still to finish (not blocking), DETECK asks first, so the team can go back.
	const submitted = page.getByText('Submitted. A DETECK reviewer');
	const anyway = page.getByRole('button', { name: 'Submit anyway' });
	await expect(submitted.or(anyway)).toBeVisible();
	if (await anyway.isVisible()) {
		await expect(page.getByRole('link', { name: 'Go back and make changes' })).toBeVisible();
		await anyway.click();
	}
	await expect(submitted).toBeVisible();
});

test('DETECK reviews the data and approves go-live', async ({ page }) => {
	await signInWithCode(page, STAFF.email, STAFF.password);
	await page.goto('/console/applications');
	await page.getByRole('link', { name: 'Meridian E2E Life Sciences' }).last().click();
	await expect(page.getByText(/Spot check: 2 of 2 random serials/)).toBeVisible();
	await page.getByRole('button', { name: 'Approve and go live' }).click();
	await expect(page.getByText('Meridian E2E Life Sciences is live.')).toBeVisible();

	for (const path of [
		'/console',
		'/console/drugs?q=Meritone',
		'/console/businesses',
		'/console/signals',
		'/console/audit',
		'/console/team',
		'/console/manufacturers'
	]) {
		const response = await page.goto(path);
		expect(response?.status(), path).toBe(200);
		await audit(page, path);
	}
	await page.goto('/console/audit?range=all&q=Meridian');
	await expect(page.getByText('Approved Meridian E2E Life Sciences to go live')).toBeVisible();
	const download = page.waitForEvent('download');
	await page.getByRole('link', { name: 'Export CSV' }).click();
	expect((await download).suggestedFilename()).toMatch(/deteck-audit-.*\.csv/);
});

test('the manufacturer adds its packaging photos', async ({ page }) => {
	await signInWithCode(page, MAKER.email, MAKER.password);
	await page.goto('/workspace/packaging');
	await page.getByRole('link', { name: 'Add photos' }).click();
	await page.getByRole('button', { name: 'Start adding photos' }).click();

	const small = await packPhoto({ width: 800, height: 600 });
	await page
		.getByLabel('Photo of the front')
		.setInputFiles({ name: 'front.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(small.bytes) });
	await page
		.getByLabel('Photo of the front')
		.locator('xpath=ancestor::form[1]')
		.getByRole('button', { name: 'Upload' })
		.click();
	await expect(page.getByText(/Too small \(600 px\)/)).toBeVisible();

	const photo = await packPhoto({ width: 1400, height: 1100 });
	const sides = ['front', 'back', 'left side', 'right side', 'label (batch and expiry)'];
	for (const [i, side] of sides.entries()) {
		const input = page.getByLabel(`Photo of the ${side}`);
		await input.setInputFiles({
			name: 'side.jpg',
			mimeType: 'image/jpeg',
			buffer: Buffer.from(photo.bytes)
		});
		await input
			.locator('xpath=ancestor::form[1]')
			.getByRole('button', { name: /^(Upload|Replace)$/ })
			.click();
		await expect(page.getByText(/✓ Passed/)).toHaveCount(i + 1);
	}
	await page.getByRole('button', { name: 'Submit for the packaging check' }).click();
	await expect(page.getByRole('cell', { name: 'Ready' })).toBeVisible({ timeout: 20_000 });
	await audit(page, 'packaging version');
	for (const path of [
		'/workspace',
		'/workspace/products',
		'/workspace/import',
		'/workspace/packaging',
		'/workspace/company',
		'/workspace/team'
	]) {
		await page.goto(path);
		await audit(page, path);
	}
});

test('the public can now check an imported serial and see its journey', async ({ page }) => {
	await page.goto('/check');
	await page.getByLabel('Serial number').fill('e2epack00001');
	await page.getByRole('button', { name: 'Check medicine' }).click();
	await expect(
		page.getByText("This serial matches Meridian E2E Life Sciences's records for Meritone 500 mg.")
	).toBeVisible();
	await expect(
		page
			.getByText(/last recorded with Crescent Pharmacy/i)
			.filter({ visible: true })
			.first()
	).toBeVisible();
});

test('the public can check the packaging by photo (beta)', async ({ page }) => {
	await page.goto('/check');
	await page.getByLabel('Serial number').fill('E2EPACK00001');
	await page.getByRole('button', { name: 'Check medicine' }).click();
	await page
		.getByRole('link', { name: 'Verify further by scan' })
		.filter({ visible: true })
		.first()
		.click();
	await expect(page).toHaveURL(/\/scan\?from=/);
	const photo = await packPhoto();
	for (const side of ['front', 'back', 'label']) {
		await page.locator(`#photo-${side}`).setInputFiles({
			name: `${side}.jpg`,
			mimeType: 'image/jpeg',
			buffer: Buffer.from(photo.bytes)
		});
	}
	await expect(page.getByText('✓ Clear').filter({ visible: true })).toHaveCount(3);
	await page.getByRole('button', { name: 'Check the packaging' }).click();
	// No AI provider in e2e: the stub always answers "can't tell", never a guess.
	await expect(page.getByRole('heading', { name: "I can't tell from these photos" })).toBeVisible({
		timeout: 20_000
	});
	await expect(page.getByText(/can't test what's inside/)).toBeVisible();
	await expect(page.getByRole('link', { name: 'Retake the photos' })).toBeVisible();
});

const PHARMACY = { email: 'kola@kola-pharmacy-e2e.test', password: 'Pharm-pass-2026!' };

test('a pharmacy registers, DETECK approves it, and it confirms a delivery', async ({ page }) => {
	await page.goto('/business/register/pharmacy');
	await page.getByLabel('Business name').fill('Kola Pharmacy E2E');
	await page.getByLabel('Type of business').selectOption('pharmacy');
	await page.getByLabel('PCN premises licence no.').fill('PCN-E2E-0042');
	await page.getByLabel('Address').fill('12 Allen Avenue, Ikeja');
	await page.getByLabel('State').selectOption('Lagos');
	await page.getByLabel('Town or area').fill('Ikeja');
	await page.getByLabel('PCN premises licence', { exact: true }).setInputFiles({
		name: 'pcn-licence.pdf',
		mimeType: 'application/pdf',
		buffer: Buffer.from('%PDF-1.4 e2e')
	});
	await page.getByLabel('Full name').fill('Kola Bello');
	await page.getByLabel('Work email').fill(PHARMACY.email);
	await page.getByLabel('Password', { exact: true }).fill(PHARMACY.password);
	await page.getByLabel('Confirm password').fill(PHARMACY.password);
	await page.getByRole('checkbox', { name: /authorised to register this business/ }).check();
	await page.getByRole('button', { name: 'Submit application' }).click();
	await expect(page.getByText('Application received')).toBeVisible();
	await signIn(page, PHARMACY.email, PHARMACY.password);
	await setUpTwoFactor(page, PHARMACY.email, PHARMACY.password);
	await expect(page).toHaveURL(/\/portal/);

	// DETECK checks the licence and approves the account.
	await page.context().clearCookies();
	await signInWithCode(page, STAFF.email, STAFF.password);
	await page.goto('/console/business-accounts');
	await page.getByRole('link', { name: 'Kola Pharmacy E2E' }).click();
	await page.getByLabel('Approve').check();
	await page.getByLabel('Reason (required, sent to the business)').fill('PCN licence checked');
	await page.getByRole('button', { name: 'Save decision' }).click();
	await expect(page.getByText('Decision saved')).toBeVisible();

	// The pharmacy checks a delivery and confirms the Valid packs as received.
	await page.context().clearCookies();
	await signInWithCode(page, PHARMACY.email, PHARMACY.password);
	await page.goto('/portal/check');
	await page
		.getByLabel('Serials or scanned codes, one per line')
		.fill('E2EPACK00001\nNOTONDETECK1');
	await page.getByRole('button', { name: 'Check them' }).click();
	// The manufacturer's records say this pack went to another pharmacy: it isn't ticked for them,
	// and the row says why. Here the stock really was passed on, so the pharmacy ticks it.
	const received = page.getByRole('checkbox', { name: 'Received E2EPACK00001' });
	await expect(received).not.toBeChecked();
	await expect(page.getByText('Already recorded with Crescent Pharmacy')).toBeVisible();
	await received.check();
	await page.getByRole('button', { name: 'Confirm the ticked packs as received' }).click();
	await expect(page.getByText('Recorded 1 pack as received.')).toBeVisible();

	// The public journey now shows the pharmacy's confirmed receipt.
	await page.context().clearCookies();
	await page.goto('/check');
	await page.getByLabel('Serial number').fill('E2EPACK00001');
	await page.getByRole('button', { name: 'Check medicine' }).click();
	await page.goto(page.url() + '/journey');
	await expect(page.getByText('Kola Pharmacy E2E').first()).toBeVisible();
	await expect(page.getByText('Receipt confirmed by this business')).toBeVisible();
});
