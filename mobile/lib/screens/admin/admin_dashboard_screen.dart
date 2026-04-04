import 'package:flutter/material.dart';
import 'package:gtoplaybook/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import '../../models/inquiry.dart';
import '../../providers/admin_inquiry_provider.dart';

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
      final provider = context.read<AdminInquiryProvider>();
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
        content: SingleChildScrollView(
          child: Column(
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
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(l.cancel),
          ),
          FilledButton(
            onPressed: () async {
              if (controller.text.trim().isEmpty) return;
              final provider = context.read<AdminInquiryProvider>();
              final success = await provider.replyToInquiry(
                inquiry.id,
                controller.text.trim(),
              );
              if (!ctx.mounted) return;
              final messenger = ScaffoldMessenger.of(ctx);
              if (success) {
                Navigator.pop(ctx);
                await provider.loadAllInquiries(status: _statusFilter);
                await provider.loadAdminStats();
              } else {
                messenger.showSnackBar(
                  SnackBar(
                    content: Text(
                      provider.replyError ?? l.failedToSendReply,
                    ),
                  ),
                );
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
    final provider = context.watch<AdminInquiryProvider>();
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
      body: _buildBody(context, provider, stats, l, pendingCount, totalUsers, totalInquiries, dailySignups),
    );
  }

  Widget _buildBody(
    BuildContext context,
    AdminInquiryProvider provider,
    Map<String, dynamic>? stats,
    AppLocalizations l,
    int pendingCount,
    int totalUsers,
    int totalInquiries,
    List dailySignups,
  ) {
    final hasStatsError = provider.statsError != null && stats == null;
    final hasInquiryError =
        provider.inquiriesError != null && provider.allInquiries.isEmpty;

    if (provider.isLoading && stats == null) {
      return const Center(child: CircularProgressIndicator());
    }

    if (hasStatsError && hasInquiryError) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              provider.error ?? l.failedToLoadAdminData,
              style: const TextStyle(color: Colors.redAccent),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () async {
                await provider.loadAdminStats();
                await provider.loadAllInquiries(status: _statusFilter);
              },
              child: Text(l.retry),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        await provider.loadAdminStats();
        await provider.loadAllInquiries(status: _statusFilter);
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (provider.statsError != null) ...[
            _InlineErrorBanner(
              message: provider.statsError ?? l.failedToLoadAdminData,
              onRetry: provider.loadAdminStats,
              retryLabel: l.retry,
            ),
            const SizedBox(height: 12),
          ],
          if (provider.inquiriesError != null) ...[
            _InlineErrorBanner(
              message: provider.inquiriesError ?? l.failedToLoadInquiries,
              onRetry: () => provider.loadAllInquiries(status: _statusFilter),
              retryLabel: l.retry,
            ),
            const SizedBox(height: 12),
          ],
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

          Wrap(
            spacing: 8,
            runSpacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Padding(
                padding: const EdgeInsets.only(right: 8),
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
              ChoiceChip(
                label: Text(l.pending),
                selected: _statusFilter == 'pending',
                onSelected: (_) {
                  setState(() => _statusFilter = 'pending');
                  provider.loadAllInquiries(status: 'pending');
                },
              ),
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

class _InlineErrorBanner extends StatelessWidget {
  final String message;
  final Future<void> Function() onRetry;
  final String retryLabel;

  const _InlineErrorBanner({
    required this.message,
    required this.onRetry,
    required this.retryLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.redAccent.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.redAccent.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: Colors.redAccent),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: Colors.white),
            ),
          ),
          const SizedBox(width: 8),
          TextButton(
            onPressed: onRetry,
            child: Text(retryLabel),
          ),
        ],
      ),
    );
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
