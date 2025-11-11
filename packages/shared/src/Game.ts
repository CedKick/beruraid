import { PlayerState } from './Player';

export interface BossAttack {
  id: string;
  type: 'laser' | 'aoe' | 'expandingCircle';
  damage: number;
  x: number;
  y: number;
  angle?: number;
  radius?: number;
  width?: number;
  height?: number;
  active: boolean;
  spawnTime: number;
  expiresAt: number;
}

export interface Projectile {
  id: string;
  ownerId: string;
  type: 'melee' | 'ranged';
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  damage: number;
  createdAt: number;
  expiresAt: number;
  radius: number;
  angle?: number;
}

export interface SkillEffect {
  id: string;
  ownerId: string;
  ownerName: string;
  characterId: string;
  skillType: 'skill1' | 'skill2' | 'ultimate';
  effectType:
    | 'fern_fire_aoe'        // Fern Skill A
    | 'fern_zoltraak'        // Fern Skill E
    | 'stark_stun_aoe'       // Stark Skill A
    | 'stark_shield'         // Stark Skill E (buff)
    | 'guts_rage_aoe'        // Guts Skill A
    | 'guts_beast_aura'      // Guts Skill B (buff)
    | 'guts_berserker_armor'; // Guts Ultimate (buff)
  x: number;
  y: number;
  radius?: number;
  angle?: number;
  velocityX?: number;
  velocityY?: number;
  createdAt: number;
  expiresAt: number;
  damage?: number;
  data?: any; // For skill-specific data (stacks, multipliers, etc.)
}

export interface PlayerBuff {
  type: 'stark_shield' | 'guts_beast' | 'guts_berserker';
  expiresAt: number;
  data?: any;
}

export interface BossState {
  hp: number;
  maxHp: number;
  nextBarMaxHp: number; // HP of the next bar (for UI display)
  position: {
    x: number;
    y: number;
  };
  rageCount: number;
  barsDefeated: number;
  isStunned: boolean;
  stunEndTime: number;
  totalDamageDealt: number;
  attacks?: BossAttack[];
  velocityX?: number;
  velocityY?: number;
}

export interface GameState {
  roomId: string;
  players: PlayerState[];
  boss: BossState;
  projectiles: Projectile[];
  skillEffects: SkillEffect[];
  startTime: number;
  elapsedTime: number;
  remainingTime: number;
  isActive: boolean;
  isCompleted: boolean;
  winner?: 'players' | 'boss';
}

export interface DamageEvent {
  playerId: string;
  targetType: 'boss' | 'player';
  targetId?: string; // For player damage
  damage: number;
  isCrit: boolean;
  skillId?: string;
  timestamp: number;
}

export interface SkillEvent {
  playerId: string;
  skillId: string;
  skillType: 'skill1' | 'skill2' | 'ultimate';
  position?: {
    x: number;
    y: number;
  };
  targetPosition?: {
    x: number;
    y: number;
  };
  timestamp: number;
}

export interface PlayerDeathEvent {
  playerId: string;
  timestamp: number;
}

export interface BossDefeatEvent {
  timestamp: number;
  totalTime: number;
  players: {
    id: string;
    name: string;
    damage: number;
  }[];
}
