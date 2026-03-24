class GtoChart {
  final int id;
  final String position;
  final String situation;
  final String? vsPosition;
  final int stackDepth;
  final String? description;
  final List<HandRange>? ranges;

  GtoChart({
    required this.id,
    required this.position,
    required this.situation,
    this.vsPosition,
    this.stackDepth = 100,
    this.description,
    this.ranges,
  });

  factory GtoChart.fromJson(Map<String, dynamic> json) {
    return GtoChart(
      id: json['id'] as int,
      position: json['position'] as String,
      situation: json['situation'] as String,
      vsPosition: json['vs_position'] as String?,
      stackDepth: json['stack_depth'] as int? ?? 100,
      description: json['description'] as String?,
      ranges: json['ranges'] != null
          ? (json['ranges'] as List).map((r) => HandRange.fromJson(r)).toList()
          : null,
    );
  }
}

class HandRange {
  final int id;
  final int chartId;
  final String hand;
  final int rowIdx;
  final int colIdx;
  final String action;
  final double raiseFreq;
  final double callFreq;
  final double foldFreq;

  HandRange({
    required this.id,
    required this.chartId,
    required this.hand,
    required this.rowIdx,
    required this.colIdx,
    required this.action,
    this.raiseFreq = 0,
    this.callFreq = 0,
    this.foldFreq = 0,
  });

  factory HandRange.fromJson(Map<String, dynamic> json) {
    return HandRange(
      id: json['id'] as int,
      chartId: json['chart_id'] as int,
      hand: json['hand'] as String,
      rowIdx: json['row_idx'] as int,
      colIdx: json['col_idx'] as int,
      action: json['action'] as String,
      raiseFreq: (json['raise_freq'] as num?)?.toDouble() ?? 0,
      callFreq: (json['call_freq'] as num?)?.toDouble() ?? 0,
      foldFreq: (json['fold_freq'] as num?)?.toDouble() ?? 0,
    );
  }
}
