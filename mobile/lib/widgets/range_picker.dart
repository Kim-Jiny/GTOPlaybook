import 'package:flutter/material.dart';
import 'package:gtoplaybook/l10n/app_localizations.dart';

class RangePicker extends StatefulWidget {
  final Set<String> initialRange;

  const RangePicker({super.key, this.initialRange = const {}});

  static Future<Set<String>?> show(BuildContext context, {Set<String> initialRange = const {}}) {
    return showModalBottomSheet<Set<String>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1A2E1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (_, controller) => RangePicker(initialRange: initialRange),
      ),
    );
  }

  @override
  State<RangePicker> createState() => _RangePickerState();
}

class _RangePickerState extends State<RangePicker> {
  static const _ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  late Set<String> selected;

  // Presets
  static const _top10 = {'AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AQs', 'AJs', 'ATs', 'AKo', 'KQs'};
  static const _top20 = {
    ..._top10,
    '99', '88', 'AQo', 'AJo', 'ATo', 'KJs', 'KTs', 'KQo', 'QJs', 'QTs', 'JTs',
  };
  static const _top30 = {
    ..._top20,
    '77', '66', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'KJo', 'KTo', 'QJo', 'QTo', 'JTo', 'J9s', 'T9s', '98s',
  };

  @override
  void initState() {
    super.initState();
    selected = Set.from(widget.initialRange);
  }

  String _handLabel(int row, int col) {
    if (row == col) return '${_ranks[row]}${_ranks[col]}';
    if (row < col) return '${_ranks[row]}${_ranks[col]}s';
    return '${_ranks[col]}${_ranks[row]}o';
  }

  Set<String> _allPairs() => {for (final r in _ranks) '$r$r'};

  Set<String> _broadways() {
    const b = ['A', 'K', 'Q', 'J', 'T'];
    final set = <String>{};
    for (int i = 0; i < b.length; i++) {
      for (int j = i; j < b.length; j++) {
        if (i == j) {
          set.add('${b[i]}${b[j]}');
        } else {
          set.add('${b[i]}${b[j]}s');
          set.add('${b[i]}${b[j]}o');
        }
      }
    }
    return set;
  }

  Set<String> _suitedConnectors() {
    final set = <String>{};
    for (int i = 0; i < _ranks.length - 1; i++) {
      set.add('${_ranks[i]}${_ranks[i + 1]}s');
    }
    return set;
  }

  void _applyPreset(Set<String> preset) {
    setState(() => selected = Set.from(preset));
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    final pct = selected.isEmpty ? 0 : _estimatePercent();
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(l.rangeNHandsPercent(selected.length, pct),
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                Row(
                  children: [
                    TextButton(
                      onPressed: () => setState(() => selected.clear()),
                      child: Text(l.clear),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(context, selected),
                      child: Text(l.done),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 4),
            // Presets
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _presetChip(l.rangePresetTop10, _top10),
                  _presetChip(l.rangePresetTop20, _top20),
                  _presetChip(l.rangePresetTop30, _top30),
                  _presetChip(l.rangePresetPairs, _allPairs()),
                  _presetChip(l.rangePresetBroadways, _broadways()),
                  _presetChip(l.rangePresetSuitedConnectors, _suitedConnectors()),
                ],
              ),
            ),
            const SizedBox(height: 8),
            // 13x13 grid
            Expanded(
              child: AspectRatio(
                aspectRatio: 1,
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final cellSize = constraints.maxWidth / 13;
                    return Column(
                      children: List.generate(13, (row) {
                        return Row(
                          children: List.generate(13, (col) {
                            final hand = _handLabel(row, col);
                            final isSelected = selected.contains(hand);
                            final isPair = row == col;
                            final isSuited = row < col;

                            return GestureDetector(
                              onTap: () {
                                setState(() {
                                  if (isSelected) {
                                    selected.remove(hand);
                                  } else {
                                    selected.add(hand);
                                  }
                                });
                              },
                              child: Container(
                                width: cellSize,
                                height: cellSize,
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? const Color(0xFF2E7D32)
                                      : isPair
                                          ? const Color(0xFF37474F)
                                          : isSuited
                                              ? const Color(0xFF263238)
                                              : const Color(0xFF1C1C1C),
                                  border: Border.all(color: Colors.black38, width: 0.5),
                                ),
                                child: Center(
                                  child: Text(
                                    hand,
                                    style: TextStyle(
                                      color: isSelected ? Colors.white : Colors.white70,
                                      fontSize: cellSize * 0.28,
                                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
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
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _presetChip(String label, Set<String> preset) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: ActionChip(
        label: Text(label, style: const TextStyle(fontSize: 12)),
        onPressed: () => _applyPreset(preset),
        backgroundColor: const Color(0xFF263238),
      ),
    );
  }

  int _estimatePercent() {
    // Total combos: 1326
    int combos = 0;
    for (final hand in selected) {
      if (hand.length == 2) {
        combos += 6; // pair
      } else if (hand.endsWith('s')) {
        combos += 4; // suited
      } else {
        combos += 12; // offsuit
      }
    }
    return (combos / 1326 * 100).round();
  }
}
