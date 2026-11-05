import { expect, test } from '@playwright/test';

// The camera needs JavaScript; a fake one stands in for a webcam.
test.use({
	permissions: ['camera'],
	launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] }
});

test('the scan camera fits the screen: no scrolling to take or send the photos', async ({
	page
}, testInfo) => {
	// The most common laptop screen.
	if (testInfo.project.name === 'desktop') await page.setViewportSize({ width: 1366, height: 768 });
	await page.goto('/scan');
	// The first screen's "Scan the package" turns the camera on straight away.
	await page.getByRole('link', { name: 'Scan the package' }).click();
	await expect(page.getByRole('button', { name: 'Take photo' })).toBeInViewport({ ratio: 1 });
	if (testInfo.project.name === 'desktop')
		await expect(page.getByRole('button', { name: 'Check the packaging' })).toBeInViewport({
			ratio: 1
		});
});
