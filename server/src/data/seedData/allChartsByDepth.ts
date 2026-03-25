import { ChartDef, STACK_TIERS, PLAYER_COUNTS } from './helpers';
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

export function getAllCharts(): ChartDef[] {
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
