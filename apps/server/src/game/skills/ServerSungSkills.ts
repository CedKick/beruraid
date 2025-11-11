import { SkillEffect, PlayerBuff } from '@beruraid/shared';

export class ServerSungSkills {
  private ownerId: string;
  private ownerName: string;

  // Skill A (Barrage Strike) properties
  private skill1Cooldown = 0;
  private skill1CooldownMax = 1; // 1 second cooldown
  private skill1ManaCost = 7;
  private skill1DamageMultiplier = 2; // 200% of base attack
  private skill1CritBonus = 15; // +15% crit rate per stack
  private skill1BuffDuration = 20000; // 20 seconds
  private skill1MaxStacks = 10;
  private skill1SlowChance = 0.33; // 33% chance to slow

  // Skill B (Death Gamble) properties
  private skill2Cooldown = 0;
  private skill2CooldownMax = 12; // 12 second cooldown
  private skill2ManaCost = 19;
  private skill2Duration = 5000; // 5 seconds

  // Passive properties
  private passiveCooldown = 0;
  private passiveCooldownMax = 15; // 15 second cooldown
  private passiveHpThreshold = 0.3; // Below 30% HP
  private passiveAtkBonus = 0.5; // +50% attack

  // Death tracking for resurrection
  private timeOfDeath: number = 0;
  private isDead: boolean = false;

  private skillEffectCounter = 0;

  constructor(ownerId: string, ownerName: string) {
    this.ownerId = ownerId;
    this.ownerName = ownerName;
  }

  update(delta: number): void {
    // Update cooldowns
    const deltaInSeconds = delta / 1000;
    if (this.skill1Cooldown > 0) {
      this.skill1Cooldown = Math.max(0, this.skill1Cooldown - deltaInSeconds);
    }
    if (this.skill2Cooldown > 0) {
      this.skill2Cooldown = Math.max(0, this.skill2Cooldown - deltaInSeconds);
    }
    if (this.passiveCooldown > 0) {
      this.passiveCooldown = Math.max(0, this.passiveCooldown - deltaInSeconds);
    }
  }

  useSkill1(currentMana: number, baseAtk: number, playerX: number, playerY: number, targetX: number, targetY: number, time: number): {
    success: boolean;
    manaCost: number;
    damage: number;
    effect?: SkillEffect;
    buff?: PlayerBuff;
    slowTarget: boolean;
  } {
    if (this.skill1Cooldown > 0 || currentMana < this.skill1ManaCost) {
      return { success: false, manaCost: 0, damage: 0, slowTarget: false };
    }

    // Set cooldown
    this.skill1Cooldown = this.skill1CooldownMax;

    // Calculate damage
    const damage = baseAtk * this.skill1DamageMultiplier;

    // Check for slow
    const slowTarget = Math.random() < this.skill1SlowChance;

    // Calculate angle to target
    const angle = Math.atan2(targetY - playerY, targetX - playerX);
    const distance = 60;

    // Create skill effect (projectile towards target)
    const effect: SkillEffect = {
      id: `${this.ownerId}_sung_barrage_${this.skillEffectCounter++}`,
      ownerId: this.ownerId,
      ownerName: this.ownerName,
      characterId: 'sung',
      skillType: 'skill1',
      effectType: 'sung_barrage_strike',
      x: playerX + Math.cos(angle) * distance,
      y: playerY + Math.sin(angle) * distance,
      radius: 40,
      createdAt: time,
      expiresAt: time + 300, // 300ms visual effect
      damage: damage,
      data: {
        angle: angle,
        slowTarget: slowTarget
      }
    };

    // Create crit buff (stackable)
    const buff: PlayerBuff = {
      type: 'sung_barrage_crit',
      expiresAt: time + this.skill1BuffDuration,
      data: {
        critBonus: this.skill1CritBonus,
        maxStacks: this.skill1MaxStacks
      }
    };

    return {
      success: true,
      manaCost: this.skill1ManaCost,
      damage: damage,
      effect: effect,
      buff: buff,
      slowTarget: slowTarget
    };
  }

  useSkill2(currentMana: number, playerX: number, playerY: number, time: number): {
    success: boolean;
    manaCost: number;
    buff?: PlayerBuff;
    effect?: SkillEffect;
    isBlue: boolean;
  } {
    if (this.skill2Cooldown > 0 || currentMana < this.skill2ManaCost) {
      return { success: false, manaCost: 0, isBlue: false };
    }

    // Set cooldown
    this.skill2Cooldown = this.skill2CooldownMax;

    // Random circle color (50/50)
    const isBlue = Math.random() < 0.5;

    // Create buff based on color
    const buff: PlayerBuff = {
      type: isBlue ? 'sung_death_gamble_blue' : 'sung_death_gamble_red',
      expiresAt: time + this.skill2Duration,
      data: {
        atkMultiplier: isBlue ? 3 : 6, // Blue: +300%, Red: +600%
        isInvincible: isBlue,
        damageTakenMultiplier: isBlue ? 1 : 1.6 // Red: +60% damage taken
      }
    };

    // Create visual effect
    const effect: SkillEffect = {
      id: `${this.ownerId}_sung_death_gamble_${this.skillEffectCounter++}`,
      ownerId: this.ownerId,
      ownerName: this.ownerName,
      characterId: 'sung',
      skillType: 'skill2',
      effectType: 'sung_death_gamble',
      x: playerX,
      y: playerY,
      radius: 80,
      createdAt: time,
      expiresAt: time + this.skill2Duration, // 5 seconds
      damage: 0,
      data: {
        isBlue: isBlue
      }
    };

    return {
      success: true,
      manaCost: this.skill2ManaCost,
      buff: buff,
      effect: effect,
      isBlue: isBlue
    };
  }

  // Check and apply passive (called when HP drops below 30%)
  checkPassive(currentHp: number, maxHp: number, time: number): {
    shouldApply: boolean;
    buff?: PlayerBuff;
  } {
    const hpPercentage = currentHp / maxHp;

    if (hpPercentage < this.passiveHpThreshold && this.passiveCooldown === 0) {
      // Apply passive buff
      this.passiveCooldown = this.passiveCooldownMax;

      const buff: PlayerBuff = {
        type: 'sung_desperate_resolve',
        expiresAt: Number.MAX_SAFE_INTEGER, // Permanent until removed
        data: {
          atkBonus: this.passiveAtkBonus
        }
      };

      return {
        shouldApply: true,
        buff: buff
      };
    }

    return { shouldApply: false };
  }

  // Mark player as dead for resurrection tracking
  markDead(time: number): void {
    this.isDead = true;
    this.timeOfDeath = time;
  }

  // Check if resurrection is still possible
  canBeResurrected(time: number): boolean {
    if (!this.isDead) return false;
    return (time - this.timeOfDeath) <= 5000; // Within 5 seconds
  }

  // Reset death status
  resurrect(): void {
    this.isDead = false;
    this.timeOfDeath = 0;
  }

  getCooldowns(): { skill1: number; skill2: number } {
    return {
      skill1: this.skill1Cooldown / this.skill1CooldownMax,
      skill2: this.skill2Cooldown / this.skill2CooldownMax
    };
  }
}
