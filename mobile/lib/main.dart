import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:app_tracking_transparency/app_tracking_transparency.dart';
import 'app.dart';
import 'config/platform_support.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (PlatformSupport.isFirebaseSupported) {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  }

  if (PlatformSupport.isAdsSupported) {
    await MobileAds.instance.initialize();
  }

  if (PlatformSupport.isTrackingTransparencySupported) {
    await AppTrackingTransparency.requestTrackingAuthorization();
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
