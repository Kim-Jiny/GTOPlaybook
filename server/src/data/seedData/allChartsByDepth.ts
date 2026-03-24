import { ChartDef, STACK_TIERS } from './helpers';
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

  for (const depth of STACK_TIERS) {
    all.push(
      ...getShortStackCharts(depth),
      ...getRfiCharts(depth),
      ...getThreeBetCharts(depth),
      ...getVs3betCharts(depth),
      ...getBbDefendCharts(depth),
      ...getSbDefendCharts(depth),
      ...getFacing4betCharts(depth),
      ...getPostflopCharts(depth),
    );
  }

  return all;
}
