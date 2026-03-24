import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../models/game_state.dart';

class PokerTable extends StatelessWidget {
  final GameState gameState;
  const PokerTable({super.key, required this.gameState});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final h = constraints.maxHeight;

        // Position players around an oval table
        final positions = _seatPositions(gameState.players.length, w, h);

        return Stack(
          children: [
            // Table background (oval)
            Center(
              child: Container(
                width: w * 0.85,
                height: h * 0.6,
                decoration: BoxDecoration(
                  color: const Color(0xFF1B5E20),
                  borderRadius: BorderRadius.circular(w * 0.2),
                  border: Border.all(color: const Color(0xFF4E342E), width: 8),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.5),
                      blurRadius: 20,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    'Pot: ${gameState.pot}',
                    style: const TextStyle(
                      color: Color(0xFFFFD700),
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
            // Players
            ...gameState.players.asMap().entries.map((entry) {
              final i = entry.key;
              final player = entry.value;
              final pos = i < positions.length
                  ? positions[i]
                  : Offset(w / 2, h / 2);
              return Positioned(
                left: pos.dx - 40,
                top: pos.dy - 30,
                child: _PlayerChip(
                  player: player,
                  isDealer: player.seatIndex == gameState.dealerIndex,
                  isCurrentTurn: player.id == gameState.currentPlayerId,
                ),
              );
            }),
          ],
        );
      },
    );
  }

  List<Offset> _seatPositions(int count, double w, double h) {
    final cx = w / 2;
    final cy = h / 2;
    final rx = w * 0.42;
    final ry = h * 0.38;

    final positions = <Offset>[];
    for (int i = 0; i < count; i++) {
      final angle = -math.pi / 2 + (2 * math.pi * i / count);
      positions.add(Offset(
        cx + rx * math.cos(angle),
        cy + ry * math.sin(angle),
      ));
    }
    return positions;
  }
}

class _PlayerChip extends StatelessWidget {
  final GamePlayer player;
  final bool isDealer;
  final bool isCurrentTurn;

  const _PlayerChip({
    required this.player,
    required this.isDealer,
    required this.isCurrentTurn,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 80,
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: player.folded
            ? Colors.grey.shade800
            : isCurrentTurn
                ? const Color(0xFF4CAF50)
                : const Color(0xFF263238),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isCurrentTurn
              ? const Color(0xFFFFD700)
              : player.connected
                  ? Colors.white24
                  : Colors.red,
          width: isCurrentTurn ? 2 : 1,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (isDealer)
                Container(
                  width: 16,
                  height: 16,
                  margin: const EdgeInsets.only(right: 2),
                  decoration: const BoxDecoration(
                    color: Color(0xFFFFD700),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Text('D', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black)),
                  ),
                ),
              Flexible(
                child: Text(
                  player.displayName,
                  style: const TextStyle(color: Colors.white, fontSize: 10),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            '${player.chips}',
            style: const TextStyle(
              color: Color(0xFFFFD700),
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
          if (player.bet > 0)
            Text(
              'Bet: ${player.bet}',
              style: const TextStyle(color: Colors.white54, fontSize: 9),
            ),
          if (player.folded)
            const Text(
              'FOLD',
              style: TextStyle(color: Colors.red, fontSize: 9, fontWeight: FontWeight.bold),
            ),
          if (player.allIn)
            const Text(
              'ALL IN',
              style: TextStyle(color: Color(0xFFFFD700), fontSize: 9, fontWeight: FontWeight.bold),
            ),
        ],
      ),
    );
  }
}
