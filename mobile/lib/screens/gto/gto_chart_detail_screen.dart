import 'package:flutter/material.dart';
import 'package:gtoplaybook/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import '../../providers/gto_provider.dart';
import '../../models/gto_chart.dart';
import '../../services/ad_helper.dart';
import '../../widgets/banner_ad_widget.dart';
import '../../widgets/gto_grid.dart';

class GtoChartDetailScreen extends StatefulWidget {
  final int chartId;
  const GtoChartDetailScreen({super.key, required this.chartId});

  @override
  State<GtoChartDetailScreen> createState() => _GtoChartDetailScreenState();
}

class _GtoChartDetailScreenState extends State<GtoChartDetailScreen> {
  HandRange? _selectedRange;
  bool _detailedMode = true;
  GtoChart? _chart;
  String? _error;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadChart();
    });
  }

  Future<void> _loadChart() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final chart = await context.read<GtoProvider>().fetchChartDetail(widget.chartId);
      if (!mounted) return;
      setState(() {
        _chart = chart;
        _selectedRange = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final chart = _chart;
    final selectedRange = chart == null ? null : (_selectedRange ?? _defaultRange(chart));
    final l = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(
        title: Text(chart?.description ?? l.loading),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_error!, style: const TextStyle(color: Colors.redAccent)),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: _loadChart,
                        child: Text(l.retry),
                      ),
                    ],
                  ),
                )
              : chart == null
                  ? Center(
                      child: Text(
                        l.noData,
                        style: const TextStyle(color: Colors.white54),
                      ),
                    )
                  : SingleChildScrollView(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _ChartSummaryCard(chart: chart),
                  const SizedBox(height: 16),
                  _DisplayModeToggle(
                    detailedMode: _detailedMode,
                    onChanged: (value) {
                      setState(() => _detailedMode = value);
                    },
                  ),
                  const SizedBox(height: 12),
                  _buildLegend(chart),
                  const SizedBox(height: 12),
                  GtoGrid(
                    ranges: chart.ranges ?? [],
                    actionTypes: chart.actionTypes,
                    selectedHand: selectedRange?.hand,
                    detailedMode: _detailedMode,
                    onCellTap: (range) {
                      setState(() => _selectedRange = range);
                    },
                  ),
                  const SizedBox(height: 16),
                  if (selectedRange != null)
                    _HandDetail(
                      range: selectedRange,
                      actionTypes: chart.actionTypes,
                    ),
                  const SizedBox(height: 16),
                  const Center(child: BannerAdWidget(placement: AdPlacement.chart)),
                ],
              ),
            ),
    );
  }

  HandRange? _defaultRange(GtoChart chart) {
    final ranges = chart.ranges ?? const [];
    if (ranges.isEmpty) return null;

    final sorted = [...ranges]
      ..sort((a, b) => _primaryFrequency(b).compareTo(_primaryFrequency(a)));
    return sorted.first;
  }

  double _primaryFrequency(HandRange range) {
    if (range.frequencies.isNotEmpty) {
      return range.frequencies.values.fold<double>(0, (best, value) => value > best ? value : best);
    }
    return [range.raiseFreq, range.callFreq, range.foldFreq]
        .fold<double>(0, (best, value) => value > best ? value : best);
  }

  Widget _buildLegend(GtoChart chart) {
    if (chart.actionTypes != null && chart.actionTypes!.isNotEmpty) {
      return Wrap(
        alignment: WrapAlignment.center,
        spacing: 16,
        children: chart.actionTypes!
            .map((at) => _LegendItem(color: at.toColor(), label: at.label))
            .toList(),
      );
    }
    // Fallback legacy legend
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _LegendItem(color: Colors.red.shade700, label: 'Raise'),
        const SizedBox(width: 16),
        _LegendItem(color: Colors.green.shade700, label: 'Call'),
        const SizedBox(width: 16),
        _LegendItem(color: Colors.grey.shade700, label: 'Fold'),
      ],
    );
  }
}

class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;
  const _LegendItem({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(3),
          ),
        ),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
      ],
    );
  }
}

