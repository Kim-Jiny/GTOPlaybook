import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/game_provider.dart';
import '../../widgets/poker_table.dart';
import '../../widgets/action_buttons.dart';
import '../../widgets/playing_card_widget.dart';

class PokerTableScreen extends StatelessWidget {
  final String roomId;
  const PokerTableScreen({super.key, required this.roomId});

  @override
  Widget build(BuildContext context) {
    final game = context.watch<GameProvider>();
    final gameState = game.gameState;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _showLeaveConfirm(context, game);
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF0A1A0A),
        appBar: AppBar(
          title: Text(gameState != null
              ? 'Hand #${gameState.handNumber} | ${gameState.phase}'
              : 'Waiting for players...'),
          centerTitle: true,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => _showLeaveConfirm(context, game),
          ),
        ),
        body: Column(
          children: [
            // Poker table
            Expanded(
              child: gameState != null
                  ? PokerTable(gameState: gameState)
                  : Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            'Waiting for players...',
                            style: TextStyle(color: Colors.white54, fontSize: 18),
                          ),
                          const SizedBox(height: 16),
                          FilledButton(
                            onPressed: () => game.sendReady(),
                            child: const Text('Ready'),
                          ),
                        ],
                      ),
                    ),
            ),
            // Community cards
            if (gameState != null && gameState.communityCards.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: gameState.communityCards
                      .map((c) => Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 2),
                            child: PlayingCardWidget(cardString: c),
                          ))
                      .toList(),
                ),
              ),
            // Hole cards
            if (game.holeCards != null && game.holeCards!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Your cards: ', style: TextStyle(color: Colors.white54)),
                    ...game.holeCards!.map((c) => Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 2),
                          child: PlayingCardWidget(cardString: c, size: 1.2),
                        )),
                  ],
                ),
              ),
            // Pot info
            if (gameState != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(
                  'Pot: ${gameState.pot}',
                  style: const TextStyle(
                    color: Color(0xFFFFD700),
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            // Action buttons
            if (game.isMyTurn && gameState != null)
              ActionButtons(
                currentBet: gameState.currentBet,
                timeLeft: game.turnTimeLeft,
                onAction: (action, amount) => game.sendAction(action, amount: amount),
              ),
            // Showdown results
            if (game.showdownResult != null)
              _ShowdownBanner(result: game.showdownResult!),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  void _showLeaveConfirm(BuildContext context, GameProvider game) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Leave Game?'),
        content: const Text('You will forfeit your current hand.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Stay'),
          ),
          FilledButton(
            onPressed: () {
              game.leaveRoom();
              Navigator.pop(ctx);
              Navigator.pop(context);
            },
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Leave'),
          ),
        ],
      ),
    );
  }
}

class _ShowdownBanner extends StatelessWidget {
  final Map<String, dynamic> result;
  const _ShowdownBanner({required this.result});

  @override
  Widget build(BuildContext context) {
    final winners = List<String>.from(result['winners'] ?? []);
    final results = result['results'] as List? ?? [];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1A2E1A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF4CAF50)),
      ),
      child: Column(
        children: [
          Text(
            'Winners: ${winners.join(', ')}',
            style: const TextStyle(
              color: Color(0xFFFFD700),
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 4),
          ...results.map((r) {
            final data = Map<String, dynamic>.from(r);
            return Text(
              '${data['playerId']}: ${data['handDescription']} (+${data['winnings']})',
              style: const TextStyle(color: Colors.white70, fontSize: 12),
            );
          }),
        ],
      ),
    );
  }
}
