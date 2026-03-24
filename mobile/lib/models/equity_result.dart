import 'card.dart';

enum InputMode { cards, range }

class PlayerInput {
  final int index;
  List<PlayingCard> cards;
  Set<String> range;
  InputMode inputMode;

  PlayerInput({
    required this.index,
    this.cards = const [],
    Set<String>? range,
    this.inputMode = InputMode.cards,
  }) : range = range ?? {};
}

class EquityResult {
  final List<double> equities;
  final List<double> tieRates;
  final int simulations;

  EquityResult({
    required this.equities,
    required this.tieRates,
    required this.simulations,
  });
}
