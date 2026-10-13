import 'package:flutter/material.dart';
import 'package:gtoplaybook/l10n/app_localizations.dart';
import '../../config/legal_links.dart';
import '../../theme/app_theme.dart';

/// Purchase, withdrawal and refund terms for the ad-free upgrade.
class PurchasePolicyScreen extends StatelessWidget {
  const PurchasePolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    final sections = [
      (l.purchasePolicyProductTitle, l.purchasePolicyProductBody),
      (l.purchasePolicyPaymentTitle, l.purchasePolicyPaymentBody),
      (l.purchasePolicyUsageTitle, l.purchasePolicyUsageBody),
      (l.purchasePolicyRefundTitle, l.purchasePolicyRefundBody),
      (l.purchasePolicyContactTitle, l.purchasePolicyContactBody),
    ];

    return Scaffold(
      appBar: AppBar(title: Text(l.purchaseInfoLink), centerTitle: true),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
        children: [
          Text(
            l.purchasePolicyEffective,
            style: TextStyle(color: context.ink54, fontSize: 13),
          ),
          const SizedBox(height: 12),
          for (var i = 0; i < sections.length; i++)
            Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${i + 1}. ${sections[i].$1}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      sections[i].$2,
                      style: TextStyle(color: context.ink70, height: 1.5),
                    ),
                  ],
                ),
              ),
            ),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: () =>
                  LegalLinks.open(context, LegalLinks.purchaseRefund),
              icon: const Icon(Icons.open_in_new, size: 18),
              label: Text(l.viewOnWeb),
            ),
          ),
        ],
      ),
    );
  }
}
