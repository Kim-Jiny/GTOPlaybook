part of '../pot_calculator_screen.dart';

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
