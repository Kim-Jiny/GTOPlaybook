import 'package:flutter/material.dart';
import 'package:gtoplaybook/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import '../../models/equity_result.dart';
import '../../providers/equity_provider.dart';
import '../../widgets/card_picker.dart';
import '../../widgets/range_picker.dart';
import '../../widgets/playing_card_widget.dart';

class EquityCalculatorScreen extends StatelessWidget {
  const EquityCalculatorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(
        title: Text(l.equityCalculator),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<EquityProvider>().reset(),
          ),
        ],
      ),
      body: Consumer<EquityProvider>(
        builder: (context, provider, _) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _BoardSection(provider: provider),
                const SizedBox(height: 16),
                ...provider.players.asMap().entries.map(
                      (e) => _PlayerRow(index: e.key, player: e.value, provider: provider),
                    ),
                const SizedBox(height: 8),
                if (provider.players.length < 9)
                  OutlinedButton.icon(
                    onPressed: provider.addPlayer,
                    icon: const Icon(Icons.add),
                    label: Text(l.addPlayer),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white70,
                      side: const BorderSide(color: Colors.white24),
                    ),
                  ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 52,
                  child: FilledButton(
                    onPressed: provider.isCalculating ? null : () => provider.calculate(),
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF2E7D32),
                    ),
                    child: provider.isCalculating
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : Text(l.calculate, style: const TextStyle(fontSize: 18)),
                  ),
                ),
                if (provider.result != null) ...[
                  const SizedBox(height: 16),
                  _ResultsBar(result: provider.result!, playerCount: provider.players.length),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _BoardSection extends StatelessWidget {
  final EquityProvider provider;
  const _BoardSection({required this.provider});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(l.board, style: const TextStyle(fontSize: 14, color: Colors.white60)),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () async {
                final cards = await CardPicker.show(
                  context,
                  maxCards: 5,
                  initialCards: provider.board,
                  disabledCards: provider.usedCards.difference(provider.board.toSet()),
                );
                if (cards != null) provider.setBoardCards(cards);
              },
              child: Row(
                children: List.generate(5, (i) {
                  if (i < provider.board.length) {
                    return Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: PlayingCardWidget(cardString: provider.board[i].toString(), size: 0.9),
                    );
                  }
                  return Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: _EmptyCardSlot(),
                  );
                }),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyCardSlot extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 40,
      height: 56,
      decoration: BoxDecoration(
        color: Colors.white10,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: Colors.white24, width: 1),
      ),
      child: const Center(
        child: Icon(Icons.add, color: Colors.white30, size: 20),
      ),
    );
  }
}

class _PlayerRow extends StatelessWidget {
  final int index;
  final PlayerInput player;
  final EquityProvider provider;

  const _PlayerRow({required this.index, required this.player, required this.provider});

