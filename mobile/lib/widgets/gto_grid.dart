import 'package:flutter/material.dart';
import '../models/gto_chart.dart';

class GtoGrid extends StatelessWidget {
  final List<HandRange> ranges;
  final Function(HandRange)? onCellTap;

  const GtoGrid({super.key, required this.ranges, this.onCellTap});

  static const _ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

  @override
  Widget build(BuildContext context) {
    // Build lookup map
    final grid = <String, HandRange>{};
    for (final r in ranges) {
      grid['${r.rowIdx},${r.colIdx}'] = r;
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
                        color: _cellColor(range),
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

  Color _cellColor(HandRange? range) {
    if (range == null) return Colors.grey.shade900;

    final raise = range.raiseFreq;
    final call = range.callFreq;
    final fold = range.foldFreq;

    if (fold >= 0.99) return Colors.grey.shade800;

    // Pure raise
    if (raise >= 0.99) return Colors.red.shade700;
    // Pure call
    if (call >= 0.99) return Colors.green.shade700;

    // Mixed — blend colors based on frequency
    if (raise > 0 && fold > 0 && call == 0) {
      // Raise/fold mix
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
