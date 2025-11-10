export interface PlayerStats {
  // Core stats
  level: number;
  experience: number;
  experienceToNextLevel: number;
  statPoints: number;

  // Combat stats
  maxHp: number;
  currentHp: number;
  maxMana: number;
  currentMana: number;
  attack: number;
  defense: number;
  defPen: number; // Defense Penetration
  critDamage: number; // % bonus damage on crit
  critRate: number; // % chance to crit
  attackSpeed: number; // attacks per second
  damageBoost: number; // % bonus to all damage
}

export class StatsManager {
  private stats: PlayerStats;
  private baseStats: PlayerStats;

  constructor() {
    // Initialize with base stats
    this.baseStats = {
      level: 1,
      experience: 0,
      experienceToNextLevel: 100,
      statPoints: 0,

      maxHp: 100,
      currentHp: 100,
      maxMana: 50,
      currentMana: 50,
      attack: 10,
      defense: 5,
      defPen: 0,
      critDamage: 150, // 150% = 1.5x damage
      critRate: 5, // 5%
      attackSpeed: 1, // 1 attack per second
      damageBoost: 0, // 0%
    };

    this.stats = { ...this.baseStats };
  }

  getStats(): PlayerStats {
    return { ...this.stats };
  }

  // Add stat points
  addStatPoint(stat: keyof PlayerStats, amount: number = 1): boolean {
    if (this.stats.statPoints <= 0) return false;

    switch (stat) {
      case 'maxHp':
        this.stats.maxHp += 10 * amount;
        this.stats.statPoints -= amount;
        break;
      case 'maxMana':
        this.stats.maxMana += 5 * amount;
        this.stats.statPoints -= amount;
        break;
      case 'attack':
        this.stats.attack += 2 * amount;
        this.stats.statPoints -= amount;
        break;
      case 'defense':
        this.stats.defense += 1 * amount;
        this.stats.statPoints -= amount;
        break;
      case 'defPen':
        this.stats.defPen += 1 * amount;
        this.stats.statPoints -= amount;
        break;
      case 'critDamage':
        this.stats.critDamage += 5 * amount; // +5% per point
        this.stats.statPoints -= amount;
        break;
      case 'critRate':
        this.stats.critRate += 1 * amount; // +1% per point
        this.stats.statPoints -= amount;
        break;
      case 'attackSpeed':
        this.stats.attackSpeed += 0.05 * amount; // +0.05 attacks/sec per point
        this.stats.statPoints -= amount;
        break;
      case 'damageBoost':
        this.stats.damageBoost += 2 * amount; // +2% per point
        this.stats.statPoints -= amount;
        break;
      default:
        return false;
    }

    return true;
  }

  // Gain experience
  gainExperience(amount: number): boolean {
    this.stats.experience += amount;

    // Check for level up
    if (this.stats.experience >= this.stats.experienceToNextLevel) {
      return this.levelUp();
    }

    return false;
  }

  private levelUp(): boolean {
    this.stats.level++;
    this.stats.experience -= this.stats.experienceToNextLevel;
    this.stats.experienceToNextLevel = Math.floor(
      this.stats.experienceToNextLevel * 1.5
    );

    // Grant stat points
    this.stats.statPoints += 5;

    // Increase base stats slightly
    this.stats.maxHp += 5;
    this.stats.currentHp = this.stats.maxHp; // Full heal on level up
    this.stats.maxMana += 5;
    this.stats.currentMana = this.stats.maxMana;

    return true;
  }

  // Calculate actual damage with all modifiers
  calculateDamage(baseDamage: number): number {
    let damage = baseDamage + this.stats.attack;

    // Apply damage boost
    damage *= 1 + this.stats.damageBoost / 100;

    // Check for critical hit
    if (Math.random() * 100 < this.stats.critRate) {
      damage *= this.stats.critDamage / 100;
    }

    return Math.floor(damage);
  }

  // Calculate damage received with defense
  calculateDamageTaken(incomingDamage: number, attackerDefPen: number = 0): number {
    const effectiveDefense = Math.max(0, this.stats.defense - attackerDefPen);
    const damageReduction = effectiveDefense / (effectiveDefense + 100);
    const finalDamage = incomingDamage * (1 - damageReduction);

    return Math.max(1, Math.floor(finalDamage));
  }

  takeDamage(amount: number): void {
    this.stats.currentHp = Math.max(0, this.stats.currentHp - amount);
  }

  heal(amount: number): void {
    this.stats.currentHp = Math.min(
      this.stats.maxHp,
      this.stats.currentHp + amount
    );
  }

  useMana(amount: number): boolean {
    if (this.stats.currentMana >= amount) {
      this.stats.currentMana -= amount;
      return true;
    }
    return false;
  }

  regenerateMana(amount: number): void {
    this.stats.currentMana = Math.min(
      this.stats.maxMana,
      this.stats.currentMana + amount
    );
  }

  isAlive(): boolean {
    return this.stats.currentHp > 0;
  }

  resetStats(): void {
    this.stats = { ...this.baseStats };
  }
}
