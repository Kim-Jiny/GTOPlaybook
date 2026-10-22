import 'package:flutter/material.dart';
import 'package:gtoplaybook/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import '../../providers/gto_provider.dart';
import '../../models/gto_chart.dart';
import '../../services/interstitial_ad_manager.dart';
import 'gto_chart_detail_screen.dart';
import '../../theme/app_theme.dart';
import '../../widgets/ui_kit.dart';

class GtoChartListScreen extends StatefulWidget {
  const GtoChartListScreen({super.key});

  @override
  State<GtoChartListScreen> createState() => _GtoChartListScreenState();
}

class _GtoChartListScreenState extends State<GtoChartListScreen> {
  String? _selectedPosition;

  final _positions = ['All', 'UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];

  @override
  Widget build(BuildContext context) {
    final gto = context.watch<GtoProvider>();
    final l = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(
        title: Text(l.gtoCharts),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // Position filter chips
          SizedBox(
            height: 48,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _positions.length,
              itemBuilder: (context, i) {
                final pos = _positions[i];
                final isSelected = (_selectedPosition == null && pos == 'All') ||
                    _selectedPosition == pos;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(pos == 'All' ? l.all : pos),
                    selected: isSelected,
                    onSelected: (_) {
                      setState(() {
                        _selectedPosition = pos == 'All' ? null : pos;
                      });
                      gto.loadCharts(position: _selectedPosition);
                    },
                    selectedColor: context.accent.withValues(alpha: 0.85),
                    showCheckmark: false,
                    side: BorderSide(color: context.hairline),
                    labelStyle: TextStyle(
                      color: isSelected ? context.ink : context.ink70,
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),
          // Chart list
          Expanded(
            child: gto.isLoading
                ? const SkeletonList()
                : gto.error != null
                    ? ErrorState(
                        error: gto.error,
                        onRetry: () => gto.loadCharts(position: _selectedPosition),
                      )
                    : gto.charts.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(l.noChartsAvailable, style: TextStyle(color: context.ink54)),
                                const SizedBox(height: 12),
                                ElevatedButton(
                                  onPressed: () => gto.loadCharts(position: _selectedPosition),
                                  child: Text(l.reload),
                                ),
                              ],
                            ),
                          )
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: gto.charts.length,
                        itemBuilder: (context, i) => _ChartCard(chart: gto.charts[i]).staggerIn(i, maxSteps: 8),
                      ),
          ),
        ],
      ),
    );
  }
}

class _ChartCard extends StatelessWidget {
  final GtoChart chart;
  const _ChartCard({required this.chart});

  Color _positionColor(String pos) {
    switch (pos) {
      case 'UTG':
        return Colors.red;
      case 'MP':
        return Colors.orange;
      case 'CO':
        return Colors.yellow;
      case 'BTN':
        return Colors.green;
      case 'SB':
        return Colors.blue;
      case 'BB':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _positionColor(chart.position),
          child: Text(
            chart.position,
            style: TextStyle(
              color: context.ink,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
        title: Text(
          chart.description ?? '${chart.position} ${chart.situation}',
          style: TextStyle(color: context.ink),
        ),
        subtitle: Text(
          '${chart.situation} | ${chart.stackDepth}bb',
          style: TextStyle(color: context.ink54),
        ),
        trailing: Icon(Icons.chevron_right, color: context.ink54),
        onTap: () {
          InterstitialAdManager.instance.maybeShowOnTransition();
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
