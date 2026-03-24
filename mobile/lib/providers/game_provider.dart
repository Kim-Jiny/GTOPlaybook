import 'dart:async';
import 'package:flutter/material.dart';
import '../models/game_state.dart';
import '../services/socket_service.dart';

class GameProvider extends ChangeNotifier {
  final SocketService _socketService = SocketService();
  StreamSubscription? _subscription;

  GameState? _gameState;
  List<String>? _holeCards;
  String? _currentRoomId;
  bool _isMyTurn = false;
  int _turnTimeLeft = 30;
  Timer? _turnTimer;
  Map<String, dynamic>? _showdownResult;

  GameState? get gameState => _gameState;
  List<String>? get holeCards => _holeCards;
  String? get currentRoomId => _currentRoomId;
  bool get isMyTurn => _isMyTurn;
  int get turnTimeLeft => _turnTimeLeft;
  Map<String, dynamic>? get showdownResult => _showdownResult;

  String? _myUid;

  void init(String uid) {
    _myUid = uid;
    _subscription = _socketService.events.listen(_handleEvent);
  }

  void _handleEvent(SocketEvent event) {
    switch (event.event) {
      case 'game:state':
        _gameState = GameState.fromJson(Map<String, dynamic>.from(event.data));
        _isMyTurn = _gameState?.currentPlayerId == _myUid;
        _showdownResult = null;
        notifyListeners();
        break;

      case 'game:deal':
        final data = Map<String, dynamic>.from(event.data);
        _holeCards = List<String>.from(data['holeCards'] ?? []);
        notifyListeners();
        break;

      case 'game:turn':
        final data = Map<String, dynamic>.from(event.data);
        _isMyTurn = data['playerId'] == _myUid;
        _turnTimeLeft = ((data['timeLimit'] as int?) ?? 30000) ~/ 1000;
        _startTurnCountdown();
        notifyListeners();
        break;

      case 'game:community':
        final data = Map<String, dynamic>.from(event.data);
        if (_gameState != null) {
          _gameState = GameState(
            roomId: _gameState!.roomId,
            phase: data['phase'] as String,
            players: _gameState!.players,
            communityCards: List<String>.from(data['communityCards'] ?? []),
            pot: _gameState!.pot,
            currentPlayerId: _gameState!.currentPlayerId,
            dealerIndex: _gameState!.dealerIndex,
            currentBet: _gameState!.currentBet,
            handNumber: _gameState!.handNumber,
          );
        }
        notifyListeners();
        break;

      case 'game:showdown':
        _showdownResult = Map<String, dynamic>.from(event.data);
        _isMyTurn = false;
        _turnTimer?.cancel();
        notifyListeners();
        break;

      case 'game:action':
        final data = Map<String, dynamic>.from(event.data);
        if (_gameState != null) {
          _gameState = GameState(
            roomId: _gameState!.roomId,
            phase: _gameState!.phase,
            players: _gameState!.players,
            communityCards: _gameState!.communityCards,
            pot: data['pot'] as int? ?? _gameState!.pot,
            currentPlayerId: _gameState!.currentPlayerId,
            dealerIndex: _gameState!.dealerIndex,
            currentBet: _gameState!.currentBet,
            handNumber: _gameState!.handNumber,
          );
        }
        notifyListeners();
        break;

      case 'game:ended':
      case 'game:busted':
        _gameState = null;
        _holeCards = null;
        _currentRoomId = null;
        _isMyTurn = false;
        _turnTimer?.cancel();
        notifyListeners();
        break;
    }
  }

  void _startTurnCountdown() {
    _turnTimer?.cancel();
    _turnTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_turnTimeLeft > 0) {
        _turnTimeLeft--;
        notifyListeners();
      } else {
        timer.cancel();
      }
    });
  }

  void joinRoom(String roomId) {
    _currentRoomId = roomId;
  }

  void sendReady() {
    if (_currentRoomId != null) {
      _socketService.emit('game:ready', {'roomId': _currentRoomId});
    }
  }

  void sendAction(String action, {int amount = 0}) {
    if (_currentRoomId != null) {
      _socketService.emit('game:action', {
        'roomId': _currentRoomId,
        'action': action,
        'amount': amount,
      });
      _isMyTurn = false;
      _turnTimer?.cancel();
      notifyListeners();
    }
  }

  void leaveRoom() {
    if (_currentRoomId != null) {
      _socketService.emit('room:leave', {'roomId': _currentRoomId});
      _gameState = null;
      _holeCards = null;
      _currentRoomId = null;
      _isMyTurn = false;
      _turnTimer?.cancel();
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _turnTimer?.cancel();
    super.dispose();
  }
}
