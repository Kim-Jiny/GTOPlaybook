import { Server } from 'socket.io';
import { RoomManager } from './roomManager';
import { GameState, GamePhase, Player, PlayerAction, Card, SidePot } from '../game/types';
import { createDeck, shuffle, deal, cardToString } from '../game/deck';
import { evaluateHand, compareHands } from '../game/handEvaluator';
import { calculatePots } from '../game/potManager';
import pool from '../config/db';

const TURN_TIMEOUT = 30_000; // 30 seconds

export class HoldemGame {
  private games = new Map<string, GameState>();
  private io: Server | null = null;

  constructor(private roomManager: RoomManager) {}

  setIo(io: Server) {
    this.io = io;
  }

  startGame(roomId: string, io: Server) {
    const config = this.roomManager.getRoomConfig(roomId);
    if (!config) return;

    const players = this.roomManager.getPlayersInRoom(roomId);
    if (players.size < 2) return;

    this.roomManager.setRoomStatus(roomId, 'playing');
    this.roomManager.clearReady(roomId);

    const existingGame = this.games.get(roomId);
    const seatOrder = Array.from(players.keys());

    // Reset players for new hand
    for (const player of players.values()) {
      player.bet = 0;
      player.holeCards = [];
      player.folded = false;
      player.allIn = false;
    }

    const dealerIndex = existingGame
      ? (existingGame.dealerIndex + 1) % seatOrder.length
      : 0;

    const state: GameState = {
      roomId,
      phase: 'PREFLOP',
      players,
      seatOrder,
      deck: shuffle(createDeck()),
      communityCards: [],
      pot: 0,
      sidePots: [],
      currentPlayerIndex: 0,
      dealerIndex,
      smallBlind: config.smallBlind,
      bigBlind: config.bigBlind,
      currentBet: config.bigBlind,
      minRaise: config.bigBlind,
      handNumber: (existingGame?.handNumber || 0) + 1,
    };

    this.games.set(roomId, state);

    // Post blinds
    this.postBlinds(state);

    // Deal hole cards
    this.dealHoleCards(state);

    // Set current player (UTG = after BB)
    const bbIdx = (dealerIndex + 2) % seatOrder.length;
    state.currentPlayerIndex = (bbIdx + 1) % seatOrder.length;

    // Emit game start
    this.broadcastGameState(roomId, io);

    // Send private hole cards to each player
    for (const [uid, player] of players) {
      const socketId = this.roomManager.getSocketId(roomId, uid);
      if (socketId) {
        io.to(socketId).emit('game:deal', {
          holeCards: player.holeCards.map(cardToString),
        });
      }
    }

    // Start turn timer
    this.startTurnTimer(state, io);
  }

  private postBlinds(state: GameState) {
    const { seatOrder, dealerIndex, players, smallBlind, bigBlind } = state;
    const sbIdx = (dealerIndex + 1) % seatOrder.length;
    const bbIdx = (dealerIndex + 2) % seatOrder.length;

    const sbPlayer = players.get(seatOrder[sbIdx])!;
    const bbPlayer = players.get(seatOrder[bbIdx])!;

    const sbAmount = Math.min(smallBlind, sbPlayer.chips);
    sbPlayer.chips -= sbAmount;
    sbPlayer.bet = sbAmount;
    if (sbPlayer.chips === 0) sbPlayer.allIn = true;

    const bbAmount = Math.min(bigBlind, bbPlayer.chips);
    bbPlayer.chips -= bbAmount;
    bbPlayer.bet = bbAmount;
    if (bbPlayer.chips === 0) bbPlayer.allIn = true;

    state.pot = sbAmount + bbAmount;
  }

  private dealHoleCards(state: GameState) {
    for (const uid of state.seatOrder) {
      const player = state.players.get(uid)!;
      const { dealt, remaining } = deal(state.deck, 2);
      player.holeCards = dealt;
      state.deck = remaining;
    }
  }

