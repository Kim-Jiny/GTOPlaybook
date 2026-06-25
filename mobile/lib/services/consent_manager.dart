import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

/// Wraps Google UMP (User Messaging Platform) consent gathering, required by
/// AdMob policy for users in the EEA/UK (GDPR).
///
/// Safe to call on every launch: UMP no-ops outside regions that require a
/// consent message and when consent has already been gathered.
class ConsentManager {
  ConsentManager._();

  /// Requests the latest consent info and, if a form is required and available,
  /// loads and shows it. Resolves once the flow settles (or on error).
  static Future<void> gatherConsent() async {
    final completer = Completer<void>();
    final params = ConsentRequestParameters();

    ConsentInformation.instance.requestConsentInfoUpdate(
      params,
      () {
        ConsentForm.loadAndShowConsentFormIfRequired((formError) {
          if (formError != null) {
            debugPrint('UMP consent form error: ${formError.message}');
          }
          if (!completer.isCompleted) completer.complete();
        });
      },
      (error) {
        debugPrint('UMP consent info update error: ${error.message}');
        if (!completer.isCompleted) completer.complete();
      },
    );

    // Never let a stuck/slow UMP callback block ad initialization.
    return completer.future.timeout(
      const Duration(seconds: 5),
      onTimeout: () => debugPrint('UMP consent gathering timed out'),
    );
  }

  /// Whether ad requests are permitted. False only when consent is required in
  /// this region and the user has not yet provided it.
  static Future<bool> canRequestAds() =>
      ConsentInformation.instance.canRequestAds();
}
