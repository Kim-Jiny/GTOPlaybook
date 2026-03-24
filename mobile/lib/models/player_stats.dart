class PlayerStats {
  final int handsPlayed;
  final int handsWon;
  final int totalWinnings;
  final int biggestPot;
  final int vpipHands;
  final int pfrHands;

  PlayerStats({
    this.handsPlayed = 0,
    this.handsWon = 0,
    this.totalWinnings = 0,
    this.biggestPot = 0,
    this.vpipHands = 0,
    this.pfrHands = 0,
  });

  factory PlayerStats.fromJson(Map<String, dynamic> json) {
    return PlayerStats(
      handsPlayed: json['hands_played'] as int? ?? 0,
      handsWon: json['hands_won'] as int? ?? 0,
      totalWinnings: json['total_winnings'] as int? ?? 0,
      biggestPot: json['biggest_pot'] as int? ?? 0,
      vpipHands: json['vpip_hands'] as int? ?? 0,
      pfrHands: json['pfr_hands'] as int? ?? 0,
    );
  }

  double get winRate => handsPlayed > 0 ? handsWon / handsPlayed * 100 : 0;
  double get vpip => handsPlayed > 0 ? vpipHands / handsPlayed * 100 : 0;
  double get pfr => handsPlayed > 0 ? pfrHands / handsPlayed * 100 : 0;
}
