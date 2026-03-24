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

export type StackDepth = 15 | 25 | 40 | 60 | 100;
export const STACK_TIERS: StackDepth[] = [15, 25, 40, 60, 100];

export interface ChartDef {
  position: string;
  situation: string;
  vsPosition?: string;
  category: string;
  description: string;
  flopTexture?: string;
  stackDepth?: StackDepth;
  actionTypes: { key: string; label: string; color: string }[];
  ranges: (row: number, col: number) => FreqMap;
}
