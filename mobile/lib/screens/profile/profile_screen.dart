import 'package:flutter/material.dart';
import 'package:gtoplaybook/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/purchase_provider.dart';
import '../../services/ad_helper.dart';
import '../../widgets/banner_ad_widget.dart';
import '../inquiry/inquiry_screen.dart';
import '../inquiry/my_inquiries_screen.dart';
import '../admin/admin_dashboard_screen.dart';
import '../../theme/app_theme.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final l = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(title: Text(l.myPage), centerTitle: true),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // User info card
          Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundImage: user?.photoURL != null
                        ? NetworkImage(user!.photoURL!)
                        : null,
                    child: user?.photoURL == null
                        ? const Icon(Icons.person, size: 32)
                        : null,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.displayName ?? l.player,
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: context.ink,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          user?.email ?? '',
                          style: TextStyle(color: context.ink54, fontSize: 14),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Center(child: BannerAdWidget(placement: AdPlacement.profile)),
          const SizedBox(height: 16),

          const _RemoveAdsTile(),
          const SizedBox(height: 8),

          // Appearance
          const _ThemeModeTile(),
          const SizedBox(height: 8),

          // Menu items
          _MenuTile(
            icon: Icons.edit_note,
            title: l.contactUs,
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const InquiryScreen()),
            ),
          ),
          _MenuTile(
            icon: Icons.list_alt,
            title: l.myInquiries,
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const MyInquiriesScreen()),
            ),
          ),
          if (auth.isAdmin)
            _MenuTile(
              icon: Icons.admin_panel_settings,
              title: l.admin,
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AdminDashboardScreen()),
              ),
            ),
          const Divider(height: 32),
          _MenuTile(
            icon: Icons.logout,
            title: l.signOut,
            iconColor: Colors.redAccent,
            onTap: () {
              context.read<PurchaseProvider>().onSignedOut();
              auth.signOut();
            },
          ),
          _MenuTile(
            icon: Icons.delete_forever,
            title: l.deleteAccount,
            iconColor: Colors.redAccent,
            onTap: () => _showDeleteAccountDialog(context, auth, l),
          ),
        ],
      ),
    );
  }
}

void _showDeleteAccountDialog(
  BuildContext context,
  AuthProvider auth,
  AppLocalizations l,
) {
  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(l.deleteAccountTitle),
      content: Text(l.deleteAccountMessage),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: Text(l.cancel)),
        TextButton(
          onPressed: () async {
            final messenger = ScaffoldMessenger.of(context);
            final navigator = Navigator.of(context);
            Navigator.pop(ctx);
            showDialog(
              context: context,
              barrierDismissible: false,
              builder: (_) => const Center(child: CircularProgressIndicator()),
            );
            try {
              await auth.deleteAccount();
              if (context.mounted) navigator.pop(); // dismiss loading
            } catch (e) {
              if (context.mounted) navigator.pop(); // dismiss loading
              messenger.showSnackBar(SnackBar(content: Text(e.toString())));
            }
          },
          style: TextButton.styleFrom(foregroundColor: Colors.redAccent),
          child: Text(l.delete),
        ),
      ],
    ),
  );
}

class _MenuTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final Color? iconColor;

  const _MenuTile({
    required this.icon,
    required this.title,
    required this.onTap,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: iconColor ?? context.accent),
      title: Text(title, style: TextStyle(color: context.ink)),
      trailing: Icon(Icons.chevron_right, color: context.ink38, size: 20),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      onTap: onTap,
    );
  }
}

class _ThemeModeTile extends StatelessWidget {
  const _ThemeModeTile();

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    final theme = context.watch<ThemeProvider>();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        children: [
          Icon(Icons.brightness_6, color: context.accent),
          const SizedBox(width: 16),
          Expanded(child: Text(l.themeLabel)),
          SegmentedButton<ThemeMode>(
            showSelectedIcon: false,
            style: const ButtonStyle(visualDensity: VisualDensity.compact),
            segments: [
              ButtonSegment(
                value: ThemeMode.system,
                label: Text(l.themeSystem),
              ),
              ButtonSegment(value: ThemeMode.light, label: Text(l.themeLight)),
              ButtonSegment(value: ThemeMode.dark, label: Text(l.themeDark)),
            ],
            selected: {theme.mode},
            onSelectionChanged: (s) => theme.setMode(s.first),
          ),
        ],
      ),
    );
  }
}

class _RemoveAdsTile extends StatelessWidget {
  const _RemoveAdsTile();

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context)!;
    final purchase = context.watch<PurchaseProvider>();

    if (purchase.adsRemoved) {
      return ListTile(
        leading: Icon(Icons.check_circle, color: context.accent),
        title: Text(l.adsRemoved),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      );
    }
    if (!purchase.storeAvailable) return const SizedBox.shrink();

    final notice = switch (purchase.notice) {
      PurchaseNotice.success => l.purchaseSuccess,
      PurchaseNotice.restoreEmpty => l.purchaseRestoreEmpty,
      PurchaseNotice.pending => l.purchasePending,
      PurchaseNotice.failed => l.purchaseFailed,
      PurchaseNotice.none => null,
    };

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.block, color: context.accent),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    l.removeAds,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                FilledButton(
                  onPressed: purchase.canBuy ? purchase.buy : null,
                  child: purchase.busy
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(purchase.product?.price ?? '—'),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              l.removeAdsDesc,
              style: TextStyle(color: context.ink54, fontSize: 13),
            ),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton(
                onPressed: purchase.busy ? null : purchase.restore,
                child: Text(l.restorePurchases),
              ),
            ),
            if (notice != null)
              Text(
                notice,
                style: TextStyle(color: context.ink70, fontSize: 13),
              ),
          ],
        ),
      ),
    );
  }
}
