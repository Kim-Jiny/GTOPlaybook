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

    return Scaffold(
      appBar: AppBar(
        title: Text('$pos Situations'),
        centerTitle: true,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: positionSituations.categories.length,
        itemBuilder: (context, i) {
          final cat = positionSituations.categories[i];
          return _CategorySection(
            category: cat,
            posColor: color,
            icon: _categoryIcons[cat.category] ?? Icons.casino,
          );
        },
      ),
    );
  }
}

class _CategorySection extends StatelessWidget {
  final SituationCategory category;
  final Color posColor;
  final IconData icon;

  const _CategorySection({
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
                category.category,
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
        ...category.charts.map((chart) => _ChartTile(chart: chart, posColor: posColor)),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _ChartTile extends StatelessWidget {
  final ChartSummary chart;
  final Color posColor;

  const _ChartTile({required this.chart, required this.posColor});

  @override
  Widget build(BuildContext context) {
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
          chart.description ?? chart.situation,
          style: const TextStyle(color: Colors.white, fontSize: 14),
        ),
        subtitle: chart.actionTypes != null
            ? Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Row(
                  children: chart.actionTypes!
                      .where((a) => a.key != 'fold')
                      .map((a) => Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 10,
                                  height: 10,
                                  decoration: BoxDecoration(
                                    color: a.toColor(),
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  a.label,
                                  style: TextStyle(
                                    color: Colors.white54,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ))
                      .toList(),
                ),
              )
            : null,
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
}
