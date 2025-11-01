/**
 * Game State Types
 */

import type { Vector2, DamageableEntity } from './entities.js';
import type { HunterClass } from './hunter.js';

export interface Player extends DamageableEntity {
  name: string;
  class: HunterClass;
  mana: number;
  maxMana: number;
  isAlive: boolean;
}

export interface Boss extends DamageableEntity {
  phase: number;
  maxPhase: number;
  isBreakPhase: boolean;
}

export interface Projectile {
  id: string;
  position: Vector2;
  velocity: Vector2;
  damage: number;
  ownerId: string; // player or boss id
  type: 'player' | 'boss';
}

export interface GameState {
  tick: number;
  players: Player[];
  boss: Boss;
  projectiles: Projectile[];
  timeRemaining?: number; // in seconds
}

export enum GamePhase {
  LOBBY = 'lobby',
  STARTING = 'starting',
  ACTIVE = 'active',
  BOSS_BREAK = 'boss_break',
  VICTORY = 'victory',
  DEFEAT = 'defeat'
}
