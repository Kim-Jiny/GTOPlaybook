import 'package:flutter/material.dart';
import 'package:gtoplaybook/l10n/app_localizations.dart';
import 'package:url_launcher/url_launcher.dart';
import 'app_config.dart';

/// Public pages served by the backend at /legal/{slug}.
class LegalLinks {
  static const privacy = 'privacy';
  static const terms = 'terms';
  static const purchaseRefund = 'purchase-refund';
  static const accountDeletion = 'account-deletion';

  static Uri uri(String slug) =>
      Uri.parse('${AppConfig.apiBaseUrl}/legal/$slug');

  /// Opens the page in the system browser; tells the user if that is not possible.
  static Future<void> open(BuildContext context, String slug) async {
    final messenger = ScaffoldMessenger.of(context);
    final message = AppLocalizations.of(context)!.linkOpenFailed;
    var opened = false;
    try {
      opened = await launchUrl(uri(slug), mode: LaunchMode.externalApplication);
    } catch (_) {
      opened = false;
    }
    if (!opened) {
      messenger.showSnackBar(SnackBar(content: Text(message)));
    }
  }
}
