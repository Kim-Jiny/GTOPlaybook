import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../l10n/app_localizations.dart';
import '../../providers/pot_calculator_provider.dart';
import '../../services/ad_helper.dart';
import '../../widgets/banner_ad_widget.dart';

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

// --- 1. Blind structure selector ---

class _BlindStructureBar extends StatelessWidget {
  const _BlindStructureBar();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PotCalculatorProvider>();
    final structure = provider.activeStructure;

    return Card(
      child: InkWell(
        onTap: () => _openStructureSheet(context),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.list_alt,
                  size: 18,
                  color: Colors.white70,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      structure?.name ?? AppLocalizations.of(context)!.selectBlindStructure,
                      style: TextStyle(
                        color: structure != null
                            ? Colors.white
                            : Colors.white54,
                        fontSize: 14,
                        fontWeight: structure != null
                            ? FontWeight.w700
                            : FontWeight.normal,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      structure != null
                          ? AppLocalizations.of(context)!.tapToChangeStructure
                          : AppLocalizations.of(context)!.selectPresetStructureHint,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.white38,
                      ),
                    ),
                  ],
                ),
              ),
              if (structure != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2E7D32).withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: const Text(
                    'ACTIVE',
                    style: TextStyle(
                      fontSize: 10,
                      color: Color(0xFF81C784),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
              ],
              const Icon(Icons.chevron_right, color: Colors.white38),
            ],
          ),
        ),
      ),
    );
  }

  void _openStructureSheet(BuildContext context) {
    final provider = context.read<PotCalculatorProvider>();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => ChangeNotifierProvider.value(
        value: provider,
        child: const _StructureSheet(),
      ),
    );
  }
}

// --- Structure list bottom sheet ---

class _StructureSheet extends StatelessWidget {
  const _StructureSheet();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PotCalculatorProvider>();
    final structures = provider.structures;
    final nav = Navigator.of(context);

