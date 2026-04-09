import '../config/platform_support.dart';

enum AdPlacement {
  main,
  situationList,
  chart,
  equity,
  handAnalysis,
  profile,
  potCalculator,
}

class AdHelper {
  static bool get isBannerAdsSupported => PlatformSupport.isAdsSupported;

  static String? getBannerAdUnitId(AdPlacement placement) {
    if (!isBannerAdsSupported) {
      return null;
    }
    if (PlatformSupport.isAppleSignInSupported) {
      return _iosBannerIds[placement];
    }
    return _androidBannerIds[placement];
  }

  static const _iosBannerIds = {
    AdPlacement.main: 'ca-app-pub-2707874353926722/7401612013',
    AdPlacement.situationList: 'ca-app-pub-2707874353926722/3627119586',
    AdPlacement.chart: 'ca-app-pub-2707874353926722/2123166928',
    AdPlacement.equity: 'ca-app-pub-2707874353926722/5814999924',
    AdPlacement.handAnalysis: 'ca-app-pub-2707874353926722/1000956247',
    AdPlacement.profile: 'ca-app-pub-2707874353926722/2640239921',
    AdPlacement.potCalculator: 'ca-app-pub-2707874353926722/2045297764',
  };

  static const _androidBannerIds = {
    AdPlacement.main: 'ca-app-pub-2707874353926722/2202357275',
    AdPlacement.situationList: 'ca-app-pub-2707874353926722/5870840247',
    AdPlacement.chart: 'ca-app-pub-2707874353926722/4775448673',
    AdPlacement.equity: 'ca-app-pub-2707874353926722/1212709231',
    AdPlacement.handAnalysis: 'ca-app-pub-2707874353926722/9889275609',
    AdPlacement.profile: 'ca-app-pub-2707874353926722/1823083324',
    AdPlacement.potCalculator: 'ca-app-pub-2707874353926722/6153528778',
  };
}
