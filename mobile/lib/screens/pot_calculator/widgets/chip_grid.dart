part of '../pot_calculator_screen.dart';

// --- Chip grid ---

class _ChipGrid extends StatelessWidget {
  const _ChipGrid();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PotCalculatorProvider>();
    final chips = provider.chipValues;
    const spacing = 10.0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.touch_app_outlined, size: 16, color: Colors.white54),
                const SizedBox(width: 6),
                Text(
                  AppLocalizations.of(context)!.quickChipAdd,
                  style: const TextStyle(fontSize: 13, color: Colors.white70),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              AppLocalizations.of(context)!.longPressToRemoveChip,
              style: const TextStyle(fontSize: 12, color: Colors.white38),
            ),
            const SizedBox(height: 12),
            LayoutBuilder(
              builder: (context, constraints) {
                final buttonSize = (constraints.maxWidth - (spacing * 4)) / 5;

                return Wrap(
                  spacing: spacing,
                  runSpacing: spacing,
                  alignment: WrapAlignment.start,
                  children: [
                    ...chips.map((value) {
                      final isCustom = provider.isCustomChip(value);
                      return _ChipButton(
                        size: buttonSize,
                        label: provider.chipLabel(value),
                        onTap: () => provider.addChip(value),
                        onLongPress: isCustom
                            ? () => provider.removeCustomChip(value)
                            : null,
                        isCustom: isCustom,
                      );
                    }),
                    if (provider.canAddMore)
                      _AddChipButton(
                        size: buttonSize,
                        onTap: () => provider.addNextChip(),
                      ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _ChipButton extends StatelessWidget {
  final double size;
  final String label;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;
  final bool isCustom;

  const _ChipButton({
    required this.size,
    required this.label,
    required this.onTap,
    this.onLongPress,
    this.isCustom = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      onLongPress: onLongPress,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isCustom
                ? [const Color(0xFF1565C0), const Color(0xFF0D47A1)]
                : [const Color(0xFF2E7D32), const Color(0xFF1B5E20)],
          ),
          boxShadow: [
            BoxShadow(
              color:
                  (isCustom ? const Color(0xFF42A5F5) : const Color(0xFF4CAF50))
                      .withValues(alpha: 0.3),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Center(
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: size * 0.18,
              height: 1.1,
            ),
          ),
        ),
      ),
    );
  }
}

class _AddChipButton extends StatelessWidget {
  final double size;
  final VoidCallback onTap;

  const _AddChipButton({required this.size, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white24, width: 2),
        ),
        child: Center(
          child: Icon(Icons.add, color: Colors.white54, size: size * 0.38),
        ),
      ),
    );
  }
}
