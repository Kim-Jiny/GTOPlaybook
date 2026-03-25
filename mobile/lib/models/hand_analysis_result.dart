class HandAnalysisResult {
  final String heroHandName;
  final int heroHandCategory;
  final double winPercent;
  final double tiePercent;
  final double losePercent;
  final int totalCombos;
  final List<BeatingCategory> beatingHands;
  final List<OutCard> outs;

  HandAnalysisResult({
    required this.heroHandName,
    required this.heroHandCategory,
    required this.winPercent,
    required this.tiePercent,
    required this.losePercent,
    required this.totalCombos,
    required this.beatingHands,
    required this.outs,
  });
}

class BeatingCategory {
  final String name;
  final int category;
  final int combos;
  final double percent;
  final List<String> examples;

  BeatingCategory({
    required this.name,
    required this.category,
    required this.combos,
    required this.percent,
    required this.examples,
  });
}

class OutCard {
  final String card;
  final String improvement;
  final int count;

  OutCard({
    required this.card,
    required this.improvement,
    required this.count,
  });
}
