import { createHash, createHmac, randomBytes } from 'node:crypto';
import { normaliseSerialKey } from '../gs1/serial.ts';
import { ctx } from './context.ts';
import { today } from './time.ts';

const SEP = '\u001f';

function hmac(key: string, value: string): Buffer {
	return createHmac('sha256', key).update(value).digest();
}

/** Identifies one pack: GTIN plus the exact serial as printed. */
export function serialExactHmac(gtin14: string, serial: string): Buffer {
	return hmac(ctx().config.serialHmacKey, `exact${SEP}${gtin14}${SEP}${serial}`);
}

/** Lookup key for a typed serial (spaces and dashes removed, upper case). */
export function serialKeyHmac(serial: string): Buffer {
	return hmac(ctx().config.serialHmacKey, `key${SEP}${normaliseSerialKey(serial)}`);
}

/** Anonymous device hash that changes daily, so devices can't be tracked over time. */
export function deviceDayHash(deviceId: string, day = today()): Buffer {
	return hmac(ctx().config.deviceHashSecret, `device${SEP}${day}${SEP}${deviceId}`);
}

/** URL-safe random identifier. */
export function randomId(bytes = 16): string {
	return randomBytes(bytes).toString('base64url');
}

export function sha256Hex(data: Buffer | Uint8Array | string): string {
	return createHash('sha256').update(data).digest('hex');
}
