/**
 * Shrinks a photo on the phone before upload (PRD US-04.1: under 500 KB;
 * D-10 target about 250 KB). Also strips metadata such as location, because
 * the canvas re-encode keeps pixels only.
 */
export async function shrinkPhoto(
	source: Blob,
	options: { maxEdge?: number; targetBytes?: number } = {}
): Promise<Blob> {
	const maxEdge = options.maxEdge ?? 1280;
	const target = options.targetBytes ?? 250_000;
	const bitmap = await createImageBitmap(source, {
		imageOrientation: 'from-image'
	} as ImageBitmapOptions);
	const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
	const canvas = document.createElement('canvas');
	canvas.width = Math.round(bitmap.width * scale);
	canvas.height = Math.round(bitmap.height * scale);
	const context = canvas.getContext('2d')!;
	context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	bitmap.close();
	let quality = 0.85;
	let blob = await toBlob(canvas, quality);
	while (blob.size > target && quality > 0.45) {
		quality -= 0.1;
		blob = await toBlob(canvas, quality);
	}
	return blob;
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
	return new Promise((resolve, reject) =>
		canvas.toBlob(
			(b) => (b ? resolve(b) : reject(new Error('encode failed'))),
			'image/jpeg',
			quality
		)
	);
}

/** Puts a blob into a file input so a normal form submit sends it. */
export function setInputFile(input: HTMLInputElement, blob: Blob, name: string) {
	const transfer = new DataTransfer();
	transfer.items.add(new File([blob], name, { type: blob.type || 'image/jpeg' }));
	input.files = transfer.files;
}

/**
 * A rough sharpness and exposure check (on-phone quality gate, D-10): variance
 * of a Laplacian filter over a small grey copy, plus mean brightness.
 */
export async function photoQuality(
	source: Blob
): Promise<{ sharpness: number; brightness: number }> {
	const bitmap = await createImageBitmap(source);
	const w = 320;
	const h = Math.max(1, Math.round((bitmap.height / bitmap.width) * w));
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const context = canvas.getContext('2d', { willReadFrequently: true })!;
	context.drawImage(bitmap, 0, 0, w, h);
	bitmap.close();
	const { data } = context.getImageData(0, 0, w, h);
	const grey = new Float32Array(w * h);
	let sum = 0;
	for (let i = 0; i < w * h; i++) {
		const g = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
		grey[i] = g;
		sum += g;
	}
	let mean = 0;
	let sq = 0;
	let n = 0;
	for (let y = 1; y < h - 1; y++) {
		for (let x = 1; x < w - 1; x++) {
			const i = y * w + x;
			const lap = 4 * grey[i] - grey[i - 1] - grey[i + 1] - grey[i - w] - grey[i + w];
			mean += lap;
			sq += lap * lap;
			n++;
		}
	}
	mean /= n;
	return { sharpness: sq / n - mean * mean, brightness: sum / (w * h) };
}
