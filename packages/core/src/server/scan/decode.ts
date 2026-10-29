/**
 * Reads a GS1 DataMatrix (or QR code) from a photo on the server, for phones
 * whose browser has no built-in barcode reader (D-04). The WebAssembly binary
 * is loaded from node_modules, never from a CDN.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isAcceptableImage, openImage } from './quality.ts';
import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader';

let prepared = false;

function wasmPath(): string {
	let dir = dirname(fileURLToPath(import.meta.resolve('zxing-wasm/reader')));
	for (let i = 0; i < 6; i++) {
		const candidate = join(dir, 'dist', 'reader', 'zxing_reader.wasm');
		if (existsSync(candidate)) return candidate;
		const sibling = join(dir, 'zxing_reader.wasm');
		if (existsSync(sibling)) return sibling;
		dir = dirname(dir);
	}
	throw new Error('zxing_reader.wasm not found in node_modules');
}

function prepare() {
	if (prepared) return;
	prepareZXingModule({
		overrides: { wasmBinary: readFileSync(wasmPath()) },
		fireImmediately: false
	});
	prepared = true;
}

async function tryRead(image: Uint8Array): Promise<string | null> {
	const results = await readBarcodes(image, {
		formats: ['DataMatrix', 'QRCode'],
		tryHarder: true,
		tryRotate: true,
		maxNumberOfSymbols: 1
	});
	const hit = results.find((r) => r.isValid && r.text);
	return hit ? hit.text : null;
}

/**
 * Returns the decoded text (a GS1 element string for DataMatrix), or null. The photo is never
 * handed to the barcode reader as uploaded: it is opened with the pixel cap and shrunk first, so
 * a hostile image can't tie up the server.
 */
export async function decodeCode(photo: Uint8Array): Promise<string | null> {
	prepare();
	if (!(await isAcceptableImage(photo))) return null;
	for (const variant of [
		(img: ReturnType<typeof openImage>) =>
			img.resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }),
		(img: ReturnType<typeof openImage>) =>
			img
				.resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
				.grayscale()
				.normalise()
	]) {
		try {
			const prepared = await variant(openImage(photo).rotate()).png().toBuffer();
			const text = await tryRead(new Uint8Array(prepared));
			if (text) return text;
		} catch {
			// Try the next variant.
		}
	}
	return null;
}
