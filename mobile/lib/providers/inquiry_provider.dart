import 'package:flutter/material.dart';
import '../models/inquiry.dart';
import '../services/api_service.dart';

class InquiryProvider extends ChangeNotifier {
  final ApiService _apiService;

  List<Inquiry> _myInquiries = [];
  bool _isSubmitting = false;
  bool _isLoadingMyInquiries = false;
  String? _submitError;
  String? _myInquiriesError;

  InquiryProvider(this._apiService);

  List<Inquiry> get myInquiries => _myInquiries;
  bool get isSubmitting => _isSubmitting;
  bool get isLoadingMyInquiries => _isLoadingMyInquiries;
  bool get isLoading => _isSubmitting || _isLoadingMyInquiries;
  String? get submitError => _submitError;
  String? get myInquiriesError => _myInquiriesError;
  String? get error => _submitError ?? _myInquiriesError;

  Future<bool> submitInquiry(String title, String content) async {
    _isSubmitting = true;
    _submitError = null;
    notifyListeners();
    try {
      await _apiService.post('/api/inquiries', body: {
        'title': title,
        'content': content,
      });
      _isSubmitting = false;
      notifyListeners();
      return true;
    } catch (e) {
      _submitError = e.toString();
      _isSubmitting = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> loadMyInquiries() async {
    _isLoadingMyInquiries = true;
    _myInquiriesError = null;
    notifyListeners();
    try {
      final data = await _apiService.get('/api/inquiries/my');
      _myInquiries =
          (data as List).map((e) => Inquiry.fromJson(e)).toList();
    } catch (e) {
      _myInquiriesError = e.toString();
    }
    _isLoadingMyInquiries = false;
    notifyListeners();
  }
}
