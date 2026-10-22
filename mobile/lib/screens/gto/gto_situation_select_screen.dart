import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:gtoplaybook/l10n/app_localizations.dart';
import '../../models/position_situations.dart';
import '../../services/ad_helper.dart';
import '../../services/interstitial_ad_manager.dart';
import '../../widgets/banner_ad_widget.dart';
import 'gto_chart_detail_screen.dart';
import '../../theme/app_theme.dart';
import '../../widgets/ui_kit.dart';
import 'package:flutter_animate/flutter_animate.dart';

class GtoSituationSelectScreen extends StatelessWidget {
  final PositionSituations positionSituations;

  const GtoSituationSelectScreen({super.key, required this.positionSituations});

  static const _positionColors = {
    'UTG': AppTheme.coral,
    'UTG+1': Color(0xFFFF8A80),
    'UTG+2': Color(0xFFFF9E80),
    'MP': Color(0xFFFFA94D),
    'HJ': Color(0xFFFFB84D),
    'CO': AppTheme.yellow,
    'BTN': AppTheme.mint,
    'SB': AppTheme.sky,
    'BB': AppTheme.grape,
  };

  static const _categoryIcons = {
    'RFI': Icons.arrow_upward,
    'Iso Raise vs Limp': Icons.north_east,
    'Cold Call': Icons.call_received,
    'Facing Open': Icons.call_received,
    'Facing Open + Caller': Icons.groups_rounded,
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
      appBar: AppBar(title: Text(l.positionPlaybook(pos)), centerTitle: true),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _SituationIntroCard(
            position: pos,
            color: color,
            categoryCount: positionSituations.categories.length,
            chartCount: totalCharts,
          ).staggerIn(0),
          const SizedBox(height: 12),
          const Center(
            child: BannerAdWidget(placement: AdPlacement.situationList),
          ),
          const SizedBox(height: 12),
          ...positionSituations.categories.indexed.map((e) {
            final cat = e.$2;
            return _CategorySection(
              heroPosition: pos,
              category: cat,
              posColor: color,
              icon: _categoryIcons[cat.category] ?? Icons.casino,
            ).staggerIn(e.$1 + 2);
          }),
        ],
      ),
    );
  }
}

class _CategorySection extends StatefulWidget {
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
  State<_CategorySection> createState() => _CategorySectionState();
}

class _CategorySectionState extends State<_CategorySection> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    final heroPosition = widget.heroPosition;
    final category = widget.category;
    final posColor = widget.posColor;
    final icon = widget.icon;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Category header — tap to fold / unfold the chart list
        InkWell(
          borderRadius: BorderRadius.circular(8),
          onTap: () {
            HapticFeedback.selectionClick();
            setState(() => _expanded = !_expanded);
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: posColor,
                    shape: BoxShape.circle,
                    border: Border.all(color: context.outline, width: 2),
                  ),
                  child: Icon(icon, color: AppTheme.lightOutline, size: 20),
                ),
                const SizedBox(width: 10),
                Flexible(
                  child: Text(
                    _categoryLabel(category.category, l),
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontFamily: AppTheme.display,
                      color: context.ink,
                      fontSize: 19,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                PopTag(label: '${category.charts.length}', color: posColor),
                const Spacer(),
                AnimatedRotation(
                  turns: _expanded ? 0.5 : 0,
                  duration: AppTheme.normal,
                  curve: AppTheme.curve,
                  child: Icon(Icons.expand_more, color: context.ink54),
                ),
              ],
            ),
          ),
        ),
        // Chart list
        AnimatedSize(
          duration: AppTheme.normal,
          curve: AppTheme.curve,
          alignment: Alignment.topCenter,
          child: _expanded
              ? Column(
                  children: [
                    ...category.charts.indexed.map(
                      (e) => _ChartTile(
                        heroPosition: heroPosition,
                        chart: e.$2,
                        category: category.category,
                        posColor: posColor,
                      ).staggerIn(e.$1, stepMs: 30, maxSteps: 8),
                    ),
                  ],
                )
              : const SizedBox(width: double.infinity),
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
      case 'Facing Open':
        return l.categoryFacingOpen;
      case 'Facing Open + Caller':
        return l.categoryFacingOpenCaller;
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
    final actions =
        chart.actionTypes?.where((a) => a.key != 'fold').toList() ?? const [];
    final villainColor = chart.vsPosition != null
        ? _villainColors[chart.vsPosition] ?? Colors.grey
        : posColor;

    return Pressable(
      haptic: false,
      onTap: () {
          InterstitialAdManager.instance.maybeShowOnTransition();
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => GtoChartDetailScreen(chartId: chart.id),
            ),
          );
        },
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        decoration: cardDecoration(context),
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
                    color: villainColor,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: context.outline, width: 2),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    chart.vsPosition!,
                    style: TextStyle(
                      fontFamily: AppTheme.display,
                      color: AppTheme.lightOutline,
                      fontSize: chart.vsPosition!.length > 3 ? 12 : 15,
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
                      style: TextStyle(
                        color: context.ink,
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    if (actions.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      // Mini action bar
                      ClipRRect(
                        borderRadius: BorderRadius.circular(5),
                        child: SizedBox(
                          height: 8,
                          child: Row(
                            children: [
                              ...actions.map(
                                (a) => Expanded(
                                  child: Container(color: a.toColor()),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ).animate().scaleX(
                            begin: 0,
                            end: 1,
                            alignment: Alignment.centerLeft,
                            duration: AppTheme.slow,
                            curve: AppTheme.curve,
                          ),
                      const SizedBox(height: 4),
                      // Action labels
                      Row(
                        children: actions
                            .take(3)
                            .map(
                              (a) => Padding(
                                padding: const EdgeInsets.only(right: 10),
                                child: Text(
                                  a.label,
                                  style: TextStyle(
                                    color: context.ink70,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            )
                            .toList(),
                      ),
                    ],
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: context.ink30, size: 20),
            ],
          ),
        ),
      ),
    );
  }

  String _chartTitle() {
    if ((chart.description ?? '').isNotEmpty) {
      // Drop the trailing "(100bb, 6-max)": stack and table size are already chosen.
      return chart.description!.replaceFirst(RegExp(r'\s*\([^)]*\)\s*$'), '');
    }
    if (chart.flopTexture != null && chart.flopTexture!.isNotEmpty) {
      return 'vs ${chart.vsPosition} ${chart.flopTexture}';
    }
    if (chart.callerPosition != null && chart.callerPosition!.isNotEmpty) {
      return 'vs ${chart.vsPosition} + ${chart.callerPosition}';
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

    return PopCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l.chooseSpotDesc,
              style: TextStyle(color: context.ink70, height: 1.4),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                PopTag(label: l.nSections(categoryCount), color: color, fontSize: 13),
                PopTag(label: l.nCharts(chartCount), color: color, fontSize: 13),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
