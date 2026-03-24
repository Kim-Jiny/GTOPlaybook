import { Player, SidePot } from './types';

export function calculatePots(players: Player[]): { mainPot: number; sidePots: SidePot[] } {
  const activePlayers = players
    .filter((p) => !p.folded)
    .sort((a, b) => a.bet - b.bet);

  if (activePlayers.length === 0) {
    return { mainPot: 0, sidePots: [] };
  }

  const allBets = players.map((p) => p.bet);
  const sidePots: SidePot[] = [];
  let processed = 0;

  // Get unique bet levels from active (non-folded) all-in players
  const allInBets = activePlayers
    .filter((p) => p.allIn)
    .map((p) => p.bet)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => a - b);

  // Add max bet as final level
  const maxBet = Math.max(...allBets);
  const levels = [...allInBets, maxBet].filter((v, i, a) => a.indexOf(v) === i);

  for (const level of levels) {
    const contribution = level - processed;
    if (contribution <= 0) continue;

    let potAmount = 0;
    const eligible: string[] = [];

    for (const player of players) {
      const playerContribution = Math.min(player.bet - processed, contribution);
      if (playerContribution > 0) {
        potAmount += playerContribution;
      }
      if (!player.folded && player.bet >= level) {
        eligible.push(player.id);
      }
    }

    // Players who bet this level but didn't fold are also eligible
    for (const player of players) {
      if (!player.folded && player.bet >= processed && !eligible.includes(player.id)) {
        eligible.push(player.id);
      }
    }

    if (potAmount > 0) {
      sidePots.push({ amount: potAmount, eligible: [...new Set(eligible)] });
    }
    processed = level;
  }

  // Merge pots with same eligible players
  const mergedPots: SidePot[] = [];
  for (const pot of sidePots) {
    const eligibleKey = pot.eligible.sort().join(',');
    const existing = mergedPots.find(
      (p) => p.eligible.sort().join(',') === eligibleKey,
    );
    if (existing) {
      existing.amount += pot.amount;
    } else {
      mergedPots.push(pot);
    }
  }

  const mainPot = mergedPots.length > 0 ? mergedPots[0].amount : 0;
  return { mainPot, sidePots: mergedPots };
}
