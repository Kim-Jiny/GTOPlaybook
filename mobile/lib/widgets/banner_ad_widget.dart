import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:visibility_detector/visibility_detector.dart';
import '../services/ad_helper.dart';

class BannerAdWidget extends StatefulWidget {
  final AdPlacement placement;

  const BannerAdWidget({super.key, required this.placement});

  @override
  State<BannerAdWidget> createState() => _BannerAdWidgetState();
}

class _BannerAdWidgetState extends State<BannerAdWidget> {
  BannerAd? _bannerAd;
  bool _isLoaded = false;
  // Whether this banner is currently on screen. When it isn't (e.g. an
  // offstage IndexedStack tab or a route covered by another), we drop the
  // AdWidget from the tree so its WebView stops drawing — otherwise the
  // AdMob SDK keeps invalidating it every frame and janks the whole app.
  bool _visible = false;

  @override
  void initState() {
    super.initState();
    _loadAd();
  }

  void _loadAd() {
    final adUnitId = AdHelper.getBannerAdUnitId(widget.placement);
    if (adUnitId == null) {
      return;
    }

    _bannerAd = BannerAd(
      adUnitId: adUnitId,
      size: AdSize.banner,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (ad) {
          if (mounted) {
            setState(() => _isLoaded = true);
          }
        },
        onAdFailedToLoad: (ad, error) {
          ad.dispose();
        },
      ),
    )..load();
  }

  @override
  void dispose() {
    _bannerAd?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!AdHelper.isBannerAdsSupported || !_isLoaded || _bannerAd == null) {
      return const SizedBox.shrink();
    }

    final width = _bannerAd!.size.width.toDouble();
    final height = _bannerAd!.size.height.toDouble();

    return VisibilityDetector(
      key: Key('banner-${widget.placement}-${identityHashCode(this)}'),
      onVisibilityChanged: (info) {
        if (!mounted) return;
        final nowVisible = info.visibleFraction > 0;
        if (nowVisible != _visible) {
          setState(() => _visible = nowVisible);
        }
      },
      // Reserve the slot size always so layout doesn't jump; only mount the
      // actual AdWidget (WebView) while visible.
      child: SizedBox(
        width: width,
        height: height,
        child: _visible ? AdWidget(ad: _bannerAd!) : null,
      ),
    );
  }
}
