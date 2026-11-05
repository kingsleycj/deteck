import { test, type Page } from '@playwright/test';
import { audit } from './axe.ts';

async function check(page: Page, serial: string) {
	await page.goto('/check');
	await page.getByLabel('Serial number').fill(serial);
	await page.getByRole('button', { name: 'Check medicine' }).click();
	await page.waitForURL(/\/r\//);
}

test('public pages have no serious accessibility problems', async ({ page }) => {
	for (const path of [
		'/',
		'/check',
		'/privacy',
		'/terms',
		'/scan',
		'/contact',
		'/business/sign-in',
		'/business/register'
	]) {
		await page.goto(path);
		await audit(page, path);
	}
});

test('every result state has no serious accessibility problems', async ({ page }) => {
	// Demo serials from scripts/seed.ts: valid, expired, recalled, suspended manufacturer, two
	// manufacturers sharing a serial (batch choice), and unrecognised.
	for (const serial of [
		'7K4M9QX2TB8D',
		'3M8P41KD7Q2X',
		'A7R2C9L4E1DX',
		'S5U8S1P4N7DX',
		'TW1N2026PACK',
		'ZZZZ8888ZZZZ'
	]) {
		await check(page, serial);
		await audit(page, `result for ${serial}`);
	}
	await check(page, '7K4M9QX2TB8D');
	await page.goto(page.url() + '/journey');
	await audit(page, 'journey');
	await page.goto('/check');
	await page.getByLabel('Serial number').fill('A4-1');
	await page.getByRole('button', { name: 'Check medicine' }).click();
	await audit(page, 'format error');
});
