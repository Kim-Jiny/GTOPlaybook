/**
 * Standalone integrity checker for all GTO charts.
 * Run: npx ts-node src/data/validateCharts.ts
 * No DB connection required — it only evaluates the in-memory ChartDefs.
 */
import { handLabel } from './seedData/helpers';
import { getAllCharts } from './seedData/allChartsByDepth';

type Issue = { chart: string; hand?: string; msg: string };

const charts = getAllCharts();
const issues: Issue[] = [];

const SUM_TOL = 0.02; // allow rounding noise around 1.0

function chartId(c: (typeof charts)[number]): string {
  return [
    `${c.maxPlayers ?? 6}max`,
    `${c.stackDepth ?? 100}bb`,
    c.position,
    c.situation,
    c.vsPosition ? `vs${c.vsPosition}` : '',
    c.callerPosition ? `caller${c.callerPosition}` : '',
    c.flopTexture ? `[${c.flopTexture}]` : '',
  ]
    .filter(Boolean)
    .join('/');
}

// Duplicate detection key (matches what the app treats as a unique chart)
const dupKey = (c: (typeof charts)[number]) =>
  [
    c.maxPlayers ?? 6,
    c.stackDepth ?? 100,
    c.position,
    c.situation,
    c.vsPosition ?? '',
    c.callerPosition ?? '',
    c.flopTexture ?? '',
  ].join('|');

const seen = new Map<string, number>();

let totalHands = 0;

for (const c of charts) {
  const id = chartId(c);

  // 1. duplicate charts
  const k = dupKey(c);
  seen.set(k, (seen.get(k) ?? 0) + 1);

  // 2. actionTypes sanity
  if (!c.actionTypes || c.actionTypes.length === 0) {
    issues.push({ chart: id, msg: 'no actionTypes declared' });
  }
  const declaredKeys = new Set((c.actionTypes ?? []).map((a) => a.key));
  for (const a of c.actionTypes ?? []) {
    if (!a.color) issues.push({ chart: id, msg: `actionType ${a.key} missing color` });
    if (!a.label) issues.push({ chart: id, msg: `actionType ${a.key} missing label` });
  }

  let nonEmptyHands = 0;

  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const hand = handLabel(row, col);
      totalHands++;
      let freqs;
      try {
        freqs = c.ranges(row, col);
      } catch (e) {
        issues.push({ chart: id, hand, msg: `ranges() threw: ${(e as Error).message}` });
        continue;
      }
      if (!freqs || typeof freqs !== 'object') {
        issues.push({ chart: id, hand, msg: 'ranges() returned null/non-object' });
        continue;
      }
      const entries = Object.entries(freqs);
      if (entries.length === 0) continue; // empty = pure fold / not in range, allowed
      nonEmptyHands++;

      let sum = 0;
      for (const [key, val] of entries) {
        if (typeof val !== 'number' || Number.isNaN(val)) {
          issues.push({ chart: id, hand, msg: `freq[${key}] not a number: ${val}` });
          continue;
        }
        if (val < 0 || val > 1) {
          issues.push({ chart: id, hand, msg: `freq[${key}]=${val} out of [0,1]` });
        }
        // key must be declared in actionTypes (else grid can't color/label it)
        if (!declaredKeys.has(key)) {
          issues.push({
            chart: id,
            hand,
            msg: `freq key "${key}" not in actionTypes {${[...declaredKeys].join(',')}}`,
          });
        }
        sum += val;
      }
      if (Math.abs(sum - 1) > SUM_TOL) {
        issues.push({ chart: id, hand, msg: `freq sum=${sum.toFixed(3)} (≠1)` });
      }
    }
  }

  if (nonEmptyHands === 0) {
    issues.push({ chart: id, msg: 'chart has zero non-empty hands (entirely blank)' });
  }
}

// report duplicates
for (const [k, n] of seen) {
  if (n > 1) issues.push({ chart: k, msg: `duplicate chart appears ${n} times` });
}

// ---- summary ----
console.log(`Charts: ${charts.length}`);
console.log(`Hand-cells evaluated: ${totalHands}`);
console.log(`Issues found: ${issues.length}`);

// group issues by message prefix for a compact summary
const byType = new Map<string, number>();
for (const it of issues) {
  const t = it.msg.replace(/[0-9.]+/g, '#').replace(/\{.*\}/, '{...}').slice(0, 60);
  byType.set(t, (byType.get(t) ?? 0) + 1);
}
console.log('\n--- issue types ---');
for (const [t, n] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${n.toString().padStart(5)}  ${t}`);
}

console.log('\n--- first 40 issues ---');
for (const it of issues.slice(0, 40)) {
  console.log(`  ${it.chart}${it.hand ? ` [${it.hand}]` : ''}: ${it.msg}`);
}

process.exit(issues.length > 0 ? 1 : 0);
