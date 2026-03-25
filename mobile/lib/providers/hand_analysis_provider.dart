import 'package:flutter/material.dart';
import '../models/card.dart';
import '../models/hand_analysis_result.dart';
import '../core/hand_analyzer.dart';

class HandAnalysisProvider extends ChangeNotifier {
  List<PlayingCard> _heroCards = [];
  List<PlayingCard> _board = [];
  HandAnalysisResult? _result;
  bool _isAnalyzing = false;

  List<PlayingCard> get heroCards => _heroCards;
  List<PlayingCard> get board => _board;
  HandAnalysisResult? get result => _result;
  bool get isAnalyzing => _isAnalyzing;

  Set<PlayingCard> get usedCards => {..._heroCards, ..._board};

  void setHeroCards(List<PlayingCard> cards) {
    _heroCards = cards;
    _result = null;
    notifyListeners();
  }

  void setBoardCards(List<PlayingCard> cards) {
    _board = cards;
    _result = null;
    notifyListeners();
  }

  bool get canAnalyze => _heroCards.length == 2 && _board.length >= 3;

  Future<void> analyze({required bool isKorean}) async {
    if (!canAnalyze || _isAnalyzing) return;

    _isAnalyzing = true;
    notifyListeners();

    try {
      _result = await HandAnalyzer.analyze(
        heroCards: _heroCards,
        board: _board,
        isKorean: isKorean,
      );
    } finally {
      _isAnalyzing = false;
      notifyListeners();
    }
  }

  void reset() {
    _heroCards = [];
    _board = [];
    _result = null;
    _isAnalyzing = false;
    notifyListeners();
  }
}
