import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:gtoplaybook/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import '../../models/position_situations.dart';
import '../../providers/gto_provider.dart';
import '../../services/ad_helper.dart';
import '../../services/interstitial_ad_manager.dart';
import '../../services/recent_charts.dart';
import '../../theme/app_theme.dart';
import '../../widgets/banner_ad_widget.dart';
import '../../widgets/ui_kit.dart';
import 'gto_chart_detail_screen.dart';
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

  /// Position order per table size (action order, BB last).
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

  static String _tableLabel(int maxPlayers) => maxPlayers == 2 ? 'HU' : '$maxPlayers-MAX';

  static Color _tierColor(int tier) {
    switch (tier) {
      case 7:
        return AppTheme.coral;
      case 15:
        return const Color(0xFFFF9F43);
      case 25:
        return AppTheme.yellow;
      case 40:
        return AppTheme.mintLight;
      case 60:
        return AppTheme.mint;
      default:
        return AppTheme.sky;
    }
  }

  @override
  void initState() {
    super.initState();
    RecentCharts.load();
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
      appBar: AppBar(title: Text(l.gtoCharts)),
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        behavior: HitTestBehavior.translucent,
        child: gto.isLoading
            ? const SkeletonList(count: 4, itemHeight: 120)
            : gto.error != null
                ? ErrorState(error: gto.error, onRetry: gto.loadPositionTree)
                : _buildBody(context, gto, l),
      ),
    );
  }

  Widget _buildBody(BuildContext context, GtoProvider gto, AppLocalizations l) {
    final treeMap = {for (final ps in gto.positionTree) ps.position: ps};
    final positions = _positionOrder(gto.selectedPlayerCount);
    final chartCount = gto.positionTree.fold<int>(
      0,
      (sum, ps) => sum + ps.categories.fold<int>(0, (s, c) => s + c.charts.length),
    );

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
      children: [
        _buildSetupCard(gto, l).staggerIn(0),
        const SizedBox(height: 16),
        _PokerTable(
          // Rebuild (and replay the seat pop-in) when the table size changes.
          key: ValueKey('table-${gto.selectedPlayerCount}'),
          positions: positions,
          treeMap: treeMap,
          colors: _positionColors,
          centerLabel: _tableLabel(gto.selectedPlayerCount),
          tier: gto.selectedTier,
          tierColor: _tierColor(gto.selectedTier),
          chartCount: chartCount,
          onSeatTap: (pos) {
            InterstitialAdManager.instance.maybeShowOnTransition();
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => GtoSituationSelectScreen(positionSituations: treeMap[pos]!),
              ),
            );
          },
        ).staggerIn(1),
        const SizedBox(height: 10),
        Center(
          child: Text(
            l.tapSeatHint,
            style: TextStyle(color: context.ink54, fontWeight: FontWeight.w700),
          ),
        ),
        const SizedBox(height: 16),
        ValueListenableBuilder<List<RecentChart>>(
          valueListenable: RecentCharts.items,
          builder: (context, recents, _) {
            if (recents.isEmpty) return const SizedBox.shrink();
            return _RecentRow(recents: recents, title: l.recentCharts).staggerIn(2);
          },
        ),
        const Center(child: BannerAdWidget(placement: AdPlacement.main)),
      ],
    );
  }

  Widget _buildSetupCard(GtoProvider gto, AppLocalizations l) {
    const counts = [2, 3, 4, 5, 6, 7, 8, 9];
    const tiers = [7, 15, 25, 40, 60, 100];

    return PopCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionLabel(l.tableSize),
          const SizedBox(height: 8),
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.only(top: 4, bottom: 4),
              itemCount: counts.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (_, i) => _PopChip(
                label: counts[i] == 2 ? 'HU' : '${counts[i]}',
                selected: counts[i] == gto.selectedPlayerCount,
                color: AppTheme.sky,
                onTap: () => gto.selectPlayerCount(counts[i]),
              ),
            ),
          ),
          const SizedBox(height: 10),
          _SectionLabel(l.stackLabel),
          const SizedBox(height: 8),
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.only(top: 4, bottom: 4),
              itemCount: tiers.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (_, i) => _PopChip(
                label: '${tiers[i]}bb',
                selected: tiers[i] == gto.selectedTier,
                color: _tierColor(tiers[i]),
                onTap: () {
                  _bbController.clear();
                  _chipsController.clear();
                  gto.selectTier(tiers[i]);
                },
              ),
            ),
          ),
          const SizedBox(height: 12),
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
          const SizedBox(height: 10),
          AnimatedSwitcher(
            duration: AppTheme.normal,
            switchInCurve: AppTheme.bounce,
            child: gto.effectiveBb > 0
                ? PopTag(
                    key: ValueKey(gto.effectiveBb),
                    label: l.nbbEffective(gto.effectiveBb),
                    color: _tierColor(gto.selectedTier),
                    fontSize: 14,
                  )
                : Text(
                    l.enterValuesToCalculate,
                    key: const ValueKey('hint'),
                    style: TextStyle(color: context.ink38, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        fontFamily: AppTheme.display,
        fontSize: 16,
        color: context.ink,
      ),
    );
  }
}

