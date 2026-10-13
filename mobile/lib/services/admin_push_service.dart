import 'dart:async';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import '../config/platform_support.dart';
import '../screens/admin/admin_dashboard_screen.dart';
import 'api_service.dart';
import 'app_keys.dart';

/// Push alerts for admin accounts (new inquiries, purchases, refunds).
///
/// Only admin devices register a token with the server, and the server only
/// sends to tokens that belong to admins.
class AdminPushService {
  AdminPushService._();
  static final AdminPushService instance = AdminPushService._();

  StreamSubscription<String>? _refreshSub;
  StreamSubscription<RemoteMessage>? _foregroundSub;
  StreamSubscription<RemoteMessage>? _openedSub;
  String? _token;

  Future<void> register(ApiService api) async {
    if (!PlatformSupport.isMobileRuntime) return;
    try {
      final messaging = FirebaseMessaging.instance;
      final settings = await messaging.requestPermission();
      if (settings.authorizationStatus == AuthorizationStatus.denied) return;

      await messaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      _refreshSub ??= messaging.onTokenRefresh.listen((t) => _send(api, t));
      _foregroundSub ??= FirebaseMessaging.onMessage.listen(_showInApp);
      _openedSub ??= FirebaseMessaging.onMessageOpenedApp.listen(
        (_) => _openAdmin(),
      );

      final token = await _fetchToken(messaging);
      if (token != null) await _send(api, token);

      // App was launched by tapping an alert while it was closed.
      final initial = await messaging.getInitialMessage();
      if (initial != null) _openAdmin();
    } catch (e) {
      debugPrint('Admin push setup failed: $e');
    }
  }

  /// iOS hands out the FCM token only after the APNs token is ready, so retry once.
  Future<String?> _fetchToken(FirebaseMessaging messaging) async {
    try {
      return await messaging.getToken();
    } catch (_) {
      await Future<void>.delayed(const Duration(seconds: 3));
      try {
        return await messaging.getToken();
      } catch (e) {
        debugPrint('FCM token unavailable: $e');
        return null;
      }
    }
  }

  Future<void> _send(ApiService api, String token) async {
    _token = token;
    try {
      await api.post(
        '/api/users/device-token',
        body: {
          'token': token,
          'platform': PlatformSupport.isAppleSignInSupported
              ? 'ios'
              : 'android',
        },
      );
    } catch (e) {
      debugPrint('Device token registration failed: $e');
    }
  }

  /// Call before signing out, while the API token is still set.
  Future<void> unregister(ApiService api) async {
    if (!PlatformSupport.isMobileRuntime) return;
    final token = _token;
    _token = null;
    try {
      if (token != null) {
        await api.delete(
          '/api/users/device-token?token=${Uri.encodeQueryComponent(token)}',
        );
      }
      await FirebaseMessaging.instance.deleteToken();
    } catch (e) {
      debugPrint('Device token removal failed: $e');
    }
  }

  void _showInApp(RemoteMessage message) {
    // iOS shows its own banner in the foreground; Android does not.
    if (PlatformSupport.isAppleSignInSupported) return;
    final n = message.notification;
    if (n == null) return;
    AppKeys.messenger.currentState?.showSnackBar(
      SnackBar(
        content: Text([n.title, n.body].whereType<String>().join('\n')),
        duration: const Duration(seconds: 6),
        action: SnackBarAction(label: '열기', onPressed: _openAdmin),
      ),
    );
  }

  void _openAdmin() {
    AppKeys.navigator.currentState?.push(
      MaterialPageRoute(builder: (_) => const AdminDashboardScreen()),
    );
  }
}
