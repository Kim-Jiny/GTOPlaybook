import 'package:flutter/foundation.dart';

class PlatformSupport {
  static bool get isMobileRuntime =>
      !kIsWeb &&
      (defaultTargetPlatform == TargetPlatform.android ||
          defaultTargetPlatform == TargetPlatform.iOS);

  static bool get isFirebaseSupported => isMobileRuntime;

  static bool get isAdsSupported => isMobileRuntime;

  static bool get isAppleSignInSupported =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;

  static bool get isTrackingTransparencySupported =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;
}
