/**
 * Screenshots for docs/reference/walkthrough.md. Run with `pnpm screenshots` (from the repo root).
 * It rebuilds the e2e database with demo data, then walks through each flow like a person would.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { packPhoto } from '@deteck/core/tests/helpers/photos.ts';
import { totp } from '../e2e/totp.ts';

const OUT = fileURLToPath(new URL('../../../../docs/reference/walkthrough/img/', import.meta.url));
const state = JSON.parse(readFileSync('tests/e2e/.state.json', 'utf8')) as { staffInvite: string };
const secrets: Record<string, string> = {};
const STAFF = { email: 'ada@deteck.test', password: 'Staff-pass-2026!' };
const MAKER = { email: 'funke@meridian-demo.test', password: 'Maker-pass-2026!' };
const PHARMACY = { email: 'kola@kola-pharmacy.test', password: 'Pharm-pass-2026!' };
const GTIN = '09506000998886';

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

async function shot(page: Page, name: string, options: { full?: boolean } = {}) {
	await page.waitForLoadState('networkidle');
	await page.screenshot({
		path: `${OUT}${name}.jpg`,
		type: 'jpeg',
		quality: 70,
		fullPage: options.full ?? false
	});
}

async function signIn(page: Page, email: string, password: string) {
	await page.goto('/business/sign-in');
	await page.getByLabel('Work email').fill(email);
	await page.getByLabel('Password', { exact: true }).fill(password);
	await page.getByRole('button', { name: 'Sign in' }).click();
}

async function setUpTwoFactor(page: Page, email: string, password: string, name?: string) {
	await expect(page).toHaveURL(/\/business\/setup-2fa/);
	await page.getByLabel('Confirm your password').fill(password);
	await page.getByRole('button', { name: 'Continue' }).click();
	secrets[email] = (await page.locator('.mono').first().textContent())!.trim();
	if (name) await shot(page, name);
	await page.getByLabel(/Enter the 6-digit code/).fill(totp(secrets[email]));
	await page.getByRole('button', { name: 'Turn on two-step sign-in' }).click();
}

async function signInWithCode(page: Page, email: string, password: string) {
	await page.context().clearCookies();
	await signIn(page, email, password);
	await expect(page).toHaveURL(/\/business\/sign-in\/code/);
	await page.getByLabel('Sign-in code').fill(totp(secrets[email]));
	await page.getByRole('button', { name: 'Verify and sign in' }).click();
}

async function check(page: Page, serial: string) {
	await page.goto('/check');
	await page.getByLabel('Serial number').fill(serial);
	await page.getByRole('button', { name: 'Check medicine' }).click();
}

const csvFile = (name: string, rows: string[][]) => ({
	name,
	mimeType: 'text/csv',
	buffer: Buffer.from(rows.map((r) => r.join(',')).join('\n'))
});

test.describe.configure({ mode: 'serial' });

test('the public checker', async ({ page }) => {
	await page.setViewportSize(DESKTOP);
	await page.goto('/');
	await shot(page, '01-landing');
	await page.setViewportSize(PHONE);
	await page.goto('/');
	await shot(page, '02-landing-phone');
	await page.goto('/check');
	await shot(page, '03-check');
	await check(page, '7k4m-9qx2 tb8d');
	await shot(page, '04-result-valid', { full: true });
	await page.goto(page.url() + '/journey');
	await shot(page, '05-journey', { full: true });
	await check(page, '3M8P41KD7Q2X');
	await shot(page, '06-result-expired');
	await check(page, 'A7R2C9L4E1DX');
	await shot(page, '07-result-recalled');
	await check(page, 'ZZZZ8888ZZZZ');
	await shot(page, '08-result-unrecognised', { full: true });
	await check(page, 'TW1N2026PACK');
	await shot(page, '09-batch-question');
	await check(page, 'A4-1234');
	await shot(page, '10-wrong-format');
	await page.goto('/scan');
	await shot(page, '11-scan');

	await check(page, '7K4M9QX2TB8D');
	await page.getByText('Tell me if this batch is recalled').click();
	await page.getByLabel('Email').fill('reader@example.com');
	await page.getByRole('checkbox').check();
	await page.getByRole('button', { name: 'Sign up' }).click();
	await shot(page, '12-alert-signed-up');

	await check(page, 'ZZZZ8888ZZZZ');
	await page.getByRole('link', { name: 'Report a suspected fake' }).click();
	await page.getByLabel('Name and strength on the pack').fill('Amoxil 500 mg capsules');
	await page.getByLabel('Pharmacy, shop or seller').fill('Corner Chemist, Yaba');
	await page.getByLabel('State').selectOption('Lagos');
	await shot(page, '13-report', { full: true });
	await page.getByRole('button', { name: 'Send the report' }).click();
	await shot(page, '14-report-sent');

	await page.goto('/check?lang=ha');
	await page.locator('.lang-menu summary').click();
	await shot(page, '15-language-menu');
	await page.keyboard.press('Escape');
	await page.goto('/check?lang=ha');
	await page.getByRole('textbox').first().fill('7K4M9QX2TB8D');
	await page.locator('form[data-check-form] button[type=submit]').click();
	await shot(page, '16-result-hausa', { full: true });
	await page.goto('/check?lang=en');
});

test('a manufacturer joins and goes live', async ({ page }) => {
	await page.setViewportSize(DESKTOP);
	await page.goto(state.staffInvite);
	await page.getByLabel('Password', { exact: true }).fill(STAFF.password);
	await page.getByLabel('Confirm password').fill(STAFF.password);
	await page.getByRole('button', { name: 'Create account' }).click();
	await signIn(page, STAFF.email, STAFF.password);
	await setUpTwoFactor(page, STAFF.email, STAFF.password, '17-two-step-setup');
	await expect(page).toHaveURL(/\/console$/);
	await shot(page, '18-console-overview', { full: true });

	await page.context().clearCookies();
	await page.goto('/business/register');
	await page.getByLabel('Manufacturer name').fill('Meridian Demo Life Sciences');
	await page.getByLabel('Address').fill('Plot 4, Industrial Avenue, Ikeja');
	await page.getByLabel('State').selectOption('Lagos');
	await page.getByLabel('NAFDAC company reg. no.').fill('NAF-DEMO-0001');
	await page.getByLabel('Full name').fill('Funke Adeyemi');
	await page.getByLabel('Work email').fill(MAKER.email);
	await page.getByLabel('Password', { exact: true }).fill(MAKER.password);
	await page.getByLabel('Confirm password').fill(MAKER.password);
	await page.getByLabel('NAFDAC certificate').setInputFiles({
		name: 'nafdac-cert.pdf',
		mimeType: 'application/pdf',
		buffer: Buffer.from('%PDF-1.4 demo')
	});
	await page.getByRole('checkbox', { name: /authorised to register/ }).check();
	await shot(page, '19-register-manufacturer', { full: true });
	await page.getByRole('button', { name: 'Submit application' }).click();
	await signIn(page, MAKER.email, MAKER.password);
	await setUpTwoFactor(page, MAKER.email, MAKER.password);
	await shot(page, '20-workspace-pending');

	await signInWithCode(page, STAFF.email, STAFF.password);
	await page.goto('/console/applications');
	await page
		.getByRole('listitem')
		.filter({ hasText: 'Meridian Demo Life Sciences' })
		.getByRole('link', { name: 'Review' })
		.click();
	await page.getByLabel('Approve: they can add data').check();
	await page.getByLabel(/Reason/).fill('Certificate checked against the Green Book');
	await shot(page, '21-application-review', { full: true });
	await page.getByRole('button', { name: 'Save decision' }).click();

	await signInWithCode(page, MAKER.email, MAKER.password);
	await page.goto('/workspace/company');
	await page.getByLabel('Type of document').selectOption('data_sharing_agreement');
	await page.locator('input[name=file]').setInputFiles({
		name: 'agreement.pdf',
		mimeType: 'application/pdf',
		buffer: Buffer.from('%PDF-1.4 agreement')
	});
	await page.getByRole('button', { name: 'Upload' }).click();

	const imports: [RegExp, ReturnType<typeof csvFile>, string | null][] = [
		[
			/Drugs \(product list\)/,
			csvFile('drugs.csv', [
				['GTIN', 'Brand name', 'Generic name', 'Strength', 'Dosage form', 'Pack size', 'NAFDAC no'],
				[GTIN, 'Meritone', 'Metformin', '500 mg', 'Tablets', '30', 'A4-9001']
			]),
			'22-import-match'
		],
		[
			/Batches and serial numbers/,
			csvFile('serials.csv', [
				['GTIN', 'Batch number', 'Manufacture date', 'Expiry date', 'Serial number'],
				[GTIN, 'ME-2601', '2026-01-05', '2028-01-31', 'DEMOPACK0001'],
				[GTIN, 'ME-2601', '2026-01-05', '2028-01-31', 'DEMOPACK0002'],
				[GTIN, 'ME-2601', '2026-01-05', '2028-01-31', 'DEMOPACK0002']
			]),
			'23-import-checked'
		],
		[
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
					'DEMOPACK0001',
					'Crescent Pharmacy',
					'Pharmacy',
					'FCT',
					'Wuse',
					'2026-02-10'
				]
			]),
			null
		]
	];
	for (const [kind, file, name] of imports) {
		await page.goto('/workspace/import');
		await page.getByLabel(kind).check();
		await page.locator('input[name=file]').setInputFiles(file);
		await page.getByRole('button', { name: 'Upload and match columns' }).click();
		if (name === '22-import-match') await shot(page, name, { full: true });
		await page.getByRole('button', { name: 'Check the file' }).click();
		await expect(page.getByText('Ready to import')).toBeVisible({ timeout: 20_000 });
		if (name === '23-import-checked') await shot(page, name, { full: true });
		await page.getByRole('button', { name: /^Import \d+ rows?$/ }).click();
		await expect(page.getByText('SUCCESS')).toBeVisible({ timeout: 20_000 });
	}
	await shot(page, '24-import-committed');
	await page.goto('/workspace/review');
	await shot(page, '25-golive-checklist', { full: true });
	await page.getByRole('button', { name: 'Submit for go-live review' }).click();
	// Items still to finish (not blocking): DETECK asks first.
	await page.getByRole('button', { name: 'Submit anyway' }).waitFor();
	await shot(page, '25b-golive-confirm');
	await page.getByRole('button', { name: 'Submit anyway' }).click();
	await expect(page.getByText('Submitted. A DETECK reviewer')).toBeVisible();

	await signInWithCode(page, STAFF.email, STAFF.password);
	await page.goto('/console/applications');
	await page.getByRole('link', { name: 'Meridian Demo Life Sciences' }).last().click();
	await shot(page, '26-golive-review', { full: true });
	await page.getByRole('button', { name: 'Approve and go live' }).click();
	await expect(page.getByText('Meridian Demo Life Sciences is live.')).toBeVisible();

	await signInWithCode(page, MAKER.email, MAKER.password);
	await page.goto('/workspace/developers');
	await shot(page, '27-workspace-developers', { full: true });
	await page.goto('/workspace/team');
	await shot(page, '28-workspace-team');

	await page.goto('/workspace/packaging');
	await page.getByRole('link', { name: 'Add photos' }).click();
	await page.getByRole('button', { name: 'Start adding photos' }).click();
	const photo = await packPhoto({ width: 1400, height: 1100 });
	for (const side of ['front', 'back', 'label (batch and expiry)']) {
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
		await expect(page.getByText(/✓ Passed/).last()).toBeVisible();
	}
	await shot(page, '29-packaging-photos', { full: true });
	await page.getByRole('button', { name: 'Submit for the packaging check' }).click();
	await expect(page.getByRole('cell', { name: 'Ready' })).toBeVisible({ timeout: 20_000 });
});

test('the public packaging check (beta)', async ({ page }) => {
	await page.context().clearCookies();
	await page.setViewportSize(PHONE);
	await check(page, 'DEMOPACK0001');
	await page
		.getByRole('link', { name: 'Verify further by scan' })
		.filter({ visible: true })
		.first()
		.click();
	await page.getByRole('link', { name: /Upload 3 photos of the pack/ }).click();
	const photo = await packPhoto();
	for (const side of ['front', 'back', 'label']) {
		await page.locator(`#photo-${side}`).setInputFiles({
			name: `${side}.jpg`,
			mimeType: 'image/jpeg',
			buffer: Buffer.from(photo.bytes)
		});
	}
	await page.getByRole('checkbox').check();
	await expect(page.getByText('✓ Clear').filter({ visible: true })).toHaveCount(3);
	await shot(page, '30-packaging-photos-public', { full: true });
	await page.getByRole('button', { name: 'Check the packaging' }).click();
	await expect(page.getByRole('heading', { name: "I can't tell from these photos" })).toBeVisible({
		timeout: 20_000
	});
	await shot(page, '31-packaging-result', { full: true });
});

test('a pharmacy confirms a delivery', async ({ page }) => {
	await page.context().clearCookies();
	await page.setViewportSize(DESKTOP);
	await page.goto('/business/register/pharmacy');
	await page.getByLabel('Business name').fill('Kola Pharmacy');
	await page.getByLabel('Type of business').selectOption('pharmacy');
	await page.getByLabel('PCN premises licence no.').fill('PCN-DEMO-0042');
	await page.getByLabel('Address').fill('12 Allen Avenue, Ikeja');
	await page.getByLabel('State').selectOption('Lagos');
	await page.getByLabel('Town or area').fill('Ikeja');
	await page.getByLabel('PCN premises licence', { exact: true }).setInputFiles({
		name: 'pcn.pdf',
		mimeType: 'application/pdf',
		buffer: Buffer.from('%PDF-1.4 demo')
	});
	await page.getByLabel('Full name').fill('Kola Bello');
	await page.getByLabel('Work email').fill(PHARMACY.email);
	await page.getByLabel('Password', { exact: true }).fill(PHARMACY.password);
	await page.getByLabel('Confirm password').fill(PHARMACY.password);
	await page.getByRole('checkbox', { name: /authorised to register this business/ }).check();
	await shot(page, '32-register-pharmacy', { full: true });
	await page.getByRole('button', { name: 'Submit application' }).click();
	await signIn(page, PHARMACY.email, PHARMACY.password);
	await setUpTwoFactor(page, PHARMACY.email, PHARMACY.password);

	await signInWithCode(page, STAFF.email, STAFF.password);
	await page.goto('/console/business-accounts');
	await page.getByRole('link', { name: 'Kola Pharmacy' }).click();
	await page.getByLabel('Approve').check();
	await page.getByLabel('Reason (required, sent to the business)').fill('PCN licence checked');
	await shot(page, '33-console-pharmacy-review', { full: true });
	await page.getByRole('button', { name: 'Save decision' }).click();

	await signInWithCode(page, PHARMACY.email, PHARMACY.password);
	await shot(page, '34-portal-home');
	await page.goto('/portal/check');
	await page
		.getByLabel('Serials or scanned codes, one per line')
		.fill('DEMOPACK0001\n7K4M9QX2TB8D\nA7R2C9L4E1DX\nNOTONDETECK1');
	await page.getByRole('button', { name: 'Check them' }).click();
	await shot(page, '35-portal-check', { full: true });
	await page.getByRole('button', { name: 'Confirm the ticked packs as received' }).click();
	await shot(page, '36-portal-received');

	await page.context().clearCookies();
	await page.setViewportSize(PHONE);
	await check(page, 'DEMOPACK0001');
	await page.goto(page.url() + '/journey');
	await shot(page, '37-journey-confirmed', { full: true });
});

test('the DETECK console', async ({ page }) => {
	await page.setViewportSize(DESKTOP);
	await signInWithCode(page, STAFF.email, STAFF.password);
	await page.goto('/console/reports');
	await shot(page, '38-console-reports');
	await page
		.getByRole('link', { name: /Amoxil/ })
		.first()
		.click();
	await shot(page, '39-console-report', { full: true });
	await page.goto('/console/drugs?q=Meritone');
	await page
		.getByRole('link', { name: /Meritone/ })
		.first()
		.click();
	await page.getByRole('link', { name: 'ME-2601' }).click();
	await shot(page, '40-console-corrections', { full: true });
	await page.goto('/console/scans?show=all');
	await shot(page, '41-console-scans', { full: true });
	await page.goto('/console/team');
	await shot(page, '42-console-team');
	await page.goto('/console/audit');
	await shot(page, '43-console-audit');
	await page.goto('/console/api-keys');
	await shot(page, '44-console-api-keys');
	await page.context().clearCookies();
	await page.goto('/developers');
	await shot(page, '45-developers');
	await signIn(page, MAKER.email, MAKER.password);
	await shot(page, '46-sign-in-code');
});
