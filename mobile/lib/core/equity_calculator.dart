import 'dart:math';
import 'package:flutter/foundation.dart';
import '../models/card.dart';
import '../models/equity_result.dart';

class _HandRank {
  static const highCard = 0;
  static const pair = 1;
  static const twoPair = 2;
  static const threeKind = 3;
  static const straight = 4;
  static const flush = 5;
  static const fullHouse = 6;
  static const fourKind = 7;
  static const straightFlush = 8;
}

class EquityCalculator {
  static const _rankOrder = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
    '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
  };

  static int _rankVal(String r) => _rankOrder[r] ?? 0;

  /// Evaluate 5-card hand → (category, kickers) encoded as single int for comparison.
  static int _eval5(List<int> ranks, List<String> suits) {
    final sorted = List<int>.from(ranks)..sort((a, b) => b - a);
    final isFlush = suits.toSet().length == 1;

    // Check straight
    bool isStraight = false;
    int straightHigh = 0;
    if (sorted[0] - sorted[4] == 4 && sorted.toSet().length == 5) {
      isStraight = true;
      straightHigh = sorted[0];
    }
    // Ace-low straight (A-2-3-4-5)
    if (sorted[0] == 14 && sorted[1] == 5 && sorted[2] == 4 && sorted[3] == 3 && sorted[4] == 2) {
      isStraight = true;
      straightHigh = 5;
    }

    if (isStraight && isFlush) return _encode(_HandRank.straightFlush, [straightHigh]);
    if (isFlush) return _encode(_HandRank.flush, sorted);
    if (isStraight) return _encode(_HandRank.straight, [straightHigh]);

    // Count rank frequencies
    final freq = <int, int>{};
    for (final r in sorted) {
      freq[r] = (freq[r] ?? 0) + 1;
    }

    final groups = freq.entries.toList()
      ..sort((a, b) {
        final c = b.value.compareTo(a.value);
        return c != 0 ? c : b.key.compareTo(a.key);
      });

    if (groups[0].value == 4) {
      return _encode(_HandRank.fourKind, [groups[0].key, groups[1].key]);
    }
    if (groups[0].value == 3 && groups[1].value == 2) {
      return _encode(_HandRank.fullHouse, [groups[0].key, groups[1].key]);
    }
    if (groups[0].value == 3) {
      return _encode(_HandRank.threeKind, [groups[0].key, groups[1].key, groups[2].key]);
    }
    if (groups[0].value == 2 && groups[1].value == 2) {
      final p1 = max(groups[0].key, groups[1].key);
      final p2 = min(groups[0].key, groups[1].key);
      return _encode(_HandRank.twoPair, [p1, p2, groups[2].key]);
    }
    if (groups[0].value == 2) {
      return _encode(_HandRank.pair, [groups[0].key, groups[1].key, groups[2].key, groups[3].key]);
    }

    return _encode(_HandRank.highCard, sorted);
  }

  static int _encode(int category, List<int> kickers) {
    int val = category * 100000000;
    for (int i = 0; i < kickers.length && i < 5; i++) {
      val += kickers[i] * pow(16, 4 - i).toInt();
    }
    return val;
  }

  /// Evaluate the best 5-card hand from 5, 6, or 7 cards.
  static int evaluateHand(List<PlayingCard> cards) {
    final n = cards.length;
    int best = 0;
    // Generate all C(n,5) combinations
    for (int i = 0; i < n - 4; i++) {
      for (int j = i + 1; j < n - 3; j++) {
        for (int k = j + 1; k < n - 2; k++) {
          for (int l = k + 1; l < n - 1; l++) {
            for (int m = l + 1; m < n; m++) {
              final five = [cards[i], cards[j], cards[k], cards[l], cards[m]];
              final ranks = five.map((c) => _rankVal(c.rank)).toList();
              final suits = five.map((c) => c.suit).toList();
              final val = _eval5(ranks, suits);
              if (val > best) best = val;
            }
          }
        }
      }
    }
    return best;
  }

  /// Expand a hand notation like "AKs" into all suited combos, "AKo" into offsuit, "AA" into pairs.
  static List<List<PlayingCard>> expandHandNotation(String hand) {
    final combos = <List<PlayingCard>>[];
    if (hand.length < 2) return combos;

    final r1 = hand[0];
    final r2 = hand[1];
    final suffix = hand.length > 2 ? hand[2] : '';

    if (r1 == r2) {
      // Pair
      for (int i = 0; i < 4; i++) {
        for (int j = i + 1; j < 4; j++) {
          combos.add([
            PlayingCard(rank: r1, suit: PlayingCard.suits[i]),
            PlayingCard(rank: r2, suit: PlayingCard.suits[j]),
          ]);
        }
      }
    } else if (suffix == 's') {
      for (final s in PlayingCard.suits) {
        combos.add([
          PlayingCard(rank: r1, suit: s),
          PlayingCard(rank: r2, suit: s),
        ]);
      }
    } else {
      // Offsuit
      for (int i = 0; i < 4; i++) {
        for (int j = 0; j < 4; j++) {
          if (i != j) {
            combos.add([
              PlayingCard(rank: r1, suit: PlayingCard.suits[i]),
              PlayingCard(rank: r2, suit: PlayingCard.suits[j]),
            ]);
          }
        }
      }
    }
    return combos;
  }

  /// Run Monte Carlo simulation in an isolate.
  static Future<EquityResult> calculate({
    required List<PlayerInput> players,
    required List<PlayingCard> board,
    int simulations = 10000,
  }) async {
    final data = _SimInput(
      playerCards: players.map((p) => p.inputMode == InputMode.cards ? p.cards.map((c) => c.toString()).toList() : <String>[]).toList(),
      playerRanges: players.map((p) => p.inputMode == InputMode.range ? p.range.toList() : <String>[]).toList(),
      board: board.map((c) => c.toString()).toList(),
      simulations: simulations,
    );

    return compute(_runSimulation, data);
  }

  static EquityResult _runSimulation(_SimInput input) {
    final rng = Random();
    final numPlayers = input.playerCards.length;
    final wins = List<double>.filled(numPlayers, 0);
    final ties = List<double>.filled(numPlayers, 0);
    int validSims = 0;

    final boardCards = input.board.map((s) => PlayingCard.fromString(s)).toList();

    // Parse fixed player cards
    final fixedHands = <int, List<PlayingCard>>{};
    for (int i = 0; i < numPlayers; i++) {
      if (input.playerCards[i].isNotEmpty) {
        fixedHands[i] = input.playerCards[i].map((s) => PlayingCard.fromString(s)).toList();
      }
    }

    // Parse range combos
    final rangeCombos = <int, List<List<PlayingCard>>>{};
    for (int i = 0; i < numPlayers; i++) {
      if (input.playerRanges[i].isNotEmpty) {
        final allCombos = <List<PlayingCard>>[];
        for (final hand in input.playerRanges[i]) {
          allCombos.addAll(expandHandNotation(hand));
        }
        rangeCombos[i] = allCombos;
      }
    }

    final fullDeck = PlayingCard.deck();

    for (int sim = 0; sim < input.simulations; sim++) {
      // Collect known cards
      final used = <PlayingCard>{...boardCards};
      for (final h in fixedHands.values) {
        used.addAll(h);
      }

      // Assign range players
      final simHands = <int, List<PlayingCard>>{};
      bool valid = true;
      for (final entry in rangeCombos.entries) {
        final available = entry.value.where((combo) => !combo.any((c) => used.contains(c))).toList();
        if (available.isEmpty) {
          valid = false;
          break;
        }
        final chosen = available[rng.nextInt(available.length)];
        simHands[entry.key] = chosen;
        used.addAll(chosen);
      }
      if (!valid) continue;

      // Remaining deck
      final remaining = fullDeck.where((c) => !used.contains(c)).toList()..shuffle(rng);

      // Deal remaining board cards
      final simBoard = List<PlayingCard>.from(boardCards);
      int deckIdx = 0;
      while (simBoard.length < 5) {
        simBoard.add(remaining[deckIdx++]);
      }

      // Evaluate each player
      final scores = <int>[];
      for (int i = 0; i < numPlayers; i++) {
        final hand = fixedHands[i] ?? simHands[i] ?? [];
        if (hand.length < 2) {
          valid = false;
          break;
        }
        scores.add(evaluateHand([...hand, ...simBoard]));
      }
      if (!valid) continue;

      validSims++;
      final maxScore = scores.reduce(max);
      final winners = <int>[];
      for (int i = 0; i < numPlayers; i++) {
        if (scores[i] == maxScore) winners.add(i);
      }

      if (winners.length == 1) {
        wins[winners[0]] += 1;
      } else {
        for (final w in winners) {
          ties[w] += 1;
        }
      }
    }

    if (validSims == 0) {
      return EquityResult(
        equities: List.filled(numPlayers, 0),
        tieRates: List.filled(numPlayers, 0),
        simulations: 0,
        errorMessage: 'No valid simulation could be generated from the selected cards and ranges.',
      );
    }

    return EquityResult(
      equities: List.generate(numPlayers, (i) => (wins[i] + ties[i] / 2) / validSims * 100),
      tieRates: List.generate(numPlayers, (i) => ties[i] / validSims * 100),
      simulations: validSims,
    );
  }
}

class _SimInput {
  final List<List<String>> playerCards;
  final List<List<String>> playerRanges;
  final List<String> board;
  final int simulations;

  _SimInput({
    required this.playerCards,
    required this.playerRanges,
    required this.board,
    required this.simulations,
  });
}
