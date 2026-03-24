import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/gto_chart.dart';
import '../models/position_situations.dart';
import '../services/api_service.dart';

class GtoProvider extends ChangeNotifier {
  final ApiService _apiService;

  List<GtoChart> _charts = [];
  List<PositionSituations> _positionTree = [];
  GtoChart? _selectedChart;
  bool _isLoading = false;
  String? _error;

  // Stack depth state
  int _oneBbValue = 0;
  int _chipCount = 0;
  int _effectiveBb = 0;
  int _selectedTier = 100;

  // Player count state
  int _selectedPlayerCount = 6;

  GtoProvider(this._apiService);

  List<GtoChart> get charts => _charts;
  List<PositionSituations> get positionTree => _positionTree;
  GtoChart? get selectedChart => _selectedChart;
  bool get isLoading => _isLoading;
  String? get error => _error;

  int get oneBbValue => _oneBbValue;
  int get chipCount => _chipCount;
  int get effectiveBb => _effectiveBb;
  int get selectedTier => _selectedTier;
  int get selectedPlayerCount => _selectedPlayerCount;

  int _matchTier(int bb) {
    if (bb <= 17) return 15;
    if (bb <= 32) return 25;
    if (bb <= 49) return 40;
    if (bb <= 79) return 60;
    return 100;
  }

  Future<void> updateStackDepth({int? oneBb, int? chips}) async {
    if (oneBb != null) _oneBbValue = oneBb;
    if (chips != null) _chipCount = chips;

    if (_oneBbValue > 0 && _chipCount > 0) {
      _effectiveBb = (_chipCount / _oneBbValue).floor();
      _selectedTier = _matchTier(_effectiveBb);
    } else {
      _effectiveBb = 0;
      _selectedTier = 100;
    }

    // Save to prefs
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('gto_one_bb', _oneBbValue);
    await prefs.setInt('gto_chips', _chipCount);

    notifyListeners();
    await loadPositionTree();
  }

  Future<void> loadSavedStackSettings() async {
    final prefs = await SharedPreferences.getInstance();
    _oneBbValue = prefs.getInt('gto_one_bb') ?? 0;
    _chipCount = prefs.getInt('gto_chips') ?? 0;
    _selectedPlayerCount = prefs.getInt('gto_player_count') ?? 6;

    if (_oneBbValue > 0 && _chipCount > 0) {
      _effectiveBb = (_chipCount / _oneBbValue).floor();
      _selectedTier = _matchTier(_effectiveBb);
    } else {
      _effectiveBb = 0;
      _selectedTier = prefs.getInt('gto_selected_tier') ?? 100;
    }

    notifyListeners();
  }

  Future<void> selectTier(int tier) async {
    _selectedTier = tier;
    _oneBbValue = 0;
    _chipCount = 0;
    _effectiveBb = 0;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('gto_selected_tier', tier);
    await prefs.remove('gto_one_bb');
    await prefs.remove('gto_chips');

    notifyListeners();
    await loadPositionTree();
  }

  Future<void> selectPlayerCount(int count) async {
    _selectedPlayerCount = count;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('gto_player_count', count);

    notifyListeners();
    await loadPositionTree();
  }

  Future<void> loadPositionTree() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _apiService.get(
        '/api/gto/positions',
        params: {
          'stack_depth': _selectedTier.toString(),
          'max_players': _selectedPlayerCount.toString(),
        },
      );
      _positionTree = (data as List)
          .map((j) => PositionSituations.fromJson(j))
          .toList();
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadCharts({String? position, String? situation}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final params = <String, String>{
        'stack_depth': _selectedTier.toString(),
        'max_players': _selectedPlayerCount.toString(),
      };
      if (position != null) params['position'] = position;
      if (situation != null) params['situation'] = situation;

      final data = await _apiService.get('/api/gto/charts', params: params);
      _charts = (data as List).map((j) => GtoChart.fromJson(j)).toList();
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadChartDetail(int chartId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _apiService.get('/api/gto/charts/$chartId');
      _selectedChart = GtoChart.fromJson(data);
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  void clearSelection() {
    _selectedChart = null;
    notifyListeners();
  }
}
