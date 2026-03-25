import 'package:flutter/material.dart';
import 'package:gtoplaybook/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../inquiry/inquiry_screen.dart';
import '../inquiry/my_inquiries_screen.dart';
import '../admin/admin_dashboard_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final l = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(
        title: Text(l.myPage),
        centerTitle: true,
      ),
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
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          user?.email ?? '',
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

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
                MaterialPageRoute(
                    builder: (_) => const AdminDashboardScreen()),
              ),
            ),
          const Divider(height: 32),
          _MenuTile(
            icon: Icons.logout,
            title: l.signOut,
            iconColor: Colors.redAccent,
            onTap: () => auth.signOut(),
          ),
        ],
      ),
    );
  }
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
      leading: Icon(icon, color: iconColor ?? const Color(0xFF4CAF50)),
      title: Text(title, style: const TextStyle(color: Colors.white)),
      trailing:
          const Icon(Icons.chevron_right, color: Colors.white38, size: 20),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      onTap: onTap,
    );
  }
}
