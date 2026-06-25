import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'ad_helper.dart';

/// Manages the page-transition interstitial shown in the chart tab.
///
/// Guards (so users aren't hammered):
/// - nothing within [_launchGrace] of app start
/// - 35% chance per eligible transition
/// - at most one ad every [_cooldown]
/// - the first [_graceTransitions] transition(s) are skipped (let users settle)
/// - at most [_maxPerSession] ads, then a [_sessionCapCooldown] pause before
///   the quota refreshes
/// - always preloaded; if not ready it is skipped silently (never blocks nav)
class InterstitialAdManager {
  InterstitialAdManager._();
  static final InterstitialAdManager instance = InterstitialAdManager._();

  static const Duration _launchGrace = Duration(minutes: 2);
  static const Duration _cooldown = Duration(minutes: 3);
  static const Duration _sessionCapCooldown = Duration(hours: 2);
  static const int _graceTransitions = 1;
  static const int _maxPerSession = 8;
  static const double _probability = 0.35;

  final Random _random = Random();

  InterstitialAd? _ad;
  bool _isLoading = false;
  DateTime? _appStartedAt;
  DateTime? _lastShownAt;
  int _transitionCount = 0;
  int _shownThisSession = 0;

  /// Preload an interstitial so it can show instantly later.
  void preload() {
    _appStartedAt ??= DateTime.now();
    if (!AdHelper.isInterstitialAdsSupported) return;
    if (_ad != null || _isLoading) return;
    final adUnitId = AdHelper.getInterstitialAdUnitId();
    if (adUnitId == null) return;

    _isLoading = true;
    InterstitialAd.load(
      adUnitId: adUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          _ad = ad;
          _isLoading = false;
          ad.fullScreenContentCallback = FullScreenContentCallback(
            onAdDismissedFullScreenContent: (ad) {
              ad.dispose();
              _ad = null;
              preload(); // get the next one ready
            },
            onAdFailedToShowFullScreenContent: (ad, error) {
              ad.dispose();
              _ad = null;
              preload();
            },
          );
        },
        onAdFailedToLoad: (error) {
          _isLoading = false;
          _ad = null;
          debugPrint('Interstitial failed to load: $error');
        },
      ),
    );
  }

  /// Call at a chart-tab page transition. May show an interstitial subject to
  /// the guards above; otherwise it just ensures one is preloaded.
  void maybeShowOnTransition() {
    if (!AdHelper.isInterstitialAdsSupported) return;

    _transitionCount++;
    if (_ad == null) preload();

    final startedAt = _appStartedAt;
    if (startedAt != null &&
        DateTime.now().difference(startedAt) < _launchGrace) {
      return;
    }

    if (_transitionCount <= _graceTransitions) return;

    final last = _lastShownAt;

    // Per-session cap with refresh: after _maxPerSession ads, pause for
    // _sessionCapCooldown rather than blocking until the app process dies
    // (mobile apps are usually backgrounded, not killed, so the counter would
    // otherwise never reset). Once that pause elapses, the quota resets.
    if (_shownThisSession >= _maxPerSession) {
      if (last == null ||
          DateTime.now().difference(last) < _sessionCapCooldown) {
        return;
      }
      _shownThisSession = 0;
    }

    if (last != null && DateTime.now().difference(last) < _cooldown) return;

    if (_random.nextDouble() >= _probability) return;

    final ad = _ad;
    if (ad == null) return; // not ready — skip silently, never block navigation

    _ad = null;
    _lastShownAt = DateTime.now();
    _shownThisSession++;
    ad.show();
  }
}
