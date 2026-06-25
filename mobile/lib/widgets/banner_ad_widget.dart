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
  // Guards against re-requesting when dependencies (e.g. MediaQuery) change.
  bool _adRequested = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Adaptive banner sizing needs the screen width, so load here (where
    // MediaQuery is available) rather than in initState.
    if (!_adRequested) {
      _adRequested = true;
      _loadAd();
    }
  }

  Future<void> _loadAd() async {
    final adUnitId = AdHelper.getBannerAdUnitId(widget.placement);
    if (adUnitId == null) {
      return;
    }

    // Anchored adaptive banner: full screen width, height optimized per device.
    // Falls back to the fixed 320x50 banner if a size can't be resolved.
    final width = MediaQuery.of(context).size.width.truncate();
    final size = await AdSize.getAnchoredAdaptiveBannerAdSize(
          Orientation.portrait,
          width,
        ) ??
        AdSize.banner;

    if (!mounted) {
      return;
    }

    _bannerAd = BannerAd(
      adUnitId: adUnitId,
      size: size,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (ad) {
          if (mounted) {
            setState(() => _isLoaded = true);
          }
        },
        onAdFailedToLoad: (ad, error) {
          debugPrint('Banner[${widget.placement}] FAILED: $error');
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
