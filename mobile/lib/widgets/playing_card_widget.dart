import 'package:flutter/material.dart';
import '../models/card.dart';

class PlayingCardWidget extends StatelessWidget {
  final String cardString;
  final double size;

  const PlayingCardWidget({super.key, required this.cardString, this.size = 1.0});

  @override
  Widget build(BuildContext context) {
    final card = PlayingCard.fromString(cardString);
    final w = 44.0 * size;
    final h = 62.0 * size;

    return Container(
      width: w,
      height: h,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(6 * size),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 4,
            offset: const Offset(1, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            card.rank,
            style: TextStyle(
              color: card.suitColor,
              fontSize: 16 * size,
              fontWeight: FontWeight.bold,
              height: 1,
            ),
          ),
          Text(
            card.suitSymbol,
            style: TextStyle(
              color: card.suitColor,
              fontSize: 14 * size,
              height: 1,
            ),
          ),
        ],
      ),
    );
  }
}

class CardBackWidget extends StatelessWidget {
  final double size;
  const CardBackWidget({super.key, this.size = 1.0});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 44.0 * size,
      height: 62.0 * size,
      decoration: BoxDecoration(
        color: const Color(0xFF1565C0),
        borderRadius: BorderRadius.circular(6 * size),
        border: Border.all(color: Colors.white24),
      ),
      child: Center(
        child: Icon(
          Icons.casino,
          color: Colors.white30,
          size: 20 * size,
        ),
      ),
    );
  }
}
