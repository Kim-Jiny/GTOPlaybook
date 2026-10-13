import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/platform_support.dart';
import '../services/ad_helper.dart';
import '../services/api_service.dart';

enum PurchaseNotice { none, success, restoreEmpty, pending, failed }

/// One-time "remove ads" purchase. The store receipt is verified by the server,
/// which records the entitlement on the account; the local flag is only a cache
/// so ads stay off while offline.
class PurchaseProvider extends ChangeNotifier {
  static const productId = 'gto.remove_ads';
  static const _cacheKey = 'ads_removed';

  final ApiService _api;
  final InAppPurchase _iap = InAppPurchase.instance;
  StreamSubscription<List<PurchaseDetails>>? _subscription;

  /// Purchases delivered before the user was signed in (the server needs a token).
  final List<PurchaseDetails> _deferred = [];
  bool _signedIn = false;

  bool _adsRemoved = false;
  bool _storeAvailable = false;
  bool _busy = false;
  ProductDetails? _product;
  PurchaseNotice _notice = PurchaseNotice.none;

  PurchaseProvider(this._api);

  bool get adsRemoved => _adsRemoved;
  bool get storeAvailable => _storeAvailable;
  bool get busy => _busy;
  ProductDetails? get product => _product;
  PurchaseNotice get notice => _notice;
  bool get canBuy =>
      _storeAvailable && _product != null && !_adsRemoved && !_busy;

  void _setAdsRemoved(bool value) {
    _adsRemoved = value;
    AdHelper.adsRemoved = value;
    SharedPreferences.getInstance()
        .then((p) => p.setBool(_cacheKey, value))
        .catchError((_) => false);
  }

  Future<void> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (prefs.getBool(_cacheKey) ?? false) {
        _adsRemoved = true;
        AdHelper.adsRemoved = true;
        notifyListeners();
      }
    } catch (_) {}

    if (!PlatformSupport.isMobileRuntime) {
      return;
    }

    _subscription = _iap.purchaseStream.listen(
      _onPurchases,
      onError: (Object e) => debugPrint('purchaseStream error: $e'),
    );

    try {
      _storeAvailable = await _iap.isAvailable();
      if (_storeAvailable) {
        final response = await _iap.queryProductDetails({productId});
        if (response.productDetails.isNotEmpty) {
          _product = response.productDetails.first;
        }
      }
    } catch (e) {
      debugPrint('IAP init failed: $e');
    }
    notifyListeners();
  }

  /// Call once the user is signed in (the API token is set).
  Future<void> refresh() async {
    _signedIn = true;
    try {
      final result = await _api.get('/api/purchases/status');
      _setAdsRemoved(result['adsRemoved'] == true);
      notifyListeners();
    } catch (e) {
      debugPrint('Purchase status failed: $e');
    }
    final deferred = List.of(_deferred);
    _deferred.clear();
    for (final purchase in deferred) {
      await _handle(purchase);
    }
  }

  void onSignedOut() {
    _signedIn = false;
    _setAdsRemoved(false);
    notifyListeners();
  }

  Future<void> buy() async {
    final product = _product;
    if (product == null || _busy) {
      return;
    }
    _notice = PurchaseNotice.none;
    _busy = true;
    notifyListeners();
    try {
      final started = await _iap.buyNonConsumable(
        purchaseParam: PurchaseParam(productDetails: product),
      );
      if (!started) {
        _finish(PurchaseNotice.failed);
      }
    } on PlatformException {
      _finish(PurchaseNotice.failed);
    } catch (_) {
      _finish(PurchaseNotice.failed);
    }
  }

  Future<void> restore() async {
    if (_busy) {
      return;
    }
    _notice = PurchaseNotice.none;
    _busy = true;
    notifyListeners();
    try {
      await _iap.restorePurchases();
      // Restored purchases arrive on the stream; if none did, say so.
      await Future<void>.delayed(const Duration(seconds: 4));
      if (_busy) {
        _finish(
          _adsRemoved ? PurchaseNotice.success : PurchaseNotice.restoreEmpty,
        );
      }
    } catch (_) {
      _finish(PurchaseNotice.failed);
    }
  }

  void _finish(PurchaseNotice notice) {
    _busy = false;
    _notice = notice;
    notifyListeners();
  }

  Future<void> _onPurchases(List<PurchaseDetails> purchases) async {
    for (final purchase in purchases) {
      // Android reports a cancelled or failed purchase with an empty product id,
      // so those must still reach _handle or the progress indicator never stops.
      final isOurs = purchase.productID == productId;
      final isFailure =
          purchase.productID.isEmpty &&
          (purchase.status == PurchaseStatus.canceled ||
              purchase.status == PurchaseStatus.error);
      if (!isOurs && !isFailure) continue;
      await _handle(purchase);
    }
  }

  Future<void> _handle(PurchaseDetails purchase) async {
    switch (purchase.status) {
      case PurchaseStatus.pending:
        _busy = true;
        _notice = PurchaseNotice.pending;
        notifyListeners();
        return;
      case PurchaseStatus.canceled:
        _finish(PurchaseNotice.none);
        if (purchase.pendingCompletePurchase) {
          await _iap.completePurchase(purchase);
        }
        return;
      case PurchaseStatus.error:
        _finish(PurchaseNotice.failed);
        if (purchase.pendingCompletePurchase) {
          await _iap.completePurchase(purchase);
        }
        return;
      case PurchaseStatus.purchased:
      case PurchaseStatus.restored:
        if (!_signedIn) {
          _deferred.add(purchase);
          return;
        }
        await _verify(purchase);
    }
  }

  Future<void> _verify(PurchaseDetails purchase) async {
    final receipt = purchase.verificationData.serverVerificationData;
    if (receipt.isEmpty) {
      // Nothing to verify yet: leave the transaction open so it is delivered again.
      _finish(PurchaseNotice.failed);
      return;
    }
    try {
      await _api.post(
        '/api/purchases/verify',
        body: {
          'platform': PlatformSupport.isAppleSignInSupported
              ? 'ios'
              : 'android',
          'productId': productId,
          'receipt': receipt,
        },
      );
      _setAdsRemoved(true);
      _finish(PurchaseNotice.success);
      if (purchase.pendingCompletePurchase) {
        await _iap.completePurchase(purchase);
      }
    } on ApiException catch (e) {
      _finish(PurchaseNotice.failed);
      // Only close the transaction when the purchase belongs to another account
      // (409). Anything else may be transient, so the store redelivers it on the
      // next launch instead of the user losing a paid purchase.
      if (e.statusCode == 409 && purchase.pendingCompletePurchase) {
        await _iap.completePurchase(purchase);
      }
    } catch (_) {
      _finish(PurchaseNotice.failed);
    }
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
