import 'package:flutter/material.dart';
import '../models/inquiry.dart';
import '../services/api_service.dart';

class InquiryProvider extends ChangeNotifier {
  final ApiService _apiService;

  List<Inquiry> _myInquiries = [];
  List<Inquiry> _allInquiries = [];
  Map<String, dynamic>? _adminStats;
  bool _isLoading = false;
  String? _error;

  InquiryProvider(this._apiService);

  List<Inquiry> get myInquiries => _myInquiries;
  List<Inquiry> get allInquiries => _allInquiries;
  Map<String, dynamic>? get adminStats => _adminStats;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<bool> submitInquiry(String title, String content) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      await _apiService.post('/api/inquiries', body: {
        'title': title,
        'content': content,
      });
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> loadMyInquiries() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await _apiService.get('/api/inquiries/my');
      _myInquiries =
          (data as List).map((e) => Inquiry.fromJson(e)).toList();
    } catch (e) {
      _error = e.toString();
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadAdminStats() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await _apiService.get('/api/admin/stats');
      _adminStats = data;
    } catch (e) {
      _error = e.toString();
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadAllInquiries({String? status}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final params = status != null ? {'status': status} : null;
      final data =
          await _apiService.get('/api/admin/inquiries', params: params);
      _allInquiries =
          (data as List).map((e) => Inquiry.fromJson(e)).toList();
    } catch (e) {
      _error = e.toString();
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> replyToInquiry(int id, String reply) async {
    try {
      await _apiService.post('/api/admin/inquiries/$id/reply', body: {
        'reply': reply,
      });
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
}
