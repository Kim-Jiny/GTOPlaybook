import 'package:flutter/material.dart';
import 'package:gtoplaybook/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import '../../models/inquiry.dart';
import '../../providers/inquiry_provider.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  String? _statusFilter;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<InquiryProvider>();
      provider.loadAdminStats();
      provider.loadAllInquiries();
    });
  }

  void _showReplyDialog(Inquiry inquiry) {
    final controller = TextEditingController();
    final l = AppLocalizations.of(context)!;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(inquiry.title),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(inquiry.content,
                style: const TextStyle(color: Colors.white70)),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              decoration: InputDecoration(
                labelText: l.reply,
                border: const OutlineInputBorder(),
              ),
              maxLines: 4,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(l.cancel),
          ),
          FilledButton(
            onPressed: () async {
              if (controller.text.trim().isEmpty) return;
              final provider = context.read<InquiryProvider>();
              final success = await provider.replyToInquiry(
                inquiry.id,
                controller.text.trim(),
              );
              if (!ctx.mounted) return;
              Navigator.pop(ctx);
              if (success) {
                provider.loadAllInquiries(status: _statusFilter);
                provider.loadAdminStats();
              }
            },
            child: Text(l.sendReply),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<InquiryProvider>();
    final stats = provider.adminStats;
    final l = AppLocalizations.of(context)!;

    final pendingCount = _getInquiryStatCount(stats, 'pending');
    final totalUsers = stats?['totalUsers'] ?? 0;
    final totalInquiries = stats?['totalInquiries'] ?? 0;
    final dailySignups = (stats?['dailySignups'] as List?) ?? [];

    return Scaffold(
      appBar: AppBar(
        title: Text(l.admin),
        centerTitle: true,
      ),
      body: provider.isLoading && stats == null
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async {
                await provider.loadAdminStats();
                await provider.loadAllInquiries(status: _statusFilter);
              },
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Stats cards
                  Row(
                    children: [
                      _StatCard(
                          label: l.users, value: '$totalUsers', flex: 1),
                      const SizedBox(width: 8),
                      _StatCard(
                          label: l.inquiries, value: '$totalInquiries', flex: 1),
                      const SizedBox(width: 8),
                      _StatCard(
                        label: l.pending,
                        value: '$pendingCount',
                        flex: 1,
                        valueColor: pendingCount > 0
                            ? Colors.orange
                            : const Color(0xFF4CAF50),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Daily signups
                  Text(l.signupsLast30Days,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  if (dailySignups.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Text(l.noDataAvailable,
                          style: const TextStyle(color: Colors.white38)),
                    )
                  else
                    ...dailySignups.map((d) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 2),
                          child: Row(
                            mainAxisAlignment:
                                MainAxisAlignment.spaceBetween,
                            children: [
                              Text('${d['date']}'.substring(0, 10),
                                  style: const TextStyle(
                                      color: Colors.white70)),
                              Text('${d['count']}',
                                  style: const TextStyle(
                                      color: Color(0xFF4CAF50),
                                      fontWeight: FontWeight.w600)),
                            ],
                          ),
                        )),
                  const SizedBox(height: 24),

                  // Inquiry management
                  Row(
                    children: [
                      Expanded(
                        child: Text(l.inquiryManagement,
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold)),
                      ),
                      ChoiceChip(
                        label: Text(l.all),
                        selected: _statusFilter == null,
                        onSelected: (_) {
                          setState(() => _statusFilter = null);
                          provider.loadAllInquiries();
                        },
                      ),
                      const SizedBox(width: 4),
                      ChoiceChip(
                        label: Text(l.pending),
                        selected: _statusFilter == 'pending',
                        onSelected: (_) {
                          setState(() => _statusFilter = 'pending');
                          provider.loadAllInquiries(status: 'pending');
                        },
                      ),
                      const SizedBox(width: 4),
                      ChoiceChip(
                        label: Text(l.replied),
                        selected: _statusFilter == 'replied',
                        onSelected: (_) {
                          setState(() => _statusFilter = 'replied');
                          provider.loadAllInquiries(status: 'replied');
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  if (provider.allInquiries.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      child: Center(
                          child: Text(l.noInquiries,
                              style: const TextStyle(color: Colors.white38))),
                    )
                  else
                    ...provider.allInquiries.map((inq) => Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: ListTile(
                            title: Text(inq.title,
                                style:
                                    const TextStyle(color: Colors.white)),
                            subtitle: Text(
                              '${inq.displayName ?? inq.email ?? ''} · ${inq.createdAt.toLocal().toString().substring(0, 10)}',
                              style:
                                  const TextStyle(color: Colors.white38),
                            ),
                            trailing: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: inq.status == 'replied'
                                    ? const Color(0xFF4CAF50)
                                        .withValues(alpha: 0.15)
                                    : Colors.orange
                                        .withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                inq.statusLabel(l),
                                style: TextStyle(
                                  color: inq.status == 'replied'
                                      ? const Color(0xFF4CAF50)
                                      : Colors.orange,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            onTap: inq.status == 'pending'
                                ? () => _showReplyDialog(inq)
                                : null,
                          ),
                        )),
                ],
              ),
            ),
    );
  }

  int _getInquiryStatCount(Map<String, dynamic>? stats, String status) {
    if (stats == null) return 0;
    final list = stats['inquiryStats'] as List?;
    if (list == null) return 0;
    for (final item in list) {
      if (item['status'] == status) return int.tryParse('${item['count']}') ?? 0;
    }
    return 0;
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final int flex;
  final Color? valueColor;

  const _StatCard({
    required this.label,
    required this.value,
    required this.flex,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      flex: flex,
      child: Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Text(value,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: valueColor ?? Colors.white,
                  )),
              const SizedBox(height: 4),
              Text(label, style: const TextStyle(color: Colors.white54)),
            ],
          ),
        ),
      ),
    );
  }
}
