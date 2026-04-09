export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

export function handLabel(row: number, col: number): string {
  if (row === col) return `${RANKS[row]}${RANKS[col]}`;
  if (row < col) return `${RANKS[row]}${RANKS[col]}s`;
  return `${RANKS[col]}${RANKS[row]}o`;
}

export function inSet(hand: string, set: Set<string>): boolean {
  return set.has(hand);
}

export type FreqMap = Record<string, number>;

export type StackDepth = 7 | 15 | 25 | 40 | 60 | 100;
export const STACK_TIERS: StackDepth[] = [7, 15, 25, 40, 60, 100];

export type MaxPlayers = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export const PLAYER_COUNTS: MaxPlayers[] = [2, 3, 4, 5, 6, 7, 8, 9];

type ActionSetDef = {
  key: string;
  set: Set<string>;
};

const NEIGHBOR_OFFSETS = [
  { dr: -1, dc: 0, weight: 1.0 },
  { dr: 1, dc: 0, weight: 1.0 },
  { dr: 0, dc: -1, weight: 1.0 },
  { dr: 0, dc: 1, weight: 1.0 },
  { dr: -1, dc: -1, weight: 0.75 },
  { dr: -1, dc: 1, weight: 0.75 },
  { dr: 1, dc: -1, weight: 0.75 },
  { dr: 1, dc: 1, weight: 0.75 },
  { dr: -2, dc: 0, weight: 0.45 },
  { dr: 2, dc: 0, weight: 0.45 },
  { dr: 0, dc: -2, weight: 0.45 },
  { dr: 0, dc: 2, weight: 0.45 },
];

/**
 * Returns position names for a given table size.
 * 2인 (HU): SB, BB           (SB acts as BTN)
 * 3인:      BTN, SB, BB
 * 4인:      CO, BTN, SB, BB
 * 5인:      HJ, CO, BTN, SB, BB
 * 6인:      UTG, HJ, CO, BTN, SB, BB
 * 7인:      UTG, MP, HJ, CO, BTN, SB, BB
 * 8인:      UTG, UTG+1, MP, HJ, CO, BTN, SB, BB
 * 9인:      UTG, UTG+1, UTG+2, MP, HJ, CO, BTN, SB, BB
 */
export function positionsForPlayerCount(n: MaxPlayers): string[] {
  switch (n) {
    case 2: return ['SB', 'BB'];
    case 3: return ['BTN', 'SB', 'BB'];
    case 4: return ['CO', 'BTN', 'SB', 'BB'];
    case 5: return ['HJ', 'CO', 'BTN', 'SB', 'BB'];
    case 6: return ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
    case 7: return ['UTG', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
    case 8: return ['UTG', 'UTG+1', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
    case 9: return ['UTG', 'UTG+1', 'UTG+2', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  }
}

/** RFI-eligible positions (everyone except BB) */
export function rfiPositions(n: MaxPlayers): string[] {
  return positionsForPlayerCount(n).filter(p => p !== 'BB');
}

/**
 * Maps a position name to an opener "tightness" class.
 * Used by 3bet/defend files to reuse range data.
 */
export function openerClass(position: string): 'ep-tight' | 'hj' | 'co' | 'btn' | 'sb' {
  switch (position) {
    case 'BTN': return 'btn';
    case 'CO': return 'co';
    case 'HJ': return 'hj';
    case 'SB': return 'sb';
    default: return 'ep-tight'; // UTG, UTG+1, UTG+2, MP
  }
}

export function smoothFrequencies(
  row: number,
  col: number,
  currentKey: string,
  actionSets: ActionSetDef[],
  pureThreshold = 0.86,
  boundaryThreshold = 0.12,
): FreqMap | null {
  const totals: Record<string, number> = {};
  const allKeys = [...actionSets.map((def) => def.key), 'fold'];
  for (const key of allKeys) totals[key] = 0;

  totals[currentKey] = (totals[currentKey] ?? 0) + 3.0;

  for (const { dr, dc, weight } of NEIGHBOR_OFFSETS) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr < 0 || nr > 12 || nc < 0 || nc > 12) continue;

    const hand = handLabel(nr, nc);
    const neighborKey = classifyAction(hand, actionSets);
    totals[neighborKey] = (totals[neighborKey] ?? 0) + weight;
  }

  const totalWeight = Object.values(totals).reduce((sum, value) => sum + value, 0);
  if (totalWeight <= 0) return null;

  const normalized = Object.fromEntries(
    Object.entries(totals)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => [key, roundFreq(value / totalWeight)]),
  ) as FreqMap;

  const sorted = Object.entries(normalized).sort((a, b) => b[1] - a[1]);
  if (sorted.length < 2) return null;

  const [, best] = sorted[0];
  const [, second] = sorted[1];

  if (best >= pureThreshold || second < boundaryThreshold) {
    return null;
  }

  return renormalizeFrequencies(normalized);
}

function classifyAction(hand: string, actionSets: ActionSetDef[]): string {
  for (const def of actionSets) {
    if (def.set.has(hand)) return def.key;
  }
  return 'fold';
}

function roundFreq(value: number): number {
  return Math.round(value * 100) / 100;
}

function renormalizeFrequencies(freqs: FreqMap): FreqMap {
  const sum = Object.values(freqs).reduce((acc, value) => acc + value, 0);
  if (sum <= 0) return freqs;
  const entries = Object.entries(freqs)
    .map(([key, value]) => [key, roundFreq(value / sum)] as const)
    .filter(([, value]) => value > 0);

  const adjusted = Object.fromEntries(entries) as FreqMap;
  const adjustedSum = Object.values(adjusted).reduce((acc, value) => acc + value, 0);
  const delta = roundFreq(1 - adjustedSum);
  if (Math.abs(delta) >= 0.01 && entries.length > 0) {
    const [firstKey, firstValue] = entries[0];
    adjusted[firstKey] = roundFreq(firstValue + delta);
  }
  return adjusted;
}

/**
 * Shallow-stack opener grouping is less compressed than deep-stack grouping.
 * In 8-9max at 15-25bb, MP can lean toward HJ, but UTG+2 remains distinctly tighter.
 */
export function shallowOpenerClass(
  position: string,
  maxPlayers: MaxPlayers,
): 'ep-tight' | 'hj' | 'co' | 'btn' | 'sb' {
  if (position === 'SB') return 'sb';
  if (position === 'BTN') return 'btn';
  if (position === 'CO') return 'co';
  if (position === 'HJ') return 'hj';

  if (maxPlayers >= 7 && position === 'MP') return 'hj';

  return 'ep-tight';
}

export interface ChartDef {
  position: string;
  situation: string;
  vsPosition?: string;
  callerPosition?: string;
  category: string;
  description: string;
  flopTexture?: string;
  stackDepth?: StackDepth;
  maxPlayers?: MaxPlayers;
  actionTypes: { key: string; label: string; color: string }[];
  ranges: (row: number, col: number) => FreqMap;
}
