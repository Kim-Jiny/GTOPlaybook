import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import '../models/gto_chart.dart';
import '../theme/app_theme.dart';
import 'ui_kit.dart';

/// 13x13 hand grid.
///
/// Drawing 169 cells with ~340 text labels is too much work for a single
/// frame, so it happens in three steps:
///  1. the cells' text is laid out in small slices across several frames while
///     a skeleton is shown (see [_Prepared.build]),
///  2. the finished grid fades in,
///  3. from then on a single [CustomPainter] just draws the cached cells, and
///     tapping a cell only moves the selection overlay.
class GtoGrid extends StatefulWidget {
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

  static const _ranks = [
    'A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2',
  ];
  static const _actionPriority = {
    'allin': 0,
    '5bet': 1,
    '4bet': 2,
    '3bet': 3,
    'raise': 4,
    'bet': 5,
    'call': 6,
    'check': 7,
    'fold': 8,
  };

  @override
  State<GtoGrid> createState() => _GtoGridState();
}

class _GtoGridState extends State<GtoGrid> {
  _Prepared? _ready;
  Object? _readyKey;
  Object? _pendingKey;
  int _token = 0;

  Object _key(double cellSize, Color axisColor) => (
        identityHashCode(widget.ranges),
        identityHashCode(widget.actionTypes),
        widget.detailedMode,
        cellSize.toStringAsFixed(2),
        axisColor.toARGB32(),
      );

