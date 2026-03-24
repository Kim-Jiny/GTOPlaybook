import 'package:flutter/material.dart';
import '../models/card.dart';

class CardPicker extends StatefulWidget {
  final int maxCards;
  final List<PlayingCard> initialCards;
  final Set<PlayingCard> disabledCards;

  const CardPicker({
    super.key,
    required this.maxCards,
    this.initialCards = const [],
    this.disabledCards = const {},
  });

  static Future<List<PlayingCard>?> show(
    BuildContext context, {
    required int maxCards,
    List<PlayingCard> initialCards = const [],
    Set<PlayingCard> disabledCards = const {},
  }) {
    return showModalBottomSheet<List<PlayingCard>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1A2E1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => CardPicker(
        maxCards: maxCards,
        initialCards: initialCards,
        disabledCards: disabledCards,
      ),
    );
  }

  @override
  State<CardPicker> createState() => _CardPickerState();
}

class _CardPickerState extends State<CardPicker> {
  late List<PlayingCard> selected;

  @override
  void initState() {
    super.initState();
    selected = List.from(widget.initialCards);
  }

  void _toggle(PlayingCard card) {
    setState(() {
      if (selected.contains(card)) {
        selected.remove(card);
      } else if (selected.length < widget.maxCards) {
        selected.add(card);
        if (selected.length == widget.maxCards) {
          Navigator.pop(context, selected);
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Select ${widget.maxCards} card${widget.maxCards > 1 ? 's' : ''} (${selected.length}/${widget.maxCards})',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Row(
                  children: [
                    if (selected.isNotEmpty)
                      TextButton(
                        onPressed: () => setState(() => selected.clear()),
                        child: const Text('Clear'),
                      ),
                    TextButton(
                      onPressed: () => Navigator.pop(context, selected),
                      child: const Text('Done'),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),
            ...PlayingCard.suits.map((suit) => _buildSuitRow(suit)),
          ],
        ),
      ),
    );
  }

  Widget _buildSuitRow(String suit) {
    final suitSymbols = {'s': '♠', 'h': '♥', 'd': '♦', 'c': '♣'};
    final suitColors = {'s': Colors.white, 'h': Colors.red, 'd': Colors.blue, 'c': Colors.green};

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: PlayingCard.ranks.map((rank) {
          final card = PlayingCard(rank: rank, suit: suit);
          final isSelected = selected.contains(card);
          final isDisabled = widget.disabledCards.contains(card) && !widget.initialCards.contains(card);

          return Expanded(
            child: GestureDetector(
              onTap: isDisabled ? null : () => _toggle(card),
              child: Container(
                height: 48,
                margin: const EdgeInsets.all(1),
                decoration: BoxDecoration(
                  color: isDisabled
                      ? Colors.grey.shade800.withValues(alpha: 0.5)
                      : isSelected
                          ? const Color(0xFF2E7D32)
                          : const Color(0xFF263238),
                  borderRadius: BorderRadius.circular(4),
                  border: isSelected ? Border.all(color: Colors.greenAccent, width: 1.5) : null,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      rank,
                      style: TextStyle(
                        color: isDisabled ? Colors.grey.shade600 : Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        height: 1,
                      ),
                    ),
                    Text(
                      suitSymbols[suit]!,
                      style: TextStyle(
                        color: isDisabled ? Colors.grey.shade600 : suitColors[suit],
                        fontSize: 12,
                        height: 1.2,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
