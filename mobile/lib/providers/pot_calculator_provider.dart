import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum ChipMode { bb, absolute }

enum AnteMode { none, bbAnte, everyoneAntes }

// --- Blind structure models ---

class BlindLevel {
  final int sb;
  final int bb;
  final int ante;
  final AnteMode anteMode;

  const BlindLevel({
    required this.sb,
    required this.bb,
    this.ante = 0,
    this.anteMode = AnteMode.none,
  });

  String get label {
    String fmt(int v) {
      if (v >= 1000000) return '${v ~/ 1000000}M';
      if (v >= 1000) return '${v ~/ 1000}K';
      return '$v';
    }

    final base = '${fmt(sb)}/${fmt(bb)}';
    if (anteMode == AnteMode.bbAnte && ante > 0) {
      return '$base BB Ante ${fmt(ante)}';
    }
    if (anteMode == AnteMode.everyoneAntes && ante > 0) {
      return '$base All Ante ${fmt(ante)}';
    }
    return base;
  }

  Map<String, dynamic> toJson() => {
    'sb': sb,
    'bb': bb,
    'ante': ante,
    'anteMode': anteMode.name,
  };

  factory BlindLevel.fromJson(Map<String, dynamic> j) {
    final ante = j['ante'] as int? ?? 0;
    final rawAnteMode = j['anteMode'] as String?;
    final anteMode = AnteMode.values.firstWhere(
      (mode) => mode.name == rawAnteMode,
      orElse: () => ante > 0 ? AnteMode.bbAnte : AnteMode.none,
    );

    return BlindLevel(
      sb: j['sb'] as int,
      bb: j['bb'] as int,
      ante: ante,
      anteMode: anteMode,
    );
  }
}

class BlindStructure {
  String name;
  List<BlindLevel> levels;

  BlindStructure({required this.name, required this.levels});

  Map<String, dynamic> toJson() => {
    'name': name,
    'levels': levels.map((l) => l.toJson()).toList(),
  };

  factory BlindStructure.fromJson(Map<String, dynamic> j) => BlindStructure(
    name: j['name'] as String,
    levels: (j['levels'] as List)
        .map((l) => BlindLevel.fromJson(l as Map<String, dynamic>))
        .toList(),
  );
}

// --- Provider ---

class PotCalculatorProvider extends ChangeNotifier {
  static const _structuresKey = 'pot_blind_structures';

  // Blind structures
  List<BlindStructure> _structures = [];
  int? _activeStructureIndex;
  int _activeLevelIndex = 0;

  List<BlindStructure> get structures => _structures;
  int? get activeStructureIndex => _activeStructureIndex;
  int get activeLevelIndex => _activeLevelIndex;

  BlindStructure? get activeStructure => _activeStructureIndex != null
      ? _structures[_activeStructureIndex!]
      : null;
  BlindLevel? get activeLevel =>
      activeStructure != null &&
          _activeLevelIndex < activeStructure!.levels.length
      ? activeStructure!.levels[_activeLevelIndex]
      : null;
  bool get canNextLevel =>
      activeStructure != null &&
      _activeLevelIndex < activeStructure!.levels.length - 1;
  bool get canPrevLevel => _activeLevelIndex > 0;

  // Pot calculator state
  ChipMode _chipMode = ChipMode.bb;
  int _bbSize = 10000;
  int _sbSize = 5000;
  int _potTotal = 0;

  // Ante state
  AnteMode _anteMode = AnteMode.none;
  int _anteValue = 0;
  bool _anteSameAsBb = false;
  int _playerCount = 9;
  final List<int> _history = [];
  final List<double> _customBbChips = [];
  final List<int> _customAbsoluteChips = [];

  static const _extraAbsolute = [
    50000,
    100000,
    500000,
    1000000,
    5000000,
    10000000,
    25000000,
    50000000,
    100000000,
  ];
  static const _extraBb = [20.0, 50.0, 100.0, 500.0, 1000.0, 5000.0];

  PotCalculatorProvider() {
    _loadStructures();
  }

