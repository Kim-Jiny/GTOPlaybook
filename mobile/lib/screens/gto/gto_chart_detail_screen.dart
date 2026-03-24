import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/gto_provider.dart';
import '../../models/gto_chart.dart';
import '../../widgets/gto_grid.dart';

class GtoChartDetailScreen extends StatefulWidget {
  final int chartId;
  const GtoChartDetailScreen({super.key, required this.chartId});

  @override
  State<GtoChartDetailScreen> createState() => _GtoChartDetailScreenState();
}

class _GtoChartDetailScreenState extends State<GtoChartDetailScreen> {
  HandRange? _selectedRange;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<GtoProvider>().loadChartDetail(widget.chartId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final gto = context.watch<GtoProvider>();
    final chart = gto.selectedChart;

    return Scaffold(
      appBar: AppBar(
        title: Text(chart?.description ?? 'Loading...'),
        centerTitle: true,
      ),
      body: gto.isLoading || chart == null
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  // Legend
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _LegendItem(color: Colors.red.shade700, label: 'Raise'),
                      const SizedBox(width: 16),
                      _LegendItem(color: Colors.green.shade700, label: 'Call'),
                      const SizedBox(width: 16),
                      _LegendItem(color: Colors.grey.shade700, label: 'Fold'),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // GTO Grid
                  GtoGrid(
                    ranges: chart.ranges ?? [],
                    onCellTap: (range) {
                      setState(() => _selectedRange = range);
                    },
                  ),
                  const SizedBox(height: 16),
                  // Selected hand detail
                  if (_selectedRange != null) _HandDetail(range: _selectedRange!),
                ],
              ),
            ),
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
  const _HandDetail({required this.range});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              range.hand,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 12),
            _FreqBar(label: 'Raise', freq: range.raiseFreq, color: Colors.red.shade700),
            const SizedBox(height: 8),
            _FreqBar(label: 'Call', freq: range.callFreq, color: Colors.green.shade700),
            const SizedBox(height: 8),
            _FreqBar(label: 'Fold', freq: range.foldFreq, color: Colors.grey.shade600),
          ],
        ),
      ),
    );
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
