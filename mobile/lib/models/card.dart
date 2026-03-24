import 'package:flutter/material.dart';

class PlayingCard {
  final String rank;
  final String suit;

  PlayingCard({required this.rank, required this.suit});

  factory PlayingCard.fromString(String s) {
    return PlayingCard(rank: s[0], suit: s[1]);
  }

  static const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  static const suits = ['s', 'h', 'd', 'c'];

  static List<PlayingCard> deck() {
    return [
      for (final r in ranks)
        for (final s in suits) PlayingCard(rank: r, suit: s),
    ];
  }

  String get display => '$rank$suitSymbol';

  String get suitSymbol {
    switch (suit) {
      case 'h':
        return '♥';
      case 'd':
        return '♦';
      case 'c':
        return '♣';
      case 's':
        return '♠';
      default:
        return suit;
    }
  }

  Color get suitColor {
    switch (suit) {
      case 'h':
      case 'd':
        return Colors.red;
      default:
        return Colors.black;
    }
  }

  bool get isRed => suit == 'h' || suit == 'd';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PlayingCard && rank == other.rank && suit == other.suit;

  @override
  int get hashCode => rank.hashCode ^ suit.hashCode;

  @override
  String toString() => '$rank$suit';
}
