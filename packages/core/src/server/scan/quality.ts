/**
 * Photo quality gate (D-10, PRD US-02.1: blurry, dark or cropped photos are
 * never used for a result). Thresholds are starting values calibrated on test
 * images; tune them on the evaluation set (OQ-08).
 */
import sharp from 'sharp';

export const QUALITY = {
	minSharpness: 0.6,
	minBrightness: 45,
	maxBrightness: 248,
	/** Customer photos are resized on the phone to a 1280 px long edge. */
	minScanShortSide: 480,
	/** PRD US-05.4: reference photos at least 1,000 px on the short side. */
	minReferenceShortSide: 1000
};

export type PhotoProblem = 'unreadable' | 'too_small' | 'blurry' | 'dark' | 'bright';

export const PHOTO_PROBLEM_TEXT: Record<PhotoProblem, string> = {
	unreadable: "This file isn't a photo we can open. Use a JPG or PNG.",
	too_small: 'This photo is too small. Use a sharper, larger photo.',
	blurry:
		"This photo is too blurry. I can't read the details. Hold the phone steady, in good light.",
	dark: 'This photo is too dark. Take it again in better light.',
	bright:
		'This photo is washed out by light or glare. Tilt the pack away from the light and try again.'
};

export interface PhotoCheck {
	ok: boolean;
	problem?: PhotoProblem;
	width: number;
	height: number;
	sharpness: number;
	brightness: number;
}

/**
 * The most pixels a photo may have before it's decoded. A phone photo is about 12 million; the
 * cap stops a tiny file that unpacks into billions of pixels from exhausting the server.
 * Manufacturers' reference photos (often from real cameras) get a higher one.
 */
export const MAX_PHOTO_PIXELS = 40_000_000;
export const MAX_REFERENCE_PIXELS = 70_000_000;
const PHOTO_FORMATS = new Set(['jpeg', 'png', 'webp', 'heif', 'avif', 'tiff']);

/** Opens an image with the pixel cap. Reading `metadata()` only parses the header. */
export function openImage(bytes: Uint8Array, maxPixels = MAX_PHOTO_PIXELS) {
	return sharp(bytes, { limitInputPixels: maxPixels, failOn: 'error' });
}

/** True when the bytes are a photo format we accept and within the pixel cap. */
export async function isAcceptableImage(bytes: Uint8Array, maxPixels = MAX_PHOTO_PIXELS) {
	try {
		const meta = await openImage(bytes, maxPixels).metadata();
		return (
			PHOTO_FORMATS.has(meta.format ?? '') &&
			(meta.width ?? 0) * (meta.height ?? 0) <= maxPixels &&
			(meta.pages ?? 1) <= 1
		);
	} catch {
		return false;
	}
}

export async function checkPhoto(
	bytes: Uint8Array,
	minShortSide: number,
	maxPixels = MAX_PHOTO_PIXELS
): Promise<PhotoCheck> {
	try {
		if (!(await isAcceptableImage(bytes, maxPixels)))
			return { ok: false, problem: 'unreadable', width: 0, height: 0, sharpness: 0, brightness: 0 };
		const image = openImage(bytes, maxPixels).rotate();
		const meta = await image.metadata();
		const width = meta.autoOrient?.width ?? meta.width ?? 0;
		const height = meta.autoOrient?.height ?? meta.height ?? 0;
		const stats = await openImage(bytes, maxPixels).stats();
		const brightness =
			stats.channels.slice(0, 3).reduce((a, c) => a + c.mean, 0) /
			Math.min(3, stats.channels.length);
		const result = { width, height, sharpness: stats.sharpness, brightness };
		if (Math.min(width, height) < minShortSide)
			return { ok: false, problem: 'too_small', ...result };
		if (brightness < QUALITY.minBrightness) return { ok: false, problem: 'dark', ...result };
		if (brightness > QUALITY.maxBrightness) return { ok: false, problem: 'bright', ...result };
		if (stats.sharpness < QUALITY.minSharpness) return { ok: false, problem: 'blurry', ...result };
		return { ok: true, ...result };
	} catch {
		return { ok: false, problem: 'unreadable', width: 0, height: 0, sharpness: 0, brightness: 0 };
	}
}

/** Re-encodes as JPEG with a capped long edge. sharp drops metadata (including location) by default. */
export async function normalisePhoto(
	bytes: Uint8Array,
	maxEdge = 1280,
	maxPixels = MAX_PHOTO_PIXELS
): Promise<Buffer> {
	return openImage(bytes, maxPixels)
		.rotate()
		.resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
		.jpeg({ quality: 82, mozjpeg: true })
		.toBuffer();
}
