import 'package:flutter/material.dart';
import '../models/card.dart';
import '../models/equity_result.dart';
import '../core/equity_calculator.dart';

class EquityProvider extends ChangeNotifier {
  List<PlayerInput> players = [
    PlayerInput(index: 0),
    PlayerInput(index: 1),
  ];
  List<PlayingCard> board = [];
  EquityResult? result;
  bool isCalculating = false;
  String? errorMessage;

  Set<PlayingCard> get usedCards {
    final used = <PlayingCard>{...board};
    for (final p in players) {
      if (p.inputMode == InputMode.cards) {
        used.addAll(p.cards);
      }
    }
    return used;
  }

  void addPlayer() {
    if (players.length >= 9) return;
    players.add(PlayerInput(index: players.length));
    result = null;
    errorMessage = null;
    notifyListeners();
  }

  void removePlayer(int index) {
    if (players.length <= 2) return;
    players.removeAt(index);
    for (int i = 0; i < players.length; i++) {
      players[i] = PlayerInput(
        index: i,
        cards: players[i].cards,
        range: players[i].range,
        inputMode: players[i].inputMode,
      );
    }
    result = null;
    errorMessage = null;
    notifyListeners();
  }

  void setPlayerCards(int index, List<PlayingCard> cards) {
    players[index].cards = cards;
    result = null;
    errorMessage = null;
    notifyListeners();
  }

  void setPlayerRange(int index, Set<String> range) {
    players[index].range = range;
    result = null;
    errorMessage = null;
    notifyListeners();
  }

  void setPlayerInputMode(int index, InputMode mode) {
    players[index].inputMode = mode;
    players[index].cards = [];
    players[index].range = {};
    result = null;
    errorMessage = null;
    notifyListeners();
  }

  void setBoardCards(List<PlayingCard> cards) {
    board = cards;
    result = null;
    errorMessage = null;
    notifyListeners();
  }

  Future<void> calculate() async {
    // Validate inputs
    for (final p in players) {
      if (p.inputMode == InputMode.cards && p.cards.length != 2) return;
      if (p.inputMode == InputMode.range && p.range.isEmpty) return;
    }

    isCalculating = true;
    errorMessage = null;
    notifyListeners();

    try {
      result = await EquityCalculator.calculate(
        players: players,
        board: board,
      );
      errorMessage = result?.errorMessage;
    } catch (e) {
      result = null;
      errorMessage = e.toString();
    } finally {
      isCalculating = false;
      notifyListeners();
    }
  }

  void reset() {
    players = [
      PlayerInput(index: 0),
      PlayerInput(index: 1),
    ];
    board = [];
    result = null;
    isCalculating = false;
    errorMessage = null;
    notifyListeners();
  }
}
