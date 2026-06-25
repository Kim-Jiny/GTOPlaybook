import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:app_tracking_transparency/app_tracking_transparency.dart';
import 'package:visibility_detector/visibility_detector.dart';
import 'app.dart';
import 'services/consent_manager.dart';
import 'services/interstitial_ad_manager.dart';
import 'config/platform_support.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Report banner visibility quickly so ads mount/unmount promptly on tab
  // switches (default is 500ms).
  VisibilityDetectorController.instance.updateInterval =
      const Duration(milliseconds: 150);

  if (PlatformSupport.isFirebaseSupported) {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  }

  // Ask for ATT BEFORE initializing/loading ads so the very first ad request
  // can use the IDFA (better fill/eCPM). A short delay lets the app reach the
  // active state, which iOS requires for the prompt to actually appear.
  if (PlatformSupport.isTrackingTransparencySupported) {
    await Future.delayed(const Duration(milliseconds: 200));
    await AppTrackingTransparency.requestTrackingAuthorization();
  }

  if (PlatformSupport.isAdsSupported) {
    // Debug builds keep the real ad unit IDs but register dev devices as test
    // devices, so they get "Test Ad"-labelled ads — safe (no invalid-traffic
    // strikes) and they actually fill (unlike Google's sample ad unit IDs,
    // which return "Publisher data not found" against a real App ID).
    // Add a device's hash (printed in logcat/console on first ad request) here.
    if (kDebugMode) {
      MobileAds.instance.updateRequestConfiguration(
        RequestConfiguration(
          testDeviceIds: ['0D8B0DA203416FDF05C4B50FC43C5B09'],
        ),
      );
    }
    // Gather GDPR/EEA consent (UMP) before requesting any ads.
    await ConsentManager.gatherConsent();
    await MobileAds.instance.initialize();
    if (await ConsentManager.canRequestAds()) {
      InterstitialAdManager.instance.preload();
    }
  }

  runApp(
    GtoPlaybookApp(
      platformSupported: PlatformSupport.isFirebaseSupported,
      currentPlatformLabel: kIsWeb
          ? 'Web'
          : switch (defaultTargetPlatform) {
              TargetPlatform.android => 'Android',
              TargetPlatform.iOS => 'iOS',
              TargetPlatform.macOS => 'macOS',
              TargetPlatform.windows => 'Windows',
              TargetPlatform.linux => 'Linux',
              TargetPlatform.fuchsia => 'Fuchsia',
            },
    ),
  );
}
