import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import firebaseApp from '../config/firebase';
import { RoomManager } from './roomManager';
import { HoldemGame } from './holdemGame';

const roomManager = new RoomManager();
const holdemGame = new HoldemGame(roomManager);

export function setupSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  // Firebase auth middleware for socket connections
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = await firebaseApp.auth().verifyIdToken(token);
      socket.data.uid = decoded.uid;
      socket.data.email = decoded.email;
      socket.data.displayName = decoded.name || decoded.email?.split('@')[0] || 'Player';
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const uid = socket.data.uid as string;
    const displayName = socket.data.displayName as string;
    console.log(`Player connected: ${displayName} (${uid})`);

    // === Lobby Events ===
    socket.on('room:list', (callback) => {
      callback(roomManager.listRooms());
    });

    socket.on('room:create', (data: { name: string; maxPlayers?: number; smallBlind?: number; bigBlind?: number }, callback) => {
      const room = roomManager.createRoom({
        id: `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: data.name,
        maxPlayers: data.maxPlayers || 6,
        smallBlind: data.smallBlind || 10,
        bigBlind: data.bigBlind || 20,
        createdBy: uid,
      });
      socket.join(room.id);
      roomManager.addPlayer(room.id, uid, displayName, socket.id);
      io.emit('room:updated', roomManager.listRooms());
      callback({ success: true, roomId: room.id });
    });

    socket.on('room:join', (data: { roomId: string }, callback) => {
      const result = roomManager.addPlayer(data.roomId, uid, displayName, socket.id);
      if (!result.success) {
        callback({ success: false, error: result.error });
        return;
      }
      socket.join(data.roomId);
      io.to(data.roomId).emit('room:playerJoined', {
        playerId: uid,
        displayName,
        seatIndex: result.seatIndex,
      });
      io.emit('room:updated', roomManager.listRooms());
      callback({ success: true, seatIndex: result.seatIndex });
    });

    socket.on('room:leave', (data: { roomId: string }) => {
      handleLeaveRoom(socket, io, data.roomId, uid);
    });

    // === Game Events ===
    socket.on('game:ready', (data: { roomId: string }) => {
      roomManager.setPlayerReady(data.roomId, uid);
      const room = roomManager.getRoom(data.roomId);
      if (room) {
        io.to(data.roomId).emit('game:playerReady', { playerId: uid });
        // Check if all players ready (min 2)
        if (roomManager.allPlayersReady(data.roomId)) {
          holdemGame.startGame(data.roomId, io);
        }
      }
    });

    socket.on('game:action', (data: { roomId: string; action: string; amount?: number }) => {
      holdemGame.handleAction(data.roomId, uid, data.action, data.amount || 0, io);
    });

    // === Disconnect ===
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${displayName} (${uid})`);
      const roomId = roomManager.getPlayerRoom(uid);
      if (roomId) {
        roomManager.setPlayerDisconnected(roomId, uid);
        io.to(roomId).emit('game:playerDisconnected', { playerId: uid });

        // 15-second grace period for reconnection
        setTimeout(() => {
          if (roomManager.isPlayerDisconnected(roomId, uid)) {
            handleLeaveRoom(socket, io, roomId, uid);
          }
        }, 15_000);
      }
    });

    // === Reconnect ===
    socket.on('game:reconnect', (data: { roomId: string }, callback) => {
      const reconnected = roomManager.reconnectPlayer(data.roomId, uid, socket.id);
      if (reconnected) {
        socket.join(data.roomId);
        io.to(data.roomId).emit('game:playerReconnected', { playerId: uid });
        const state = holdemGame.getClientState(data.roomId, uid);
        callback({ success: true, gameState: state });
      } else {
        callback({ success: false, error: 'Cannot reconnect' });
      }
    });
  });

  holdemGame.setIo(io);
  return io;
}

function handleLeaveRoom(socket: Socket, io: Server, roomId: string, uid: string) {
  roomManager.removePlayer(roomId, uid);
  socket.leave(roomId);
  io.to(roomId).emit('room:playerLeft', { playerId: uid });

  const room = roomManager.getRoom(roomId);
  if (!room || roomManager.getPlayerCount(roomId) === 0) {
    roomManager.deleteRoom(roomId);
  }
  io.emit('room:updated', roomManager.listRooms());
}
