import 'package:flutter/material.dart';
import '../models/inquiry.dart';
import '../services/api_service.dart';

class AdminInquiryProvider extends ChangeNotifier {
  final ApiService _apiService;

  List<Inquiry> _allInquiries = [];
  Map<String, dynamic>? _adminStats;
  bool _isLoadingStats = false;
  bool _isLoadingInquiries = false;
  bool _isReplying = false;
  String? _statsError;
  String? _inquiriesError;
  String? _replyError;

  AdminInquiryProvider(this._apiService);

  List<Inquiry> get allInquiries => _allInquiries;
  Map<String, dynamic>? get adminStats => _adminStats;
  bool get isLoadingStats => _isLoadingStats;
  bool get isLoadingInquiries => _isLoadingInquiries;
  bool get isReplying => _isReplying;
  bool get isLoading => _isLoadingStats || _isLoadingInquiries || _isReplying;
  String? get statsError => _statsError;
  String? get inquiriesError => _inquiriesError;
  String? get replyError => _replyError;
  String? get error => _replyError ?? _inquiriesError ?? _statsError;

  Future<void> loadAdminStats() async {
    _isLoadingStats = true;
    _statsError = null;
    notifyListeners();
    try {
      final data = await _apiService.get('/api/admin/stats');
      _adminStats = data;
    } catch (e) {
      _statsError = e.toString();
    } finally {
      _isLoadingStats = false;
      notifyListeners();
    }
  }

  Future<void> loadAllInquiries({String? status}) async {
    _isLoadingInquiries = true;
    _inquiriesError = null;
    notifyListeners();
    try {
      final params = status != null ? {'status': status} : null;
      final data = await _apiService.get('/api/admin/inquiries', params: params);
      _allInquiries = (data as List).map((e) => Inquiry.fromJson(e)).toList();
    } catch (e) {
      _inquiriesError = e.toString();
    } finally {
      _isLoadingInquiries = false;
      notifyListeners();
    }
  }

  Future<bool> replyToInquiry(int id, String reply) async {
    _isReplying = true;
    _replyError = null;
    notifyListeners();
    try {
      await _apiService.post('/api/admin/inquiries/$id/reply', body: {
        'reply': reply,
      });
      return true;
    } catch (e) {
      _replyError = e.toString();
      return false;
    } finally {
      _isReplying = false;
      notifyListeners();
    }
  }
}
