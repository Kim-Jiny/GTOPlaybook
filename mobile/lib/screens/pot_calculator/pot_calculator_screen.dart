import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../l10n/app_localizations.dart';
import '../../providers/pot_calculator_provider.dart';
import '../../services/ad_helper.dart';
import '../../widgets/banner_ad_widget.dart';

part 'widgets/pot_display.dart';
part 'widgets/blind_structure.dart';
part 'widgets/table_settings.dart';
part 'widgets/chip_grid.dart';

class PotCalculatorScreen extends StatelessWidget {
  const PotCalculatorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(
        title: Text(l.potCalculatorTitle),
        actions: [
          Consumer<PotCalculatorProvider>(
            builder: (context, provider, _) => IconButton(
              onPressed: provider.canUndo ? provider.undo : null,
              icon: const Icon(Icons.undo),
              tooltip: l.undo,
            ),
          ),
          Consumer<PotCalculatorProvider>(
            builder: (context, provider, _) => IconButton(
              onPressed: () => _showFullResetDialog(context, provider),
              icon: const Icon(Icons.restart_alt),
              tooltip: l.fullReset,
            ),
          ),
        ],
      ),
      body: const _PotCalculatorBody(),
    );
  }

  static void _showFullResetDialog(
    BuildContext context,
    PotCalculatorProvider provider,
  ) {
    final l = AppLocalizations.of(context)!;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l.fullReset),
        content: Text(l.fullResetConfirm),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(l.cancel),
          ),
          FilledButton(
            onPressed: () {
              provider.resetAll();
              Navigator.pop(ctx);
            },
            child: Text(l.reset),
          ),
        ],
      ),
    );
  }
}

class _PotCalculatorBody extends StatefulWidget {
  const _PotCalculatorBody();

  @override
  State<_PotCalculatorBody> createState() => _PotCalculatorBodyState();
}

class _PotCalculatorBodyState extends State<_PotCalculatorBody> {
  static const double _stickyRevealOffset = 220;

  bool _showStickyPotBar = false;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        NotificationListener<ScrollNotification>(
          onNotification: (notification) {
            if (notification.metrics.axis != Axis.vertical) return false;
            final shouldShow =
                notification.metrics.pixels > _stickyRevealOffset;
            if (shouldShow != _showStickyPotBar) {
              setState(() {
                _showStickyPotBar = shouldShow;
              });
            }
            return false;
          },
          child: GestureDetector(
            onTap: () => FocusScope.of(context).unfocus(),
            behavior: HitTestBehavior.translucent,
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
              child: Column(
                children: [
                  // 1. Blind structure selector
                  const _BlindStructureBar(),
                  const SizedBox(height: 8),
                  // 2. Current level + SB/BB
                  const _LevelDisplay(),
                  const SizedBox(height: 10),
                  // 3. Current pot
                  const _PotDisplay(),
                  const SizedBox(height: 10),
                  // 4. Table settings
                  const _TableSettingsCard(),
                  const SizedBox(height: 10),
                  // 5. Preflop pot button
                  const _PreflopButton(),
                  const SizedBox(height: 10),
                  // 6. Betting presets
                  const _BetPresetSection(),
                  const SizedBox(height: 10),
                  // 7. Ad
                  const Center(
                    child: BannerAdWidget(placement: AdPlacement.potCalculator),
                  ),
                  const SizedBox(height: 10),
                  // 8. Quick actions
                  const _QuickActionBar(),
                  const SizedBox(height: 10),
                  // 9. BB / Absolute toggle
                  const _ModeToggle(),
                  const SizedBox(height: 16),
                  // 10. Chip buttons
                  const _ChipGrid(),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ),
        Positioned(
          top: 8,
          left: 16,
          right: 16,
          child: IgnorePointer(
            ignoring: !_showStickyPotBar,
            child: AnimatedSlide(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOutCubic,
              offset: _showStickyPotBar ? Offset.zero : const Offset(0, -0.25),
              child: AnimatedOpacity(
                duration: const Duration(milliseconds: 180),
                opacity: _showStickyPotBar ? 1 : 0,
                child: const _CompactPotBar(),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
