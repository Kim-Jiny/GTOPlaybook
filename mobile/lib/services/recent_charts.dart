import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class RecentChart {
  final int id;
  final String title;
  const RecentChart(this.id, this.title);
}

/// Last few GTO charts the user opened, persisted across launches.
class RecentCharts {
  RecentCharts._();

  static const _key = 'recent_charts';
  static const _max = 6;

  static final ValueNotifier<List<RecentChart>> items = ValueNotifier(const []);

  static Future<void> load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getStringList(_key) ?? const [];
      items.value = [
        for (final e in raw)
          if (e.contains('|') && int.tryParse(e.split('|').first) != null)
            RecentChart(int.parse(e.split('|').first), e.substring(e.indexOf('|') + 1)),
      ];
    } catch (_) {}
  }

  static Future<void> add(int id, String title) async {
    final next = [
      RecentChart(id, title),
      ...items.value.where((c) => c.id != id),
    ].take(_max).toList();
    items.value = next;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(_key, [for (final c in next) '${c.id}|${c.title}']);
    } catch (_) {}
  }
}
