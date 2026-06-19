/**
 * Verifies the inline stack-depth switcher's lookup logic.
 * Simulates the mobile fetchChartForTier matching against the real chart set:
 *   server filter:  position + situation + max_players + stack_depth
 *   client filter:  exact match on vsPosition / callerPosition / flopTexture
 * Asserts that for every (spot, targetTier) the match count is 0 or 1 — never
 * ambiguous (>=2), which would make the UI load the wrong chart.
 *
 * Run: npx ts-node src/data/verifyTierSwitch.ts
 */
import { STACK_TIERS } from './seedData/helpers';
import { getAllCharts } from './seedData/allChartsByDepth';

const charts = getAllCharts();

const norm = (v: unknown) => v ?? null;

// Replicates server-side /charts filter (only the always-present params)
function serverFilter(
  position: string,
  situation: string,
  maxPlayers: number,
  stackDepth: number,
) {
  return charts.filter(
    (c) =>
      c.position === position &&
      c.situation === situation &&
      (c.maxPlayers ?? 6) === maxPlayers &&
      (c.stackDepth ?? 100) === stackDepth,
  );
}

let ambiguous = 0;
let reachable = 0;
let deadEnds = 0;
let checks = 0;
const examples: string[] = [];

for (const base of charts) {
  for (const tier of STACK_TIERS) {
    if (tier === (base.stackDepth ?? 100)) continue;
    checks++;

    const serverRows = serverFilter(
      base.position,
      base.situation,
      base.maxPlayers ?? 6,
      tier,
    );
    // client-side exact match on nullable attrs
    const matched = serverRows.filter(
      (c) =>
        norm(c.vsPosition) === norm(base.vsPosition) &&
        norm(c.callerPosition) === norm(base.callerPosition) &&
        norm(c.flopTexture) === norm(base.flopTexture),
    );

    if (matched.length === 0) {
      deadEnds++;
    } else if (matched.length === 1) {
      reachable++;
    } else {
      ambiguous++;
      if (examples.length < 10) {
        examples.push(
          `${base.maxPlayers}max ${base.position}/${base.situation}` +
            `${base.vsPosition ? '/vs' + base.vsPosition : ''}` +
            `${base.flopTexture ? '/[' + base.flopTexture + ']' : ''}` +
            ` -> ${tier}bb matched ${matched.length}`,
        );
      }
    }
  }
}

console.log(`Charts: ${charts.length}`);
console.log(`(spot, targetTier) checks: ${checks}`);
console.log(`  reachable (exactly 1 match): ${reachable}`);
console.log(`  dead-ends (0 match, shows snackbar): ${deadEnds}`);
console.log(`  AMBIGUOUS (>=2 match, BUG): ${ambiguous}`);
if (examples.length) {
  console.log('\n--- ambiguous examples ---');
  examples.forEach((e) => console.log('  ' + e));
}

process.exit(ambiguous > 0 ? 1 : 0);
