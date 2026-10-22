part of '../pot_calculator_screen.dart';

// --- Chip grid ---

class _ChipGrid extends StatelessWidget {
  const _ChipGrid();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PotCalculatorProvider>();
    final chips = provider.chipValues;
    const spacing = 10.0;

    return PopCard(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.touch_app_outlined, size: 16, color: context.ink54),
                const SizedBox(width: 6),
                Text(
                  AppLocalizations.of(context)!.quickChipAdd,
                  style: TextStyle(fontSize: 13, color: context.ink70),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              AppLocalizations.of(context)!.longPressToRemoveChip,
              style: TextStyle(fontSize: 12, color: context.ink38),
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
      onLongPress: onLongPress,
      child: Pressable(
        scale: 0.9,
        onTap: onTap,
        child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isCustom
                ? [AppTheme.sky, AppTheme.sky]
                : [AppTheme.mint, AppTheme.mint],
          ),
          border: Border.all(color: context.outline, width: 2.5),
          boxShadow: [BoxShadow(color: context.outline, offset: const Offset(0, 4))],
        ),
        child: Center(
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppTheme.lightOutline,
              fontFamily: AppTheme.display,
              fontSize: size * 0.2,
              height: 1.1,
            ),
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
          border: Border.all(color: context.ink24, width: 2),
        ),
        child: Center(
          child: Icon(Icons.add, color: context.ink54, size: size * 0.38),
        ),
      ),
    );
  }
}
