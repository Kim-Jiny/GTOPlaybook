import 'dart:async';
import 'package:flutter/material.dart';
import '../models/game_state.dart';
import '../services/socket_service.dart';

class LobbyProvider extends ChangeNotifier {
  final SocketService _socketService = SocketService();
  StreamSubscription? _subscription;

  List<GameRoom> _rooms = [];
  bool _isLoading = false;

  List<GameRoom> get rooms => _rooms;
  bool get isLoading => _isLoading;

  void init() {
    _subscription = _socketService.events.listen(_handleEvent);
    refreshRooms();
  }

  void _handleEvent(SocketEvent event) {
    if (event.event == 'room:updated') {
      _rooms = (event.data as List)
          .map((r) => GameRoom.fromJson(Map<String, dynamic>.from(r)))
          .toList();
      notifyListeners();
    }
  }

  void refreshRooms() {
    _isLoading = true;
    notifyListeners();

    _socketService.emitWithCallback('room:list', {}, (data) {
      _rooms = (data as List)
          .map((r) => GameRoom.fromJson(Map<String, dynamic>.from(r)))
          .toList();
      _isLoading = false;
      notifyListeners();
    });
  }

  void createRoom(String name, {int maxPlayers = 6, int smallBlind = 10, int bigBlind = 20}) {
    _socketService.emitWithCallback('room:create', {
      'name': name,
      'maxPlayers': maxPlayers,
      'smallBlind': smallBlind,
      'bigBlind': bigBlind,
    }, (data) {
      // Room created, list will be updated via room:updated event
    });
  }

  void joinRoom(String roomId, Function(Map<String, dynamic>) callback) {
    _socketService.emitWithCallback('room:join', {'roomId': roomId}, (data) {
      callback(Map<String, dynamic>.from(data));
    });
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