  ChipMode get chipMode => _chipMode;
  int get bbSize => _bbSize;
  int get sbSize => _sbSize;
  int get potTotal => _potTotal;
  bool get canUndo => _history.isNotEmpty;

  AnteMode get anteMode => _anteMode;
  int get anteValue => _anteValue;
  bool get anteSameAsBb => _anteSameAsBb;
  int get playerCount => _playerCount;
  int get effectiveAnte =>
      _anteMode == AnteMode.none ? 0 : (_anteSameAsBb ? _bbSize : _anteValue);
  bool get usesTablePlayerCount => _anteMode == AnteMode.everyoneAntes;

  String get potBbEquivalent {
    if (_bbSize <= 0) return _formatNumber(_potTotal);
    final bbValue = _potTotal / _bbSize;
    if (bbValue == bbValue.roundToDouble()) {
      return '${bbValue.toInt()} BB';
    }
    return '${bbValue.toStringAsFixed(1)} BB';
  }

  String get potDisplayText {
    if (_chipMode == ChipMode.bb && _bbSize > 0) {
      final bbValue = _potTotal / _bbSize;
      if (bbValue == bbValue.roundToDouble()) {
        return '${bbValue.toInt()} BB';
      }
      return '${bbValue.toStringAsFixed(1)} BB';
    }
    return _formatNumber(_potTotal);
  }

  String get formattedSb => _formatNumber(_sbSize);
  String get formattedBb => _formatNumber(_bbSize);
  String get formattedAnteValue => _formatNumber(_anteSameAsBb ? _bbSize : _anteValue);

  List<int> get chipValues {
    if (_chipMode == ChipMode.bb) {
      final multipliers = <double>[0.5, 1, 2, 3, 5, 10, ..._customBbChips];
      return multipliers.map((m) => (m * _bbSize).toInt()).toList();
    }
    return [100, 500, 1000, 5000, 10000, ..._customAbsoluteChips];
  }

  bool get canAddMore {
    if (_chipMode == ChipMode.bb) {
      return _nextBbIndex < _extraBb.length;
    }
    return _nextAbsoluteIndex < _extraAbsolute.length;
  }

  int get _nextAbsoluteIndex {
    if (_customAbsoluteChips.isEmpty) return 0;
    final lastChip = _customAbsoluteChips.last;
    final idx = _extraAbsolute.indexOf(lastChip);
    return idx < 0 ? _customAbsoluteChips.length : idx + 1;
  }

  int get _nextBbIndex {
    if (_customBbChips.isEmpty) return 0;
    final lastChip = _customBbChips.last;
    final idx = _extraBb.indexOf(lastChip);
    return idx < 0 ? _customBbChips.length : idx + 1;
  }

  void addNextChip() {
    if (_chipMode == ChipMode.bb) {
      final idx = _nextBbIndex;
      if (idx < _extraBb.length) {
        _customBbChips.add(_extraBb[idx]);
        notifyListeners();
      }
    } else {
      final idx = _nextAbsoluteIndex;
      if (idx < _extraAbsolute.length) {
        _customAbsoluteChips.add(_extraAbsolute[idx]);
        notifyListeners();
      }
    }
  }

  void removeCustomChip(int chipValue) {
    if (_chipMode == ChipMode.bb && _bbSize > 0) {
      final bb = chipValue / _bbSize;
      _customBbChips.remove(bb);
    } else {
      _customAbsoluteChips.remove(chipValue);
    }
    notifyListeners();
  }

  bool isCustomChip(int chipValue) {
    if (_chipMode == ChipMode.bb && _bbSize > 0) {
      final bb = chipValue / _bbSize;
      return _customBbChips.contains(bb);
    }
    return _customAbsoluteChips.contains(chipValue);
  }

  String chipLabel(int value) {
    if (_chipMode == ChipMode.bb && _bbSize > 0) {
      final bb = value / _bbSize;
      if (bb == bb.roundToDouble()) {
        return '${bb.toInt()} BB';
      }
      return '${bb.toStringAsFixed(1)} BB';
    }
    if (value >= 1000000) {
      return '${_formatNumber(value ~/ 1000)}K';
    }
    return _formatNumber(value);
  }

