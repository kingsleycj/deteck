// Packaging check evaluation (D-10, G-06): runs a labelled photo set through each
// model and reports false alarms, misses and "can't tell" rates with sample sizes.
//
// Usage:
//   node --env-file-if-exists=.env scripts/eval-scan.ts <set-dir> [--models a,b] [--out report.json] [--timeout ms] [--stub]
//
// <set-dir>/eval.json describes the set; paths are relative to <set-dir>:
//   {
//     "references": {
//       "amoxil-v1": {
//         "product": { "brandName": "Amoxil", "strength": "500 mg", "dosageForm": "Capsule", "manufacturer": "..." },
//         "dir": "references/amoxil-v1"            // front.jpg, back.jpg, left.jpg, right.jpg, label.jpg, security.jpg (optional)
//       }
//     },
//     "cases": [
//       { "id": "001", "reference": "amoxil-v1", "dir": "cases/001", "expected": "same" },      // front.jpg, back.jpg, label.jpg
//       { "id": "002", "reference": "amoxil-v1", "dir": "cases/002", "expected": "different" }
//     ]
//   }
// "same" = a pack from the manufacturer; "different" = a known fake or altered pack.
// --stub runs the harness without calling the API (checks the set loads).
//
// Each run sends real photos to the Claude API and costs money: roughly
// cases x models x (9 photos at ~1,500 tokens each). Check the estimate it prints first.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	anthropicComparer,
	COMPARE_TIMEOUT_MS,
	COMPARED_REFERENCE_SIDES,
	CONFIDENCE_FLOOR,
	mapOutput,
	SIDES,
	stubComparer,
	type ComparisonResult,
	type PackagingComparer
} from '../src/server/scan/provider.ts';
import { normalisePhoto } from '../src/server/scan/quality.ts';

/** US dollars per million tokens (input, output). Check current pricing before relying on the cost column. */
const PRICING: Record<string, [number, number]> = {
	'claude-haiku-5-5': [0.1, 0.5],
	'claude-sonnet-5-5': [2, 10],
	'claude-opus-5-5': [4, 20]
};
const DEFAULT_MODELS = Object.keys(PRICING);
// Same reference sides and timeout as production, so the gate measures what people will get.
const REFERENCE_SIDES = COMPARED_REFERENCE_SIDES;
const FLOORS = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

interface EvalSet {
	references: Record<
		string,
		{
			product: { brandName: string; strength: string; dosageForm: string; manufacturer: string };
			dir: string;
		}
	>;
	cases: { id: string; reference: string; dir: string; expected: 'same' | 'different' }[];
}

const args = process.argv.slice(2);
const flag = (name: string) => {
	const i = args.indexOf(name);
	return i >= 0 ? args[i + 1] : undefined;
};
const flagValues = [flag('--models'), flag('--out'), flag('--timeout')];
const dir = args.find((a) => !a.startsWith('--') && !flagValues.includes(a));
if (!dir) {
	console.error(
		'Usage: node scripts/eval-scan.ts <set-dir> [--models a,b] [--out report.json] [--stub]'
	);
	process.exit(2);
}
const stub = args.includes('--stub');
const models = stub ? ['stub'] : (flag('--models')?.split(',') ?? DEFAULT_MODELS);
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!stub && !apiKey) {
	console.error(
		'ANTHROPIC_API_KEY is not set. Use --stub to check the set without calling the API.'
	);
	process.exit(2);
}

const set: EvalSet = JSON.parse(readFileSync(join(dir, 'eval.json'), 'utf8'));

async function load(path: string, maxEdge: number) {
	return normalisePhoto(readFileSync(path), maxEdge);
}

const references = new Map<string, { side: string; data: Buffer }[]>();
for (const [name, ref] of Object.entries(set.references)) {
	const images = [];
	for (const side of REFERENCE_SIDES) {
		const path = join(dir, ref.dir, `${side}.jpg`);
		if (existsSync(path)) images.push({ side, data: await load(path, 2000) });
	}
	if (!images.length) throw new Error(`Reference ${name} has no photos in ${ref.dir}`);
	references.set(name, images);
}

const cases = [];
for (const c of set.cases) {
	if (!references.has(c.reference))
		throw new Error(`Case ${c.id} uses unknown reference ${c.reference}`);
	const photos = [];
	for (const side of SIDES)
		photos.push({ side, data: await load(join(dir, c.dir, `${side}.jpg`), 1280) });
	cases.push({ ...c, photos });
}
console.log(
	`Loaded ${cases.length} cases (${cases.filter((c) => c.expected === 'same').length} same, ${cases.filter((c) => c.expected === 'different').length} different) and ${references.size} references.`
);
if (!stub)
	console.log(`This makes ${cases.length * models.length} API calls across ${models.join(', ')}.`);

/** Wilson score interval, 95%. Small sets give wide intervals; report them, don't hide them. */
function wilson(k: number, n: number): [number, number] {
	if (n === 0) return [0, 1];
	const z = 1.96;
	const p = k / n;
	const d = 1 + (z * z) / n;
	const centre = p + (z * z) / (2 * n);
	const margin = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
	return [Math.max(0, (centre - margin) / d), Math.min(1, (centre + margin) / d)];
}
const pct = (k: number, n: number) => {
	if (n === 0) return 'n/a';
	const [lo, hi] = wilson(k, n);
	return `${((100 * k) / n).toFixed(0)}% (${k}/${n}, 95% CI ${(100 * lo).toFixed(0)}-${(100 * hi).toFixed(0)}%)`;
};

