import { ChartDef, handLabel, RANKS, StackDepth } from './helpers';
import { POSTFLOP_CBET_ACTIONS } from './actionColors';

// Postflop Cbet ranges: BTN vs BB (Single Raised Pot)
// 6 representative flop textures
// Actions: bet / check (no fold — we are the aggressor with initiative)

// Helper: classify hands for cbet frequency on different board textures
// Simplified GTO-approximate Cbet frequencies

// 1. Dry High: A♠7♥2♦ (rainbow) — high cbet frequency (~70%)
function dryHighCbet(row: number, col: number) {
  const h = handLabel(row, col);
  const r1 = RANKS[row], r2 = RANKS[col];
  const isPair = row === col;
  const isSuited = row < col;

  // Bet with: any Ace, overpairs, good draws
  if (r1 === 'A' || r2 === 'A') return { bet: 0.85, check: 0.15 };
  if (isPair && row <= 5) return { bet: 0.9, check: 0.1 }; // overpairs KK-88
  if (isPair && row >= 6) return { bet: 0.3, check: 0.7 }; // underpairs
  // Broadway hands
  if (row <= 3 && col <= 3) return { bet: 0.65, check: 0.35 };
  // Suited connectors — sometimes bet as bluff
  if (isSuited && Math.abs(row - col) === 1) return { bet: 0.45, check: 0.55 };
  // High cards
  if (r1 === 'K' || r2 === 'K') return { bet: 0.6, check: 0.4 };
  return { bet: 0.35, check: 0.65 };
}

// 2. Dry Mid: K♠8♥3♦ (rainbow) — moderate cbet (~55%)
function dryMidCbet(row: number, col: number) {
  const h = handLabel(row, col);
  const r1 = RANKS[row], r2 = RANKS[col];
  const isPair = row === col;
  const isSuited = row < col;

  if (r1 === 'K' || r2 === 'K') return { bet: 0.8, check: 0.2 };
  if (r1 === 'A' || r2 === 'A') return { bet: 0.7, check: 0.3 };
  if (isPair && row <= 4) return { bet: 0.75, check: 0.25 };
  if (isPair && row === 5) return { bet: 0.6, check: 0.4 }; // 88 on K83
  if (isPair) return { bet: 0.25, check: 0.75 };
  if (row <= 2 && col <= 2) return { bet: 0.5, check: 0.5 };
  if (isSuited && Math.abs(row - col) <= 2) return { bet: 0.4, check: 0.6 };
  return { bet: 0.3, check: 0.7 };
}

// 3. Wet Broadway: Q♠J♥T♦ — mostly check (~35% cbet)
function wetBroadwayCbet(row: number, col: number) {
  const h = handLabel(row, col);
  const r1 = RANKS[row], r2 = RANKS[col];
  const isPair = row === col;
  const isSuited = row < col;

  // Sets and two pair — bet for value
  if (isPair && (row === 2 || row === 3 || row === 4)) return { bet: 0.85, check: 0.15 };
  // Straights (AK, K9, 98)
  if ((r1 === 'A' && r2 === 'K') || (r1 === 'K' && r2 === 'A')) return { bet: 0.8, check: 0.2 };
  if ((r1 === 'K' || r2 === 'K') && (r1 === '9' || r2 === '9')) return { bet: 0.75, check: 0.25 };
  // Overpairs
  if (isPair && row <= 1) return { bet: 0.5, check: 0.5 };
  // Gutshots and draws
  if (r1 === 'A' || r2 === 'A') return { bet: 0.4, check: 0.6 };
  if (r1 === 'K' || r2 === 'K') return { bet: 0.35, check: 0.65 };
  // Most hands check on this connected board
  return { bet: 0.2, check: 0.8 };
}

// 4. Monotone: 9♣6♣3♣ — mostly check (~30% cbet)
function monotoneCbet(row: number, col: number) {
  const h = handLabel(row, col);
  const r1 = RANKS[row], r2 = RANKS[col];
  const isPair = row === col;
  const isSuited = row < col;

  // Overpairs with suited — bet
  if (isPair && row <= 3) return { bet: 0.45, check: 0.55 };
  // Flush draws (suited hands) — mix
  if (isSuited) {
    if (r1 === 'A' || r2 === 'A') return { bet: 0.55, check: 0.45 };
    if (r1 === 'K' || r2 === 'K') return { bet: 0.4, check: 0.6 };
    return { bet: 0.3, check: 0.7 };
  }
  // Non-suited overpairs
  if (isPair && row <= 5) return { bet: 0.35, check: 0.65 };
  // Mostly check on monotone without flush draw
  if (r1 === 'A' || r2 === 'A') return { bet: 0.3, check: 0.7 };
  return { bet: 0.15, check: 0.85 };
}

