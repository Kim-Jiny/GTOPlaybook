import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/app_config.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  io.Socket? _socket;
  bool get isConnected => _socket?.connected ?? false;

  final _eventController = StreamController<SocketEvent>.broadcast();
  Stream<SocketEvent> get events => _eventController.stream;

  void connect(String token) {
    _socket?.dispose();
    _socket = io.io(
      AppConfig.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .disableAutoConnect()
          .build(),
    );

    _socket!.onConnect((_) {
      _eventController.add(SocketEvent('connected', {}));
    });

    _socket!.onDisconnect((_) {
      _eventController.add(SocketEvent('disconnected', {}));
    });

    _socket!.onConnectError((data) {
      _eventController.add(SocketEvent('error', {'message': data.toString()}));
    });

    // Room events
    _socket!.on('room:updated', (data) {
      _eventController.add(SocketEvent('room:updated', data));
    });
    _socket!.on('room:playerJoined', (data) {
      _eventController.add(SocketEvent('room:playerJoined', data));
    });
    _socket!.on('room:playerLeft', (data) {
      _eventController.add(SocketEvent('room:playerLeft', data));
    });

    // Game events
    _socket!.on('game:state', (data) {
      _eventController.add(SocketEvent('game:state', data));
    });
    _socket!.on('game:deal', (data) {
      _eventController.add(SocketEvent('game:deal', data));
    });
    _socket!.on('game:turn', (data) {
      _eventController.add(SocketEvent('game:turn', data));
    });
    _socket!.on('game:action', (data) {
      _eventController.add(SocketEvent('game:action', data));
    });
    _socket!.on('game:community', (data) {
      _eventController.add(SocketEvent('game:community', data));
    });
    _socket!.on('game:showdown', (data) {
      _eventController.add(SocketEvent('game:showdown', data));
    });
    _socket!.on('game:playerReady', (data) {
      _eventController.add(SocketEvent('game:playerReady', data));
    });
    _socket!.on('game:playerDisconnected', (data) {
      _eventController.add(SocketEvent('game:playerDisconnected', data));
    });
    _socket!.on('game:playerReconnected', (data) {
      _eventController.add(SocketEvent('game:playerReconnected', data));
    });
    _socket!.on('game:ended', (data) {
      _eventController.add(SocketEvent('game:ended', data));
    });
    _socket!.on('game:busted', (data) {
      _eventController.add(SocketEvent('game:busted', data));
    });

    _socket!.connect();
  }

  void emit(String event, [dynamic data]) {
    _socket?.emit(event, data);
  }

  void emitWithCallback(String event, dynamic data, Function(dynamic) callback) {
    _socket?.emitWithAck(event, data, ack: callback);
  }

  void disconnect() {
    _socket?.dispose();
    _socket = null;
  }

  void dispose() {
    disconnect();
    _eventController.close();
  }
}

class SocketEvent {
  final String event;
  final dynamic data;
  SocketEvent(this.event, this.data);
}