  @override
  Widget build(BuildContext context) {
    final result = provider.result;
    final equity = result != null ? result.equities[index] : null;
    final l = AppLocalizations.of(context)!;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Row(
          children: [
            // Player label
            SizedBox(
              width: 28,
              child: Text(
                'P${index + 1}',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
            // Mode toggle
            GestureDetector(
              onTap: () {
                final newMode = player.inputMode == InputMode.cards ? InputMode.range : InputMode.cards;
                provider.setPlayerInputMode(index, newMode);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: player.inputMode == InputMode.range ? const Color(0xFF1565C0) : const Color(0xFF37474F),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  player.inputMode == InputMode.cards ? 'Cards' : 'Range',
                  style: const TextStyle(fontSize: 11),
                ),
              ),
            ),
            const SizedBox(width: 8),
            // Input area
            Expanded(
              child: player.inputMode == InputMode.cards
                  ? _buildCardInput(context)
                  : _buildRangeInput(context, l),
            ),
            // Equity display
            if (equity != null)
              Container(
                width: 60,
                alignment: Alignment.centerRight,
                child: Text(
                  '${equity.toStringAsFixed(1)}%',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: equity > 50
                        ? Colors.greenAccent
                        : equity > 30
                            ? Colors.white
                            : Colors.redAccent,
                  ),
                ),
              ),
            // Remove button
            if (provider.players.length > 2)
              IconButton(
                icon: const Icon(Icons.close, size: 18),
                onPressed: () => provider.removePlayer(index),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildCardInput(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        final cards = await CardPicker.show(
          context,
          maxCards: 2,
          initialCards: player.cards,
          disabledCards: provider.usedCards.difference(player.cards.toSet()),
        );
        if (cards != null) provider.setPlayerCards(index, cards);
      },
      child: Row(
        children: [
          if (player.cards.isEmpty)
            Row(
              children: [
                _EmptyCardSlot(),
                const SizedBox(width: 4),
                _EmptyCardSlot(),
              ],
            )
          else
            ...player.cards.map(
              (c) => Padding(
                padding: const EdgeInsets.only(right: 4),
                child: PlayingCardWidget(cardString: c.toString(), size: 0.8),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildRangeInput(BuildContext context, AppLocalizations l) {
    return GestureDetector(
      onTap: () async {
        final range = await RangePicker.show(context, initialRange: player.range);
        if (range != null) provider.setPlayerRange(index, range);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white10,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: Colors.white24),
        ),
        child: Text(
          player.range.isEmpty
              ? l.tapToSelectRange
              : l.nHandsPercent(player.range.length, _estimatePercent(player.range)),
          style: TextStyle(
            color: player.range.isEmpty ? Colors.white38 : Colors.white,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  int _estimatePercent(Set<String> range) {
    int combos = 0;
    for (final hand in range) {
      if (hand.length == 2) {
        combos += 6;
      } else if (hand.endsWith('s')) {
        combos += 4;
      } else {
        combos += 12;
      }
    }
    return (combos / 1326 * 100).round();
  }
}

class _ResultsBar extends StatelessWidget {
  final EquityResult result;
  final int playerCount;

  const _ResultsBar({required this.result, required this.playerCount});

  static const _colors = [
    Color(0xFF2E7D32),
    Color(0xFFC62828),
    Color(0xFF1565C0),
    Color(0xFFF9A825),
    Color(0xFF6A1B9A),
    Color(0xFFEF6C00),
    Color(0xFF00838F),
    Color(0xFF4E342E),
    Color(0xFF546E7A),
  ];

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l.nSimulations(result.simulations.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+$)'), (m) => '${m[1]},')),
              style: const TextStyle(fontSize: 12, color: Colors.white38),
            ),
            const SizedBox(height: 8),
            // Stacked bar
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: SizedBox(
                height: 28,
                child: Row(
                  children: List.generate(playerCount, (i) {
                    final eq = result.equities[i];
                    if (eq <= 0) return const SizedBox.shrink();
                    return Expanded(
                      flex: (eq * 10).round().clamp(1, 1000),
                      child: Container(
                        color: _colors[i % _colors.length],
                        alignment: Alignment.center,
                        child: eq > 8
                            ? Text(
                                '${eq.toStringAsFixed(1)}%',
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                              )
                            : null,
                      ),
                    );
                  }),
                ),
              ),
            ),
            const SizedBox(height: 8),
            // Legend
            Wrap(
              spacing: 12,
              runSpacing: 4,
              children: List.generate(playerCount, (i) {
                return Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: _colors[i % _colors.length],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'P${i + 1}: ${result.equities[i].toStringAsFixed(1)}%',
                      style: const TextStyle(fontSize: 12),
                    ),
                    if (result.tieRates[i] > 0.1)
                      Text(
                        ' (tie ${result.tieRates[i].toStringAsFixed(1)}%)',
                        style: const TextStyle(fontSize: 11, color: Colors.white38),
                      ),
                  ],
                );
              }),
            ),
          ],
        ),
      ),
    );
  }
}
