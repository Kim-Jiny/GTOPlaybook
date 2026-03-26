import 'dart:io';

enum AdPlacement {
  main,
  situationList,
  chart,
  equity,
  handAnalysis,
  profile,
}

class AdHelper {
  static String getBannerAdUnitId(AdPlacement placement) {
    if (Platform.isIOS) {
      return _iosBannerIds[placement]!;
    } else {
      return _androidBannerIds[placement]!;
    }
  }

  static const _iosBannerIds = {
    AdPlacement.main: 'ca-app-pub-2707874353926722/7401612013',
    AdPlacement.situationList: 'ca-app-pub-2707874353926722/3627119586',
    AdPlacement.chart: 'ca-app-pub-2707874353926722/2123166928',
    AdPlacement.equity: 'ca-app-pub-2707874353926722/5814999924',
    AdPlacement.handAnalysis: 'ca-app-pub-2707874353926722/1000956247',
    AdPlacement.profile: 'ca-app-pub-2707874353926722/2640239921',
  };

  static const _androidBannerIds = {
    AdPlacement.main: 'ca-app-pub-2707874353926722/2202357275',
    AdPlacement.situationList: 'ca-app-pub-2707874353926722/5870840247',
    AdPlacement.chart: 'ca-app-pub-2707874353926722/4775448673',
    AdPlacement.equity: 'ca-app-pub-2707874353926722/1212709231',
    AdPlacement.handAnalysis: 'ca-app-pub-2707874353926722/9889275609',
    AdPlacement.profile: 'ca-app-pub-2707874353926722/1823083324',
  };
}
