import 'dart:math';
import 'package:flutter/foundation.dart';
import '../models/card.dart';
import '../models/hand_analysis_result.dart';
import 'equity_calculator.dart';

class _HandRankConst {
  static const pair = 1;
  static const twoPair = 2;
  static const threeKind = 3;
}

const _categoryNamesEn = [
  'High Card',
  'Pair',
  'Two Pair',
  'Three of a Kind',
  'Straight',
  'Flush',
  'Full House',
  'Four of a Kind',
  'Straight Flush',
];

const _categoryNamesKo = [
  '하이카드',
  '원페어',
  '투페어',
  '트리플',
  '스트레이트',
  '플러시',
  '풀하우스',
  '포카드',
  '스트레이트 플러시',
];

class HandAnalyzer {
  static const _rankOrder = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
    '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
  };

  static const _rankNames = {
    14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: 'T',
    9: '9', 8: '8', 7: '7', 6: '6', 5: '5', 4: '4', 3: '3', 2: '2',
  };

  static int _category(int evalScore) => evalScore ~/ 100000000;

  static Future<HandAnalysisResult> analyze({
    required List<PlayingCard> heroCards,
    required List<PlayingCard> board,
    required bool isKorean,
  }) async {
    final input = _AnalysisInput(
      heroCards: heroCards.map((c) => c.toString()).toList(),
      board: board.map((c) => c.toString()).toList(),
      isKorean: isKorean,
    );
    return compute(_runAnalysis, input);
  }

  static HandAnalysisResult _runAnalysis(_AnalysisInput input) {
    final heroCards = input.heroCards.map((s) => PlayingCard.fromString(s)).toList();
    final board = input.board.map((s) => PlayingCard.fromString(s)).toList();
    final names = input.isKorean ? _categoryNamesKo : _categoryNamesEn;

    final usedCards = <PlayingCard>{...heroCards, ...board};
    final remainingDeck = PlayingCard.deck().where((c) => !usedCards.contains(c)).toList();

    // Evaluate hero hand
    final heroScore = EquityCalculator.evaluateHand([...heroCards, ...board]);
    final heroCategory = _category(heroScore);
    final heroHandName = _describeHand(heroCards, board, heroCategory, names);

    int wins = 0;
    int ties = 0;
    int losses = 0;
    int totalCombos = 0;

    // Track beating hands by category
    final beatingByCategory = <int, List<List<PlayingCard>>>{};

    if (board.length == 5) {
      // River: exact enumeration
      for (int i = 0; i < remainingDeck.length - 1; i++) {
        for (int j = i + 1; j < remainingDeck.length; j++) {
          final villainCards = [remainingDeck[i], remainingDeck[j]];
          final villainScore = EquityCalculator.evaluateHand([...villainCards, ...board]);
          totalCombos++;
          if (villainScore > heroScore) {
            losses++;
            final cat = _category(villainScore);
            beatingByCategory.putIfAbsent(cat, () => []);
            beatingByCategory[cat]!.add(villainCards);
          } else if (villainScore == heroScore) {
            ties++;
          } else {
            wins++;
          }
        }
      }
    } else if (board.length == 4) {
      // Turn: enumerate villain hands, then enumerate remaining card
      final remainingForRunout = remainingDeck.toList();
      for (int i = 0; i < remainingDeck.length - 1; i++) {
        for (int j = i + 1; j < remainingDeck.length; j++) {
          final villainCards = [remainingDeck[i], remainingDeck[j]];
          int vWins = 0;
          int vTies = 0;
          int vLosses = 0;
          int runouts = 0;
          for (final river in remainingForRunout) {
            if (river == villainCards[0] || river == villainCards[1]) continue;
            final fullBoard = [...board, river];
            final hScore = EquityCalculator.evaluateHand([...heroCards, ...fullBoard]);
            final vScore = EquityCalculator.evaluateHand([...villainCards, ...fullBoard]);
            runouts++;
            if (vScore > hScore) {
              vWins++;
            } else if (vScore == hScore) {
              vTies++;
            } else {
              vLosses++;
            }
          }
          if (runouts > 0) {
            totalCombos++;
            final villainEquity = (vWins + vTies * 0.5) / runouts;
            final heroEquity = (vLosses + vTies * 0.5) / runouts;
            if (villainEquity > heroEquity) {
              losses++;
              // Use most common outcome category
              final bestVillainBoard = _findBestRunoutForVillain(villainCards, heroCards, board, remainingForRunout);
              final cat = _category(bestVillainBoard);
              beatingByCategory.putIfAbsent(cat, () => []);
              beatingByCategory[cat]!.add(villainCards);
            } else if ((villainEquity - heroEquity).abs() < 0.001) {
              ties++;
            } else {
              wins++;
            }
          }
        }
      }
    } else {
      // Flop: Monte Carlo
      final rng = Random(42);
      const sims = 10000;
      // Enumerate all villain combos
      final villainCombos = <List<PlayingCard>>[];
      for (int i = 0; i < remainingDeck.length - 1; i++) {
        for (int j = i + 1; j < remainingDeck.length; j++) {
          villainCombos.add([remainingDeck[i], remainingDeck[j]]);
        }
      }

      final comboWins = <int, int>{};
      final comboLosses = <int, int>{};
      final comboTies = <int, int>{};
      final comboCategories = <int, Map<int, int>>{};

      for (int sim = 0; sim < sims; sim++) {
        final vIdx = rng.nextInt(villainCombos.length);
        final villainCards = villainCombos[vIdx];

        // Deal remaining board from deck minus villain cards
        final deckForBoard = remainingDeck.where(
          (c) => c != villainCards[0] && c != villainCards[1],
        ).toList()..shuffle(rng);

        final fullBoard = [...board];
        int di = 0;
        while (fullBoard.length < 5) {
          fullBoard.add(deckForBoard[di++]);
        }

        final hScore = EquityCalculator.evaluateHand([...heroCards, ...fullBoard]);
        final vScore = EquityCalculator.evaluateHand([...villainCards, ...fullBoard]);

        comboWins[vIdx] = (comboWins[vIdx] ?? 0) + (vScore > hScore ? 1 : 0);
        comboLosses[vIdx] = (comboLosses[vIdx] ?? 0) + (vScore < hScore ? 1 : 0);
        comboTies[vIdx] = (comboTies[vIdx] ?? 0) + (vScore == hScore ? 1 : 0);
        if (vScore > hScore) {
          comboCategories.putIfAbsent(vIdx, () => {});
          final cat = _category(vScore);
          comboCategories[vIdx]![cat] = (comboCategories[vIdx]![cat] ?? 0) + 1;
        }
      }

      totalCombos = villainCombos.length;
      for (int idx = 0; idx < villainCombos.length; idx++) {
        final w = comboWins[idx] ?? 0;
        final l = comboLosses[idx] ?? 0;
        final t = comboTies[idx] ?? 0;
        final total = w + l + t;
        if (total == 0) {
          wins++; // no data, assume hero wins
          continue;
        }
        final villainEq = (w + t * 0.5) / total;
        final heroEq = (l + t * 0.5) / total;
        if (villainEq > heroEq) {
          losses++;
          // Find dominant category
          final cats = comboCategories[idx];
          if (cats != null && cats.isNotEmpty) {
            final bestCat = cats.entries.reduce((a, b) => a.value > b.value ? a : b).key;
            beatingByCategory.putIfAbsent(bestCat, () => []);
            beatingByCategory[bestCat]!.add(villainCombos[idx]);
          }
        } else if ((villainEq - heroEq).abs() < 0.01) {
          ties++;
        } else {
          wins++;
        }
      }
    }

    // Build beating categories
    final beatingList = <BeatingCategory>[];
    final sortedCats = beatingByCategory.keys.toList()..sort((a, b) => b.compareTo(a));
    for (final cat in sortedCats) {
      final hands = beatingByCategory[cat]!;
      final examples = _pickExamples(hands, 3);
      beatingList.add(BeatingCategory(
        name: names[cat],
        category: cat,
        combos: hands.length,
        percent: totalCombos > 0 ? hands.length / totalCombos * 100 : 0,
        examples: examples,
      ));
    }

    final winPct = totalCombos > 0 ? wins / totalCombos * 100.0 : 0.0;
    final tiePct = totalCombos > 0 ? ties / totalCombos * 100.0 : 0.0;
    final losePct = totalCombos > 0 ? losses / totalCombos * 100.0 : 0.0;

    // Calculate outs for incomplete boards
    final outs = <OutCard>[];
    if (board.length >= 3 && board.length <= 4) {
      outs.addAll(_calculateOuts(heroCards, board, heroScore, heroCategory, remainingDeck, names));
    }

    return HandAnalysisResult(
      heroHandName: heroHandName,
      heroHandCategory: heroCategory,
      winPercent: winPct,
      tiePercent: tiePct,
      losePercent: losePct,
      totalCombos: totalCombos,
      beatingHands: beatingList,
      outs: outs,
    );
  }

  static int _findBestRunoutForVillain(
    List<PlayingCard> villainCards,
    List<PlayingCard> heroCards,
    List<PlayingCard> board,
    List<PlayingCard> remaining,
  ) {
    int bestScore = 0;
    for (final river in remaining) {
      if (river == villainCards[0] || river == villainCards[1]) continue;
      final fullBoard = [...board, river];
      final vScore = EquityCalculator.evaluateHand([...villainCards, ...fullBoard]);
      final hScore = EquityCalculator.evaluateHand([...heroCards, ...fullBoard]);
      if (vScore > hScore && vScore > bestScore) {
        bestScore = vScore;
      }
    }
    return bestScore;
  }

  static String _describeHand(
    List<PlayingCard> heroCards,
    List<PlayingCard> board,
    int category,
    List<String> names,
  ) {
    final allCards = [...heroCards, ...board];
    final rankValues = allCards.map((c) => _rankOrder[c.rank] ?? 0).toList();
    final heroRankValues = heroCards.map((c) => _rankOrder[c.rank] ?? 0).toList();

    switch (category) {
      case _HandRankConst.pair:
        // Determine if it's top pair, middle pair, overpair, etc.
        final boardRanks = board.map((c) => _rankOrder[c.rank] ?? 0).toList()..sort((a, b) => b - a);
        final heroRanks = heroRankValues.toList()..sort((a, b) => b - a);

        // Check if hero has a pocket pair
        if (heroCards[0].rank == heroCards[1].rank) {
          final pairRank = heroRanks[0];
          if (boardRanks.isNotEmpty && pairRank > boardRanks[0]) {
            return '${names[category]} (Overpair)';
          }
        }

        // Check which hero card pairs with the board
        for (final hr in heroRanks) {
          for (final br in boardRanks) {
            if (hr == br) {
              if (br == boardRanks[0]) {
                final kicker = heroRanks.firstWhere((r) => r != hr, orElse: () => hr);
                return '${names[category]} (Top, ${_rankNames[kicker]} kicker)';
              } else if (boardRanks.length > 1 && br == boardRanks[1]) {
                return '${names[category]} (Middle)';
              } else {
                return '${names[category]} (Bottom)';
              }
            }
          }
        }
        return names[category];

      case _HandRankConst.twoPair:
        // Find the two pairs
        final freq = <int, int>{};
        for (final r in rankValues) {
          freq[r] = (freq[r] ?? 0) + 1;
        }
        final pairs = freq.entries.where((e) => e.value >= 2).map((e) => e.key).toList()
          ..sort((a, b) => b.compareTo(a));
        if (pairs.length >= 2) {
          return '${names[category]} (${_rankNames[pairs[0]]}${_rankNames[pairs[1]]})';
        }
        return names[category];

      case _HandRankConst.threeKind:
        final freq = <int, int>{};
        for (final r in rankValues) {
          freq[r] = (freq[r] ?? 0) + 1;
        }
        final trips = freq.entries.where((e) => e.value >= 3).map((e) => e.key).toList();
        if (trips.isNotEmpty) {
          final isSet = heroRankValues.where((r) => r == trips[0]).length == 2;
          return isSet ? '${names[category]} (Set)' : names[category];
        }
        return names[category];

      default:
        return names[category];
    }
  }

  static List<String> _pickExamples(List<List<PlayingCard>> hands, int count) {
    final seen = <String>{};
    final examples = <String>[];
    for (final hand in hands) {
      final display = hand.map((c) => c.display).join('');
      final canonical = _canonicalHand(hand);
      if (!seen.contains(canonical)) {
        seen.add(canonical);
        examples.add(display);
        if (examples.length >= count) break;
      }
    }
    return examples;
  }

  static String _canonicalHand(List<PlayingCard> hand) {
    final r1 = _rankOrder[hand[0].rank] ?? 0;
    final r2 = _rankOrder[hand[1].rank] ?? 0;
    if (r1 >= r2) {
      return '${hand[0].rank}${hand[1].rank}';
    }
    return '${hand[1].rank}${hand[0].rank}';
  }

  static List<OutCard> _calculateOuts(
    List<PlayingCard> heroCards,
    List<PlayingCard> board,
    int currentHeroScore,
    int currentCategory,
    List<PlayingCard> remainingDeck,
    List<String> names,
  ) {
    final outs = <OutCard>[];
    final outsByRank = <String, _OutInfo>{};

    // For each possible next card, check if it improves the hero's hand
    for (final card in remainingDeck) {
      // Skip cards that are in villain's possible hands (we check all)
      final newBoard = [...board, card];
      final newScore = EquityCalculator.evaluateHand([...heroCards, ...newBoard]);
      final newCategory = _category(newScore);

      if (newScore > currentHeroScore && newCategory > currentCategory) {
        final rank = card.rank;
        outsByRank.putIfAbsent(rank, () => _OutInfo(improvement: names[newCategory], count: 0));
        // Prefer the higher category name
        final existing = outsByRank[rank]!;
        if (newCategory > names.indexOf(existing.improvement)) {
          outsByRank[rank] = _OutInfo(improvement: names[newCategory], count: existing.count + 1);
        } else {
          outsByRank[rank] = _OutInfo(improvement: existing.improvement, count: existing.count + 1);
        }
      }
    }

    for (final entry in outsByRank.entries) {
      outs.add(OutCard(
        card: entry.key,
        improvement: entry.value.improvement,
        count: entry.value.count,
      ));
    }

    // Sort by count descending
    outs.sort((a, b) => b.count.compareTo(a.count));
    return outs;
  }
}

class _OutInfo {
  final String improvement;
  final int count;
  _OutInfo({required this.improvement, required this.count});
}

class _AnalysisInput {
  final List<String> heroCards;
  final List<String> board;
  final bool isKorean;

  _AnalysisInput({
    required this.heroCards,
    required this.board,
    required this.isKorean,
  });
}
