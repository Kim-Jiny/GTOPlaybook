import 'package:flutter/material.dart';

class PlayingCard {
  final String rank;
  final String suit;

  PlayingCard({required this.rank, required this.suit});

  factory PlayingCard.fromString(String s) {
    return PlayingCard(rank: s[0], suit: s[1]);
  }

  String get display => '$rank${suitSymbol}';

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
}
