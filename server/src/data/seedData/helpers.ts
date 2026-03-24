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

export interface ChartDef {
  position: string;
  situation: string;
  vsPosition?: string;
  category: string;
  description: string;
  flopTexture?: string;
  stackDepth?: StackDepth;
  maxPlayers?: MaxPlayers;
  actionTypes: { key: string; label: string; color: string }[];
  ranges: (row: number, col: number) => FreqMap;
}
