import { SkillEffect, PlayerBuff } from '@beruraid/shared';

export class ServerGutsSkills {
  private ownerId: string;
  private ownerName: string;

  // Skill A (Berserker Rage) properties
  private skill1Cooldown = 0;
  private skill1CooldownMax = 0.5; // 0.5 second cooldown
  private skill1HpCost = 0.2; // 20% of current HP
  private skill1Damage = 40;

  // Skill B (Beast of Darkness) properties
  private skill2Cooldown = 0;
  private skill2CooldownMax = 10; // 10 second cooldown
  private skill2ManaCost = 30;
  private skill2Duration = 5000; // 5 seconds invincibility
  private skill2StunChance = 0.5; // 50% chance to stun
  private skill2StunDuration = 5000; // 5 seconds stun

  // Ultimate (Berserker Armor) properties
  private ultiCooldown = 0;
  private ultiCooldownMax = 45; // 45 second cooldown
  private ultiManaCost = 50;
  private ultiDuration = 10000; // 10 seconds
  private ultiDamageMultiplier = 5; // 500% attack damage
  private ultiDpsMultiplierIncrement = 1.2; // Increases by 1.2 every 0.5s

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
    if (this.ultiCooldown > 0) {
      this.ultiCooldown = Math.max(0, this.ultiCooldown - deltaInSeconds);
    }
  }

  useSkill1(currentHp: number, maxHp: number, baseDef: number, isInvincible: boolean, playerX: number, playerY: number, time: number): {
    success: boolean;
    hpCost: number;
    damage: number;
    effect?: SkillEffect;
  } {
    const hpCost = isInvincible ? 0 : Math.floor(currentHp * this.skill1HpCost);

    // If invincible, no HP cost restriction. Otherwise, need at least 21% HP
    if (this.skill1Cooldown > 0) {
      return { success: false, hpCost: 0, damage: 0 };
    }

    if (!isInvincible && (currentHp <= hpCost || currentHp < maxHp * 0.21)) {
      return { success: false, hpCost: 0, damage: 0 };
    }

    // Set cooldown
    this.skill1Cooldown = this.skill1CooldownMax;

    // Calculate damage with DEF scaling
    const scaledDamage = this.skill1Damage * (1 + baseDef / 100);

    // Create skill effect
    const effect: SkillEffect = {
      id: `${this.ownerId}_guts_rage_${this.skillEffectCounter++}`,
      ownerId: this.ownerId,
      ownerName: this.ownerName,
      characterId: 'guts',
      skillType: 'skill1',
      effectType: 'guts_rage_aoe',
      x: playerX,
      y: playerY,
      radius: 40, // Start radius
      createdAt: time,
      expiresAt: time + 600, // 600ms duration
      damage: scaledDamage,
      data: {
        maxRadius: 120
      }
    };

    return {
      success: true,
      hpCost: hpCost,
      damage: scaledDamage,
      effect
    };
  }

  useSkill2(currentMana: number, time: number): {
    success: boolean;
    manaCost: number;
    stunBoss: boolean;
    buff?: PlayerBuff;
  } {
    if (this.skill2Cooldown > 0 || currentMana < this.skill2ManaCost) {
      return { success: false, manaCost: 0, stunBoss: false };
    }

    // Check for boss stun (50% chance)
    const stunSuccess = Math.random() < this.skill2StunChance;

    // Set cooldown
    this.skill2Cooldown = this.skill2CooldownMax;

    // Create buff (invincibility)
    const buff: PlayerBuff = {
      type: 'guts_beast',
      expiresAt: time + this.skill2Duration,
      data: {}
    };

    return {
      success: true,
      manaCost: this.skill2ManaCost,
      stunBoss: stunSuccess,
      buff
    };
  }

  useUltimate(currentMana: number, currentAtk: number, time: number): {
    success: boolean;
    manaCost: number;
    damage: number;
    buff?: PlayerBuff;
  } {
    if (this.ultiCooldown > 0 || currentMana < this.ultiManaCost) {
      return { success: false, manaCost: 0, damage: 0 };
    }

    // Calculate initial burst damage (500% of attack)
    const burstDamage = currentAtk * this.ultiDamageMultiplier;

    // Set cooldown
    this.ultiCooldown = this.ultiCooldownMax;

    // Create buff (damage multiplier)
    const buff: PlayerBuff = {
      type: 'guts_berserker',
      expiresAt: time + this.ultiDuration,
      data: {
        dpsMultiplierIncrement: this.ultiDpsMultiplierIncrement,
        dpsMultiplierInterval: 500 // Every 0.5 seconds
      }
    };

    return {
      success: true,
      manaCost: this.ultiManaCost,
      damage: burstDamage,
      buff
    };
  }

  getStunDuration(): number {
    return this.skill2StunDuration;
  }

  getCooldowns(): { skill1: number; skill2: number; ultimate: number } {
    return {
      skill1: this.skill1Cooldown / this.skill1CooldownMax,
      skill2: this.skill2Cooldown / this.skill2CooldownMax,
      ultimate: this.ultiCooldown / this.ultiCooldownMax
    };
  }
}