    return DraggableScrollableSheet(
      initialChildSize: 0.5,
      minChildSize: 0.3,
      maxChildSize: 0.8,
      expand: false,
      builder: (context, scrollController) => Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 8, 8),
            child: Row(
              children: [
                Text(AppLocalizations.of(context)!.blindStructure, style: Theme.of(context).textTheme.titleMedium),
                const Spacer(),
                FilledButton.icon(
                  onPressed: () {
                    nav.pop();
                    nav.push(
                      MaterialPageRoute(
                        builder: (_) => ChangeNotifierProvider.value(
                          value: provider,
                          child: const BlindStructureEditScreen(),
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.add, size: 18),
                  label: Text(AppLocalizations.of(context)!.newStructure),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF2E7D32),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(),
          if (structures.isEmpty)
            Expanded(
              child: Center(
                child: Text(
                  AppLocalizations.of(context)!.noSavedStructures,
                  style: const TextStyle(color: Colors.white54),
                ),
              ),
            )
          else
            Expanded(
              child: ListView.builder(
                controller: scrollController,
                itemCount: structures.length,
                itemBuilder: (context, index) {
                  final s = structures[index];
                  final isActive = provider.activeStructureIndex == index;
                  final l = AppLocalizations.of(context)!;
                  final preview = s.levels.isEmpty
                      ? l.noLevels
                      : s.levels.length <= 3
                          ? s.levels.map((lv) => lv.label).join(' → ')
                          : '${s.levels.first.label} → ... → ${s.levels.last.label}  (${l.nSteps(s.levels.length)})';

                  return ListTile(
                    leading: Icon(
                      isActive ? Icons.check_circle : Icons.circle_outlined,
                      color: isActive
                          ? const Color(0xFF4CAF50)
                          : Colors.white24,
                    ),
                    title: Text(s.name),
                    subtitle: Text(
                      preview,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.white54,
                      ),
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(
                            Icons.edit_outlined,
                            size: 20,
                            color: Colors.white38,
                          ),
                          onPressed: () {
                            nav.pop();
                            nav.push(
                              MaterialPageRoute(
                                builder: (_) => ChangeNotifierProvider.value(
                                  value: provider,
                                  child: BlindStructureEditScreen(
                                    editIndex: index,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                        IconButton(
                          icon: const Icon(
                            Icons.delete_outline,
                            size: 20,
                            color: Colors.white38,
                          ),
                          onPressed: () {
                            provider.removeStructure(index);
                          },
                        ),
                      ],
                    ),
                    onTap: () {
                      provider.loadStructure(index);
                      nav.pop();
                    },
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}

// --- Blind structure edit screen ---

class BlindStructureEditScreen extends StatefulWidget {
  final int? editIndex;

  const BlindStructureEditScreen({super.key, this.editIndex});

  @override
  State<BlindStructureEditScreen> createState() =>
      _BlindStructureEditScreenState();
}

class _BlindStructureEditScreenState extends State<BlindStructureEditScreen> {
  late final TextEditingController _nameCtrl;
  late List<BlindLevel> _levels;

  @override
  void initState() {
    super.initState();
    final provider = context.read<PotCalculatorProvider>();
    if (widget.editIndex != null) {
      final s = provider.structures[widget.editIndex!];
      _nameCtrl = TextEditingController(text: s.name);
      _levels = List.of(s.levels);
    } else {
      _nameCtrl = TextEditingController();
      _levels = [];
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  void _addLevel() {
    final last = _levels.isNotEmpty ? _levels.last : null;
    setState(() {
      _levels.add(
        BlindLevel(
          sb: last != null ? last.sb * 2 : 100,
          bb: last != null ? last.bb * 2 : 200,
          ante: last?.ante ?? 0,
          anteMode: last?.anteMode ?? AnteMode.none,
        ),
      );
    });
  }

  void _editLevel(int index) {
    final level = _levels[index];
    final sbCtrl = TextEditingController(text: '${level.sb}');
    final bbCtrl = TextEditingController(text: '${level.bb}');
    final anteCtrl = TextEditingController(text: '${level.ante}');
    AnteMode selectedAnteMode = level.anteMode;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          title: Text(AppLocalizations.of(context)!.editLevelN(index + 1)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildField(sbCtrl, 'SB'),
              const SizedBox(height: 12),
              _buildField(bbCtrl, 'BB'),
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  AppLocalizations.of(context)!.anteType,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
              const SizedBox(height: 8),
              SegmentedButton<AnteMode>(
                segments: const [
                  ButtonSegment(value: AnteMode.none, label: Text('None')),
                  ButtonSegment(value: AnteMode.bbAnte, label: Text('BB Ante')),
                  ButtonSegment(
                    value: AnteMode.everyoneAntes,
                    label: Text('All Ante'),
                  ),
                ],
                selected: {selectedAnteMode},
                onSelectionChanged: (selection) {
                  setModalState(() {
                    selectedAnteMode = selection.first;
                  });
                },
                style: const ButtonStyle(visualDensity: VisualDensity.compact),
              ),
              if (selectedAnteMode != AnteMode.none) ...[
                const SizedBox(height: 12),
                _buildField(anteCtrl, 'Ante'),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(AppLocalizations.of(context)!.cancel),
            ),
            FilledButton(
              onPressed: () {
                final sb = int.tryParse(sbCtrl.text) ?? 0;
                final bb = int.tryParse(bbCtrl.text) ?? 0;
                final ante = int.tryParse(anteCtrl.text) ?? 0;
                if (bb > 0) {
                  setState(() {
                    _levels[index] = BlindLevel(
                      sb: sb,
                      bb: bb,
                      ante: selectedAnteMode == AnteMode.none ? 0 : ante,
                      anteMode: selectedAnteMode,
                    );
                  });
                }
                Navigator.pop(ctx);
              },
              child: Text(AppLocalizations.of(context)!.confirm),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildField(TextEditingController ctrl, String label) {
    return TextField(
      controller: ctrl,
      keyboardType: TextInputType.number,
      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        isDense: true,
      ),
    );
  }

  void _save() {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty || _levels.isEmpty) return;

    final provider = context.read<PotCalculatorProvider>();
    final structure = BlindStructure(name: name, levels: _levels);

    if (widget.editIndex != null) {
      provider.updateStructure(widget.editIndex!, structure);
    } else {
      provider.addStructure(structure);
    }
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.editIndex != null ? AppLocalizations.of(context)!.editStructure : AppLocalizations.of(context)!.newBlindStructure),
        actions: [
          TextButton(
            onPressed: (_nameCtrl.text.trim().isNotEmpty && _levels.isNotEmpty)
                ? _save
                : null,
            child: Text(AppLocalizations.of(context)!.save),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _addLevel,
        backgroundColor: const Color(0xFF2E7D32),
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _nameCtrl,
              decoration: InputDecoration(
                labelText: AppLocalizations.of(context)!.structureNameHint,
                border: const OutlineInputBorder(),
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
          if (_levels.isEmpty)
            Expanded(
              child: Center(
                child: Text(
                  AppLocalizations.of(context)!.addLevelsHint,
                  style: const TextStyle(color: Colors.white54),
                ),
              ),
            )
          else
            Expanded(
              child: ReorderableListView.builder(
                itemCount: _levels.length,
                onReorder: (oldIndex, newIndex) {
                  setState(() {
                    if (newIndex > oldIndex) newIndex--;
                    final item = _levels.removeAt(oldIndex);
                    _levels.insert(newIndex, item);
                  });
                },
                itemBuilder: (context, index) {
                  final level = _levels[index];
                  return ListTile(
                    key: ValueKey('level-${level.sb}-${level.bb}-$index'),
                    leading: CircleAvatar(
                      radius: 14,
                      backgroundColor: const Color(0xFF2E7D32),
                      child: Text(
                        '${index + 1}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    title: Text(level.label),
                    subtitle: Text(
                      'SB ${level.sb} / BB ${level.bb}${level.anteMode != AnteMode.none ? ' / ${level.anteMode == AnteMode.bbAnte ? 'BB Ante' : 'All Ante'} ${level.ante}' : ''}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.white54,
                      ),
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(
                            Icons.edit_outlined,
                            size: 20,
                            color: Colors.white38,
                          ),
                          onPressed: () => _editLevel(index),
                        ),
                        IconButton(
                          icon: const Icon(
                            Icons.delete_outline,
                            size: 20,
                            color: Colors.white38,
                          ),
                          onPressed: () =>
                              setState(() => _levels.removeAt(index)),
                        ),
                        const Icon(
                          Icons.drag_handle,
                          size: 20,
                          color: Colors.white24,
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}

// --- 2. Table settings ---

class _TableSettingsCard extends StatelessWidget {
  const _TableSettingsCard();

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    final provider = context.watch<PotCalculatorProvider>();

    final anteText = switch (provider.anteMode) {
      AnteMode.none => l.anteNone,
      AnteMode.bbAnte => l.anteBbLabel(provider.formattedAnteValue),
      AnteMode.everyoneAntes => l.anteAllLabel(provider.formattedAnteValue, provider.playerCount),
    };
    final summary = l.setupSummary(provider.formattedSb, provider.formattedBb, anteText, provider.playerCount);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l.tableSettings,
              style: const TextStyle(fontSize: 13, color: Colors.white70),
            ),
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.04),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white12),
              ),
              child: Text(
                summary,
                style: const TextStyle(fontSize: 12, color: Colors.white70),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              l.players,
              style: const TextStyle(fontSize: 13, color: Colors.white70),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: List.generate(9, (i) {
                final count = i + 2; // 2~10
                return ChoiceChip(
                  label: Text('$count'),
                  selected: provider.playerCount == count,
                  onSelected: (_) => provider.setPlayerCount(count),
                  visualDensity: VisualDensity.compact,
                  labelStyle: const TextStyle(fontSize: 12),
                  padding: EdgeInsets.zero,
                );
              }),
            ),
            const SizedBox(height: 12),
            const Text(
              'Ante',
              style: TextStyle(fontSize: 13, color: Colors.white70),
            ),
            const SizedBox(height: 8),
            SegmentedButton<AnteMode>(
              segments: const [
                ButtonSegment(value: AnteMode.none, label: Text('None')),
                ButtonSegment(value: AnteMode.bbAnte, label: Text('BB Ante')),
                ButtonSegment(
                  value: AnteMode.everyoneAntes,
                  label: Text('All Ante'),
                ),
              ],
              selected: {provider.anteMode},
              onSelectionChanged: (s) => provider.setAnteMode(s.first),
              style: ButtonStyle(
                visualDensity: VisualDensity.compact,
                textStyle: WidgetStatePropertyAll(
                  const TextStyle(fontSize: 12),
                ),
              ),
            ),
            if (provider.anteMode != AnteMode.none) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _SizeField(
                      label: 'Ante',
                      field: _Field.ante,
                      enabled: !provider.anteSameAsBb,
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilterChip(
                    label: const Text('= BB', style: TextStyle(fontSize: 12)),
                    selected: provider.anteSameAsBb,
                    onSelected: provider.setAnteSameAsBb,
                    visualDensity: VisualDensity.compact,
                  ),
                ],
              ),
              if (provider.usesTablePlayerCount) ...[
                const SizedBox(height: 8),
                Text(
                  AppLocalizations.of(context)!.totalAnteCalc(provider.playerCount, provider.effectiveAnte),
                  style: const TextStyle(fontSize: 12, color: Colors.white54),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}

// --- 3. Level display + SB/BB ---

class _LevelDisplay extends StatelessWidget {
  const _LevelDisplay();

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    final provider = context.watch<PotCalculatorProvider>();
    final structure = provider.activeStructure;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            if (structure != null) ...[
              Row(
                children: [
                  IconButton(
                    onPressed: provider.canPrevLevel
                        ? provider.prevLevel
                        : null,
                    icon: const Icon(Icons.chevron_left),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                  Expanded(
                    child: Column(
                      children: [
                        Text(
                          'Lv.${provider.activeLevelIndex + 1} / Lv.${structure.levels.length}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Colors.white54,
                          ),
                        ),
                        Text(
                          provider.activeLevel?.label ?? '',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: provider.canNextLevel
                        ? provider.nextLevel
                        : null,
                    icon: const Icon(Icons.chevron_right),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
              if (provider.activeLevel != null) ...[
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  alignment: WrapAlignment.center,
                  children: [
                    _InfoChip(
                      icon: Icons.sports_score_outlined,
                      label:
                          'Preflop ${provider.chipLabel(provider.preflopPot)}',
                    ),
                    _InfoChip(
                      icon: Icons.view_list_outlined,
                      label: structure.name,
                    ),
                  ],
                ),
              ],
            ] else ...[
              // Manual SB/BB input
              Row(
                children: [
                  Expanded(
                    child: _SizeField(label: l.sbSize, field: _Field.sb),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _SizeField(label: l.bbSize, field: _Field.bb),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PreflopButton extends StatelessWidget {
  const _PreflopButton();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PotCalculatorProvider>();
    final amount = provider.preflopPot;

    return SizedBox(
      width: double.infinity,
      child: FilledButton.icon(
        onPressed: amount > 0 ? provider.addPreflop : null,
        icon: const Icon(Icons.add_circle_outline, size: 20),
        label: Text(AppLocalizations.of(context)!.addPreflopPot(provider.chipLabel(amount))),
        style: FilledButton.styleFrom(
          backgroundColor: const Color(0xFF2E7D32),
          padding: const EdgeInsets.symmetric(vertical: 14),
        ),
      ),
    );
  }
}

class _BetPresetSection extends StatelessWidget {
  const _BetPresetSection();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PotCalculatorProvider>();
    const presets = <(String, double)>[
      ('1/2 Pot', 0.5),
      ('2/3 Pot', 2 / 3),
      ('3/4 Pot', 0.75),
      ('Pot', 1.0),
    ];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.flash_on_outlined, size: 16, color: Colors.white54),
                const SizedBox(width: 6),
                Text(
                  AppLocalizations.of(context)!.betPresets,
                  style: const TextStyle(fontSize: 13, color: Colors.white70),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              AppLocalizations.of(context)!.betPresetsDesc,
              style: const TextStyle(fontSize: 12, color: Colors.white38),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: presets.map((preset) {
                final label = preset.$1;
                final fraction = preset.$2;
                final amount = provider.potFractionAmount(fraction);
                return FilledButton.tonal(
                  onPressed: amount > 0
                      ? () => provider.addPotFraction(fraction)
                      : null,
                  child: Text(
                    amount > 0
                        ? '$label (+${provider.chipLabel(amount)})'
                        : label,
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}

enum _Field { bb, sb, ante }

class _SizeField extends StatefulWidget {
  final String label;
  final _Field field;
  final bool enabled;

  const _SizeField({
    required this.label,
    required this.field,
    this.enabled = true,
  });

  @override
  State<_SizeField> createState() => _SizeFieldState();
}

class _SizeFieldState extends State<_SizeField> {
  late final TextEditingController _controller;
  late final FocusNode _focusNode;
  bool _hasFocus = false;

  int _getValue(PotCalculatorProvider p) => switch (widget.field) {
    _Field.bb => p.bbSize,
    _Field.sb => p.sbSize,
    _Field.ante => p.anteValue,
  };

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(
      text: '${_getValue(context.read<PotCalculatorProvider>())}',
    );
    _focusNode = FocusNode();
    _focusNode.addListener(() {
      setState(() {
        _hasFocus = _focusNode.hasFocus;
      });
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PotCalculatorProvider>();
    final current = _getValue(provider);
    if (!_hasFocus && _controller.text != '$current') {
      _controller.text = '$current';
    }

    return TextField(
      controller: _controller,
      focusNode: _focusNode,
      enabled: widget.enabled,
      keyboardType: TextInputType.number,
      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
      decoration: InputDecoration(
        labelText: widget.label,
        isDense: true,
        border: const OutlineInputBorder(),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 10,
          vertical: 10,
        ),
      ),
      onChanged: (value) {
        final v = int.tryParse(value) ?? 0;
        final p = context.read<PotCalculatorProvider>();
        switch (widget.field) {
          case _Field.bb:
            p.setBbSize(v);
            break;
          case _Field.sb:
            p.setSbSize(v);
            break;
          case _Field.ante:
            p.setAnteValue(v);
            break;
        }
      },
    );
  }
}

// --- Mode toggle ---

class _ModeToggle extends StatelessWidget {
  const _ModeToggle();

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    final provider = context.watch<PotCalculatorProvider>();

    return SegmentedButton<ChipMode>(
      segments: [
        ButtonSegment(value: ChipMode.bb, label: Text(l.bbMode)),
        ButtonSegment(value: ChipMode.absolute, label: Text(l.absoluteMode)),
      ],
      selected: {provider.chipMode},
      onSelectionChanged: (s) => provider.setChipMode(s.first),
    );
  }
}

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
