import 'package:flutter/material.dart';
import 'package:gtoplaybook/l10n/app_localizations.dart';
import '../../models/position_situations.dart';
import '../../services/ad_helper.dart';
import '../../widgets/banner_ad_widget.dart';
import 'gto_chart_detail_screen.dart';

class GtoSituationSelectScreen extends StatelessWidget {
  final PositionSituations positionSituations;

  const GtoSituationSelectScreen({super.key, required this.positionSituations});

  static const _positionColors = {
    'UTG': Color(0xFFE53935),
    'MP': Color(0xFFFB8C00),
    'CO': Color(0xFFFDD835),
    'BTN': Color(0xFF43A047),
    'SB': Color(0xFF1E88E5),
    'BB': Color(0xFF8E24AA),
  };

  static const _categoryIcons = {
    'RFI': Icons.arrow_upward,
    'Iso Raise vs Limp': Icons.north_east,
    'Cold Call': Icons.call_received,
    'Squeeze': Icons.bolt,
    'Facing Squeeze': Icons.sync_problem,
    'Limped Pot': Icons.waterfall_chart,
    'Facing 3bet': Icons.shield,
    '3bet vs Opener': Icons.flash_on,
    'Defend': Icons.security,
    'SB Defend': Icons.gpp_good,
    'Facing 4bet': Icons.warning_amber,
    'Postflop Cbet': Icons.layers,
  };

  @override
  Widget build(BuildContext context) {
    final pos = positionSituations.position;
    final color = _positionColors[pos] ?? Colors.grey;
    final totalCharts = positionSituations.categories.fold<int>(
      0,
      (sum, category) => sum + category.charts.length,
    );
    final l = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(
        title: Text(l.positionPlaybook(pos)),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _SituationIntroCard(
            position: pos,
            color: color,
            categoryCount: positionSituations.categories.length,
            chartCount: totalCharts,
          ),
          const SizedBox(height: 12),
          const Center(child: BannerAdWidget(placement: AdPlacement.situationList)),
          const SizedBox(height: 12),
          ...positionSituations.categories.map((cat) {
            return _CategorySection(
              heroPosition: pos,
              category: cat,
              posColor: color,
              icon: _categoryIcons[cat.category] ?? Icons.casino,
            );
          }),
        ],
      ),
    );
  }
}

class _CategorySection extends StatelessWidget {
  final String heroPosition;
  final SituationCategory category;
  final Color posColor;
  final IconData icon;

  const _CategorySection({
    required this.heroPosition,
    required this.category,
    required this.posColor,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Category header
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            children: [
              Icon(icon, color: posColor, size: 20),
              const SizedBox(width: 8),
              Text(
                _categoryLabel(category.category, l),
                style: TextStyle(
                  color: posColor,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: posColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${category.charts.length}',
                  style: TextStyle(color: posColor, fontSize: 12),
                ),
              ),
            ],
          ),
        ),
        // Chart list
        ...category.charts.map(
          (chart) => _ChartTile(
            heroPosition: heroPosition,
            chart: chart,
            category: category.category,
            posColor: posColor,
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  String _categoryLabel(String category, AppLocalizations l) {
    switch (category) {
      case 'RFI':
        return l.categoryOpenPot;
      case 'Iso Raise vs Limp':
        return l.categoryIsoRaise;
      case 'Cold Call':
        return l.categoryColdCall;
      case 'Squeeze':
        return l.categorySqueeze;
      case 'Facing Squeeze':
        return l.categoryFacingSqueeze;
      case 'Limped Pot':
        return l.categoryLimpedPot;
      case 'Facing 3bet':
        return l.categoryFacing3bet;
      case '3bet vs Opener':
        return l.category3betting;
      case 'Defend':
        return l.categoryDefending;
      case 'SB Defend':
        return l.categorySBDefense;
      case 'Facing 4bet':
        return l.categoryFacing4bet;
      case 'Postflop Cbet':
        return l.categoryPostflopCbet;
      default:
        return category;
    }
  }
}

class _ChartTile extends StatelessWidget {
  final String heroPosition;
  final ChartSummary chart;
  final String category;
  final Color posColor;

  const _ChartTile({
    required this.heroPosition,
    required this.chart,
    required this.category,
    required this.posColor,
  });

  static const _villainColors = {
    'UTG': Color(0xFFE53935),
    'UTG+1': Color(0xFFE53935),
    'UTG+2': Color(0xFFE53935),
    'MP': Color(0xFFFB8C00),
    'HJ': Color(0xFFFF7043),
    'CO': Color(0xFFFDD835),
    'BTN': Color(0xFF43A047),
    'SB': Color(0xFF1E88E5),
    'BB': Color(0xFF8E24AA),
  };

  @override
  Widget build(BuildContext context) {
    final title = _chartTitle();
    final actions = chart.actionTypes?.where((a) => a.key != 'fold').toList() ?? const [];
    final villainColor = chart.vsPosition != null
        ? _villainColors[chart.vsPosition] ?? Colors.grey
        : posColor;

    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => GtoChartDetailScreen(chartId: chart.id),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(
            children: [
              // Villain position badge
              if (chart.vsPosition != null)
                Container(
                  width: 44,
                  height: 44,
                  margin: const EdgeInsets.only(right: 12),
                  decoration: BoxDecoration(
                    color: villainColor.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: villainColor.withValues(alpha: 0.3)),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    chart.vsPosition!,
                    style: TextStyle(
                      color: villainColor,
                      fontWeight: FontWeight.w800,
                      fontSize: chart.vsPosition!.length > 3 ? 10 : 13,
                    ),
                  ),
                ),
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (actions.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      // Mini action bar
                      ClipRRect(
                        borderRadius: BorderRadius.circular(3),
                        child: SizedBox(
                          height: 6,
                          child: Row(
                            children: [
                              ...actions.map((a) => Expanded(
                                    child: Container(color: a.toColor()),
                                  )),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      // Action labels
                      Row(
                        children: actions
                            .take(3)
                            .map((a) => Padding(
                                  padding: const EdgeInsets.only(right: 10),
                                  child: Text(
                                    a.label,
                                    style: TextStyle(
                                      color: a.toColor().withValues(alpha: 0.85),
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ))
                            .toList(),
                      ),
                    ],
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Colors.white30, size: 20),
            ],
          ),
        ),
      ),
    );
  }

  String _chartTitle() {
    if ((chart.description ?? '').isNotEmpty) {
      return chart.description!;
    }
    final situation = chart.situation.replaceAll('_', ' ').trim();
    if (chart.vsPosition != null) {
      return 'vs ${chart.vsPosition}  $situation';
    }
    return '$heroPosition $situation';
  }
}

class _SituationIntroCard extends StatelessWidget {
  final String position;
  final Color color;
  final int categoryCount;
  final int chartCount;

  const _SituationIntroCard({
    required this.position,
    required this.color,
    required this.categoryCount,
    required this.chartCount,
  });

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l.positionStrategyLibrary(position),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              l.chooseSpotDesc,
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
                _InfoChip(label: l.nSections(categoryCount), color: color),
                _InfoChip(label: l.nCharts(chartCount), color: color),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final String label;
  final Color color;

  const _InfoChip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