  String formatNumber(int value) => _formatNumber(value);

  String _formatNumber(int value) {
    final digits = value.abs().toString();
    final buffer = StringBuffer();

    for (int i = 0; i < digits.length; i++) {
      final remaining = digits.length - i;
      buffer.write(digits[i]);
      if (remaining > 1 && remaining % 3 == 1) {
        buffer.write(',');
      }
    }

    final formatted = buffer.toString();
    return value < 0 ? '-$formatted' : formatted;
  }

  // --- Blind structure management ---

  void loadStructure(int index) {
    _activeStructureIndex = index;
    _activeLevelIndex = 0;
    _applyCurrentLevel();
  }

  void detachStructure() {
    _activeStructureIndex = null;
    _activeLevelIndex = 0;
    notifyListeners();
  }

  void nextLevel() {
    if (canNextLevel) {
      _activeLevelIndex++;
      _applyCurrentLevel();
    }
  }

  void prevLevel() {
    if (canPrevLevel) {
      _activeLevelIndex--;
      _applyCurrentLevel();
    }
  }

  void jumpToLevel(int index) {
    if (activeStructure != null &&
        index >= 0 &&
        index < activeStructure!.levels.length) {
      _activeLevelIndex = index;
      _applyCurrentLevel();
    }
  }

  void _applyCurrentLevel() {
    final level = activeLevel;
    if (level != null) {
      _bbSize = level.bb;
      _sbSize = level.sb;
      _anteMode = level.anteMode;
      _anteValue = level.ante;
      _anteSameAsBb = false;
    }
    notifyListeners();
  }

  Future<void> addStructure(BlindStructure structure) async {
    _structures.add(structure);
    notifyListeners();
    await _saveStructures();
  }

  Future<void> updateStructure(int index, BlindStructure structure) async {
    if (index < 0 || index >= _structures.length) return;
    _structures[index] = structure;
    // If we're editing the active structure, re-apply current level
    if (_activeStructureIndex == index) {
      if (structure.levels.isEmpty) {
        _activeStructureIndex = null;
        _activeLevelIndex = 0;
        notifyListeners();
      } else {
        if (_activeLevelIndex >= structure.levels.length) {
          _activeLevelIndex = structure.levels.length - 1;
        }
        _applyCurrentLevel(); // already calls notifyListeners
      }
    } else {
      notifyListeners();
    }
    await _saveStructures();
  }

  Future<void> removeStructure(int index) async {
    if (index < 0 || index >= _structures.length) return;
    _structures.removeAt(index);
    if (_activeStructureIndex == index) {
      _activeStructureIndex = null;
      _activeLevelIndex = 0;
    } else if (_activeStructureIndex != null &&
        _activeStructureIndex! > index) {
      _activeStructureIndex = _activeStructureIndex! - 1;
    }
    notifyListeners();
    await _saveStructures();
  }