class _HandDetail extends StatelessWidget {
  final HandRange range;
  final List<ActionType>? actionTypes;
  const _HandDetail({required this.range, this.actionTypes});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    final summary = _actionSummary(range, actionTypes, l);
    final rankedActions = _rankedActions(range, actionTypes);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  range.hand,
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: summary.color.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    summary.title,
                    style: TextStyle(
                      color: summary.color,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              summary.description,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _MetaChip(label: _handCategory(range.hand, l)),
                _MetaChip(label: l.nCombos(_comboCount(range.hand))),
                _MetaChip(label: summary.mixLabel),
              ],
            ),
            const SizedBox(height: 16),
            if (rankedActions.isNotEmpty) ...[
              Text(
                l.actionPriority,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 10),
              ...rankedActions.map(
                (action) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _ActionRankTile(action: action),
                ),
              ),
              const SizedBox(height: 12),
            ],
            Text(
              _studyNote(range, rankedActions, l),
              style: const TextStyle(
                color: Colors.white60,
                fontSize: 13,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 16),
            if (actionTypes != null && range.frequencies.isNotEmpty)
              ...actionTypes!.map((at) {
                final freq = range.frequencies[at.key] ?? 0.0;
                if (freq <= 0) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _FreqBar(label: at.label, freq: freq, color: at.toColor()),
                );
              })
            else ...[
              _FreqBar(label: 'Raise', freq: range.raiseFreq, color: Colors.red.shade700),
              const SizedBox(height: 8),
              _FreqBar(label: 'Call', freq: range.callFreq, color: Colors.green.shade700),
              const SizedBox(height: 8),
              _FreqBar(label: 'Fold', freq: range.foldFreq, color: Colors.grey.shade600),
            ],
          ],
        ),
      ),
      );
    }

  _ActionSummary _actionSummary(HandRange range, List<ActionType>? actionTypes, AppLocalizations l) {
    final frequencies = <String, double>{};
    if (range.frequencies.isNotEmpty) {
      frequencies.addAll(range.frequencies);
    } else {
      if (range.raiseFreq > 0) frequencies['raise'] = range.raiseFreq;
      if (range.callFreq > 0) frequencies['call'] = range.callFreq;
      if (range.foldFreq > 0) frequencies['fold'] = range.foldFreq;
    }

    if (frequencies.isEmpty) {
      return _ActionSummary(
        title: l.noData,
        description: l.noActionFrequencies,
        color: Colors.white54,
        mixLabel: l.noMix,
      );
    }

    final sorted = frequencies.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final primary = sorted.first;
    final secondary = sorted.length > 1 ? sorted[1] : null;
    final isMixed = secondary != null && secondary.value >= 0.12;

    final labels = {
      for (final action in actionTypes ?? const <ActionType>[]) action.key: action.label,
      'raise': 'Raise',
      'call': 'Call',
      'fold': 'Fold',
    };

    final colors = {
      for (final action in actionTypes ?? const <ActionType>[]) action.key: action.toColor(),
      'raise': Colors.red.shade700,
      'call': Colors.green.shade700,
      'fold': Colors.grey.shade700,
    };

    final primaryLabel = labels[primary.key] ?? primary.key;
    final primaryPercent = (primary.value * 100).round();
    if (!isMixed) {
      return _ActionSummary(
        title: l.nPercentAction(primaryLabel, primaryPercent),
        description: l.primaryActionDesc(primaryLabel),
        color: colors[primary.key] ?? Colors.blueGrey,
        mixLabel: l.pureStrategy,
      );
    }

    final mixText = sorted
        .take(3)
        .map((entry) => l.nPercentAction(labels[entry.key] ?? entry.key, (entry.value * 100).round()))
        .join(' / ');
    return _ActionSummary(
      title: l.mixedStrategy,
      description: mixText,
      color: colors[primary.key] ?? Colors.blueGrey,
      mixLabel: l.nWayMix(sorted.length),
    );
  }

  List<_RankedAction> _rankedActions(HandRange range, List<ActionType>? actionTypes) {
    final labels = {
      for (final action in actionTypes ?? const <ActionType>[]) action.key: action.label,
      'raise': 'Raise',
      'call': 'Call',
      'fold': 'Fold',
    };
    final colors = {
      for (final action in actionTypes ?? const <ActionType>[]) action.key: action.toColor(),
      'raise': Colors.red.shade700,
      'call': Colors.green.shade700,
      'fold': Colors.grey.shade700,
    };

    final frequencies = <String, double>{};
    if (range.frequencies.isNotEmpty) {
      frequencies.addAll(range.frequencies);
    } else {
      if (range.raiseFreq > 0) frequencies['raise'] = range.raiseFreq;
      if (range.callFreq > 0) frequencies['call'] = range.callFreq;
      if (range.foldFreq > 0) frequencies['fold'] = range.foldFreq;
    }

    final sorted = frequencies.entries
        .where((entry) => entry.value > 0)
        .toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return sorted
        .map(
          (entry) => _RankedAction(
            label: labels[entry.key] ?? entry.key,
            key: entry.key,
            freq: entry.value,
            color: colors[entry.key] ?? Colors.blueGrey,
          ),
        )
        .toList();
  }

  String _handCategory(String hand, AppLocalizations l) {
    if (hand.length == 2) return l.pocketPair;
    if (hand.endsWith('s')) return l.suited;
    if (hand.endsWith('o')) return l.offsuit;
    return l.hand;
  }

  int _comboCount(String hand) {
    if (hand.length == 2) return 6;
    if (hand.endsWith('s')) return 4;
    if (hand.endsWith('o')) return 12;
    return 0;
  }

  String _studyNote(HandRange range, List<_RankedAction> rankedActions, AppLocalizations l) {
    if (rankedActions.isEmpty) {
      return l.studyNoteEmpty;
    }

    final primary = rankedActions.first;
    final secondary = rankedActions.length > 1 ? rankedActions[1] : null;

    if (secondary == null || secondary.freq < 0.12) {
      return l.studyNotePure(range.hand, primary.label.toLowerCase());
    }

    final gap = ((primary.freq - secondary.freq) * 100).round();
    return l.studyNoteMixed(range.hand, primary.label.toLowerCase(), secondary.label.toLowerCase(), gap);
  }
}

