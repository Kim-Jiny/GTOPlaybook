import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  final ApiService _apiService;

  User? _user;
  bool _isLoading = false;
  String? _error;

  AuthProvider(this._apiService) {
    _authService.authStateChanges.listen(_onAuthStateChanged);
  }

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  String? get error => _error;

  Future<void> _onAuthStateChanged(User? user) async {
    _user = user;
    if (user != null) {
      final token = await _authService.getIdToken();
      if (token != null) {
        _apiService.setToken(token);
        SocketService().connect(token);
        // Sync user to backend
        try {
          await _apiService.post('/api/users/sync', body: {
            'displayName': user.displayName,
            'photoUrl': user.photoURL,
          });
        } catch (e) {
          debugPrint('Failed to sync user: $e');
        }
      }
    }
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
    SocketService().disconnect();
    await _authService.signOut();
  }

  bool get isAppleSignInAvailable => _authService.isAppleSignInAvailable;
}
