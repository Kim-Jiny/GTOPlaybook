import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/inquiry.dart';
import '../../providers/inquiry_provider.dart';

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
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Text(
              inquiry.title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            _StatusBadge(status: inquiry.status, label: inquiry.statusLabel),
            const SizedBox(height: 16),
            const Text('Inquiry Detail',
                style: TextStyle(
                    color: Colors.white70, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Text(inquiry.content,
                style: const TextStyle(color: Colors.white)),
            if (inquiry.adminReply != null) ...[
              const SizedBox(height: 24),
              const Text('Admin Reply',
                  style: TextStyle(
                      color: Color(0xFF4CAF50),
                      fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF1A2E1A),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(inquiry.adminReply!,
                    style: const TextStyle(color: Colors.white)),
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

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Inquiries'),
        centerTitle: true,
      ),
      body: provider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : provider.myInquiries.isEmpty
              ? const Center(
                  child: Text('No inquiries yet',
                      style: TextStyle(color: Colors.white54)))
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
                              style: const TextStyle(color: Colors.white)),
                          subtitle: Text(
                            inq.createdAt.toLocal().toString().substring(0, 10),
                            style: const TextStyle(color: Colors.white38),
                          ),
                          trailing: _StatusBadge(
                              status: inq.status, label: inq.statusLabel),
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
        status == 'replied' ? const Color(0xFF4CAF50) : Colors.orange;
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