  /// Kicks off (or re-runs) preparation when anything the picture depends on
  /// changed. The previous grid stays on screen until the new one is ready.
  void _ensurePrepared(double axisSize, double cellSize, Color axisColor) {
    final key = _key(cellSize, axisColor);
    if (key == _readyKey || key == _pendingKey) return;
    _pendingKey = key;
    final token = ++_token;
    final ranges = widget.ranges;
    final actionTypes = widget.actionTypes;
    final detailed = widget.detailedMode;

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final data = await _Prepared.build(
        ranges: ranges,
        actionTypes: actionTypes,
        detailedMode: detailed,
        axisSize: axisSize,
        cellSize: cellSize,
        axisColor: axisColor,
        stillWanted: () => mounted && token == _token,
      );
      if (data == null || !mounted || token != _token) return;
      setState(() {
        _ready = data;
        _readyKey = key;
        _pendingKey = null;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final axisColor = context.ink38;
    final ready = _ready;
    final selected = widget.selectedHand == null || ready == null
        ? null
        : widget.ranges.where((r) => r.hand == widget.selectedHand).firstOrNull;

    return RepaintBoundary(
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: context.panelDeep,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: context.outline, width: 2),
          boxShadow: context.popShadow,
        ),
        child: AspectRatio(
          aspectRatio: 1,
          child: LayoutBuilder(
            builder: (context, constraints) {
              final width = constraints.maxWidth;
              final axisSize = width * 0.055;
              final cellSize = (width - axisSize) / 13;
              _ensurePrepared(axisSize, cellSize, axisColor);

              return Stack(
                children: [
                  if (ready == null)
                    const Positioned.fill(child: SkeletonBox(height: double.infinity, radius: 12)),
                  Positioned.fill(
                    child: AnimatedOpacity(
                      opacity: ready == null ? 0 : 1,
                      duration: AppTheme.normal,
                      curve: AppTheme.curve,
                      child: ready == null
                          ? null
                          : GestureDetector(
                              behavior: HitTestBehavior.opaque,
                              onTapUp: (d) {
                                final col = ((d.localPosition.dx - axisSize) / cellSize).floor();
                                final row = ((d.localPosition.dy - axisSize) / cellSize).floor();
                                if (col < 0 || col > 12 || row < 0 || row > 12) return;
                                final range = ready.grid[row * 13 + col];
                                if (range != null) widget.onCellTap?.call(range);
                              },
                              child: RepaintBoundary(
                                child: CustomPaint(
                                  painter: _GridPainter(
                                    data: ready,
                                    selectedHand: widget.selectedHand,
                                  ),
                                ),
                              ),
                            ),
                    ),
                  ),
                  if (selected != null)
                    AnimatedPositioned(
                      duration: AppTheme.fast,
                      curve: AppTheme.curve,
                      left: axisSize + selected.colIdx * cellSize,
                      top: axisSize + selected.rowIdx * cellSize,
                      width: cellSize,
                      height: cellSize,
                      child: IgnorePointer(
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: Colors.white,
                              width: cellSize > 32 ? 2 : 1.4,
                            ),
                            boxShadow: const [
                              BoxShadow(color: Colors.white54, blurRadius: 6),
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _Seg {
  final Color color;
  final int flex;
  const _Seg(this.color, this.flex);
}

class _CellDraw {
  final Color? solid;
  final List<_Seg> segs;
  final TextPainter label;
  final double labelDy;
  final TextPainter? sub;

  const _CellDraw({
    required this.solid,
    required this.segs,
    required this.label,
    required this.labelDy,
    required this.sub,
  });
}

/// Everything needed to draw the grid, computed ahead of time.
class _Prepared {
  final double axisSize;
  final double cellSize;
  final Map<int, HandRange> grid;
  final List<_CellDraw> cells; // row-major, 169 entries
  final List<TextPainter> axis; // 13 rank labels

  _Prepared(this.axisSize, this.cellSize, this.grid, this.cells, this.axis);

  static const _ranks = GtoGrid._ranks;

  /// Builds the data in small slices, yielding to the event loop between them
  /// so no single frame has to do all the text layout. Returns null if
  /// [stillWanted] turns false (widget disposed or superseded).
  static Future<_Prepared?> build({
    required List<HandRange> ranges,
    required List<ActionType>? actionTypes,
    required bool detailedMode,
    required double axisSize,
    required double cellSize,
    required Color axisColor,
    required bool Function() stillWanted,
  }) async {
    final grid = {for (final r in ranges) r.rowIdx * 13 + r.colIdx: r};
    final colorMap = {
      for (final at in actionTypes ?? const <ActionType>[]) at.key: at.toColor(),
    };
    final showSubAllowed = cellSize >= 22;

    final axis = [
      for (final r in _ranks)
        _text(r, axisSize * 0.42, FontWeight.w700, axisColor, cellSize, shadow: false),
    ];

    final cells = <_CellDraw>[];
    for (var row = 0; row < 13; row++) {
      for (var col = 0; col < 13; col++) {
        final range = grid[row * 13 + col];
        final showSub = range != null && showSubAllowed;

        final label = _text(
          range?.hand ?? _defaultLabel(row, col),
          cellSize * 0.34,
          FontWeight.w700,
          Colors.white,
          cellSize,
        );
        final labelDy =
            showSub ? (cellSize - label.height) / 2 * (1 - 0.42) : (cellSize - label.height) / 2;

        TextPainter? sub;
        if (showSub) {
          final text = detailedMode
              ? _summaryLabel(range, compact: cellSize < 30)
              : _primaryActionAbbreviation(range);
          if (text.isNotEmpty) {
            sub = _text(
              text,
              cellSize * (cellSize < 30 ? 0.25 : 0.2),
              FontWeight.w800,
              Colors.white.withValues(alpha: 0.92),
              cellSize - 2,
            );
          }
        }

        Color? solid;
        var segs = const <_Seg>[];
        if (range == null) {
          solid = Colors.grey.shade900;
        } else {
          final all = _segmentsFor(range, colorMap);
          if (all.isEmpty) {
            solid = Colors.grey.shade800;
          } else if (!detailedMode) {
            solid = all.reduce((a, b) => a.flex >= b.flex ? a : b).color;
          } else {
            segs = all;
          }
        }

        cells.add(_CellDraw(solid: solid, segs: segs, label: label, labelDy: labelDy, sub: sub));
      }

      // Hand the thread back every few rows so frames keep flowing.
      if (row % 3 == 2) {
        await Future<void>.delayed(Duration.zero);
        if (!stillWanted()) return null;
      }
    }
    return _Prepared(axisSize, cellSize, grid, cells, axis);
  }

  static TextPainter _text(
    String text,
    double fontSize,
    FontWeight weight,
    Color color,
    double maxWidth, {
    bool shadow = true,
  }) {
    return TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          color: color,
          fontSize: fontSize,
          fontWeight: weight,
          height: 1,
          shadows: shadow ? const [Shadow(blurRadius: 2, color: Colors.black87)] : null,
        ),
      ),
      textDirection: TextDirection.ltr,
      maxLines: 1,
      ellipsis: '',
    )..layout(maxWidth: maxWidth);
  }

  static Map<String, double> _freqsOf(HandRange range) {
    if (range.frequencies.isNotEmpty) return range.frequencies;
    return {
      if (range.raiseFreq > 0) 'raise': range.raiseFreq,
      if (range.callFreq > 0) 'call': range.callFreq,
      if (range.foldFreq > 0) 'fold': range.foldFreq,
    };
  }

  static List<_Seg> _segmentsFor(HandRange range, Map<String, Color> colorMap) {
    final ordered = _freqsOf(range).entries.where((e) => e.value > 0).toList()
      ..sort((a, b) {
        final pa = GtoGrid._actionPriority[a.key] ?? 99;
        final pb = GtoGrid._actionPriority[b.key] ?? 99;
        if (pa != pb) return pa.compareTo(pb);
        return b.value.compareTo(a.value);
      });

    return ordered.map((entry) {
      final base = colorMap[entry.key] ?? _fallbackColor(entry.key);
      final color = entry.key == 'fold'
          ? Colors.grey.shade800
          : Color.lerp(Colors.black, base, 0.92) ?? base;
      return _Seg(color, (entry.value * 1000).round().clamp(1, 1000));
    }).toList();
  }

  /// Detailed mode: top two actions, e.g. "R60 F40" (only the top one when the
  /// cell is small). A pure hand shows "R100".
  static String _summaryLabel(HandRange range, {bool compact = false}) {
    final sorted = _freqsOf(range).entries.where((e) => e.value > 0).toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    if (sorted.isEmpty) return '';
    return sorted
        .take(compact ? 1 : 2)
        .map((e) => '${_abbr(e.key)}${(e.value * 100).round()}')
        .join(' ');
  }

  static String _primaryActionAbbreviation(HandRange range) {
    final freqs = _freqsOf(range);
    if (freqs.isEmpty) return '';
    final best = freqs.entries.reduce((a, b) => a.value >= b.value ? a : b);
    return _abbr(best.key);
  }

  static String _abbr(String key) {
    switch (key) {
      case 'allin':
        return 'AI';
      case '5bet':
        return '5B';
      case '4bet':
        return '4B';
      case '3bet':
        return '3B';
      case 'raise':
        return 'R';
      case 'bet':
        return 'B';
      case 'call':
        return 'C';
      case 'check':
        return 'X';
      case 'fold':
        return 'F';
      default:
        return key.substring(0, 1).toUpperCase();
    }
  }

  static String _defaultLabel(int row, int col) {
    if (row == col) return '${_ranks[row]}${_ranks[col]}';
    if (row < col) return '${_ranks[row]}${_ranks[col]}s';
    return '${_ranks[col]}${_ranks[row]}o';
  }

  static Color _fallbackColor(String key) {
    switch (key) {
      case 'allin':
        return Colors.red.shade900;
      case '5bet':
        return Colors.redAccent.shade700;
      case '4bet':
        return Colors.purple.shade700;
      case '3bet':
        return Colors.orange.shade700;
      case 'raise':
        return Colors.red.shade700;
      case 'bet':
        return Colors.blue.shade700;
      case 'call':
        return Colors.green.shade700;
      case 'check':
        return Colors.blueGrey.shade500;
      case 'fold':
        return Colors.grey.shade700;
      default:
        return Colors.blueGrey.shade600;
    }
  }
}

/// Paints the already-prepared cells. No layout or allocation-heavy work here.
class _GridPainter extends CustomPainter {
  final _Prepared data;
  final String? selectedHand;

  _GridPainter({required this.data, required this.selectedHand});

  @override
  bool shouldRepaint(_GridPainter old) => !identical(old.data, data);

  // Selection only changes semantics (the highlight is a separate overlay).
  @override
  bool shouldRebuildSemantics(_GridPainter old) =>
      !identical(old.data, data) || old.selectedHand != selectedHand;

  @override
  SemanticsBuilderCallback get semanticsBuilder => (size) {
        final cell = data.cellSize;
        final axis = data.axisSize;
        return [
          for (final e in data.grid.entries)
            CustomPainterSemantics(
              rect: Rect.fromLTWH(
                axis + (e.key % 13) * cell,
                axis + (e.key ~/ 13) * cell,
                cell,
                cell,
              ),
              properties: SemanticsProperties(
                label: e.value.hand,
                button: true,
                selected: e.value.hand == selectedHand,
              ),
            ),
        ];
      };

  @override
  void paint(Canvas canvas, Size size) {
    final cell = data.cellSize;
    final axis = data.axisSize;

    for (var i = 0; i < 13; i++) {
      final tp = data.axis[i];
      tp.paint(canvas, Offset(axis + i * cell + (cell - tp.width) / 2, (axis - tp.height) / 2));
      tp.paint(canvas, Offset((axis - tp.width) / 2, axis + i * cell + (cell - tp.height) / 2));
    }

    final bg = Paint()..isAntiAlias = false;
    final border = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.5
      ..color = Colors.black26;

    for (var row = 0; row < 13; row++) {
      for (var col = 0; col < 13; col++) {
        final c = data.cells[row * 13 + col];
        final left = axis + col * cell;
        final top = axis + row * cell;
        final rect = Rect.fromLTWH(left, top, cell, cell);

        if (c.solid != null) {
          canvas.drawRect(rect, bg..color = c.solid!);
        } else {
          final total = c.segs.fold<int>(0, (s, e) => s + e.flex);
          var x = rect.left;
          for (var i = 0; i < c.segs.length; i++) {
            final seg = c.segs[i];
            final w = i == c.segs.length - 1 ? rect.right - x : rect.width * seg.flex / total;
            canvas.drawRect(Rect.fromLTWH(x, rect.top, w, rect.height), bg..color = seg.color);
            x += w;
          }
        }
        canvas.drawRect(rect.deflate(0.25), border);

        c.label.paint(canvas, Offset(left + (cell - c.label.width) / 2, top + c.labelDy));
        final sub = c.sub;
        if (sub != null) {
          sub.paint(canvas, Offset(left + (cell - sub.width) / 2, top + cell - 1 - sub.height));
        }
      }
    }
  }
}
