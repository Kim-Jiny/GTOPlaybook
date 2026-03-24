import { ChartDef, STACK_TIERS, PLAYER_COUNTS } from './helpers';
import { getShortStackCharts } from './shortStackRanges';
import { getRfiCharts } from './rfiRanges';
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
