part of '../pot_calculator_screen.dart';

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