  handleAction(roomId: string, uid: string, action: string, amount: number, io: Server) {
    const state = this.games.get(roomId);
    if (!state || state.phase === 'WAITING' || state.phase === 'SHOWDOWN') return;

    const currentUid = state.seatOrder[state.currentPlayerIndex];
    if (currentUid !== uid) return; // Not this player's turn

    const player = state.players.get(uid)!;
    if (player.folded || player.allIn) return;

    // Clear turn timer
    if (state.turnTimer) clearTimeout(state.turnTimer);

    switch (action as PlayerAction) {
      case 'fold':
        player.folded = true;
        break;

      case 'check':
        if (player.bet < state.currentBet) return; // Can't check
        break;

      case 'call': {
        const toCall = Math.min(state.currentBet - player.bet, player.chips);
        player.chips -= toCall;
        player.bet += toCall;
        state.pot += toCall;
        if (player.chips === 0) player.allIn = true;
        break;
      }

      case 'raise': {
        const raiseAmount = Math.max(amount, state.currentBet + state.minRaise);
        const totalBet = Math.min(raiseAmount, player.bet + player.chips);
        const additional = totalBet - player.bet;
        player.chips -= additional;
        state.pot += additional;
        state.minRaise = totalBet - state.currentBet;
        state.currentBet = totalBet;
        player.bet = totalBet;
        if (player.chips === 0) player.allIn = true;
        break;
      }

      case 'all_in': {
        const allInAmount = player.chips;
        player.chips = 0;
        state.pot += allInAmount;
        player.bet += allInAmount;
        player.allIn = true;
        if (player.bet > state.currentBet) {
          state.minRaise = player.bet - state.currentBet;
          state.currentBet = player.bet;
        }
        break;
      }

      default:
        return;
    }

    state.lastAction = { playerId: uid, action: action as PlayerAction, amount };

    io.to(roomId).emit('game:action', {
      playerId: uid,
      action,
      amount,
      pot: state.pot,
    });

    // Check if hand is over (all but one folded)
    const activePlayers = Array.from(state.players.values()).filter((p) => !p.folded);
    if (activePlayers.length === 1) {
      this.awardPot(state, io);
      return;
    }

    // Check if betting round is complete
    if (this.isBettingRoundComplete(state)) {
      this.advancePhase(state, io);
    } else {
      this.advanceToNextPlayer(state);
      this.broadcastGameState(roomId, io);
      this.startTurnTimer(state, io);
    }
  }

  private isBettingRoundComplete(state: GameState): boolean {
    const active = Array.from(state.players.values()).filter(
      (p) => !p.folded && !p.allIn,
    );
    if (active.length === 0) return true;
    return active.every((p) => p.bet === state.currentBet);
  }

  private advanceToNextPlayer(state: GameState) {
    let idx = state.currentPlayerIndex;
    const n = state.seatOrder.length;
    for (let i = 0; i < n; i++) {
      idx = (idx + 1) % n;
      const player = state.players.get(state.seatOrder[idx])!;
      if (!player.folded && !player.allIn) {
        state.currentPlayerIndex = idx;
        return;
      }
    }
  }

  private advancePhase(state: GameState, io: Server) {
    // Reset bets for new round
    for (const player of state.players.values()) {
      player.bet = 0;
    }
    state.currentBet = 0;
    state.minRaise = state.bigBlind;

    const phases: GamePhase[] = ['PREFLOP', 'FLOP', 'TURN', 'RIVER', 'SHOWDOWN'];
    const currentIdx = phases.indexOf(state.phase);
    state.phase = phases[currentIdx + 1];

    switch (state.phase) {
      case 'FLOP': {
        const { dealt, remaining } = deal(state.deck, 3);
        state.communityCards = dealt;
        state.deck = remaining;
        break;
      }
      case 'TURN':
      case 'RIVER': {
        const { dealt, remaining } = deal(state.deck, 1);
        state.communityCards.push(...dealt);
        state.deck = remaining;
        break;
      }
      case 'SHOWDOWN':
        this.showdown(state, io);
        return;
    }

    io.to(state.roomId).emit('game:community', {
      phase: state.phase,
      communityCards: state.communityCards.map(cardToString),
    });

    // Set current player to first active after dealer
    state.currentPlayerIndex = state.dealerIndex;
    this.advanceToNextPlayer(state);

    // Check if all remaining players are all-in
    const active = Array.from(state.players.values()).filter((p) => !p.folded && !p.allIn);
    if (active.length <= 1) {
      // Run out remaining community cards
      this.runOutBoard(state, io);
      return;
    }

    this.broadcastGameState(state.roomId, io);
    this.startTurnTimer(state, io);
  }

