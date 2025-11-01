/**
 * Network Message Types
 */

import type { Vector2 } from './entities.js';
import type { HunterClass } from './hunter.js';
import type { GameState } from './game.js';

// Client -> Server Events
export interface PlayerJoinData {
  name: string;
  class: HunterClass;
}

export interface PlayerInputData {
  keys: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  };
  mousePos?: Vector2;
  timestamp: number;
}

export interface PlayerSkillData {
  skillId: 'skill1' | 'skill2' | 'ultimate';
  targetPos?: Vector2;
  timestamp: number;
}

// Server -> Client Events
export interface PlayerJoinedData {
  playerId: string;
  timestamp: number;
}

export interface GameStateUpdate extends GameState {
  serverTimestamp: number;
}

export interface DamageEvent {
  sourceId: string;
  targetId: string;
  amount: number;
  isCritical: boolean;
  timestamp: number;
}

export interface GameEndData {
  victory: boolean;
  stats: {
    playerId: string;
    playerName: string;
    damageDealt: number;
    damageTaken: number;
    healingDone: number;
    deaths: number;
  }[];
  totalTeamDamage: number;
  duration: number;
}
