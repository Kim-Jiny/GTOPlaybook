import 'package:flutter/material.dart';
import '../models/gto_chart.dart';

class GtoGrid extends StatelessWidget {
  final List<HandRange> ranges;
  final List<ActionType>? actionTypes;
  final Function(HandRange)? onCellTap;

  const GtoGrid({super.key, required this.ranges, this.actionTypes, this.onCellTap});

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

    return AspectRatio(
      aspectRatio: 1,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final cellSize = constraints.maxWidth / 13;
          return Column(
            children: List.generate(13, (row) {
              return Row(
                children: List.generate(13, (col) {
                  final key = '$row,$col';
                  final range = grid[key];
                  return GestureDetector(
                    onTap: range != null ? () => onCellTap?.call(range) : null,
                    child: Container(
                      width: cellSize,
                      height: cellSize,
                      decoration: BoxDecoration(
                        color: _cellColor(range, colorMap),
                        border: Border.all(color: Colors.black26, width: 0.5),
                      ),
                      child: Center(
                        child: Text(
                          range?.hand ?? _defaultLabel(row, col),
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: cellSize * 0.3,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              );
            }),
          );
        },
      ),
    );
  }

  Color _cellColor(HandRange? range, Map<String, Color> colorMap) {
    if (range == null) return Colors.grey.shade900;

    final freqs = range.frequencies;

    // If we have dynamic frequencies and action colors, use them
    if (freqs.isNotEmpty && colorMap.isNotEmpty) {
      final foldFreq = freqs['fold'] ?? 0.0;
      if (foldFreq >= 0.99) return Colors.grey.shade800;

      // Find the dominant non-fold action
      String? dominantKey;
      double dominantVal = 0;
      for (final entry in freqs.entries) {
        if (entry.key != 'fold' && entry.value > dominantVal) {
          dominantKey = entry.key;
          dominantVal = entry.value;
        }
      }

      if (dominantKey == null) return Colors.grey.shade800;

      final baseColor = colorMap[dominantKey] ?? Colors.grey.shade700;

      // Use fold ratio to control opacity — more fold = more faded
      if (foldFreq > 0 && foldFreq < 1.0) {
        return Color.lerp(Colors.grey.shade800, baseColor, 1.0 - foldFreq * 0.6)!;
      }

      return baseColor;
    }

    // Fallback: legacy raise/call/fold
    final raise = range.raiseFreq;
    final call = range.callFreq;
    final fold = range.foldFreq;

    if (fold >= 0.99) return Colors.grey.shade800;
    if (raise >= 0.99) return Colors.red.shade700;
    if (call >= 0.99) return Colors.green.shade700;

    if (raise > 0 && fold > 0 && call == 0) {
      return Color.lerp(Colors.grey.shade800, Colors.red.shade700, raise)!;
    }
    if (raise > 0 && call > 0) {
      return Color.lerp(Colors.green.shade700, Colors.red.shade700, raise / (raise + call))!;
    }

    return Colors.grey.shade700;
  }

  String _defaultLabel(int row, int col) {
    if (row == col) return '${_ranks[row]}${_ranks[col]}';
    if (row < col) return '${_ranks[row]}${_ranks[col]}s';
    return '${_ranks[col]}${_ranks[row]}o';
  }
}
