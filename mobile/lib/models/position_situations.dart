import 'gto_chart.dart';

class PositionSituations {
  final String position;
  final List<SituationCategory> categories;

  PositionSituations({required this.position, required this.categories});

  factory PositionSituations.fromJson(Map<String, dynamic> json) {
    return PositionSituations(
      position: json['position'] as String,
      categories: mergeFacingOpen(
        (json['categories'] as List)
            .map((c) => SituationCategory.fromJson(c))
            .toList(),
      ),
    );
  }

  static const facingOpen = 'Facing Open';
  static const facingOpenCaller = 'Facing Open + Caller';

  /// The server stores "what to do facing an open" as two categories ("3bet vs
  /// Opener" and "Cold Call") that both hold 3bet/call/fold charts for the same
  /// hero-vs-opener spot. Show them as one: 3bet charts win, cold-call charts
  /// only fill spots without one, and opener + caller (overcall) spots get their
  /// own section.
  static List<SituationCategory> mergeFacingOpen(List<SituationCategory> cats) {
    final tbIndex = cats.indexWhere((c) => c.category == '3bet vs Opener');
    final ccIndex = cats.indexWhere((c) => c.category == 'Cold Call');
    if (tbIndex < 0 && ccIndex < 0) return cats;

    final tb = tbIndex < 0 ? const <ChartSummary>[] : cats[tbIndex].charts;
    final cc = ccIndex < 0 ? const <ChartSummary>[] : cats[ccIndex].charts;
    bool hasCaller(ChartSummary c) => (c.callerPosition ?? '').isNotEmpty;

    final covered = {for (final c in tb) c.vsPosition};
    final heads = [
      ...tb,
      ...cc.where((c) => !hasCaller(c) && !covered.contains(c.vsPosition)),
    ]..sort((a, b) => (a.vsPosition ?? '').compareTo(b.vsPosition ?? ''));
    final multiway = cc.where(hasCaller).toList();

    final firstIndex = [tbIndex, ccIndex].where((i) => i >= 0).reduce((a, b) => a < b ? a : b);
    final result = <SituationCategory>[];
    for (var i = 0; i < cats.length; i++) {
      if (i == tbIndex || i == ccIndex) {
        if (i != firstIndex) continue;
        if (heads.isNotEmpty) result.add(SituationCategory(category: facingOpen, charts: heads));
        if (multiway.isNotEmpty) {
          result.add(SituationCategory(category: facingOpenCaller, charts: multiway));
        }
      } else {
        result.add(cats[i]);
      }
    }
    return result;
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
