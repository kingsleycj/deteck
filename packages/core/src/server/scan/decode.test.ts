import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { prepareZXingModule, writeBarcode } from 'zxing-wasm/writer';
import { decodeCode } from './decode.ts';
import { parseGs1 } from '../../gs1/element-string.ts';

prepareZXingModule({
	overrides: { wasmBinary: readFileSync('node_modules/zxing-wasm/dist/writer/zxing_writer.wasm') },
	fireImmediately: false
});

/** A GS1 DataMatrix rendered as a slightly blurred, compressed phone-style JPEG. */
async function packPhoto(text: string) {
	const out = await writeBarcode(text, { format: 'DataMatrix', scale: 6 });
	const png = Buffer.from(await out.image!.arrayBuffer());
	return new Uint8Array(
		await sharp(png)
			.flatten({ background: '#ffffff' })
			.extend({ top: 80, bottom: 80, left: 120, right: 120, background: '#f3efe6' })
			.blur(0.6)
			.jpeg({ quality: 62 })
			.toBuffer()
	);
}

describe('server-side code reading', () => {
	it('decodes a GS1 DataMatrix from a photo into GTIN, serial, batch and expiry', async () => {
		const photo = await packPhoto(
			'\u001d0109506000990019217K4M9QX2TB8D\u001d10NB-2611\u001d17280430'
		);
		const text = await decodeCode(photo);
		expect(text).toBeTruthy();
		const parsed = parseGs1(text!);
		expect(parsed.ok && parsed.data).toMatchObject({
			gtin: '09506000990019',
			serial: '7K4M9QX2TB8D',
			lot: 'NB-2611',
			expiry: '2028-04-30'
		});
	});

	it('returns null when there is no code in the picture', async () => {
		const blank = new Uint8Array(
			await sharp({ create: { width: 400, height: 300, channels: 3, background: '#cccccc' } })
				.jpeg()
				.toBuffer()
		);
		expect(await decodeCode(blank)).toBeNull();
	});
});
