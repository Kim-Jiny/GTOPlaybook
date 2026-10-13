import 'package:flutter/material.dart';
import 'package:gtoplaybook/l10n/app_localizations.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/inquiry.dart';
import '../../providers/inquiry_provider.dart';
import '../../theme/app_theme.dart';

class MyInquiriesScreen extends StatefulWidget {
  const MyInquiriesScreen({super.key});

  @override
  State<MyInquiriesScreen> createState() => _MyInquiriesScreenState();
}

class _MyInquiriesScreenState extends State<MyInquiriesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<InquiryProvider>().loadMyInquiries();
    });
  }

  void _showDetail(Inquiry inquiry) {
    final l = AppLocalizations.of(context)!;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        builder: (_, controller) => ListView(
          controller: controller,
          padding: const EdgeInsets.all(20),
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: context.ink24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Text(
              inquiry.title,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: context.ink,
              ),
            ),
            const SizedBox(height: 8),
            _StatusBadge(status: inquiry.status, label: inquiry.statusLabel(l)),
            const SizedBox(height: 16),
            Text(l.inquiryDetail,
                style: TextStyle(
                    color: context.ink70, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Text(inquiry.content,
                style: TextStyle(color: context.ink)),
            if (inquiry.adminReply != null) ...[
              const SizedBox(height: 24),
              Text(l.adminReply,
                  style: TextStyle(
                      color: context.accent,
                      fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: context.card,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(inquiry.adminReply!,
                    style: TextStyle(color: context.ink)),
              ),
            ],
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<InquiryProvider>();
    final l = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(
        title: Text(l.myInquiries),
        centerTitle: true,
      ),
      body: provider.isLoadingMyInquiries
          ? const Center(child: CircularProgressIndicator())
          : provider.myInquiriesError != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        provider.myInquiriesError ?? l.failedToLoadInquiries,
                        style: const TextStyle(color: Colors.redAccent),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () => provider.loadMyInquiries(),
                        child: Text(l.retry),
                      ),
                    ],
                  ),
                )
          : provider.myInquiries.isEmpty
              ? Center(
                  child: Text(l.noInquiriesYet,
                      style: TextStyle(color: context.ink54)))
              : RefreshIndicator(
                  onRefresh: () => provider.loadMyInquiries(),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: provider.myInquiries.length,
                    itemBuilder: (_, i) {
                      final inq = provider.myInquiries[i];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: ListTile(
                          title: Text(inq.title,
                              style: TextStyle(color: context.ink)),
                          subtitle: Text(
                            DateFormat.yMMMd(
                              Localizations.localeOf(context).toString(),
                            ).format(inq.createdAt.toLocal()),
                            style: TextStyle(color: context.ink54),
                          ),
                          trailing: _StatusBadge(
                              status: inq.status, label: inq.statusLabel(l)),
                          onTap: () => _showDetail(inq),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  final String label;
  const _StatusBadge({required this.status, required this.label});

  @override
  Widget build(BuildContext context) {
    final color =
        status == 'replied' ? context.accent : Colors.orange;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(label,
          style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}
