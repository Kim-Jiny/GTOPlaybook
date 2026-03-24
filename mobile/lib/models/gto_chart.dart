import 'package:flutter/material.dart';

class ActionType {
  final String key;
  final String label;
  final String color;

  ActionType({required this.key, required this.label, required this.color});

  factory ActionType.fromJson(Map<String, dynamic> json) {
    return ActionType(
      key: json['key'] as String,
      label: json['label'] as String,
      color: json['color'] as String,
    );
  }

  Color toColor() {
    final hex = color.replaceFirst('#', '');
    return Color(int.parse('FF$hex', radix: 16));
  }
}

class GtoChart {
  final int id;
  final String position;
  final String situation;
  final String? vsPosition;
  final int stackDepth;
  final String? description;
  final String? category;
  final List<ActionType>? actionTypes;
  final List<HandRange>? ranges;

  GtoChart({
    required this.id,
    required this.position,
    required this.situation,
    this.vsPosition,
    this.stackDepth = 100,
    this.description,
    this.category,
    this.actionTypes,
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
      category: json['category'] as String?,
      actionTypes: json['action_types'] != null
          ? (json['action_types'] as List).map((a) => ActionType.fromJson(a)).toList()
          : null,
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
  final Map<String, double> frequencies;

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
    this.frequencies = const {},
  });

  factory HandRange.fromJson(Map<String, dynamic> json) {
    // Parse frequencies JSONB, fallback to legacy fields
    Map<String, double> freqs = {};
    if (json['frequencies'] != null) {
      final raw = json['frequencies'];
      if (raw is Map) {
        freqs = raw.map((k, v) => MapEntry(k.toString(), (v as num).toDouble()));
      }
    }

    // If frequencies is empty, build from legacy fields
    if (freqs.isEmpty) {
      final raise = (json['raise_freq'] as num?)?.toDouble() ?? 0;
      final call = (json['call_freq'] as num?)?.toDouble() ?? 0;
      final fold = (json['fold_freq'] as num?)?.toDouble() ?? 0;
      if (raise > 0) freqs['raise'] = raise;
      if (call > 0) freqs['call'] = call;
      if (fold > 0) freqs['fold'] = fold;
    }

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
      frequencies: freqs,
    );
  }
}