class _FreqBar extends StatelessWidget {
  final String label;
  final double freq;
  final Color color;
  const _FreqBar({required this.label, required this.freq, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(width: 50, child: Text(label, style: const TextStyle(color: Colors.white70))),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: freq,
              backgroundColor: Colors.white12,
              color: color,
              minHeight: 20,
            ),
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 48,
          child: Text(
            '${(freq * 100).round()}%',
            style: const TextStyle(color: Colors.white70),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }
}

class _ChartSummaryCard extends StatelessWidget {
  final GtoChart chart;

  const _ChartSummaryCard({required this.chart});

  @override
  Widget build(BuildContext context) {
    final headline = _headline(chart);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              headline,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w700,
              ),
            ),
            if ((chart.description ?? '').isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                chart.description!,
                style: const TextStyle(color: Colors.white70),
              ),
            ],
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _MetaChip(label: chart.position),
                if (chart.vsPosition != null) _MetaChip(label: 'vs ${chart.vsPosition}'),
                _MetaChip(label: '${chart.stackDepth}bb'),
                _MetaChip(label: '${chart.maxPlayers}-max'),
                if ((chart.category ?? '').isNotEmpty) _MetaChip(label: chart.category!),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _headline(GtoChart chart) {
    if (chart.vsPosition != null) {
      return '${chart.position} ${chart.situation} vs ${chart.vsPosition}';
    }
    return '${chart.position} ${chart.situation}';
  }
}

class _DisplayModeToggle extends StatelessWidget {
  final bool detailedMode;
  final ValueChanged<bool> onChanged;

  const _DisplayModeToggle({
    required this.detailedMode,
    required this.onChanged,
  });

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
              l.viewMode,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _ModeButton(
                    label: l.simple,
                    isSelected: !detailedMode,
                    description: l.primaryActionFirst,
                    onTap: () => onChanged(false),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _ModeButton(
                    label: l.detailed,
                    isSelected: detailedMode,
                    description: l.mixedFrequenciesVisible,
                    onTap: () => onChanged(true),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ModeButton extends StatelessWidget {
  final String label;
  final bool isSelected;
  final String description;
  final VoidCallback onTap;

  const _ModeButton({
    required this.label,
    required this.isSelected,
    required this.description,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF4CAF50).withValues(alpha: 0.16)
              : Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF4CAF50)
                : Colors.white.withValues(alpha: 0.08),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                color: isSelected ? const Color(0xFF7CFF83) : Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              description,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  final String label;

  const _MetaChip({required this.label});

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

class _ActionSummary {
  final String title;
  final String description;
  final Color color;
  final String mixLabel;

  const _ActionSummary({
    required this.title,
    required this.description,
    required this.color,
    required this.mixLabel,
  });
}

class _ActionRankTile extends StatelessWidget {
  final _RankedAction action;

  const _ActionRankTile({required this.action});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: action.color,
              borderRadius: BorderRadius.circular(3),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              action.label,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Text(
            '${(action.freq * 100).round()}%',
            style: const TextStyle(
              color: Colors.white70,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _RankedAction {
  final String label;
  final String key;
  final double freq;
  final Color color;

  const _RankedAction({
    required this.label,
    required this.key,
    required this.freq,
    required this.color,
  });
}