function summarise(rows: { expected: 'same' | 'different'; result: ComparisonResult }[]) {
	const same = rows.filter((r) => r.expected === 'same');
	const diff = rows.filter((r) => r.expected === 'different');
	return {
		falseAlarm: [
			same.filter((r) => r.result.outcome === 'INCONSISTENCIES_FOUND').length,
			same.length
		] as const,
		miss: [
			diff.filter((r) => r.result.outcome === 'NO_VISIBLE_INCONSISTENCIES').length,
			diff.length
		] as const,
		cantTell: [rows.filter((r) => r.result.outcome === 'CANT_TELL').length, rows.length] as const,
		caught: [
			diff.filter((r) => r.result.outcome === 'INCONSISTENCIES_FOUND').length,
			diff.length
		] as const
	};
}

const report: Record<string, unknown> = {};
for (const model of models) {
	const comparer: PackagingComparer = stub
		? stubComparer
		: anthropicComparer({
				apiKey: apiKey!,
				model,
				timeoutMs: Number(flag('--timeout') ?? COMPARE_TIMEOUT_MS)
			});
	const rows: {
		id: string;
		expected: 'same' | 'different';
		result: ComparisonResult;
		ms: number;
	}[] = [];
	for (const c of cases) {
		const ref = set.references[c.reference];
		const started = Date.now();
		const result = await comparer.compare({
			product: ref.product,
			reference: references.get(c.reference)!,
			photos: c.photos
		});
		rows.push({ id: c.id, expected: c.expected, result, ms: Date.now() - started });
		process.stdout.write('.');
	}
	process.stdout.write('\n');

	const s = summarise(rows);
	const price = PRICING[model];
	const tokensIn = rows.reduce((t, r) => t + (r.result.usage?.inputTokens ?? 0), 0);
	const tokensOut = rows.reduce((t, r) => t + (r.result.usage?.outputTokens ?? 0), 0);
	const cost = price ? (tokensIn * price[0] + tokensOut * price[1]) / 1e6 : 0;
	const ms = rows.map((r) => r.ms).sort((a, b) => a - b);
	const errors = rows.filter((r) =>
		['error', 'timeout', 'refused', 'inconsistent_output'].includes(r.result.reason ?? '')
	).length;

	console.log(`\n${model}`);
	console.log(`  False alarms (same pack flagged):        ${pct(...s.falseAlarm)}`);
	console.log(`  Misses (different pack passed):          ${pct(...s.miss)}`);
	console.log(`  Caught (different pack flagged):         ${pct(...s.caught)}`);
	console.log(`  Can't tell (all cases):                  ${pct(...s.cantTell)}`);
	console.log(`  Errors, timeouts, refusals, bad output:  ${errors}`);
	console.log(
		`  Latency: median ${ms[Math.floor(ms.length / 2)] ?? 0} ms, slowest ${ms.at(-1) ?? 0} ms`
	);
	if (price)
		console.log(
			`  Cost: $${cost.toFixed(4)} total, $${(cost / Math.max(1, rows.length)).toFixed(5)} per check`
		);

	// Re-map the same answers at other confidence floors (no extra API calls).
	const sweep = FLOORS.map((floor) => {
		const remapped = rows.map((r) => ({
			expected: r.expected,
			result: r.result.raw ? mapOutput(r.result.raw, model, floor) : r.result
		}));
		const t = summarise(remapped);
		return { floor, falseAlarm: t.falseAlarm, miss: t.miss, cantTell: t.cantTell };
	});
	if (!stub) {
		console.log(`  Confidence floor sweep (current ${CONFIDENCE_FLOOR}):`);
		for (const f of sweep)
			console.log(
				`    ${f.floor.toFixed(1)}  false alarms ${f.falseAlarm[0]}/${f.falseAlarm[1]}  misses ${f.miss[0]}/${f.miss[1]}  can't tell ${f.cantTell[0]}/${f.cantTell[1]}`
			);
	}

	report[model] = {
		summary: s,
		errors,
		latencyMs: { median: ms[Math.floor(ms.length / 2)] ?? 0, max: ms.at(-1) ?? 0 },
		tokens: { input: tokensIn, output: tokensOut },
		costUsd: cost,
		floorSweep: sweep,
		cases: rows.map((r) => ({
			id: r.id,
			expected: r.expected,
			outcome: r.result.outcome,
			reason: r.result.reason,
			confidence: r.result.confidence,
			categories: r.result.categories,
			ms: r.ms
		}))
	};
}

const out = flag('--out');
if (out) {
	writeFileSync(
		out,
		JSON.stringify({ ranAt: new Date().toISOString(), set: dir, models, report }, null, 2)
	);
	console.log(`\nWrote ${out}`);
}
console.log(
	'\nDecision rule (D-10): ship a model only if false alarms stay low enough that pharmacists trust the result; misses are the cost of a beta and must be stated in the copy.'
);