  private runOutBoard(state: GameState, io: Server) {
    while (state.communityCards.length < 5) {
      const { dealt, remaining } = deal(state.deck, 1);
      state.communityCards.push(...dealt);
      state.deck = remaining;
    }

    io.to(state.roomId).emit('game:community', {
      phase: 'SHOWDOWN',
      communityCards: state.communityCards.map(cardToString),
    });

    state.phase = 'SHOWDOWN';
    this.showdown(state, io);
  }

  private showdown(state: GameState, io: Server) {
    const activePlayers = Array.from(state.players.values()).filter((p) => !p.folded);
    const { sidePots } = calculatePots(Array.from(state.players.values()));
    const pots = sidePots.length > 0 ? sidePots : [{ amount: state.pot, eligible: activePlayers.map((p) => p.id) }];

    const results: Array<{
      playerId: string;
      holeCards: string[];
      handDescription: string;
      winnings: number;
    }> = [];

    const winnings = new Map<string, number>();

    for (const pot of pots) {
      const eligible = activePlayers.filter((p) => pot.eligible.includes(p.id));
      if (eligible.length === 0) continue;

      // Evaluate hands
      const evaluated = eligible.map((p) => ({
        player: p,
        hand: evaluateHand([...p.holeCards, ...state.communityCards]),
      }));

      // Sort by hand value (best first)
      evaluated.sort((a, b) => compareHands(b.hand, a.hand));

      // Find winners (may tie)
      const bestValue = evaluated[0].hand.value;
      const winners = evaluated.filter((e) => e.hand.value === bestValue);
      const share = Math.floor(pot.amount / winners.length);

      for (const winner of winners) {
        winner.player.chips += share;
        winnings.set(winner.player.id, (winnings.get(winner.player.id) || 0) + share);
      }

      for (const e of evaluated) {
        if (!results.find((r) => r.playerId === e.player.id)) {
          results.push({
            playerId: e.player.id,
            holeCards: e.player.holeCards.map(cardToString),
            handDescription: e.hand.description,
            winnings: 0,
          });
        }
      }
    }

    // Apply winnings to results
    for (const r of results) {
      r.winnings = winnings.get(r.playerId) || 0;
    }

    const winnerIds = Array.from(winnings.entries())
      .filter(([, w]) => w > 0)
      .map(([id]) => id);

    io.to(state.roomId).emit('game:showdown', {
      results,
      communityCards: state.communityCards.map(cardToString),
      winners: winnerIds,
    });

    // Save hand to DB
    this.saveHand(state, results, winnerIds).catch(console.error);

    // Update stats
    this.updateStats(state, winnerIds).catch(console.error);

    // Remove busted players, start new hand after delay
    setTimeout(() => {
      this.cleanupAndStartNewHand(state.roomId, io);
    }, 5_000);
  }

  private awardPot(state: GameState, io: Server) {
    const winner = Array.from(state.players.values()).find((p) => !p.folded)!;
    winner.chips += state.pot;

    io.to(state.roomId).emit('game:showdown', {
      results: [{
        playerId: winner.id,
        holeCards: [],
        handDescription: 'Everyone folded',
        winnings: state.pot,
      }],
      communityCards: state.communityCards.map(cardToString),
      winners: [winner.id],
    });

    this.saveHand(state, [{ playerId: winner.id, holeCards: [], handDescription: 'Fold win', winnings: state.pot }], [winner.id]).catch(console.error);
    this.updateStats(state, [winner.id]).catch(console.error);

    setTimeout(() => {
      this.cleanupAndStartNewHand(state.roomId, io);
    }, 3_000);
  }

