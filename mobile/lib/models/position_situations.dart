import 'gto_chart.dart';

class PositionSituations {
  final String position;
  final List<SituationCategory> categories;

  PositionSituations({required this.position, required this.categories});

  factory PositionSituations.fromJson(Map<String, dynamic> json) {
    return PositionSituations(
      position: json['position'] as String,
      categories: (json['categories'] as List)
          .map((c) => SituationCategory.fromJson(c))
          .toList(),
    );
  }
}

class SituationCategory {
  final String category;
  final List<ChartSummary> charts;

  SituationCategory({required this.category, required this.charts});

  factory SituationCategory.fromJson(Map<String, dynamic> json) {
    return SituationCategory(
      category: json['category'] as String,
      charts: (json['charts'] as List)
          .map((c) => ChartSummary.fromJson(c))
          .toList(),
    );
  }
}

class ChartSummary {
  final int id;
  final String situation;
  final String? vsPosition;
  final String? callerPosition;
  final String? description;
  final String? flopTexture;
  final List<ActionType>? actionTypes;

  ChartSummary({
    required this.id,
    required this.situation,
    this.vsPosition,
    this.callerPosition,
    this.description,
    this.flopTexture,
    this.actionTypes,
  });

  factory ChartSummary.fromJson(Map<String, dynamic> json) {
    return ChartSummary(
      id: json['id'] as int,
      situation: json['situation'] as String,
      vsPosition: json['vsPosition'] as String?,
      callerPosition: json['callerPosition'] as String?,
      description: json['description'] as String?,
      flopTexture: json['flopTexture'] as String?,
      actionTypes: json['actionTypes'] != null
          ? (json['actionTypes'] as List).map((a) => ActionType.fromJson(a)).toList()
          : null,
    );
  }
}
