import { RoomConfig, RoomInfo, Player } from '../game/types';

interface RoomState {
  config: RoomConfig;
  players: Map<string, Player>;
  seatOrder: string[];
  readyPlayers: Set<string>;
  socketMap: Map<string, string>; // uid -> socketId
  status: 'waiting' | 'playing';
}

export class RoomManager {
  private rooms = new Map<string, RoomState>();
  private playerRoomMap = new Map<string, string>(); // uid -> roomId

  createRoom(config: RoomConfig): RoomConfig {
    this.rooms.set(config.id, {
      config,
      players: new Map(),
      seatOrder: [],
      readyPlayers: new Set(),
      socketMap: new Map(),
      status: 'waiting',
    });
    return config;
  }

  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  deleteRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      for (const uid of room.players.keys()) {
        this.playerRoomMap.delete(uid);
      }
      this.rooms.delete(roomId);
    }
  }

  listRooms(): RoomInfo[] {
    const list: RoomInfo[] = [];
    for (const [id, room] of this.rooms) {
      list.push({
        id,
        name: room.config.name,
        playerCount: room.players.size,
        maxPlayers: room.config.maxPlayers,
        smallBlind: room.config.smallBlind,
        bigBlind: room.config.bigBlind,
        status: room.status,
      });
    }
    return list;
  }

  addPlayer(roomId: string, uid: string, displayName: string, socketId: string): { success: boolean; error?: string; seatIndex?: number } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };
    if (room.players.size >= room.config.maxPlayers) return { success: false, error: 'Room is full' };
    if (room.players.has(uid)) return { success: false, error: 'Already in room' };

    // Find first available seat
    const takenSeats = new Set(Array.from(room.players.values()).map((p) => p.seatIndex));
    let seatIndex = 0;
    while (takenSeats.has(seatIndex)) seatIndex++;

    const player: Player = {
      id: uid,
      displayName,
      seatIndex,
      chips: room.config.bigBlind * 100, // 100bb buy-in
      bet: 0,
      holeCards: [],
      folded: false,
      allIn: false,
      connected: true,
    };

    room.players.set(uid, player);
    room.seatOrder.push(uid);
    room.socketMap.set(uid, socketId);
    this.playerRoomMap.set(uid, roomId);

    return { success: true, seatIndex };
  }

  removePlayer(roomId: string, uid: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.players.delete(uid);
    room.seatOrder = room.seatOrder.filter((id) => id !== uid);
    room.readyPlayers.delete(uid);
    room.socketMap.delete(uid);
    this.playerRoomMap.delete(uid);
  }

  getPlayerRoom(uid: string): string | undefined {
    return this.playerRoomMap.get(uid);
  }

  getPlayerCount(roomId: string): number {
    return this.rooms.get(roomId)?.players.size || 0;
  }

  setPlayerReady(roomId: string, uid: string) {
    this.rooms.get(roomId)?.readyPlayers.add(uid);
  }

  allPlayersReady(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.players.size < 2) return false;
    return room.players.size === room.readyPlayers.size;
  }

  setPlayerDisconnected(roomId: string, uid: string) {
    const room = this.rooms.get(roomId);
    const player = room?.players.get(uid);
    if (player) {
      player.connected = false;
      player.disconnectedAt = Date.now();
    }
  }

  isPlayerDisconnected(roomId: string, uid: string): boolean {
    const room = this.rooms.get(roomId);
    const player = room?.players.get(uid);
    return player ? !player.connected : true;
  }

  reconnectPlayer(roomId: string, uid: string, socketId: string): boolean {
    const room = this.rooms.get(roomId);
    const player = room?.players.get(uid);
    if (!player) return false;
    player.connected = true;
    player.disconnectedAt = undefined;
    room!.socketMap.set(uid, socketId);
    return true;
  }

  getPlayersInRoom(roomId: string): Map<string, Player> {
    return this.rooms.get(roomId)?.players || new Map();
  }

  getSocketId(roomId: string, uid: string): string | undefined {
    return this.rooms.get(roomId)?.socketMap.get(uid);
  }

  setRoomStatus(roomId: string, status: 'waiting' | 'playing') {
    const room = this.rooms.get(roomId);
    if (room) room.status = status;
  }

  clearReady(roomId: string) {
    this.rooms.get(roomId)?.readyPlayers.clear();
  }

  getRoomConfig(roomId: string): RoomConfig | undefined {
    return this.rooms.get(roomId)?.config;
  }
}