/// Chunky selectable pill: bounces when picked, lifts with a hard shadow.
class _PopChip extends StatelessWidget {
  final String label;
  final bool selected;
  final Color color;
  final VoidCallback onTap;

  const _PopChip({
    required this.label,
    required this.selected,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: onTap,
      child: AnimatedContainer(
        duration: AppTheme.normal,
        curve: AppTheme.bounce,
        transform: Matrix4.translationValues(0, selected ? -2 : 0, 0),
        constraints: const BoxConstraints(minWidth: 48),
        padding: const EdgeInsets.symmetric(horizontal: 14),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? color : context.panel,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.outline, width: 2),
          boxShadow: [
            BoxShadow(
              color: context.outline,
              offset: Offset(0, selected ? 4 : 2),
            ),
          ],
        ),
        child: Text(
          label,
          style: TextStyle(
            fontFamily: AppTheme.display,
            fontSize: 16,
            color: selected ? AppTheme.lightOutline : context.ink70,
          ),
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
      style: TextStyle(color: context.ink, fontSize: 15, fontWeight: FontWeight.w800),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: context.ink54, fontSize: 13, fontWeight: FontWeight.w700),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        isDense: true,
      ),
    );
  }
}

/// Oval felt table with one tappable seat per position.
class _PokerTable extends StatelessWidget {
  final List<String> positions;
  final Map<String, PositionSituations> treeMap;
  final Map<String, Color> colors;
  final String centerLabel;
  final int tier;
  final Color tierColor;
  final int chartCount;
  final ValueChanged<String> onSeatTap;

  const _PokerTable({
    super.key,
    required this.positions,
    required this.treeMap,
    required this.colors,
    required this.centerLabel,
    required this.tier,
    required this.tierColor,
    required this.chartCount,
    required this.onSeatTap,
  });

