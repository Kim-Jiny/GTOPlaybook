import { ChartDef, MaxPlayers, handLabel, RANKS, StackDepth } from './helpers';
import { POSTFLOP_CBET_ACTIONS } from './actionColors';

// Postflop Cbet ranges: BTN vs BB (Single Raised Pot)
// 6 representative flop textures
// Actions: bet / check (no fold — we are the aggressor with initiative)
// These ranges are universal regardless of table size (BTN vs BB SRP is the same)

// Helper: classify hands for cbet frequency on different board textures
// Simplified GTO-approximate Cbet frequencies

function gap(row: number, col: number) {
  return Math.abs(row - col);
}

function isBroadway(row: number, col: number) {
  return row <= 4 && col <= 4;
}

function hasAce(row: number, col: number) {
  return row === 0 || col === 0;
}

function hasKing(row: number, col: number) {
  return row === 1 || col === 1;
}

// 1. Dry High: A72r (rainbow) — high cbet frequency (~70%)
function dryHighCbet(row: number, col: number) {
  const isPair = row === col;
  const isSuited = row < col;

  // Bet with: any Ace, overpairs, good draws
  if (hasAce(row, col)) return { bet: 0.86, check: 0.14 };
  if (isPair && row <= 5) return { bet: 0.9, check: 0.1 }; // overpairs KK-88
  if (isPair && row >= 6) return { bet: 0.3, check: 0.7 }; // underpairs
  if (isBroadway(row, col)) return { bet: 0.64, check: 0.36 };
  // Suited connectors — sometimes bet as bluff
  if (isSuited && gap(row, col) === 1) return { bet: 0.45, check: 0.55 };
  if (isSuited && gap(row, col) === 2) return { bet: 0.48, check: 0.52 };
  if (hasKing(row, col)) return { bet: 0.58, check: 0.42 };
  return { bet: 0.32, check: 0.68 };
}

// 2. Dry Mid: K83r (rainbow) — moderate cbet (~55%)
function dryMidCbet(row: number, col: number) {
  const isPair = row === col;
  const isSuited = row < col;

  if (hasKing(row, col)) return { bet: 0.8, check: 0.2 };
  if (hasAce(row, col)) return { bet: 0.68, check: 0.32 };
  if (isPair && row <= 4) return { bet: 0.75, check: 0.25 };
  if (isPair && row === 5) return { bet: 0.6, check: 0.4 }; // 88 on K83
  if (isPair) return { bet: 0.25, check: 0.75 };
  if (row <= 2 && col <= 2) return { bet: 0.52, check: 0.48 };
  if (isSuited && gap(row, col) <= 2) return { bet: 0.42, check: 0.58 };
  return { bet: 0.28, check: 0.72 };
}

// 3. Wet Broadway: QJT — mostly check (~35% cbet)
function wetBroadwayCbet(row: number, col: number) {
  const isPair = row === col;

  // Sets and two pair — bet for value
  if (isPair && (row === 2 || row === 3 || row === 4)) return { bet: 0.85, check: 0.15 };
  // Straights (AK, K9, 98)
  if ((row === 0 && col === 1) || (row === 1 && col === 0)) return { bet: 0.8, check: 0.2 };
  if ((hasKing(row, col)) && (RANKS[row] === '9' || RANKS[col] === '9')) return { bet: 0.75, check: 0.25 };
  // Overpairs
  if (isPair && row <= 1) return { bet: 0.5, check: 0.5 };
  // Gutshots and draws
  if (hasAce(row, col)) return { bet: 0.42, check: 0.58 };
  if (hasKing(row, col)) return { bet: 0.36, check: 0.64 };
  if (row < col && gap(row, col) <= 2 && row >= 1 && col <= 6) return { bet: 0.34, check: 0.66 };
  // Most hands check on this connected board
  return { bet: 0.18, check: 0.82 };
}

// 4. Monotone: 963ss — mostly check (~30% cbet)
function monotoneCbet(row: number, col: number) {
  const isPair = row === col;
  const isSuited = row < col;

  // Overpairs with suited — bet
  if (isPair && row <= 3) return { bet: 0.45, check: 0.55 };
  // Flush draws (suited hands) — mix
  if (isSuited) {
    if (hasAce(row, col)) return { bet: 0.58, check: 0.42 };
    if (hasKing(row, col)) return { bet: 0.42, check: 0.58 };
    if (gap(row, col) <= 2) return { bet: 0.34, check: 0.66 };
    return { bet: 0.26, check: 0.74 };
  }
  // Non-suited overpairs
  if (isPair && row <= 5) return { bet: 0.35, check: 0.65 };
  // Mostly check on monotone without flush draw
  if (hasAce(row, col)) return { bet: 0.28, check: 0.72 };
  return { bet: 0.15, check: 0.85 };
}

// 5. Paired: KK5 — high cbet (~65%)
function pairedCbet(row: number, col: number) {
  const isPair = row === col;

  // Trips or full house
  if (hasKing(row, col)) return { bet: 0.9, check: 0.1 };
  // Overpair AA
  if (isPair && row === 0) return { bet: 0.85, check: 0.15 };
  // Medium+ pairs
  if (isPair && row <= 4) return { bet: 0.55, check: 0.45 };
  // Ace high
  if (hasAce(row, col)) return { bet: 0.65, check: 0.35 };
  // Small pairs
  if (isPair) return { bet: 0.35, check: 0.65 };
  // Broadway
  if (isBroadway(row, col)) return { bet: 0.5, check: 0.5 };
  if (row < col && gap(row, col) <= 2) return { bet: 0.36, check: 0.64 };
  return { bet: 0.28, check: 0.72 };
}

