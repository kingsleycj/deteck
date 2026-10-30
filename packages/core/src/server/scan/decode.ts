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

async function tryRead(image: Uint8Array, harder: boolean): Promise<string | null> {
	const results = await readBarcodes(image, {
		formats: ['DataMatrix', 'QRCode'],
		tryHarder: harder,
		tryRotate: harder,
		maxNumberOfSymbols: 1
	});
	const hit = results.find((r) => r.isValid && r.text);
	return hit ? hit.text : null;
}

/** Too many photos waiting to be read: the caller asks the person to try again shortly. */
export class DecodeBusyError extends Error {}

// The barcode reader runs on the main thread, so photos are read one at a time and only a few
// may wait: a burst of uploads can't stall every other request on the server.
const MAX_WAITING = 6;
let running = false;
const waiting: (() => void)[] = [];

async function oneAtATime<T>(task: () => Promise<T>): Promise<T> {
	if (running) {
		if (waiting.length >= MAX_WAITING) throw new DecodeBusyError('Too many photos waiting');
		await new Promise<void>((resolve) => waiting.push(resolve));
	}
	running = true;
	try {
		return await task();
	} finally {
		const next = waiting.shift();
		if (next) next();
		else running = false;
	}
}

/**
 * Returns the decoded text (a GS1 element string for DataMatrix), or null. The photo is never
 * handed to the barcode reader as uploaded: it is opened with the pixel cap and shrunk first, so
 * a hostile image can't tie up the server. A quick read comes first; the slower, more thorough
 * one only when that finds nothing. Throws DecodeBusyError when too many photos are waiting.
 */
export async function decodeCode(photo: Uint8Array): Promise<string | null> {
	prepare();
	if (!(await isAcceptableImage(photo))) return null;
	return oneAtATime(async () => {
		for (const [shrink, harder] of [
			[(img: ReturnType<typeof openImage>) => img, false],
			[(img: ReturnType<typeof openImage>) => img.grayscale().normalise(), true]
		] as const) {
			try {
				const prepared = await shrink(
					openImage(photo)
						.rotate()
						.resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
				)
					.png()
					.toBuffer();
				const text = await tryRead(new Uint8Array(prepared), harder);
				if (text) return text;
			} catch {
				// Try the next way.
			}
		}
		return null;
	});
}