  @override
  Widget build(BuildContext context) {
    final n = positions.length;
    final seatSize = n <= 6 ? 62.0 : 54.0;

    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final h = w * 1.02;
        final cx = w / 2;
        final cy = h / 2;
        final rx = w / 2 - seatSize / 2 - 4;
        final ry = h / 2 - seatSize / 2 - 4;
        final step = 2 * math.pi / n;

        return SizedBox(
          width: w,
          height: h + 6,
          child: Stack(
            children: [
              // Felt
              Positioned(
                left: seatSize * 0.55,
                right: seatSize * 0.55,
                top: seatSize * 0.55,
                bottom: seatSize * 0.55 + 6,
                child: Container(
                  decoration: BoxDecoration(
                    color: context.isLight ? const Color(0xFF3FD6A4) : const Color(0xFF16A37C),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: context.outline, width: 3),
                    boxShadow: [BoxShadow(color: context.outline, offset: const Offset(0, 6))],
                  ),
                  child: Container(
                    margin: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.35), width: 2),
                    ),
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            centerLabel,
                            style: const TextStyle(
                              fontFamily: AppTheme.display,
                              fontSize: 34,
                              color: Colors.white,
                              height: 1.1,
                              shadows: [Shadow(color: Color(0x66000000), offset: Offset(0, 2))],
                            ),
                          ),
                          const SizedBox(height: 6),
                          PopTag(label: '${tier}bb', color: tierColor, fontSize: 14),
                          const SizedBox(height: 8),
                          Text(
                            '♠ ♥ ♦ ♣',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.55),
                              fontSize: 18,
                              letterSpacing: 2,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              for (var i = 0; i < n; i++)
                Builder(builder: (context) {
                  // BB sits at the bottom; action order runs clockwise from there.
                  final theta = math.pi / 2 - (n - 1 - i) * step;
                  final pos = positions[i];
                  final ps = treeMap[pos];
                  final count = ps == null
                      ? 0
                      : ps.categories.fold<int>(0, (s, c) => s + c.charts.length);
                  return Positioned(
                    left: cx + rx * math.cos(theta) - seatSize / 2,
                    top: cy + ry * math.sin(theta) - seatSize / 2,
                    child: _Seat(
                      position: pos,
                      color: colors[pos] ?? AppTheme.grape,
                      size: seatSize,
                      count: count,
                      isDealer: pos == 'BTN',
                      onTap: ps == null ? null : () => onSeatTap(pos),
                    )
                        .animate(delay: (i * 70).ms)
                        .fadeIn(duration: AppTheme.fast)
                        .scaleXY(begin: 0, end: 1, duration: 600.ms, curve: Curves.elasticOut),
                  );
                }),
            ],
          ),
        );
      },
    );
  }
}

class _Seat extends StatelessWidget {
  final String position;
  final Color color;
  final double size;
  final int count;
  final bool isDealer;
  final VoidCallback? onTap;

  const _Seat({
    required this.position,
    required this.color,
    required this.size,
    required this.count,
    required this.isDealer,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return Opacity(
      opacity: enabled ? 1 : 0.45,
      child: Pressable(
        onTap: onTap,
        scale: 0.88,
        child: SizedBox(
          width: size,
          height: size,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: size,
                height: size,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                  border: Border.all(color: context.outline, width: 2.5),
                  boxShadow: [BoxShadow(color: context.outline, offset: const Offset(0, 4))],
                ),
                child: FittedBox(
                  child: Padding(
                    padding: const EdgeInsets.all(6),
                    child: Text(
                      position,
                      style: const TextStyle(
                        fontFamily: AppTheme.display,
                        fontSize: 18,
                        color: AppTheme.lightOutline,
                      ),
                    ),
                  ),
                ),
              ),
              if (enabled && count > 0)
                Positioned(
                  right: -6,
                  top: -6,
                  child: Container(
                    constraints: const BoxConstraints(minWidth: 22),
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: context.outline, width: 1.8),
                    ),
                    child: Text(
                      '$count',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontFamily: AppTheme.display,
                        fontSize: 12,
                        color: AppTheme.lightOutline,
                      ),
                    ),
                  ),
                ),
              if (isDealer)
                Positioned(
                  left: -6,
                  bottom: -6,
                  child: Container(
                    width: 22,
                    height: 22,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AppTheme.yellow,
                      shape: BoxShape.circle,
                      border: Border.all(color: context.outline, width: 1.8),
                    ),
                    child: const Text(
                      'D',
                      style: TextStyle(
                        fontFamily: AppTheme.display,
                        fontSize: 12,
                        color: AppTheme.lightOutline,
                        height: 1.1,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RecentRow extends StatelessWidget {
  final List<RecentChart> recents;
  final String title;

  const _RecentRow({required this.recents, required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionLabel(title),
          const SizedBox(height: 10),
          SizedBox(
            height: 56,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.only(bottom: 4),
              itemCount: recents.length,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (context, i) {
                final c = recents[i];
                return Pressable(
                  onTap: () {
                    InterstitialAdManager.instance.maybeShowOnTransition();
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => GtoChartDetailScreen(chartId: c.id)),
                    );
                  },
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 220),
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: context.panel,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: context.outline, width: 2),
                      boxShadow: [BoxShadow(color: context.outline, offset: const Offset(0, 3))],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('🃏', style: TextStyle(fontSize: 18)),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            c.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: context.ink,
                              fontWeight: FontWeight.w800,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
