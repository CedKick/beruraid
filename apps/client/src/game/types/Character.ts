export type ElementType = 'Fire' | 'Water' | 'Wind' | 'Light' | 'Dark';
export type CharacterRole = 'Tank' | 'DPS' | 'Support' | 'Mage';

export interface CharacterStats {
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseMana: number;
  baseManaRegen: number;
  baseAtkSpeed: number;
  baseCritRate: number;
  baseCritDmg: number;
  baseDefPen: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  manaCost: number;
  damage?: number;
  element: ElementType;
  aoe?: boolean;
  radius?: number;
}

export interface CharacterClass {
  id: string;
  name: string;
  role: CharacterRole;
  element: ElementType;
  description: string;
  stats: CharacterStats;
  skills: {
    skill1: Skill;
    skill2: Skill;
  };
  passive: {
    name: string;
    description: string;
  };
  sprite?: string;
}

export const CHARACTERS: Record<string, CharacterClass> = {
  stark: {
    id: 'stark',
    name: 'Stark',
    role: 'Tank',
    element: 'Fire',
    description: 'A powerful tank warrior who protects allies with fire-based defensive abilities.',
    stats: {
      baseHp: 250,
      baseAtk: 12,
      baseDef: 20,
      baseMana: 100,
      baseManaRegen: 1.5,
      baseAtkSpeed: 1.0,
      baseCritRate: 10,
      baseCritDmg: 150,
      baseDefPen: 5,
    },
    skills: {
      skill1: {
        id: 'flame_shield',
        name: 'Flame Shield',
        description: 'Creates a protective shield that absorbs damage and burns nearby enemies.',
        cooldown: 8000,
        manaCost: 30,
        damage: 20,
        element: 'Fire',
        aoe: true,
        radius: 100,
      },
      skill2: {
        id: 'fire_taunt',
        name: 'Fire Taunt',
        description: 'Releases a wave of fire that attracts enemy attention and deals damage.',
        cooldown: 12000,
        manaCost: 40,
        damage: 35,
        element: 'Fire',
        aoe: true,
        radius: 150,
      },
    },
    passive: {
      name: 'Burning Resolve',
      description: 'Regenerates 2% HP per second when below 50% HP.',
    },
  },
  fern: {
    id: 'fern',
    name: 'Fern',
    role: 'Mage',
    element: 'Light',
    description: 'A powerful light mage specializing in devastating area-of-effect spells.',
    stats: {
      baseHp: 100,
      baseAtk: 25,
      baseDef: 8,
      baseMana: 150,
      baseManaRegen: 2.5,
      baseAtkSpeed: 0.8,
      baseCritRate: 15,
      baseCritDmg: 200,
      baseDefPen: 15,
    },
    skills: {
      skill1: {
        id: 'inferno_blast',
        name: 'Light Blast',
        description: 'Launches a massive light orb that explodes on impact, dealing massive AOE damage.',
        cooldown: 6000,
        manaCost: 50,
        damage: 60,
        element: 'Light',
        aoe: true,
        radius: 120,
      },
      skill2: {
        id: 'flame_storm',
        name: 'Light Storm',
        description: 'Summons a storm of light around the caster, dealing continuous damage.',
        cooldown: 10000,
        manaCost: 70,
        damage: 80,
        element: 'Light',
        aoe: true,
        radius: 200,
      },
    },
    passive: {
      name: 'Light Bearer',
      description: 'Light damage increased by 20%. Mana regeneration increased by 50%.',
    },
  },
  frieren: {
    id: 'frieren',
    name: 'Frieren',
    role: 'Support',
    element: 'Water',
    description: 'A support mage who heals allies and controls the battlefield with water magic.',
    stats: {
      baseHp: 120,
      baseAtk: 15,
      baseDef: 12,
      baseMana: 180,
      baseManaRegen: 3.0,
      baseAtkSpeed: 0.9,
      baseCritRate: 12,
      baseCritDmg: 150,
      baseDefPen: 10,
    },
    skills: {
      skill1: {
        id: 'healing_wave',
        name: 'Healing Wave',
        description: 'Releases a wave of healing water that restores HP to all allies in range.',
        cooldown: 7000,
        manaCost: 60,
        damage: 0, // This is a heal
        element: 'Water',
        aoe: true,
        radius: 150,
      },
      skill2: {
        id: 'water_prison',
        name: 'Water Prison',
        description: 'Traps the enemy in water, dealing damage and slowing their movement.',
        cooldown: 9000,
        manaCost: 50,
        damage: 40,
        element: 'Water',
        aoe: false,
      },
    },
    passive: {
      name: 'Mana Flow',
      description: 'Allies near Frieren regenerate 50% more mana. Healing effectiveness increased by 25%.',
    },
  },
  guts: {
    id: 'guts',
    name: 'Guts',
    role: 'DPS',
    element: 'Dark',
    description: 'The Black Swordsman. A berserker warrior who sacrifices his own life force for devastating power.',
    stats: {
      baseHp: 180,
      baseAtk: 30,
      baseDef: 15,
      baseMana: 120,
      baseManaRegen: 2.0,
      baseAtkSpeed: 1.2,
      baseCritRate: 20,
      baseCritDmg: 220,
      baseDefPen: 20,
    },
    skills: {
      skill1: {
        id: 'berserker_rage',
        name: 'Berserker Rage',
        description: 'Unleashes a devastating AOE attack around Guts. Costs 20% of current HP.',
        cooldown: 500,
        manaCost: 0,
        damage: 40,
        element: 'Dark',
        aoe: true,
        radius: 120,
      },
      skill2: {
        id: 'beast_of_darkness',
        name: 'Beast of Darkness',
        description: 'Becomes invincible for 5 seconds. 50% chance to stun the boss for 5 seconds.',
        cooldown: 10000,
        manaCost: 30,
        damage: 0,
        element: 'Dark',
        aoe: false,
      },
    },
    passive: {
      name: 'Dragonslayer',
      description: 'Critical hits deal 20% more damage. Each attack builds rage, increasing attack speed.',
    },
  },
  sung: {
    id: 'sung',
    name: 'Sung Jin-Woo (Rank E)',
    role: 'DPS',
    element: 'Dark',
    description: 'The weakest hunter who will rise. Stacks buffs infinitely and can resurrect with aid.',
    stats: {
      baseHp: 150,
      baseAtk: 18,
      baseDef: 10,
      baseMana: 100,
      baseManaRegen: 1.8,
      baseAtkSpeed: 1.1,
      baseCritRate: 12,
      baseCritDmg: 180,
      baseDefPen: 10,
    },
    skills: {
      skill1: {
        id: 'barrage_strike',
        name: 'Barrage Strike',
        description: 'Deals 200% damage, +15% crit for 20s (stacks 10x). 33% slow chance. CD: 1s, Mana: 7',
        cooldown: 1000,
        manaCost: 7,
        damage: 36, // 18 * 2
        element: 'Dark',
        aoe: false,
      },
      skill2: {
        id: 'death_gamble',
        name: 'Death Gamble',
        description: 'Blue: +300% ATK invincible 5s. Red: +600% ATK +60% DMG taken 5s. CD: 12s, Mana: 19',
        cooldown: 12000,
        manaCost: 19,
        damage: 0,
        element: 'Dark',
        aoe: true,
        radius: 80,
      },
    },
    passive: {
      name: 'Desperate Resolve & Phoenix Down',
      description: 'Below 30% HP: +50% ATK (stacks infinitely, CD 15s). If dead, Juhee heal resurrects within 5s.',
    },
  },
  juhee: {
    id: 'juhee',
    name: 'Juhee',
    role: 'Support',
    element: 'Light',
    description: 'A dedicated healer who can resurrect Sung, but may lose control under pressure.',
    stats: {
      baseHp: 110,
      baseAtk: 8,
      baseDef: 8,
      baseMana: 200,
      baseManaRegen: 3.5,
      baseAtkSpeed: 0.8,
      baseCritRate: 8,
      baseCritDmg: 140,
      baseDefPen: 5,
    },
    skills: {
      skill1: {
        id: 'healing_circle',
        name: 'Healing Circle',
        description: 'Zone heal restoring 50-80 HP to allies. CD: 10s, Mana: 15',
        cooldown: 10000,
        manaCost: 15,
        damage: 0,
        element: 'Light',
        aoe: true,
        radius: 120,
      },
      skill2: {
        id: 'blessing_of_courage',
        name: 'Blessing of Courage',
        description: 'Buffs +100% ATK, +50% DEF, +30% ATK Speed for 15s. CD: 15s, Mana: 30',
        cooldown: 15000,
        manaCost: 30,
        damage: 0,
        element: 'Light',
        aoe: true,
        radius: 150,
      },
    },
    passive: {
      name: 'Resurrect Sung & Panic Mode',
      description: 'Can resurrect Sung if healed within 5s of death. May panic: freeze or reverse controls randomly.',
    },
  },
};
