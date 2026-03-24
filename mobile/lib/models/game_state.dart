class GameRoom {
  final String id;
  final String name;
  final int playerCount;
  final int maxPlayers;
  final int smallBlind;
  final int bigBlind;
  final String status;

  GameRoom({
    required this.id,
    required this.name,
    required this.playerCount,
    required this.maxPlayers,
    required this.smallBlind,
    required this.bigBlind,
    required this.status,
  });

  factory GameRoom.fromJson(Map<String, dynamic> json) {
    return GameRoom(
      id: json['id'] as String,
      name: json['name'] as String,
      playerCount: json['playerCount'] as int? ?? 0,
      maxPlayers: json['maxPlayers'] as int? ?? 6,
      smallBlind: json['smallBlind'] as int? ?? 10,
      bigBlind: json['bigBlind'] as int? ?? 20,
      status: json['status'] as String? ?? 'waiting',
    );
  }
}

class GamePlayer {
  final String id;
  final String displayName;
  final int seatIndex;
  final int chips;
  final int bet;
  final bool folded;
  final bool allIn;
  final bool connected;
  final List<String>? holeCards;

  GamePlayer({
    required this.id,
    required this.displayName,
    required this.seatIndex,
    required this.chips,
    required this.bet,
    required this.folded,
    required this.allIn,
    required this.connected,
    this.holeCards,
  });

  factory GamePlayer.fromJson(Map<String, dynamic> json) {
    return GamePlayer(
      id: json['id'] as String,
      displayName: json['displayName'] as String? ?? 'Player',
      seatIndex: json['seatIndex'] as int? ?? 0,
      chips: json['chips'] as int? ?? 0,
      bet: json['bet'] as int? ?? 0,
      folded: json['folded'] as bool? ?? false,
      allIn: json['allIn'] as bool? ?? false,
      connected: json['connected'] as bool? ?? true,
      holeCards: json['holeCards'] != null
          ? List<String>.from(json['holeCards'])
          : null,
    );
  }
}

class GameState {
  final String roomId;
  final String phase;
  final List<GamePlayer> players;
  final List<String> communityCards;
  final int pot;
  final String? currentPlayerId;
  final int dealerIndex;
  final int currentBet;
  final int handNumber;

  GameState({
    required this.roomId,
    required this.phase,
    required this.players,
    required this.communityCards,
    required this.pot,
    this.currentPlayerId,
    required this.dealerIndex,
    required this.currentBet,
    required this.handNumber,
  });

  factory GameState.fromJson(Map<String, dynamic> json) {
    return GameState(
      roomId: json['roomId'] as String,
      phase: json['phase'] as String? ?? 'WAITING',
      players: (json['players'] as List?)
              ?.map((p) => GamePlayer.fromJson(p))
              .toList() ??
          [],
      communityCards: List<String>.from(json['communityCards'] ?? []),
      pot: json['pot'] as int? ?? 0,
      currentPlayerId: json['currentPlayerId'] as String?,
      dealerIndex: json['dealerIndex'] as int? ?? 0,
      currentBet: json['currentBet'] as int? ?? 0,
      handNumber: json['handNumber'] as int? ?? 0,
    );
  }
}
