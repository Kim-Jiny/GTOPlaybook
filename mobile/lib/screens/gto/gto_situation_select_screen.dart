import 'package:flutter/material.dart';
import '../../models/position_situations.dart';
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

    return Scaffold(
      appBar: AppBar(
        title: Text(_screenTitle(pos)),
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
          const SizedBox(height: 16),
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

  String _screenTitle(String position) => '$position Playbook';
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
                _categoryLabel(category.category),
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

  String _categoryLabel(String category) {
    switch (category) {
      case 'RFI':
        return 'Open Pot';
      case 'Facing 3bet':
        return 'Facing a 3-Bet';
      case '3bet vs Opener':
        return '3-Betting';
      case 'Defend':
        return 'Defending';
      case 'SB Defend':
        return 'Small Blind Defense';
      case 'Facing 4bet':
        return 'Facing a 4-Bet';
      case 'Postflop Cbet':
        return 'Postflop C-Bet';
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

  @override
  Widget build(BuildContext context) {
    final title = _chartTitle();
    final subtitle = _chartSubtitle();
    final actionPreview = _actionPreview();

    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      child: ListTile(
        leading: chart.vsPosition != null
            ? CircleAvatar(
                radius: 18,
                backgroundColor: posColor.withValues(alpha: 0.2),
                child: Text(
                  chart.vsPosition!,
                  style: TextStyle(
                    color: posColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              )
            : null,
        title: Text(
          title,
          style: const TextStyle(color: Colors.white, fontSize: 14),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                subtitle,
                style: const TextStyle(
                  color: Colors.white54,
                  fontSize: 12,
                ),
              ),
              if (actionPreview.isNotEmpty) ...[
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: actionPreview,
                ),
              ],
            ],
          ),
        ),
        trailing: const Icon(Icons.chevron_right, color: Colors.white54),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => GtoChartDetailScreen(chartId: chart.id),
            ),
          );
        },
      ),
    );
  }

  String _chartTitle() {
    if ((chart.description ?? '').isNotEmpty) {
      return chart.description!;
    }

    if (chart.vsPosition != null) {
      return '$heroPosition ${_normalizeSituation(chart.situation)} vs ${chart.vsPosition}';
    }
    return '$heroPosition ${_normalizeSituation(chart.situation)}';
  }

  String _chartSubtitle() {
    final parts = <String>[
      _categorySummary(category),
      if (chart.vsPosition != null) 'Villain: ${chart.vsPosition}',
    ];
    return parts.join('  •  ');
  }

  String _normalizeSituation(String situation) {
    final cleaned = situation.replaceAll('_', ' ').trim();
    if (cleaned.isEmpty) return 'Spot';
    return cleaned;
  }

  String _categorySummary(String category) {
    switch (category) {
      case 'RFI':
        return 'Unopened pot';
      case 'Facing 3bet':
        return 'Responding after opening';
      case '3bet vs Opener':
        return 'Re-raising an opener';
      case 'Defend':
        return 'Calling or mixing from the blinds';
      case 'SB Defend':
        return 'Playing from the small blind';
      case 'Facing 4bet':
        return 'Continuing vs a 4-bet';
      case 'Postflop Cbet':
        return 'Postflop continuation spot';
      default:
        return category;
    }
  }

  List<Widget> _actionPreview() {
    final actions = chart.actionTypes
            ?.where((action) => action.key != 'fold')
            .take(3)
            .toList() ??
        const [];
    return actions
        .map(
          (action) => Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: action.toColor(),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 4),
              Text(
                action.label,
                style: const TextStyle(
                  color: Colors.white54,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        )
        .toList();
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
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '$position Strategy Library',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Choose the exact spot you want to study. Each section groups similar decisions so detailed charts stay navigable.',
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
                _InfoChip(label: '$categoryCount sections', color: color),
                _InfoChip(label: '$chartCount charts', color: color),
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
