import { expect, test } from '@playwright/test';
import { ha } from '@deteck/core/messages/dict/ha.ts';

// The public checker must work with JavaScript turned off (F-04, D-05).
test.use({ javaScriptEnabled: false });

test('a typed serial returns Valid with its journey, without JavaScript', async ({ page }) => {
	await page.goto('/check');
	await expect(page.getByRole('heading', { name: 'Check your medicine' })).toBeVisible();
	await page.getByLabel('Serial number').fill('7k4m-9qx2 tb8d');
	await page.getByRole('button', { name: 'Check medicine' }).click();
	await expect(page).toHaveURL(/\/r\/[A-Za-z0-9_-]+$/);
	await expect(page.getByText('VALID', { exact: true })).toBeVisible();
	await expect(
		page.getByText("This serial matches Northbridge Pharma Ltd's records for Curavyn 500 mg.")
	).toBeVisible();
	expect(page.url()).not.toContain('7K4M');

	const body = await page.content();
	expect(body).not.toMatch(/\bsafe\b|100%|genuine/i);

	await page.goto(page.url() + '/journey');
	await expect(page.getByText('LAST RECORDED HOLDER', { exact: false })).toBeVisible();
	await expect(page.getByText('Riverside Pharmacy').first()).toBeVisible();
});

test('a wrong format keeps the typing and explains the problem', async ({ page }) => {
	await page.goto('/check');
	await page.getByLabel('Serial number').fill('A4-1234');
	await page.getByRole('button', { name: 'Check medicine' }).click();
	await expect(page.getByRole('alert')).toContainText('NAFDAC registration number');
	await expect(page.getByLabel('Serial number')).toHaveValue('A4-1234');
});

test('an unknown serial is Unrecognised with a calm next step', async ({ page }) => {
	await page.goto('/check');
	await page.getByLabel('Serial number').fill('ZZZZ9999ZZZZ');
	await page.getByRole('button', { name: 'Check medicine' }).click();
	await expect(page.getByText('UNRECOGNISED', { exact: true })).toBeVisible();
	await expect(page.getByText('Ask a pharmacist before you use it.')).toBeVisible();
});

test('a recalled batch overrides Valid', async ({ page }) => {
	await page.goto('/check');
	await page.getByLabel('Serial number').fill('A7R2C9L4E1DX');
	await page.getByRole('button', { name: 'Check medicine' }).click();
	await expect(page.getByRole('heading', { name: 'This batch has been recalled' })).toBeVisible();
});

test('the link opens on the landing page, which leads to the checker', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Verify Before You Trust.' })).toBeVisible();
	// The landing page's own form checks a serial straight away.
	await page.getByLabel('Serial number on the pack').fill('7K4M9QX2TB8D');
	await page.getByRole('button', { name: 'Check it' }).click();
	await expect(page).toHaveURL(/\/r\/[A-Za-z0-9_-]+$/);
	await expect(page.getByText('VALID', { exact: true })).toBeVisible();
	await page.goto('/');
	await page.getByRole('link', { name: 'Check a medicine' }).first().click();
	await expect(page.getByRole('heading', { name: 'Check your medicine' })).toBeVisible();
});

test('the contact page sends a message to the DETECK team', async ({ page }) => {
	// "Partner with us" on the landing page opens it with the subject chosen.
	await page.goto('/contact?topic=partnering');
	await expect(page.getByRole('heading', { name: 'Contact us', level: 1 })).toBeVisible();
	await expect(page.getByLabel('What is it about?')).toHaveValue('partnering');
	// Sent empty: the form comes back saying what to fix.
	await page.getByRole('button', { name: 'Send message' }).click();
	await expect(page.getByRole('alert')).toHaveText('Tell us your name.');
	await page.getByLabel('Full name').fill('Ada Obi');
	await page.getByLabel('Email').fill('ada@example.com');
	await page
		.getByLabel('Message', { exact: true })
		.fill('We would like to share our product records with DETECK.');
	await page.getByRole('button', { name: 'Send message' }).click();
	await expect(
		page.getByRole('heading', { name: 'Thank you. Your message is with the DETECK team.' })
	).toBeVisible();
});

test('a visitor can switch language, and results follow it', async ({ page }) => {
	await page.goto(`/check?lang=ha`);
	await expect(page.locator('html')).toHaveAttribute('lang', 'ha');
	await expect(page.getByRole('heading', { name: ha.check.title })).toBeVisible();
	// The translations were approved on 5 Nov 2026, so no "draft" note any more.
	await expect(page.getByText(ha.common.draftNotice)).toHaveCount(0);
	// The choice is remembered, so the result is in Hausa too.
	await page.getByLabel(ha.check.label).fill('ZZZZ9999ZZZZ');
	await page.getByRole('button', { name: ha.check.submit }).click();
	await expect(page.getByText(ha.result.unrecognised.badge, { exact: true })).toBeVisible();
	// Back to English from the language menu (a plain form, no JavaScript).
	await page.goto('/check');
	await page.locator('.lang-menu summary').click();
	await page.getByRole('button', { name: 'English' }).click();
	await expect(page.getByRole('heading', { name: 'Check your medicine' })).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('a suspected fake can be reported from a warning result', async ({ page }) => {
	await page.goto('/check');
	await page.getByLabel('Serial number').fill('ZZZZ9999ZZZZ');
	await page.getByRole('button', { name: 'Check medicine' }).click();
	await page.getByRole('link', { name: 'Report a suspected fake' }).click();
	await page.getByLabel('Name and strength on the pack').fill('Amoxil 500 mg capsules');
	await page.getByLabel('Pharmacy, shop or seller').fill('Corner Chemist, Yaba');
	await page.getByLabel('State').selectOption('Lagos');
	await page.getByRole('button', { name: 'Send the report' }).click();
	await expect(
		page.getByRole('heading', { name: 'Thank you. Your report is with DETECK.' })
	).toBeVisible();
});

test('the public API checks a serial and answers errors in one shape', async ({ request }) => {
	const ok = await request.post('/api/v1/checks', { data: { serial: '7K4M 9QX2 TB8D' } });
	expect(ok.status()).toBe(201);
	const body = await ok.json();
	expect(body.result.code).toBe('VALID');
	expect(body.summary.language).toBe('en');
	expect(JSON.stringify(body)).not.toContain('7K4M9QX2TB8D');

	const yo = await request.post('/api/v1/checks?lang=yo', { data: { serial: 'ZZZZ9999ZZZZ' } });
	expect((await yo.json()).summary.language).toBe('yo');

	const badKey = await request.post('/api/v1/checks', {
		data: { serial: '7K4M9QX2TB8D' },
		headers: { authorization: 'Bearer dtk_live_nope_nope' }
	});
	expect(badKey.status()).toBe(401);
	expect((await badKey.json()).error.code).toBe('invalid_key');
});
