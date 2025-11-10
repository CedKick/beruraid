import { GameRoom } from './GameRoom.js';
import type {
  CreateRoomRequest,
  CreateRoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  PlayerState,
  RoomInfo,
} from '@beruraid/shared';

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private roomCodeToId: Map<string, string> = new Map();
  private playerToRoom: Map<string, string> = new Map(); // socketId -> roomId

  /**
   * Generate a unique 6-character room code
   */
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;

    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.roomCodeToId.has(code));

    return code;
  }

  /**
   * Generate unique room ID
   */
  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new room
   */
  public createRoom(request: CreateRoomRequest, socketId: string): CreateRoomResponse {
    try {
      const roomId = this.generateRoomId();
      const roomCode = this.generateRoomCode();

      const room = new GameRoom(roomId, roomCode, request.maxPlayers);

      // Create initial player state
      const player: PlayerState = {
        id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        socketId: socketId,
        name: request.playerName,
        characterId: request.characterId,
        position: { x: 400, y: 500 },
        stats: this.getDefaultStats(),
        direction: 'down',
        isDodging: false,
        isAlive: true,
        lastUpdateTime: Date.now(),
      };

      // Add player to room
      room.addPlayer(player);
      room.setHost(player.id);

      // Store room
      this.rooms.set(roomId, room);
      this.roomCodeToId.set(roomCode, roomId);
      this.playerToRoom.set(socketId, roomId);

      console.log(`<� Room created: ${roomCode} (ID: ${roomId}) by ${request.playerName}`);

      return {
        success: true,
        roomCode: roomCode,
        roomId: roomId,
      };
    } catch (error) {
      console.error('Error creating room:', error);
      return {
        success: false,
        error: 'Failed to create room',
      };
    }
  }

  /**
   * Join an existing room
   */
  public joinRoom(request: JoinRoomRequest, socketId: string): JoinRoomResponse {
    try {
      const roomCode = request.roomCode.toUpperCase();
      const roomId = this.roomCodeToId.get(roomCode);

      if (!roomId) {
        return {
          success: false,
          error: 'Room not found',
        };
      }

      const room = this.rooms.get(roomId);
      if (!room) {
        return {
          success: false,
          error: 'Room not found',
        };
      }

      if (room.isFull()) {
        return {
          success: false,
          error: 'Room is full',
        };
      }

      if (room.getStatus() !== 'waiting') {
        return {
          success: false,
          error: 'Game already started',
        };
      }

      // Create player state
      const player: PlayerState = {
        id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        socketId: socketId,
        name: request.playerName,
        characterId: request.characterId,
        position: { x: 400, y: 500 },
        stats: this.getDefaultStats(),
        direction: 'down',
        isDodging: false,
        isAlive: true,
        lastUpdateTime: Date.now(),
      };

      // Add player to room
      room.addPlayer(player);
      this.playerToRoom.set(socketId, roomId);

      console.log(`=d ${request.playerName} joined room ${roomCode}`);

      return {
        success: true,
        roomId: roomId,
        players: room.getPlayers(),
      };
    } catch (error) {
      console.error('Error joining room:', error);
      return {
        success: false,
        error: 'Failed to join room',
      };
    }
  }

  /**
   * Leave room
   */
  public leaveRoom(socketId: string): void {
    const roomId = this.playerToRoom.get(socketId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    room.removePlayer(socketId);
    this.playerToRoom.delete(socketId);

    // If room is empty, clean it up
    if (room.isEmpty()) {
      this.roomCodeToId.delete(room.getCode());
      this.rooms.delete(roomId);
      console.log(`=�  Room ${room.getCode()} deleted (empty)`);
    }

    console.log(`=K Player left room ${roomId}`);
  }

  /**
   * Get room by socket ID
   */
  public getRoomBySocketId(socketId: string): GameRoom | undefined {
    const roomId = this.playerToRoom.get(socketId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  /**
   * Get room by room ID
   */
  public getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Get all rooms info
   */
  public getAllRoomsInfo(): RoomInfo[] {
    return Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      code: room.getCode(),
      hostName: room.getHostName(),
      playerCount: room.getPlayerCount(),
      maxPlayers: room.getMaxPlayers(),
      status: room.getStatus(),
    }));
  }

  /**
   * Get all active rooms (for game loop)
   */
  public getActiveRooms(): GameRoom[] {
    return Array.from(this.rooms.values()).filter(room => room.getStatus() === 'active');
  }

  /**
   * Get default player stats
   */
  private getDefaultStats() {
    return {
      level: 1,
      experience: 0,
      experienceToNextLevel: 100,
      statPoints: 0,
      maxHp: 100,
      currentHp: 100,
      maxMana: 100,
      currentMana: 100,
      attack: 10,
      defense: 5,
      defPen: 0,
      critDamage: 150,
      critRate: 10,
      attackSpeed: 1,
      damageBoost: 0,
    };
  }
}
