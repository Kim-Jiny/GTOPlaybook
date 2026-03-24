export type Suit = 'h' | 'd' | 'c' | 's';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export type HandRank =
  | 'high_card'
  | 'pair'
  | 'two_pair'
  | 'three_of_a_kind'
  | 'straight'
  | 'flush'
  | 'full_house'
  | 'four_of_a_kind'
  | 'straight_flush'
  | 'royal_flush';

export interface EvaluatedHand {
  rank: HandRank;
  value: number; // numeric score for comparison
  cards: Card[]; // best 5 cards
  description: string;
}

export type GamePhase = 'WAITING' | 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN';
export type PlayerAction = 'fold' | 'check' | 'call' | 'raise' | 'all_in';

export interface Player {
  id: string;
  displayName: string;
  seatIndex: number;
  chips: number;
  bet: number;
  holeCards: Card[];
  folded: boolean;
  allIn: boolean;
  connected: boolean;
  disconnectedAt?: number;
}

export interface SidePot {
  amount: number;
  eligible: string[]; // player IDs
}

export interface GameState {
  roomId: string;
  phase: GamePhase;
  players: Map<string, Player>;
  seatOrder: string[]; // player IDs in seat order
  deck: Card[];
  communityCards: Card[];
  pot: number;
  sidePots: SidePot[];
  currentPlayerIndex: number;
  dealerIndex: number;
  smallBlind: number;
  bigBlind: number;
  currentBet: number;
  minRaise: number;
  handNumber: number;
  turnTimer?: NodeJS.Timeout;
  lastAction?: { playerId: string; action: PlayerAction; amount: number };
}

export interface RoomConfig {
  id: string;
  name: string;
  maxPlayers: number;
  smallBlind: number;
  bigBlind: number;
  createdBy: string;
}

export interface RoomInfo {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  smallBlind: number;
  bigBlind: number;
  status: string;
}
