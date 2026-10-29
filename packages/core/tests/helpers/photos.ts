import sharp from 'sharp';

/** A synthetic photo of a medicine pack, crisp unless blurred. */
export async function packPhoto(
	options: { width?: number; height?: number; blur?: number; text?: string } = {}
) {
	const width = options.width ?? 1280;
	const height = options.height ?? 960;
	const svg = Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="#f4f1ea"/>` +
			`<rect x="${width * 0.15}" y="${height * 0.15}" width="${width * 0.7}" height="${height * 0.7}" rx="20" fill="#fff" stroke="#1a35ae" stroke-width="8"/>` +
			`<text x="${width * 0.2}" y="${height * 0.38}" font-size="${Math.round(height / 9)}" font-family="sans-serif" font-weight="800" fill="#1a35ae">NORTHBRIDGE</text>` +
			`<text x="${width * 0.2}" y="${height * 0.55}" font-size="${Math.round(height / 12)}" font-family="sans-serif" fill="#0b0b0f">${options.text ?? 'Curavyn 500 mg'}</text>` +
			`<text x="${width * 0.2}" y="${height * 0.68}" font-size="${Math.round(height / 24)}" font-family="monospace" fill="#333">SN 7K4M9QX2TB8D LOT NB-2611</text></svg>`
	);
	let image = sharp(svg);
	if (options.blur) image = image.blur(options.blur);
	const bytes = new Uint8Array(await image.jpeg({ quality: 82 }).toBuffer());
	return { name: 'photo.jpg', type: 'image/jpeg', bytes };
}
