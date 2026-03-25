import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:gtoplaybook/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import '../../providers/gto_provider.dart';
import '../../models/position_situations.dart';
import 'gto_situation_select_screen.dart';

class GtoPositionSelectScreen extends StatefulWidget {
  const GtoPositionSelectScreen({super.key});

  @override
  State<GtoPositionSelectScreen> createState() => _GtoPositionSelectScreenState();
}

class _GtoPositionSelectScreenState extends State<GtoPositionSelectScreen> {
  final _bbController = TextEditingController();
  final _chipsController = TextEditingController();
  Timer? _debounce;

  /// Position order per table size
  static List<String> _positionOrder(int maxPlayers) {
    switch (maxPlayers) {
      case 2: return ['SB', 'BB'];
      case 3: return ['BTN', 'SB', 'BB'];
      case 4: return ['CO', 'BTN', 'SB', 'BB'];
      case 5: return ['HJ', 'CO', 'BTN', 'SB', 'BB'];
      case 6: return ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
      case 7: return ['UTG', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
      case 8: return ['UTG', 'UTG+1', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
      case 9: return ['UTG', 'UTG+1', 'UTG+2', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
      default: return ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
    }
  }

  static const _positionColors = {
    'UTG': Color(0xFFE53935),
    'UTG+1': Color(0xFFD81B60),
    'UTG+2': Color(0xFFAD1457),
    'MP': Color(0xFFFB8C00),
    'HJ': Color(0xFFFB8C00),
    'CO': Color(0xFFFDD835),
    'BTN': Color(0xFF43A047),
    'SB': Color(0xFF1E88E5),
    'BB': Color(0xFF8E24AA),
  };

  Map<String, String> _positionDescriptions(AppLocalizations l) => {
    'UTG': l.positionUTG,
    'UTG+1': l.positionUTGPlus1,
    'UTG+2': l.positionUTGPlus2,
    'MP': l.positionMP,
    'HJ': l.positionHJ,
    'CO': l.positionCO,
    'BTN': l.positionBTN,
    'SB': l.positionSB,
    'BB': l.positionBB,
  };

  /// Header label for the selected table size
  static String _tableLabel(int maxPlayers) {
    if (maxPlayers == 2) return 'HU';
    return '$maxPlayers-MAX';
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final gto = context.read<GtoProvider>();
      if (gto.oneBbValue > 0) _bbController.text = gto.oneBbValue.toString();
      if (gto.chipCount > 0) _chipsController.text = gto.chipCount.toString();
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _bbController.dispose();
    _chipsController.dispose();
    super.dispose();
  }

  void _onInputChanged() {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      final oneBb = int.tryParse(_bbController.text) ?? 0;
      final chips = int.tryParse(_chipsController.text) ?? 0;
      context.read<GtoProvider>().updateStackDepth(oneBb: oneBb, chips: chips);
    });
  }

  @override
  Widget build(BuildContext context) {
    final gto = context.watch<GtoProvider>();
    final l = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(
        title: Text(l.gtoCharts),
        centerTitle: true,
      ),
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        behavior: HitTestBehavior.translucent,
        child: gto.isLoading
            ? const Center(child: CircularProgressIndicator())
            : gto.error != null
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(gto.error!, style: const TextStyle(color: Colors.redAccent)),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: () => gto.loadPositionTree(),
                          child: Text(l.retry),
                        ),
                      ],
                    ),
                  )
                : _buildBody(context, gto, l),
      ),
    );
  }

  Widget _buildBody(BuildContext context, GtoProvider gto, AppLocalizations l) {
    final treeMap = <String, PositionSituations>{};
    for (final ps in gto.positionTree) {
      treeMap[ps.position] = ps;
    }

    final positions = _positionOrder(gto.selectedPlayerCount);
    final posDesc = _positionDescriptions(l);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        _QuickStartCard(
          playerCount: gto.selectedPlayerCount,
          stackDepth: gto.selectedTier,
          effectiveBb: gto.effectiveBb,
          chartCount: gto.positionTree.fold<int>(
            0,
            (sum, ps) => sum + ps.categories.fold<int>(0, (s, c) => s + c.charts.length),
          ),
        ),
        const SizedBox(height: 12),
        // Player count selector
        _buildPlayerCountSelector(gto, l),
        const SizedBox(height: 12),
        _buildBbCalculator(gto, l),
        const SizedBox(height: 12),
        // Header row
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
          child: Row(
            children: [
              Text(
                l.stepChooseSeat,
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: _tierColor(gto.selectedTier).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '${gto.selectedTier}bb',
                  style: TextStyle(
                    color: _tierColor(gto.selectedTier),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const Spacer(),
              Text(
                '${_tableLabel(gto.selectedPlayerCount)} · ${l.nCharts(gto.positionTree.fold<int>(0, (sum, ps) => sum + ps.categories.fold<int>(0, (s, c) => s + c.charts.length)))}',
                style: TextStyle(color: Colors.white38, fontSize: 12),
              ),
            ],
          ),
        ),
        // Position cards
        ...positions.map((pos) {
          final hasSituations = treeMap.containsKey(pos);
          final ps = treeMap[pos];
          final chartCount = hasSituations
              ? ps!.categories.fold<int>(0, (sum, c) => sum + c.charts.length)
              : 0;
          final categories = hasSituations
              ? ps!.categories.map((c) => c.category).toList()
              : <String>[];

          return _PositionCard(
            position: pos,
            description: posDesc[pos] ?? pos,
            color: _positionColors[pos] ?? const Color(0xFF757575),
            chartCount: chartCount,
            categories: categories,
            onTap: hasSituations
                ? () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => GtoSituationSelectScreen(
                          positionSituations: treeMap[pos]!,
                        ),
                      ),
                    )
                : null,
          );
        }),
      ],
    );
  }

  Widget _buildPlayerCountSelector(GtoProvider gto, AppLocalizations l) {
    const counts = [2, 3, 4, 5, 6, 7, 8, 9];

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF161616),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          const spacing = 8.0;
          final itemWidth = (constraints.maxWidth - (spacing * 3)) / 4;

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l.tableSize,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                l.tableSizeDesc,
                style: const TextStyle(
                  color: Colors.white54,
                  fontSize: 12,
                  height: 1.35,
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: spacing,
                runSpacing: spacing,
                children: counts.map((count) {
                  final isSelected = count == gto.selectedPlayerCount;
                  final primaryLabel = count == 2 ? 'HU' : '$count-MAX';
                  final secondaryLabel = count == 2 ? l.headsUp : l.nPlayers(count);

                  return SizedBox(
                    width: itemWidth,
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () => gto.selectPlayerCount(count),
                        borderRadius: BorderRadius.circular(12),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? const Color(0xFF42A5F5).withValues(alpha: 0.16)
                                : Colors.white.withValues(alpha: 0.04),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected
                                  ? const Color(0xFF42A5F5)
                                  : Colors.white.withValues(alpha: 0.08),
                              width: isSelected ? 1.4 : 1,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                primaryLabel,
                                style: TextStyle(
                                  color: isSelected ? Colors.white : Colors.white70,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                secondaryLabel,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: isSelected ? Colors.white70 : Colors.white38,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildBbCalculator(GtoProvider gto, AppLocalizations l) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.06),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Input row
          Row(
            children: [
              Expanded(
                child: _BbInputField(
                  label: '1BB',
                  controller: _bbController,
                  onChanged: (_) => _onInputChanged(),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _BbInputField(
                  label: l.myChips,
                  controller: _chipsController,
                  onChanged: (_) => _onInputChanged(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Result row
          Row(
            children: [
              // Effective BB badge
              if (gto.effectiveBb > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: _tierColor(gto.selectedTier).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    l.nbbEffective(gto.effectiveBb),
                    style: TextStyle(
                      color: _tierColor(gto.selectedTier),
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                )
              else
                Text(
                  l.enterValuesToCalculate,
                  style: TextStyle(color: Colors.white30, fontSize: 12),
                ),
              const Spacer(),
            ],
          ),
          const SizedBox(height: 10),
          // Tier indicator dots
          _buildTierDots(gto.selectedTier),
        ],
      ),
    );
  }

  Widget _buildTierDots(int selectedTier) {
    const tiers = [7, 15, 25, 40, 60, 100];
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: tiers.map((tier) {
        final isSelected = tier == selectedTier;
        return GestureDetector(
          onTap: () {
            _bbController.clear();
            _chipsController.clear();
            context.read<GtoProvider>().selectTier(tier);
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
            child: Column(
              children: [
                Container(
                  width: isSelected ? 10 : 7,
                  height: isSelected ? 10 : 7,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isSelected
                        ? _tierColor(tier)
                        : Colors.white.withValues(alpha: 0.15),
                    boxShadow: isSelected
                        ? [BoxShadow(color: _tierColor(tier).withValues(alpha: 0.4), blurRadius: 6)]
                        : null,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${tier}bb',
                  style: TextStyle(
                    color: isSelected ? _tierColor(tier) : Colors.white30,
                    fontSize: 10,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Color _tierColor(int tier) {
    switch (tier) {
      case 7:
        return const Color(0xFFB71C1C); // deep red — push/fold zone
      case 15:
        return const Color(0xFFE53935); // red — danger zone
      case 25:
        return const Color(0xFFFB8C00); // orange
      case 40:
        return const Color(0xFFFDD835); // yellow
      case 60:
        return const Color(0xFF66BB6A); // light green
      case 100:
        return const Color(0xFF42A5F5); // blue
      default:
        return const Color(0xFF42A5F5);
    }
  }
}

class _QuickStartCard extends StatelessWidget {
  final int playerCount;
  final int stackDepth;
  final int effectiveBb;
  final int chartCount;

  const _QuickStartCard({
    required this.playerCount,
    required this.stackDepth,
    required this.effectiveBb,
    required this.chartCount,
  });

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF161616),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l.buildYourSpot,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            l.buildYourSpotDesc,
            style: const TextStyle(
              color: Colors.white70,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _QuickInfoChip(label: playerCount == 2 ? l.headsUp : l.nMax(playerCount)),
              _QuickInfoChip(label: l.nbbView(effectiveBb > 0 ? effectiveBb : stackDepth)),
              _QuickInfoChip(label: l.nCharts(chartCount)),
            ],
          ),
        ],
      ),
    );
  }
}

class _QuickInfoChip extends StatelessWidget {
  final String label;

  const _QuickInfoChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white70,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _BbInputField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final ValueChanged<String> onChanged;

  const _BbInputField({
    required this.label,
    required this.controller,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      keyboardType: TextInputType.number,
      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
      style: const TextStyle(color: Colors.white, fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: Colors.white38, fontSize: 12),
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.05),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFF42A5F5)),
        ),
        isDense: true,
      ),
    );
  }
}

class _PositionCard extends StatelessWidget {
  final String position;
  final String description;
  final Color color;
  final int chartCount;
  final List<String> categories;
  final VoidCallback? onTap;

  const _PositionCard({
    required this.position,
    required this.description,
    required this.color,
    required this.chartCount,
    required this.categories,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Ink(
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(12),
            ),
            child: IntrinsicHeight(
              child: Row(
                children: [
                  // Color accent bar
                  Container(
                    width: 4,
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(12),
                        bottomLeft: Radius.circular(12),
                      ),
                    ),
                  ),
                  // Content
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                position,
                                style: TextStyle(
                                  color: color,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  description,
                                  style: const TextStyle(
                                    color: Colors.white60,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          if (categories.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 6,
                              runSpacing: 4,
                              children: categories.map((cat) => Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: color.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  cat,
                                  style: TextStyle(
                                    color: color.withValues(alpha: 0.85),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              )).toList(),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  // Chart count + arrow
                  Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '$chartCount',
                          style: TextStyle(
                            color: Colors.white38,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Icon(
                          Icons.chevron_right,
                          color: Colors.white24,
                          size: 20,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