  private cleanupAndStartNewHand(roomId: string, io: Server) {
    const state = this.games.get(roomId);
    if (!state) return;

    // Remove busted players
    for (const [uid, player] of state.players) {
      if (player.chips <= 0) {
        this.roomManager.removePlayer(roomId, uid);
        const socketId = this.roomManager.getSocketId(roomId, uid);
        if (socketId) {
          io.to(socketId).emit('game:busted', { message: 'You ran out of chips' });
        }
      }
    }

    const remaining = this.roomManager.getPlayerCount(roomId);
    if (remaining < 2) {
      this.roomManager.setRoomStatus(roomId, 'waiting');
      this.roomManager.clearReady(roomId);
      this.games.delete(roomId);
      io.to(roomId).emit('game:ended', { reason: 'Not enough players' });
      io.emit('room:updated', this.roomManager.listRooms());
      return;
    }

    // Auto-start next hand
    this.startGame(roomId, io);
  }

  private startTurnTimer(state: GameState, io: Server) {
    if (state.turnTimer) clearTimeout(state.turnTimer);

    const currentUid = state.seatOrder[state.currentPlayerIndex];
    io.to(state.roomId).emit('game:turn', {
      playerId: currentUid,
      timeLimit: TURN_TIMEOUT,
    });

    state.turnTimer = setTimeout(() => {
      // Auto-fold on timeout
      this.handleAction(state.roomId, currentUid, 'fold', 0, io);
    }, TURN_TIMEOUT);
  }

  private async saveHand(state: GameState, results: any[], winnerIds: string[]) {
    try {
      await pool.query(
        `INSERT INTO game_hands (room_id, hand_number, community_cards, pot, winners, summary)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          state.roomId,
          state.handNumber,
          state.communityCards.map(cardToString),
          state.pot,
          winnerIds,
          JSON.stringify({
            players: Array.from(state.players.keys()),
            results,
          }),
        ],
      );
    } catch (err) {
      console.error('Failed to save hand:', err);
    }
  }

  private async updateStats(state: GameState, winnerIds: string[]) {
    for (const uid of state.players.keys()) {
      const won = winnerIds.includes(uid) ? 1 : 0;
      const winAmount = winnerIds.includes(uid) ? Math.floor(state.pot / winnerIds.length) : 0;
      try {
        await pool.query(
          `UPDATE player_stats SET
             hands_played = hands_played + 1,
             hands_won = hands_won + $2,
             total_winnings = total_winnings + $3,
             biggest_pot = GREATEST(biggest_pot, $4),
             updated_at = NOW()
           WHERE user_id = $1`,
          [uid, won, winAmount, state.pot],
        );
      } catch (err) {
        console.error('Failed to update stats:', err);
      }
    }
  }

  getClientState(roomId: string, requestingUid: string): any {
    const state = this.games.get(roomId);
    if (!state) return null;

    const players = Array.from(state.players.values()).map((p) => ({
      id: p.id,
      displayName: p.displayName,
      seatIndex: p.seatIndex,
      chips: p.chips,
      bet: p.bet,
      folded: p.folded,
      allIn: p.allIn,
      connected: p.connected,
      holeCards: p.id === requestingUid ? p.holeCards.map(cardToString) : undefined,
    }));

    return {
      roomId: state.roomId,
      phase: state.phase,
      players,
      communityCards: state.communityCards.map(cardToString),
      pot: state.pot,
      currentPlayerId: state.seatOrder[state.currentPlayerIndex],
      dealerIndex: state.dealerIndex,
      currentBet: state.currentBet,
      handNumber: state.handNumber,
    };
  }

  broadcastGameState(roomId: string, io: Server) {
    const state = this.games.get(roomId);
    if (!state) return;

    // Send sanitized state to each player (hide others' hole cards)
    for (const uid of state.players.keys()) {
      const socketId = this.roomManager.getSocketId(roomId, uid);
      if (socketId) {
        io.to(socketId).emit('game:state', this.getClientState(roomId, uid));
      }
    }
  }
}
