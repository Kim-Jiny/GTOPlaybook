import 'package:flutter/material.dart';
import 'package:gtoplaybook/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import '../../models/hand_analysis_result.dart';
import '../../providers/hand_analysis_provider.dart';
import '../../services/ad_helper.dart';
import '../../widgets/banner_ad_widget.dart';
import '../../widgets/card_picker.dart';
import '../../widgets/playing_card_widget.dart';

class HandAnalysisScreen extends StatelessWidget {
  const HandAnalysisScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;

    return Consumer<HandAnalysisProvider>(
      builder: (context, provider, _) {
        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _HeroHandSection(provider: provider),
              const SizedBox(height: 12),
              _BoardSection(provider: provider),
              const SizedBox(height: 16),
              SizedBox(
                height: 52,
                child: FilledButton(
                  onPressed: provider.canAnalyze && !provider.isAnalyzing
                      ? () {
                          final locale = Localizations.localeOf(context);
                          provider.analyze(isKorean: locale.languageCode == 'ko');
                        }
                      : null,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF2E7D32),
                  ),
                  child: provider.isAnalyzing
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text(l.analyze, style: const TextStyle(fontSize: 18)),
                ),
              ),
              const SizedBox(height: 12),
              const Center(child: BannerAdWidget(placement: AdPlacement.handAnalysis)),
              if (provider.result != null) ...[
                const SizedBox(height: 16),
                _HeroHandStrength(result: provider.result!),
                const SizedBox(height: 12),
                _WinLoseBar(result: provider.result!),
                const SizedBox(height: 12),
                if (provider.result!.beatingHands.isNotEmpty)
                  _BeatingHandsList(result: provider.result!),
                if (provider.result!.outs.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  _OutsSection(result: provider.result!),
                ],
              ],
            ],
          ),
        );
      },
    );
  }
}

class _HeroHandSection extends StatelessWidget {
  final HandAnalysisProvider provider;
  const _HeroHandSection({required this.provider});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(l.myHand, style: const TextStyle(fontSize: 14, color: Colors.white60)),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () async {
                final cards = await CardPicker.show(
                  context,
                  maxCards: 2,
                  initialCards: provider.heroCards,
                  disabledCards: provider.usedCards.difference(provider.heroCards.toSet()),
                );
                if (cards != null) provider.setHeroCards(cards);
              },
              child: Row(
                children: List.generate(2, (i) {
                  if (i < provider.heroCards.length) {
                    return Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: PlayingCardWidget(cardString: provider.heroCards[i].toString(), size: 1.0),
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

class _BoardSection extends StatelessWidget {
  final HandAnalysisProvider provider;
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

class _HeroHandStrength extends StatelessWidget {
  final HandAnalysisResult result;
  const _HeroHandStrength({required this.result});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            const Icon(Icons.back_hand, color: Color(0xFF4CAF50), size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(l.currentHand, style: const TextStyle(fontSize: 12, color: Colors.white60)),
                  const SizedBox(height: 2),
                  Text(
                    result.heroHandName,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WinLoseBar extends StatelessWidget {
  final HandAnalysisResult result;
  const _WinLoseBar({required this.result});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Bar
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: SizedBox(
                height: 28,
                child: Row(
                  children: [
                    if (result.winPercent > 0)
                      Expanded(
                        flex: (result.winPercent * 10).round().clamp(1, 1000),
                        child: Container(
                          color: const Color(0xFF2E7D32),
                          alignment: Alignment.center,
                          child: result.winPercent > 10
                              ? Text(
                                  '${result.winPercent.toStringAsFixed(1)}%',
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                )
                              : null,
                        ),
                      ),
                    if (result.tiePercent > 0)
                      Expanded(
                        flex: (result.tiePercent * 10).round().clamp(1, 1000),
                        child: Container(
                          color: const Color(0xFF546E7A),
                          alignment: Alignment.center,
                          child: result.tiePercent > 10
                              ? Text(
                                  '${result.tiePercent.toStringAsFixed(1)}%',
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                )
                              : null,
                        ),
                      ),
                    if (result.losePercent > 0)
                      Expanded(
                        flex: (result.losePercent * 10).round().clamp(1, 1000),
                        child: Container(
                          color: const Color(0xFFC62828),
                          alignment: Alignment.center,
                          child: result.losePercent > 10
                              ? Text(
                                  '${result.losePercent.toStringAsFixed(1)}%',
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                )
                              : null,
                        ),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            // Legend
            Row(
              children: [
                _legendDot(const Color(0xFF2E7D32)),
                const SizedBox(width: 4),
                Text('Win ${result.winPercent.toStringAsFixed(1)}%',
                    style: const TextStyle(fontSize: 12)),
                const SizedBox(width: 12),
                _legendDot(const Color(0xFF546E7A)),
                const SizedBox(width: 4),
                Text('Tie ${result.tiePercent.toStringAsFixed(1)}%',
                    style: const TextStyle(fontSize: 12)),
                const SizedBox(width: 12),
                _legendDot(const Color(0xFFC62828)),
                const SizedBox(width: 4),
                Text('Lose ${result.losePercent.toStringAsFixed(1)}%',
                    style: const TextStyle(fontSize: 12)),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              l.totalNCombos(result.totalCombos),
              style: const TextStyle(fontSize: 11, color: Colors.white38),
            ),
          ],
        ),
      ),
    );
  }

  Widget _legendDot(Color color) {
    return Container(
      width: 10,
      height: 10,
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2)),
    );
  }
}

class _BeatingHandsList extends StatelessWidget {
  final HandAnalysisResult result;
  const _BeatingHandsList({required this.result});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(l.beatingHands,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            ...result.beatingHands.map((cat) => _BeatingCategoryTile(category: cat)),
          ],
        ),
      ),
    );
  }
}

class _BeatingCategoryTile extends StatelessWidget {
  final BeatingCategory category;
  const _BeatingCategoryTile({required this.category});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('\u25B8 ', style: TextStyle(color: Color(0xFFC62828), fontSize: 14)),
              Expanded(
                child: Text(
                  category.name,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.only(left: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${category.combos} combos \u00B7 ${category.percent.toStringAsFixed(1)}%',
                  style: const TextStyle(fontSize: 12, color: Colors.white54),
                ),
                if (category.examples.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      category.examples.join(', '),
                      style: const TextStyle(fontSize: 12, color: Colors.white38),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _OutsSection extends StatelessWidget {
  final HandAnalysisResult result;
  const _OutsSection({required this.result});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(l.outs, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            ...result.outs.map((out) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: const Color(0xFF2E7D32),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          out.card,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(out.improvement, style: const TextStyle(fontSize: 13)),
                      ),
                      Text(
                        l.nCards(out.count),
                        style: const TextStyle(fontSize: 12, color: Colors.white54),
                      ),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }
}
