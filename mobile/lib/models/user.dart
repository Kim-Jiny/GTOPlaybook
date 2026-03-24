class AppUser {
  final String id;
  final String email;
  final String? displayName;
  final String? photoUrl;
  final int handsPlayed;
  final int handsWon;
  final int totalWinnings;
  final int biggestPot;

  AppUser({
    required this.id,
    required this.email,
    this.displayName,
    this.photoUrl,
    this.handsPlayed = 0,
    this.handsWon = 0,
    this.totalWinnings = 0,
    this.biggestPot = 0,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'] as String,
      email: json['email'] as String,
      displayName: json['display_name'] as String?,
      photoUrl: json['photo_url'] as String?,
      handsPlayed: json['hands_played'] as int? ?? 0,
      handsWon: json['hands_won'] as int? ?? 0,
      totalWinnings: json['total_winnings'] as int? ?? 0,
      biggestPot: json['biggest_pot'] as int? ?? 0,
    );
  }

  double get winRate => handsPlayed > 0 ? handsWon / handsPlayed : 0;
}
