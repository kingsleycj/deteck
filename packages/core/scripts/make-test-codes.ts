// Makes DataMatrix images of demo pack codes in test-data/codes/, for testing "Scan the code":
// open one on a second screen (or print it) and point the phone at it, or upload the image.
//   node scripts/make-test-codes.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareZXingModule, writeBarcode } from 'zxing-wasm/writer';
import { gtinCheckDigit } from '../src/gs1/gtin.ts';
import { decodeCode } from '../src/server/scan/decode.ts';

const out = fileURLToPath(new URL('../../../test-data/codes/', import.meta.url));
const seed = (n: number) => {
	const body = `0950600099${String(n).padStart(3, '0')}`;
	return body + gtinCheckDigit(body);
};
const testData = JSON.parse(
	readFileSync(new URL('../../../test-data/gtins.json', import.meta.url), 'utf8')
) as Record<string, string>;
const notOnDeteck = '0950600088888' + gtinCheckDigit('0950600088888');

/** [file name, code, what the result should be] */
const CODES: [string, string, string][] = [
	[
		'01-valid-curavyn',
		`(01)${seed(1)}(17)280430(10)NB-2611(21)7K4M9QX2TB8D`,
		'Valid, with a journey to Riverside Pharmacy'
	],
	['02-recalled-amoxinor', `(01)${seed(4)}(17)280131(10)AX-2602(21)A7R2C9L4E1DX`, 'Recalled'],
	[
		'03-expired-malarex',
		`(01)${seed(2)}(17)250430(10)NB-2309(21)3M8P41KD7Q2X`,
		'Valid but expired'
	],
	[
		'04-wrong-batch-on-pack',
		`(01)${seed(1)}(17)280430(10)NB-9999(21)7K4M9QX2TB8D`,
		"The pack doesn't match the record (batch)"
	],
	[
		'05-unknown-serial',
		`(01)${seed(1)}(21)ZZZZ0000ZZZZ`,
		'Unrecognised: the drug is on DETECK but not this serial'
	],
	['06-no-serial-in-code', `(01)${seed(1)}`, 'The code has no serial: type it instead'],
	['07-not-on-deteck', `(01)${notOnDeteck}(21)ABCD1234EFGH`, 'Not on DETECK yet'],
	[
		'08-shared-serial-paxolin',
		`(01)${seed(3)}(21)TW1N2026PACK`,
		'Valid: the scan says which drug, so no batch question'
	],
	[
		'09-glucorin-after-import',
		`(01)${testData.glucorin}(17)280131(10)GL-2601(21)GLTEST000005`,
		'Valid only after the test-data import has gone live'
	]
];

function wasm() {
	let dir = dirname(fileURLToPath(import.meta.resolve('zxing-wasm/writer')));
	for (let i = 0; i < 6; i++) {
		for (const candidate of [
			join(dir, 'dist', 'writer', 'zxing_writer.wasm'),
			join(dir, 'zxing_writer.wasm')
		])
			if (existsSync(candidate)) return readFileSync(candidate);
		dir = dirname(dir);
	}
	throw new Error('zxing_writer.wasm not found');
}

prepareZXingModule({ overrides: { wasmBinary: wasm() }, fireImmediately: false });
mkdirSync(out, { recursive: true });
const lines = [
	'# Test codes',
	'',
	'Open an image on another screen, or print it, and scan it with DETECK. Or upload it on the scan page.',
	'',
	'| Image | Code | Expected result |',
	'| --- | --- | --- |'
];
for (const [name, code, expected] of CODES) {
	const written = await writeBarcode(code, { format: 'DataMatrix', scale: 12 });
	if (written.error || !written.image) throw new Error(`${name}: ${written.error}`);
	const bytes = new Uint8Array(await written.image.arrayBuffer());
	const read = await decodeCode(bytes);
	if (read !== code) throw new Error(`${name}: reads back as ${read}`);
	writeFileSync(join(out, `${name}.png`), bytes);
	lines.push(`| ${name}.png | \`${code}\` | ${expected} |`);
}
writeFileSync(join(out, 'README.md'), lines.join('\n') + '\n');
console.info(`${CODES.length} codes written to ${out}, each checked by reading it back.`);