  Future<void> _loadStructures() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(_structuresKey);
    if (raw != null) {
      try {
        _structures = raw
            .map(
              (s) =>
                  BlindStructure.fromJson(jsonDecode(s) as Map<String, dynamic>),
            )
            .toList();
      } catch (_) {
        _structures = _seedStructures();
        await _saveStructures();
      }
    } else {
      _structures = _seedStructures();
      await _saveStructures();
    }
    notifyListeners();
  }

  Future<void> _saveStructures() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = _structures.map((s) => jsonEncode(s.toJson())).toList();
    await prefs.setStringList(_structuresKey, raw);
  }

  static List<BlindStructure> _seedStructures() => [
    BlindStructure(
      name: 'Daily',
      levels: const [
        BlindLevel(sb: 100, bb: 200),
        BlindLevel(sb: 200, bb: 400),
        BlindLevel(sb: 300, bb: 600),
        BlindLevel(sb: 500, bb: 1000),
        BlindLevel(sb: 1000, bb: 2000),
        BlindLevel(sb: 1500, bb: 3000),
        BlindLevel(sb: 2000, bb: 4000),
        BlindLevel(sb: 3000, bb: 6000),
        BlindLevel(sb: 5000, bb: 10000),
        BlindLevel(sb: 10000, bb: 20000),
        BlindLevel(sb: 15000, bb: 30000),
        BlindLevel(sb: 20000, bb: 40000),
        BlindLevel(sb: 30000, bb: 60000),
        BlindLevel(sb: 50000, bb: 100000),
      ],
    ),
    BlindStructure(
      name: 'Monster',
      levels: const [
        BlindLevel(sb: 200, bb: 400),
        BlindLevel(sb: 400, bb: 800),
        BlindLevel(sb: 600, bb: 1200),
        BlindLevel(sb: 1000, bb: 2000),
        BlindLevel(sb: 1500, bb: 3000),
        BlindLevel(sb: 2000, bb: 4000),
        BlindLevel(sb: 3000, bb: 6000),
        BlindLevel(sb: 5000, bb: 10000),
        BlindLevel(sb: 10000, bb: 20000),
        BlindLevel(sb: 15000, bb: 30000),
        BlindLevel(sb: 25000, bb: 50000),
        BlindLevel(sb: 50000, bb: 100000),
        BlindLevel(sb: 100000, bb: 200000),
      ],
    ),
  ];

  // --- Manual blind setters ---

  void setChipMode(ChipMode mode) {
    _chipMode = mode;
    notifyListeners();
  }

  void setBbSize(int value) {
    if (value > 0) {
      _bbSize = value;
      _activeStructureIndex = null;
      notifyListeners();
    }
  }

  void setSbSize(int value) {
    if (value >= 0) {
      _sbSize = value;
      _activeStructureIndex = null;
      notifyListeners();
    }
  }

  void setAnteMode(AnteMode mode) {
    _anteMode = mode;
    notifyListeners();
  }

  void setAnteValue(int value) {
    if (value >= 0) {
      _anteValue = value;
      _anteSameAsBb = false;
      notifyListeners();
    }
  }

  void setAnteSameAsBb(bool value) {
    _anteSameAsBb = value;
    notifyListeners();
  }

  void setPlayerCount(int value) {
    if (value >= 2 && value <= 10) {
      _playerCount = value;
      notifyListeners();
    }
  }

  int get totalAnte {
    if (_anteMode == AnteMode.none) return 0;
    final ante = effectiveAnte;
    if (_anteMode == AnteMode.bbAnte) return ante;
    return ante * _playerCount; // everyoneAntes
  }

  int get preflopPot => _bbSize + _sbSize + totalAnte;

  int potFractionAmount(double fraction) {
    if (_potTotal <= 0 || fraction <= 0) return 0;
    final rawAmount = (_potTotal * fraction).round();
    final step = _betSizingStep;
    if (step <= 1) return rawAmount;
    return (rawAmount ~/ step) * step;
  }

  int get _betSizingStep {
    if (_bbSize <= 0) return 1;
    var step = 1;
    var size = _bbSize;
    while (size >= 10) {
      size ~/= 10;
      step *= 10;
    }
    return step;
  }

  void addPreflop() {
    final amount = preflopPot;
    if (amount > 0) {
      _history.add(_potTotal);
      _potTotal += amount;
      notifyListeners();
    }
  }

  void addChip(int value) {
    _history.add(_potTotal);
    _potTotal += value;
    notifyListeners();
  }

  void addPotFraction(double fraction) {
    final amount = potFractionAmount(fraction);
    if (amount > 0) {
      addChip(amount);
    }
  }

  void undo() {
    if (_history.isNotEmpty) {
      _potTotal = _history.removeLast();
      notifyListeners();
    }
  }

  void reset() {
    _potTotal = 0;
    _history.clear();
    notifyListeners();
  }

  void resetAll() {
    _potTotal = 0;
    _history.clear();
    _activeStructureIndex = null;
    _activeLevelIndex = 0;
    _bbSize = 10000;
    _sbSize = 5000;
    _anteMode = AnteMode.none;
    _anteValue = 0;
    _anteSameAsBb = false;
    _playerCount = 9;
    _chipMode = ChipMode.bb;
    _customBbChips.clear();
    _customAbsoluteChips.clear();
    notifyListeners();
  }
}
