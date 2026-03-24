class Inquiry {
  final int id;
  final String userId;
  final String title;
  final String content;
  final String status;
  final String? adminReply;
  final DateTime? repliedAt;
  final DateTime createdAt;
  final String? email;
  final String? displayName;

  Inquiry({
    required this.id,
    required this.userId,
    required this.title,
    required this.content,
    required this.status,
    this.adminReply,
    this.repliedAt,
    required this.createdAt,
    this.email,
    this.displayName,
  });

  factory Inquiry.fromJson(Map<String, dynamic> json) {
    return Inquiry(
      id: json['id'],
      userId: json['user_id'],
      title: json['title'],
      content: json['content'],
      status: json['status'] ?? 'pending',
      adminReply: json['admin_reply'],
      repliedAt: json['replied_at'] != null
          ? DateTime.parse(json['replied_at'])
          : null,
      createdAt: DateTime.parse(json['created_at']),
      email: json['email'],
      displayName: json['display_name'],
    );
  }

  String get statusLabel {
    switch (status) {
      case 'replied':
        return '답변완료';
      case 'pending':
      default:
        return '대기중';
    }
  }
}
