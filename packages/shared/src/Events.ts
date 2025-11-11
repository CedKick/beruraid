import { PlayerState, PlayerInput } from './Player';
import { CreateRoomRequest, CreateRoomResponse, JoinRoomRequest, JoinRoomResponse } from './Room';
import { GameState, DamageEvent, SkillEvent, PlayerDeathEvent, BossDefeatEvent } from './Game';

// Socket.io event types (client -> server)
export interface ClientToServerEvents {
  // Room management
  'room:create': (data: CreateRoomRequest, callback: (response: CreateRoomResponse) => void) => void;
  'room:join': (data: JoinRoomRequest, callback: (response: JoinRoomResponse) => void) => void;
  'room:leave': () => void;
  'room:start': () => void;
  'room:kick': (data: { targetSocketId: string }, callback: (response: { success: boolean; error?: string }) => void) => void;

  // Game actions
  'game:input': (input: PlayerInput) => void;
  'game:movement': (input: { up: boolean; down: boolean; left: boolean; right: boolean }) => void;
  'game:dodge': () => void;
  'game:attack': (data: { type: 'melee' | 'ranged'; targetX: number; targetY: number }) => void;
  'game:skill': (data: { skillId: number; targetX?: number; targetY?: number }) => void;
  'game:rightclick': (data: { targetX: number; targetY: number }) => void;
  'game:damage': (damage: DamageEvent) => void;

  // Player status
  'player:ready': () => void;
  'player:update': (state: Partial<PlayerState>) => void;
}

// Socket.io event types (server -> client)
export interface ServerToClientEvents {
  // Room events
  'room:created': (data: { roomId: string; roomCode: string }) => void;
  'room:joined': (data: { roomId: string; players: PlayerState[] }) => void;
  'room:playerJoined': (player: PlayerState) => void;
  'room:playerLeft': (data: { playerId: string }) => void;
  'room:kicked': () => void;
  'room:starting': (data: { countdown: number }) => void;
  'room:started': () => void;
  
  // Game state synchronization
  'game:stateUpdate': (state: GameState) => void;
  'game:playerUpdate': (player: PlayerState) => void;
  'game:bossUpdate': (boss: Partial<GameState['boss']>) => void;
  
  // Game events
  'game:damage': (damage: DamageEvent) => void;
  'game:skill': (skill: SkillEvent) => void;
  'game:playerDeath': (event: PlayerDeathEvent) => void;
  'game:bossDefeat': (event: BossDefeatEvent) => void;
  'game:completed': (data: { winner: 'players' | 'boss'; stats: any }) => void;
  
  // Errors
  'error': (data: { message: string; code?: string }) => void;
}

// Combined event types for Socket.io typing
export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  playerId?: string;
  playerName?: string;
  roomId?: string;
}
