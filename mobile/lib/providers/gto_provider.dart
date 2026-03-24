import 'package:flutter/material.dart';
import '../models/gto_chart.dart';
import '../services/api_service.dart';

class GtoProvider extends ChangeNotifier {
  final ApiService _apiService;

  List<GtoChart> _charts = [];
  GtoChart? _selectedChart;
  bool _isLoading = false;
  String? _error;

  GtoProvider(this._apiService);

  List<GtoChart> get charts => _charts;
  GtoChart? get selectedChart => _selectedChart;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadCharts({String? position, String? situation}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final params = <String, String>{};
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
