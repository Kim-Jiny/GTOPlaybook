part of '../pot_calculator_screen.dart';

class _QuickActionBar extends StatelessWidget {
  const _QuickActionBar();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PotCalculatorProvider>();
    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: provider.potTotal > 0 ? provider.reset : null,
            icon: const Icon(Icons.fiber_new, size: 18),
            label: Text(AppLocalizations.of(context)!.newHand),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.white70,
              side: const BorderSide(color: Colors.white24),
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: FilledButton.tonalIcon(
            onPressed: provider.canUndo ? provider.undo : null,
            icon: const Icon(Icons.undo, size: 18),
            label: Text(AppLocalizations.of(context)!.lastUndo),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
      ],
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.white54),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(fontSize: 12, color: Colors.white70),
          ),
        ],
      ),
    );
  }
}

// --- Pot display ---

class _PotDisplay extends StatelessWidget {
  const _PotDisplay();

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    final provider = context.watch<PotCalculatorProvider>();

    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF4CAF50).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.monetization_on_outlined,
                    color: Color(0xFF66BB6A),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l.currentPot,
                        style: Theme.of(
                          context,
                        ).textTheme.titleSmall?.copyWith(color: Colors.white70),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        AppLocalizations.of(context)!.potDescription,
                        style: const TextStyle(fontSize: 12, color: Colors.white38),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              provider.potDisplayText,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.displaySmall?.copyWith(
                color: const Color(0xFF4CAF50),
                fontWeight: FontWeight.bold,
              ),
            ),
            if (provider.bbSize > 0 && provider.potTotal > 0)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  provider.chipMode == ChipMode.bb
                      ? '= ${provider.formatNumber(provider.potTotal)}'
                      : '= ${provider.potBbEquivalent}',
                  textAlign: TextAlign.center,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: Colors.white38),
                ),
              ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.center,
              children: [
                _InfoChip(
                  icon: Icons.payments_outlined,
                  label: provider.chipMode == ChipMode.bb
                      ? AppLocalizations.of(context)!.inputByBb
                      : AppLocalizations.of(context)!.inputByChips,
                ),
                _InfoChip(
                  icon: Icons.group_outlined,
                  label: AppLocalizations.of(context)!.nPlayersLabel(provider.playerCount),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CompactPotBar extends StatelessWidget {
  const _CompactPotBar();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PotCalculatorProvider>();
    final structure = provider.activeStructure;
    final levelText = structure != null
        ? 'Lv.${provider.activeLevelIndex + 1}/${structure.levels.length}'
        : AppLocalizations.of(context)!.manual;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF122212).withValues(alpha: 0.96),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.24),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF4CAF50).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.visibility_outlined,
              size: 18,
              color: Color(0xFF81C784),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  AppLocalizations.of(context)!.currentPotView,
                  style: const TextStyle(fontSize: 12, color: Colors.white54),
                ),
                const SizedBox(height: 2),
                Text(
                  provider.potDisplayText,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '1BB ${provider.formatNumber(provider.bbSize)} · $levelText',
                  style: const TextStyle(fontSize: 11, color: Colors.white54),
                ),
              ],
            ),
          ),
          if (provider.bbSize > 0 && provider.potTotal > 0)
            Text(
              provider.chipMode == ChipMode.bb
                  ? '= ${provider.formatNumber(provider.potTotal)}'
                  : '= ${provider.potBbEquivalent}',
              style: const TextStyle(fontSize: 12, color: Colors.white54),
            ),
        ],
      ),
    );
  }
}