// 5. Paired: K♠K♥5♦ — high cbet (~65%)
function pairedCbet(row: number, col: number) {
  const h = handLabel(row, col);
  const r1 = RANKS[row], r2 = RANKS[col];
  const isPair = row === col;
  const isSuited = row < col;

  // Trips or full house
  if (r1 === 'K' || r2 === 'K') return { bet: 0.9, check: 0.1 };
  // Overpair AA
  if (isPair && row === 0) return { bet: 0.85, check: 0.15 };
  // Medium+ pairs
  if (isPair && row <= 4) return { bet: 0.55, check: 0.45 };
  // Ace high
  if (r1 === 'A' || r2 === 'A') return { bet: 0.65, check: 0.35 };
  // Small pairs
  if (isPair) return { bet: 0.35, check: 0.65 };
  // Broadway
  if (row <= 3 && col <= 3) return { bet: 0.5, check: 0.5 };
  return { bet: 0.3, check: 0.7 };
}

// 6. Low Connected: 8♠7♥6♦ — mostly check (~30% cbet)
function lowConnectedCbet(row: number, col: number) {
  const h = handLabel(row, col);
  const r1 = RANKS[row], r2 = RANKS[col];
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
  if (r1 === 'A' || r2 === 'A') return { bet: 0.35, check: 0.65 };
  if (r1 === 'K' || r2 === 'K') return { bet: 0.3, check: 0.7 };
  // Draws
  if (isSuited && Math.abs(row - col) <= 2 && row >= 4) return { bet: 0.4, check: 0.6 };
  return { bet: 0.2, check: 0.8 };
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

export function getPostflopCharts(depth: StackDepth): ChartDef[] {
  // No postflop cbet ranges at shallow stacks
  if (depth === 15) return [];
  if (depth === 25) return [];
  if (depth === 40) return [];

  const is60 = depth === 60;
  const tag = `${depth}bb`;

  return [
    {
      position: 'BTN', situation: 'Postflop Cbet', vsPosition: 'BB', category: 'Postflop Cbet',
      description: `BTN Cbet on A72r (Dry High) [${tag}]`,
      flopTexture: 'A72r',
      stackDepth: depth,
      actionTypes: POSTFLOP_CBET_ACTIONS,
      ranges: is60 ? dryHighCbet60 : dryHighCbet,
    },
    {
      position: 'BTN', situation: 'Postflop Cbet', vsPosition: 'BB', category: 'Postflop Cbet',
      description: `BTN Cbet on K83r (Dry Mid) [${tag}]`,
      flopTexture: 'K83r',
      stackDepth: depth,
      actionTypes: POSTFLOP_CBET_ACTIONS,
      ranges: is60 ? dryMidCbet60 : dryMidCbet,
    },
    {
      position: 'BTN', situation: 'Postflop Cbet', vsPosition: 'BB', category: 'Postflop Cbet',
      description: `BTN Cbet on QJT (Wet Broadway) [${tag}]`,
      flopTexture: 'QJT',
      stackDepth: depth,
      actionTypes: POSTFLOP_CBET_ACTIONS,
      ranges: is60 ? wetBroadwayCbet60 : wetBroadwayCbet,
    },
    {
      position: 'BTN', situation: 'Postflop Cbet', vsPosition: 'BB', category: 'Postflop Cbet',
      description: `BTN Cbet on 963ss (Monotone) [${tag}]`,
      flopTexture: '963ss',
      stackDepth: depth,
      actionTypes: POSTFLOP_CBET_ACTIONS,
      ranges: is60 ? monotoneCbet60 : monotoneCbet,
    },
    {
      position: 'BTN', situation: 'Postflop Cbet', vsPosition: 'BB', category: 'Postflop Cbet',
      description: `BTN Cbet on KK5 (Paired) [${tag}]`,
      flopTexture: 'KK5',
      stackDepth: depth,
      actionTypes: POSTFLOP_CBET_ACTIONS,
      ranges: is60 ? pairedCbet60 : pairedCbet,
    },
    {
      position: 'BTN', situation: 'Postflop Cbet', vsPosition: 'BB', category: 'Postflop Cbet',
      description: `BTN Cbet on 876 (Low Connected) [${tag}]`,
      flopTexture: '876',
      stackDepth: depth,
      actionTypes: POSTFLOP_CBET_ACTIONS,
      ranges: is60 ? lowConnectedCbet60 : lowConnectedCbet,
    },
  ];
}

// Backward compatibility
export const POSTFLOP_CHARTS = getPostflopCharts(100);
