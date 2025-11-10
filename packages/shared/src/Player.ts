export interface PlayerPosition {
  x: number;
  y: number;
}

export interface PlayerStats {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  statPoints: number;
  maxHp: number;
  currentHp: number;
  maxMana: number;
  currentMana: number;
  attack: number;
  defense: number;
  defPen: number;
  critDamage: number;
  critRate: number;
  attackSpeed: number;
  damageBoost: number;
}

export interface PlayerState {
  id: string;
  socketId: string;
  name: string;
  characterId: string;
  position: PlayerPosition;
  stats: PlayerStats;
  direction: 'up' | 'down' | 'left' | 'right';
  isDodging: boolean;
  isAlive: boolean;
  isReady: boolean;
  lastUpdateTime: number;
}

export interface PlayerInput {
  playerId: string;
  timestamp: number;
  movement: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  };
  actions: {
    dodge: boolean;
    skill1: boolean;
    skill2: boolean;
    ultimate?: boolean;
  };
  mousePosition?: {
    x: number;
    y: number;
  };
}
