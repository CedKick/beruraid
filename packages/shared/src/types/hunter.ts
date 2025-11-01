/**
 * Hunter (Player Character) Types
 */

export enum HunterClass {
  // Phase 1 - Initial Hunters
  WARRIOR = 'warrior',
  MAGE = 'mage',
  ASSASSIN = 'assassin',

  // Future hunters will be added here
  // TANK = 'tank',
  // SUPPORT = 'support',
  // RANGER = 'ranger',
}

export enum HunterRole {
  DPS = 'dps',
  TANK = 'tank',
  SUPPORT = 'support',
  BREAKER = 'breaker'
}

export interface HunterStats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  atk: number;
  def: number;
  speed: number;
}

export interface HunterSkill {
  id: string;
  name: string;
  description: string;
  manaCost: number;
  cooldown: number; // in milliseconds
  damage?: number;
  range?: number;
  aoeRadius?: number;
}

export interface HunterConfig {
  class: HunterClass;
  name: string;
  role: HunterRole;
  description: string;
  baseStats: HunterStats;
  skills: {
    skill1: HunterSkill;
    skill2: HunterSkill;
    ultimate: HunterSkill;
  };
  passive?: {
    name: string;
    description: string;
  };
}
