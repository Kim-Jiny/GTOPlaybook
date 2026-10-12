/**
 * Explicit 100bb BB defence vs a single open (3bet / call, fold is the rest).
 *
 * Shapes are authored per opener class; `target` is the fraction of ALL hands the
 * BB continues with (3bet + call) and is fitted by scaling the calling range.
 * 60bb and 40bb derive from the same shapes with a lower target.
 */
import { FreqTable, parseRange, monotoneTable, fitCalls, fitMixed } from './rfiTables';

export interface BbDefendEntry {
  threeBet: FreqTable;
  call: FreqTable;
}

type OpenerCls = 'ep-tight' | 'hj' | 'co' | 'btn' | 'sb';

interface Shape {
  threeBet: string;
  call: string;
  target: number; // continue share of all hands at 100bb
  threeBetTarget: number; // 3bet share of all hands at 100bb
}

const SHAPES: Record<OpenerCls, Shape> = {
  'ep-tight': {
    target: 0.30,
    threeBetTarget: 0.045,
    threeBet: 'AA KK QQ:0.6 JJ:0.1 AKs AKo:0.55 A5s:0.4 A4s:0.2 TT:0.05 AQs:0.1 AQo:0.1 KQs:0.05 A3s:0.1 A2s:0.1 K5s:0.1',
    call: `QQ:0.4 JJ:0.9 TT 99 88 77 66 55:0.9 44:0.8 33:0.7 22:0.6 AKo:0.45
      AQs AQo:0.9 AJs ATs A9s A8s:0.6 A7s:0.5 A6s:0.4 A5s:0.55 A4s:0.7 A3s:0.5 A2s:0.4
      AJo:0.7 ATo:0.3 KQs KJs KTs K9s:0.6 K8s:0.2 K7s:0.2 K6s:0.2 K5s:0.2
      KQo:0.9 KJo:0.45 KTo:0.15 QJs QTs Q9s:0.7 Q8s:0.2 QJo:0.4
      JTs J9s:0.7 J8s:0.2 JTo:0.3 T9s T8s:0.5 98s 97s:0.4 87s 86s:0.4 76s 75s:0.3 65s 64s:0.2 54s:0.8
      A4o:0.1 A3o:0.1 A2o:0.1 K9o:0.15 K4s:0.1 K3s:0.1 K2s:0.1 Q7s:0.1 Q6s:0.1 J7s:0.1 T7s:0.1 96s:0.1 85s:0.1 74s:0.1 63s:0.1 53s:0.15 43s:0.15 Q9o:0.1 J9o:0.15 T8o:0.1 98o:0.15 87o:0.1 A9o:0.15 A8o:0.1 KTo:0.2 QTo:0.2 K8o:0.1`,
  },
  hj: {
    target: 0.34,
    threeBetTarget: 0.055,
    threeBet: 'AA KK QQ:0.7 JJ:0.15 AKs AKo:0.65 A5s:0.45 A4s:0.25 TT:0.08 AQs:0.15 AQo:0.15 KQs:0.08 A3s:0.12 A2s:0.1 K5s:0.1 76s:0.05',
    call: `QQ:0.3 JJ:0.85 TT 99 88 77 66 55 44:0.9 33:0.8 22:0.7 AKo:0.35
      AQs AQo AJs ATs A9s A8s:0.7 A7s:0.6 A6s:0.5 A5s:0.5 A4s:0.65 A3s:0.55 A2s:0.5
      AJo:0.8 ATo:0.45 A9o:0.1 KQs KJs KTs K9s:0.75 K8s:0.3 K7s:0.3 K6s:0.3 K5s:0.3 K4s:0.1
      KQo KJo:0.6 KTo:0.25 QJs QTs Q9s:0.8 Q8s:0.3 QJo:0.5 QTo:0.15
      JTs J9s:0.8 J8s:0.3 JTo:0.4 T9s T8s:0.6 T9o:0.15
      98s 97s:0.5 87s 86s:0.5 76s 75s:0.4 65s 64s:0.3 54s 53s:0.2 43s:0.15
      A4o:0.15 A3o:0.1 A2o:0.1 K9o:0.2 K3s:0.15 K2s:0.15 Q7s:0.15 Q6s:0.1 J7s:0.15 T7s:0.1 96s:0.15 85s:0.1 74s:0.1 63s:0.1 Q9o:0.15 J9o:0.2 T8o:0.15 98o:0.2 87o:0.15 A8o:0.2 K8o:0.1 K7s:0.2`,
  },
  co: {
    target: 0.41,
    threeBetTarget: 0.075,
    threeBet: 'AA KK QQ JJ:0.3 AKs AKo AQs:0.4 A5s:0.5 A4s:0.35 A3s:0.15 TT:0.15 AQo:0.3 AJs:0.15 KQs:0.1 A2s:0.2 K9s:0.1 T9s:0.05 76s:0.05',
    call: `JJ:0.7 TT 99 88 77 66 55 44 33 22:0.85 AKo:0.2 AQs:0.6 AQo AJs ATs A9s A8s
      A7s:0.8 A6s:0.7 A5s:0.5 A4s:0.6 A3s:0.8 A2s:0.7 AJo ATo:0.7 A9o:0.3 A8o:0.1
      KQs KJs KTs K9s K8s:0.6 K7s:0.5 K6s:0.5 K5s:0.45 K4s:0.3 K3s:0.2 K2s:0.2
      KQo KJo KTo:0.5 K9o:0.15 QJs QTs Q9s Q8s:0.5 Q7s:0.2 Q6s:0.2 QJo QTo:0.5 Q9o:0.1
      JTs J9s J8s:0.5 J7s:0.15 JTo:0.6 J9o:0.1 T9s T8s T7s:0.25 T9o:0.35
      98s 97s:0.7 96s:0.15 98o:0.1 87s 86s:0.7 85s:0.1 76s 75s:0.6 65s 64s:0.5 54s 53s:0.4 43s:0.3 42s:0.05
      A7o:0.15 A6o:0.1 A5o:0.15 A4o:0.15 A3o:0.1 A2o:0.1 K8o:0.15 K7o:0.1 Q8o:0.1 J8o:0.1 T8o:0.2 97o:0.1 87o:0.2 76o:0.1 Q5s:0.15 Q4s:0.1 J6s:0.1 T6s:0.1 95s:0.1 84s:0.05 73s:0.05 K2s:0.3`,
  },
  btn: {
    target: 0.52,
    threeBetTarget: 0.11,
    threeBet: 'AA KK QQ JJ TT:0.6 99:0.2 AKs AKo AQs AQo:0.6 AJs:0.3 A5s A4s:0.7 A3s:0.4 A2s:0.2 KQs:0.1 AJo:0.1 ATs:0.1 KJs:0.1 KQo:0.1 K9s:0.1 K5s:0.15 Q9s:0.05 J9s:0.05 T9s:0.1 87s:0.05 76s:0.1 65s:0.1',
    call: `TT:0.4 99:0.8 88 77 66 55 44 33 22 AQo:0.4 AJs:0.7 ATs A9s A8s A7s A6s A3s:0.6 A2s:0.8
      AJo ATo A9o:0.8 A8o:0.6 A7o:0.5 A6o:0.4 A5o:0.5 A4o:0.4 A3o:0.3 A2o:0.3
      KQs KJs KTs K9s K8s K7s K6s K5s K4s K3s K2s:0.7
      KQo KJo KTo K9o:0.8 K8o:0.4 K7o:0.2 K6o:0.1
      QJs QTs Q9s Q8s Q7s Q6s Q5s:0.7 Q4s:0.5 Q3s:0.3 Q2s:0.2 QJo QTo Q9o:0.6 Q8o:0.2
      JTs J9s J8s J7s J6s:0.5 J5s:0.3 JTo J9o:0.6 J8o:0.2
      T9s T8s T7s T6s:0.5 T9o T8o:0.5 T7o:0.1
      98s 97s 96s:0.8 95s:0.2 98o:0.8 97o:0.2 87s 86s 85s:0.5 84s:0.1 87o:0.7
      76s 75s 74s:0.4 76o:0.5 65s 64s 63s:0.3 65o:0.3 54s 53s:0.7 52s:0.1 54o:0.2 43s:0.5 42s:0.05 32s:0.1`,
  },
  sb: {
    target: 0.60,
    threeBetTarget: 0.13,
    threeBet: 'AA KK QQ JJ TT:0.7 99:0.3 AKs AKo AQs AQo:0.8 AJs:0.6 ATs:0.2 A5s A4s A3s:0.6 A2s:0.4 KQs:0.3 KJs:0.1 KQo:0.1 AJo:0.2 ATo:0.1 K9s:0.15 K5s:0.2 Q9s:0.1 J9s:0.1 T9s:0.15 87s:0.1 76s:0.15 65s:0.15 54s:0.1',
    call: `TT:0.3 99:0.7 88 77 66 55 44 33 22 AQo:0.2 AJs:0.4 ATs:0.8 A9s A8s A7s A6s A3s:0.4 A2s:0.6
      AJo ATo A9o A8o:0.8 A7o:0.7 A6o:0.6 A5o:0.7 A4o:0.6 A3o:0.5 A2o:0.5
      KQs:0.7 KJs KTs K9s K8s K7s K6s K5s K4s K3s K2s
      KQo KJo KTo K9o K8o:0.7 K7o:0.5 K6o:0.3 K5o:0.2
      QJs QTs Q9s Q8s Q7s Q6s Q5s Q4s:0.8 Q3s:0.6 Q2s:0.5 QJo QTo Q9o Q8o:0.5 Q7o:0.2
      JTs J9s J8s J7s J6s J5s:0.6 J4s:0.4 JTo J9o J8o:0.5 J7o:0.2
      T9s T8s T7s T6s T5s:0.4 T9o T8o T7o:0.3
      98s 97s 96s 95s:0.5 98o 97o:0.5 87s 86s 85s 84s:0.3 87o 86o:0.3
      76s 75s 74s:0.6 76o 75o:0.2 65s 64s 63s:0.5 65o:0.5 54s 53s 52s:0.3 54o:0.4 43s 42s:0.2 43o:0.1 32s:0.2`,
  },
};

const cache = new Map<string, BbDefendEntry>();

/** depth 100 | 60 | 40: lower depth narrows the continue share. */
export function bbDefendEntry(cls: OpenerCls, depth: 100 | 60 | 40): BbDefendEntry {
  const key = `${cls}:${depth}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const shape = SHAPES[cls];
  const factor = depth === 100 ? 1 : depth === 60 ? 0.94 : 0.85;
  const threeBet = monotoneTable(fitMixed(monotoneTable(parseRange(shape.threeBet)), shape.threeBetTarget));
  const call = fitCalls(threeBet, monotoneTable(parseRange(shape.call)), shape.target * factor);
  const entry = { threeBet, call };
  cache.set(key, entry);
  return entry;
}
