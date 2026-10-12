import { ChartDef, FreqMap, STACK_TIERS, PLAYER_COUNTS, handLabel } from './helpers';
import { getShortStackCharts } from './shortStackRanges';
import { getRfiCharts } from './rfiRanges';
import { getIsoRaiseCharts } from './isoRaiseRanges';
import { getColdCallCharts } from './coldCallRanges';
import { getFacingSqueezeCharts } from './facingSqueezeRanges';
import { getLimpedPotCharts } from './limpedPotRanges';
import { getSqueezeCharts } from './squeezeRanges';
import { getThreeBetCharts } from './threeBetRanges';
import { getVs3betCharts } from './vs3betRanges';
import { getBbDefendCharts } from './bbDefendRanges';
import { getSbDefendCharts } from './sbDefendRanges';
import { getFacing4betCharts } from './facing4betRanges';
import { getPostflopCharts } from './postflopRanges';

// Aggression order used to pick a replacement when a premium hand has no non-fold action.
const ACTION_PRIORITY = ['allin', '5bet', '4bet', '3bet', 'raise', 'bet', 'call', 'check'];

// Hands that must never fold. Smoothing (neighbour blending) and narrow call/5bet sets
// can leak fold frequency into these cells, which is never correct preflop.
const NEVER_FOLD = new Set(['AA', 'KK']);
const NEVER_FOLD_RFI = new Set(['AA', 'KK', 'QQ', 'AKs', 'AKo']);

function withoutFold(chart: ChartDef, hand: string, freqs: FreqMap): FreqMap {
  const fold = freqs['fold'] ?? 0;
  if (fold <= 0) return freqs;

  const rest = Object.entries(freqs).filter(([k, v]) => k !== 'fold' && v > 0);
  const restSum = rest.reduce((sum, [, v]) => sum + v, 0);
  if (restSum > 0) {
    // Hand the fold share back to the existing actions, proportionally.
    return Object.fromEntries(rest.map(([k, v]) => [k, Math.round((v / restSum) * 100) / 100]));
  }

  const declared = new Set(chart.actionTypes.map((a) => a.key));
  const key = ACTION_PRIORITY.find((k) => declared.has(k));
  return key ? { [key]: 1 } : freqs;
}

function enforcePremiums(chart: ChartDef): ChartDef {
  if (chart.flopTexture) return chart; // postflop charts have their own semantics
  const protectedHands = chart.situation === 'RFI' ? NEVER_FOLD_RFI : NEVER_FOLD;
  const original = chart.ranges;
  return {
    ...chart,
    ranges: (row, col) => {
      const freqs = original(row, col);
      const hand = handLabel(row, col);
      return protectedHands.has(hand) ? withoutFold(chart, hand, freqs) : freqs;
    },
  };
}

export function getAllCharts(): ChartDef[] {
  return getAllChartsRaw().map(enforcePremiums);
}

function getAllChartsRaw(): ChartDef[] {
  const all: ChartDef[] = [];

  for (const maxPlayers of PLAYER_COUNTS) {
    for (const depth of STACK_TIERS) {
      all.push(
        ...getShortStackCharts(depth, maxPlayers),
        ...getRfiCharts(depth, maxPlayers),
        ...getIsoRaiseCharts(depth, maxPlayers),
        ...getColdCallCharts(depth, maxPlayers),
        ...getSqueezeCharts(depth, maxPlayers),
        ...getFacingSqueezeCharts(depth, maxPlayers),
        ...getLimpedPotCharts(depth, maxPlayers),
        ...getThreeBetCharts(depth, maxPlayers),
        ...getVs3betCharts(depth, maxPlayers),
        ...getBbDefendCharts(depth, maxPlayers),
        ...getSbDefendCharts(depth, maxPlayers),
        ...getFacing4betCharts(depth, maxPlayers),
        ...getPostflopCharts(depth, maxPlayers),
      );
    }
  }

  return all;
}
