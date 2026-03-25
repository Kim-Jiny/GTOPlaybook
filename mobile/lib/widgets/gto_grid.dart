import 'package:flutter/material.dart';
import '../models/gto_chart.dart';

class GtoGrid extends StatelessWidget {
  final List<HandRange> ranges;
  final List<ActionType>? actionTypes;
  final Function(HandRange)? onCellTap;
  final String? selectedHand;
  final bool detailedMode;

  const GtoGrid({
    super.key,
    required this.ranges,
    this.actionTypes,
    this.onCellTap,
    this.selectedHand,
    this.detailedMode = true,
  });

  static const _ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

  @override
  Widget build(BuildContext context) {
    // Build lookup map
    final grid = <String, HandRange>{};
    for (final r in ranges) {
      grid['${r.rowIdx},${r.colIdx}'] = r;
    }

    // Build action color map from actionTypes
    final colorMap = <String, Color>{};
    if (actionTypes != null) {
      for (final at in actionTypes!) {
        colorMap[at.key] = at.toColor();
      }
    }

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFF121212),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: AspectRatio(
        aspectRatio: 1,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final axisSize = constraints.maxWidth * 0.055;
            final cellSize = (constraints.maxWidth - axisSize) / 13;

            return Column(
              children: [
                SizedBox(
                  height: axisSize,
                  child: Row(
                    children: [
                      SizedBox(width: axisSize),
                      ...List.generate(
                        13,
                        (index) => SizedBox(
                          width: cellSize,
                          child: Center(
                            child: Text(
                              _ranks[index],
                              style: TextStyle(
                                color: Colors.white38,
                                fontSize: axisSize * 0.42,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                ...List.generate(13, (row) {
                  return Row(
                    children: [
                      SizedBox(
                        width: axisSize,
                        height: cellSize,
                        child: Center(
                          child: Text(
                            _ranks[row],
                            style: TextStyle(
                              color: Colors.white38,
                              fontSize: axisSize * 0.42,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                      ...List.generate(13, (col) {
                        final key = '$row,$col';
                        final range = grid[key];
                        return GestureDetector(
                          onTap: range != null ? () => onCellTap?.call(range) : null,
                          child: Container(
                            width: cellSize,
                            height: cellSize,
                            decoration: BoxDecoration(
                              color: Colors.grey.shade900,
                              border: Border.all(color: Colors.black26, width: 0.5),
                            ),
                            child: Stack(
                              fit: StackFit.expand,
                              children: [
                                _CellBackground(
                                  range: range,
                                  colorMap: colorMap,
                                  detailedMode: detailedMode,
                                ),
                                if (range != null && selectedHand == range.hand)
                                  Container(
                                    decoration: BoxDecoration(
                                      border: Border.all(
                                        color: Colors.white,
                                        width: cellSize > 32 ? 2 : 1.2,
                                      ),
                                    ),
                                  ),
                                Center(
                                  child: Text(
                                    range?.hand ?? _defaultLabel(row, col),
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: cellSize * 0.3,
                                      fontWeight: FontWeight.w600,
                                      shadows: const [
                                        Shadow(
                                          blurRadius: 4,
                                          color: Colors.black87,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                if (range != null && cellSize >= 28)
                                  Positioned(
                                    left: 2,
                                    right: 2,
                                    bottom: 2,
                                    child: Text(
                                      detailedMode
                                          ? _summaryLabel(range)
                                          : _primaryActionAbbreviation(range),
                                      textAlign: TextAlign.center,
                                      maxLines: 1,
                                      overflow: TextOverflow.fade,
                                      style: TextStyle(
                                        color: Colors.white.withValues(alpha: 0.88),
                                        fontSize: cellSize * (detailedMode ? 0.14 : 0.16),
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        );
                      }),
                    ],
                  );
                }),
              ],
            );
          },
        ),
      ),
    );
  }

  String _summaryLabel(HandRange range) {
    final freqs = range.frequencies;
    if (freqs.isEmpty) {
      final primaryFreq = [range.raiseFreq, range.callFreq, range.foldFreq]
          .reduce((a, b) => a > b ? a : b);
      return '${(primaryFreq * 100).round()}%';
    }

    final best = freqs.entries.reduce((a, b) => a.value >= b.value ? a : b);
    return '${(best.value * 100).round()}%';
  }

  String _primaryActionAbbreviation(HandRange range) {
    final freqs = range.frequencies.isNotEmpty
        ? range.frequencies
        : <String, double>{
            if (range.raiseFreq > 0) 'raise': range.raiseFreq,
            if (range.callFreq > 0) 'call': range.callFreq,
            if (range.foldFreq > 0) 'fold': range.foldFreq,
          };
    if (freqs.isEmpty) return '';

    final best = freqs.entries.reduce((a, b) => a.value >= b.value ? a : b);
    switch (best.key) {
      case 'raise':
        return 'R';
      case 'call':
        return 'C';
      case 'fold':
        return 'F';
      default:
        return best.key.substring(0, 1).toUpperCase();
    }
  }

  String _defaultLabel(int row, int col) {
    if (row == col) return '${_ranks[row]}${_ranks[col]}';
    if (row < col) return '${_ranks[row]}${_ranks[col]}s';
    return '${_ranks[col]}${_ranks[row]}o';
  }
}

class _CellBackground extends StatelessWidget {
  final HandRange? range;
  final Map<String, Color> colorMap;
  final bool detailedMode;

  const _CellBackground({
    required this.range,
    required this.colorMap,
    required this.detailedMode,
  });

  @override
  Widget build(BuildContext context) {
    if (range == null) {
      return ColoredBox(color: Colors.grey.shade900);
    }

    final segments = _segmentsFor(range!);
    if (segments.isEmpty) {
      return ColoredBox(color: Colors.grey.shade800);
    }

    if (!detailedMode) {
      return ColoredBox(color: segments.first.color);
    }

    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: segments
          .map(
            (segment) => Expanded(
              flex: segment.flex,
              child: Container(color: segment.color),
            ),
          )
          .toList(),
    );
  }

  List<_ColorSegment> _segmentsFor(HandRange range) {
    final freqs = <String, double>{};
    if (range.frequencies.isNotEmpty) {
      freqs.addAll(range.frequencies);
    } else {
      if (range.raiseFreq > 0) freqs['raise'] = range.raiseFreq;
      if (range.callFreq > 0) freqs['call'] = range.callFreq;
      if (range.foldFreq > 0) freqs['fold'] = range.foldFreq;
    }

    final ordered = freqs.entries
        .where((entry) => entry.value > 0)
        .toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    if (ordered.isEmpty) return const [];

    return ordered.map((entry) {
      final base = colorMap[entry.key] ?? _fallbackColor(entry.key);
      final color = entry.key == 'fold'
          ? Colors.grey.shade800
          : Color.lerp(Colors.black, base, 0.92) ?? base;
      return _ColorSegment(
        color: color,
        flex: (entry.value * 1000).round().clamp(1, 1000),
      );
    }).toList();
  }

  Color _fallbackColor(String key) {
    switch (key) {
      case 'raise':
        return Colors.red.shade700;
      case 'call':
        return Colors.green.shade700;
      case 'fold':
        return Colors.grey.shade700;
      default:
        return Colors.blueGrey.shade600;
    }
  }
}

class _ColorSegment {
  final Color color;
  final int flex;

  const _ColorSegment({
    required this.color,
    required this.flex,
  });
}
