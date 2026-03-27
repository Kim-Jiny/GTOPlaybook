import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  final ApiService _apiService;

  User? _user;
  bool _isLoading = false;
  bool _isInitializing = true;
  String? _error;
  bool _isAdmin = false;

  AuthProvider(this._apiService) {
    _authService.authStateChanges.listen(_onAuthStateChanged);
  }

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isInitializing => _isInitializing;
  bool get isAuthenticated => _user != null;
  String? get error => _error;
  bool get isAdmin => _isAdmin;

  Future<void> _onAuthStateChanged(User? user) async {
    _user = user;
    if (user != null) {
      final token = await _authService.getIdToken();
      if (token != null) {
        _apiService.setToken(token);
        // Sync user to backend
        try {
          await _apiService.post('/api/users/sync', body: {
            'displayName': user.displayName,
            'photoUrl': user.photoURL,
          });
          // Fetch admin status
          final me = await _apiService.get('/api/users/me');
          _isAdmin = me['is_admin'] == true;
        } catch (e) {
          debugPrint('Failed to sync user: $e');
        }
      }
    }
    _isInitializing = false;
    notifyListeners();
  }

  Future<void> signInWithGoogle() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      await _authService.signInWithGoogle();
    } catch (e) {
      _error = e.toString();
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> signInWithApple() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      await _authService.signInWithApple();
    } catch (e) {
      _error = e.toString();
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> signOut() async {
    _isAdmin = false;
    await _authService.signOut();
  }

  Future<void> deleteAccount() async {
    await _apiService.delete('/api/users/me');
    _isAdmin = false;
    await _authService.signOut();
  }

  bool get isAppleSignInAvailable => _authService.isAppleSignInAvailable;
}