// 6. Low Connected: 876 — mostly check (~30% cbet)
function lowConnectedCbet(row: number, col: number) {
  const isPair = row === col;
  const isSuited = row < col;

  // Straights (T9, 95, 54)
  if ((row === 4 && col === 5) || (col === 4 && row === 5)) return { bet: 0.8, check: 0.2 }; // T9
  if ((row === 5 && col === 8) || (col === 5 && row === 8)) return { bet: 0.75, check: 0.25 }; // 95
  // Overpairs
  if (isPair && row <= 3) return { bet: 0.45, check: 0.55 };
  // Sets
  if (isPair && (row === 5 || row === 6 || row === 7)) return { bet: 0.85, check: 0.15 };
  // Two pair
  if (isPair) return { bet: 0.3, check: 0.7 };
  // High cards — mostly check on this low board
  if (hasAce(row, col)) return { bet: 0.35, check: 0.65 };
  if (hasKing(row, col)) return { bet: 0.28, check: 0.72 };
  // Draws
  if (isSuited && gap(row, col) <= 2 && row >= 4) return { bet: 0.42, check: 0.58 };
  if (isSuited && gap(row, col) <= 4 && row >= 3) return { bet: 0.3, check: 0.7 };
  return { bet: 0.18, check: 0.82 };
}

// --- 60bb variants: lower SPR means more aggressive cbet frequencies (+10-15%) ---

function boostBet(freqs: { bet: number; check: number }, boost: number): { bet: number; check: number } {
  const bet = Math.min(1.0, freqs.bet + boost);
  const check = Math.max(0, 1.0 - bet);
  return { bet: parseFloat(bet.toFixed(2)), check: parseFloat(check.toFixed(2)) };
}

function dryHighCbet60(row: number, col: number) {
  return boostBet(dryHighCbet(row, col), 0.12);
}

function dryMidCbet60(row: number, col: number) {
  return boostBet(dryMidCbet(row, col), 0.12);
}

function wetBroadwayCbet60(row: number, col: number) {
  return boostBet(wetBroadwayCbet(row, col), 0.10);
}

function monotoneCbet60(row: number, col: number) {
  return boostBet(monotoneCbet(row, col), 0.10);
}

function pairedCbet60(row: number, col: number) {
  return boostBet(pairedCbet(row, col), 0.15);
}

function lowConnectedCbet60(row: number, col: number) {
  return boostBet(lowConnectedCbet(row, col), 0.10);
}

// --- Chart builder by stack depth ---

export function getPostflopCharts(depth: StackDepth, maxPlayers: MaxPlayers = 6): ChartDef[] {
  // No postflop cbet ranges at shallow stacks
  if (depth <= 40) return [];

  // Need at least BTN and BB (3+ players)
  if (maxPlayers < 3) return [];

  const is60 = depth === 60;
  const tag = `${depth}bb`;

  return [
    {
      position: 'BTN', situation: 'Postflop Cbet', vsPosition: 'BB', category: 'Postflop Cbet',
      description: `BTN Cbet on A72r (Dry High) [${tag}]`,
      flopTexture: 'A72r',
      stackDepth: depth,
      maxPlayers,
      actionTypes: POSTFLOP_CBET_ACTIONS,
      ranges: is60 ? dryHighCbet60 : dryHighCbet,
    },
    {
      position: 'BTN', situation: 'Postflop Cbet', vsPosition: 'BB', category: 'Postflop Cbet',
      description: `BTN Cbet on K83r (Dry Mid) [${tag}]`,
      flopTexture: 'K83r',
      stackDepth: depth,
      maxPlayers,
      actionTypes: POSTFLOP_CBET_ACTIONS,
      ranges: is60 ? dryMidCbet60 : dryMidCbet,
    },
    {
      position: 'BTN', situation: 'Postflop Cbet', vsPosition: 'BB', category: 'Postflop Cbet',
      description: `BTN Cbet on QJT (Wet Broadway) [${tag}]`,
      flopTexture: 'QJT',
      stackDepth: depth,
      maxPlayers,
      actionTypes: POSTFLOP_CBET_ACTIONS,
      ranges: is60 ? wetBroadwayCbet60 : wetBroadwayCbet,
    },
    {
      position: 'BTN', situation: 'Postflop Cbet', vsPosition: 'BB', category: 'Postflop Cbet',
      description: `BTN Cbet on 963ss (Monotone) [${tag}]`,
      flopTexture: '963ss',
      stackDepth: depth,
      maxPlayers,
      actionTypes: POSTFLOP_CBET_ACTIONS,
      ranges: is60 ? monotoneCbet60 : monotoneCbet,
    },
    {
      position: 'BTN', situation: 'Postflop Cbet', vsPosition: 'BB', category: 'Postflop Cbet',
      description: `BTN Cbet on KK5 (Paired) [${tag}]`,
      flopTexture: 'KK5',
      stackDepth: depth,
      maxPlayers,
      actionTypes: POSTFLOP_CBET_ACTIONS,
      ranges: is60 ? pairedCbet60 : pairedCbet,
    },
    {
      position: 'BTN', situation: 'Postflop Cbet', vsPosition: 'BB', category: 'Postflop Cbet',
      description: `BTN Cbet on 876 (Low Connected) [${tag}]`,
      flopTexture: '876',
      stackDepth: depth,
      maxPlayers,
      actionTypes: POSTFLOP_CBET_ACTIONS,
      ranges: is60 ? lowConnectedCbet60 : lowConnectedCbet,
    },
  ];
}

// Backward compatibility
export const POSTFLOP_CHARTS = getPostflopCharts(100);
