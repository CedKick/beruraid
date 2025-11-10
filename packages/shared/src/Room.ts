import { PlayerState } from './Player';

export type GameMode = 'solo' | 'multiplayer';

export type RoomStatus = 'waiting' | 'starting' | 'active' | 'completed';

export interface RoomConfig {
  maxPlayers: number;
  minPlayers: number;
  startDelay: number; // milliseconds before game starts
}

export interface RoomState {
  id: string;
  code: string;
  hostId: string;
  status: RoomStatus;
  playerCount: number;
  maxPlayers: number;
  players: Map<string, PlayerState>;
  createdAt: number;
  startedAt?: number;
}

export interface RoomInfo {
  id: string;
  code: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  status: RoomStatus;
}

export interface CreateRoomRequest {
  playerName: string;
  characterId: string;
  maxPlayers: number;
}

export interface CreateRoomResponse {
  success: boolean;
  roomCode?: string;
  roomId?: string;
  error?: string;
}

export interface JoinRoomRequest {
  roomCode: string;
  playerName: string;
  characterId: string;
}

export interface JoinRoomResponse {
  success: boolean;
  roomId?: string;
  players?: PlayerState[];
  error?: string;
}
