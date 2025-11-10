export type ElementType = 'Fire' | 'Water' | 'Earth' | 'Wind' | 'Lightning';
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
    element: 'Fire',
    description: 'A powerful fire mage specializing in devastating area-of-effect spells.',
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
        name: 'Inferno Blast',
        description: 'Launches a massive fireball that explodes on impact, dealing massive AOE damage.',
        cooldown: 6000,
        manaCost: 50,
        damage: 60,
        element: 'Fire',
        aoe: true,
        radius: 120,
      },
      skill2: {
        id: 'flame_storm',
        name: 'Flame Storm',
        description: 'Summons a storm of flames around the caster, dealing continuous damage.',
        cooldown: 10000,
        manaCost: 70,
        damage: 80,
        element: 'Fire',
        aoe: true,
        radius: 200,
      },
    },
    passive: {
      name: 'Pyromaniac',
      description: 'Fire damage increased by 20%. Mana regeneration increased by 50%.',
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
    element: 'Fire',
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
        element: 'Fire',
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
        element: 'Fire',
        aoe: false,
      },
    },
    passive: {
      name: 'Dragonslayer',
      description: 'Critical hits deal 20% more damage. Each attack builds rage, increasing attack speed.',
    },
  },
};
