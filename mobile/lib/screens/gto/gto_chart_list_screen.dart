import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/gto_provider.dart';
import '../../models/gto_chart.dart';
import 'gto_chart_detail_screen.dart';

class GtoChartListScreen extends StatefulWidget {
  const GtoChartListScreen({super.key});

  @override
  State<GtoChartListScreen> createState() => _GtoChartListScreenState();
}

class _GtoChartListScreenState extends State<GtoChartListScreen> {
  String? _selectedPosition;

  final _positions = ['All', 'UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<GtoProvider>().loadCharts();
    });
  }

  @override
  Widget build(BuildContext context) {
    final gto = context.watch<GtoProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('GTO Charts'),
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
                    label: Text(pos),
                    selected: isSelected,
                    onSelected: (_) {
                      setState(() {
                        _selectedPosition = pos == 'All' ? null : pos;
                      });
                      gto.loadCharts(position: _selectedPosition);
                    },
                    selectedColor: const Color(0xFF4CAF50),
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : Colors.white70,
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
                ? const Center(child: CircularProgressIndicator())
                : gto.charts.isEmpty
                    ? const Center(
                        child: Text(
                          'No charts available',
                          style: TextStyle(color: Colors.white54),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: gto.charts.length,
                        itemBuilder: (context, i) => _ChartCard(chart: gto.charts[i]),
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
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
        title: Text(
          chart.description ?? '${chart.position} ${chart.situation}',
          style: const TextStyle(color: Colors.white),
        ),
        subtitle: Text(
          '${chart.situation} | ${chart.stackDepth}bb',
          style: const TextStyle(color: Colors.white54),
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
}
