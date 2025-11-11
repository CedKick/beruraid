import { SkillEffect, PlayerBuff } from '@beruraid/shared';

export class ServerJuheeSkills {
  private ownerId: string;
  private ownerName: string;

  // Skill A (Healing Circle) properties
  private skill1Cooldown = 0;
  private skill1CooldownMax = 10; // 10 second cooldown
  private skill1ManaCost = 15;
  private skill1HealMin = 50;
  private skill1HealMax = 80;
  private skill1Radius = 120;

  // Skill E (Blessing of Courage) properties
  private skill2Cooldown = 0;
  private skill2CooldownMax = 15; // 15 second cooldown
  private skill2ManaCost = 30;
  private skill2Duration = 15000; // 15 seconds
  private skill2AtkBonus = 1.0; // +100% attack
  private skill2DefBonus = 0.5; // +50% defense
  private skill2AtkSpeedBonus = 0.3; // +30% attack speed
  private skill2Radius = 150;

  // Panic mode properties
  private panicChance = 0.1; // 10% chance to panic per skill use
  private panicDuration = 3000; // 3 seconds
  private panicCooldown = 0;

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
    if (this.panicCooldown > 0) {
      this.panicCooldown = Math.max(0, this.panicCooldown - deltaInSeconds);
    }
    if (this.rightClickCooldown > 0) {
      this.rightClickCooldown = Math.max(0, this.rightClickCooldown - deltaInSeconds);
    }
  }

  useSkill1(currentMana: number, maxHp: number, playerX: number, playerY: number, time: number): {
    success: boolean;
    manaCost: number;
    effect?: SkillEffect;
    panicTriggered: boolean;
    panicBuff?: PlayerBuff;
  } {
    if (this.skill1Cooldown > 0 || currentMana < this.skill1ManaCost) {
      return { success: false, manaCost: 0, panicTriggered: false };
    }

    // Set cooldown
    this.skill1Cooldown = this.skill1CooldownMax;

    // Random heal amount with HP scaling
    const baseHealAmount = Math.floor(Math.random() * (this.skill1HealMax - this.skill1HealMin + 1)) + this.skill1HealMin;
    const healAmount = Math.floor(baseHealAmount * (1 + maxHp / 1000));

    // Create heal effect
    const effect: SkillEffect = {
      id: `${this.ownerId}_juhee_heal_${this.skillEffectCounter++}`,
      ownerId: this.ownerId,
      ownerName: this.ownerName,
      characterId: 'juhee',
      skillType: 'skill1',
      effectType: 'juhee_healing_circle',
      x: playerX,
      y: playerY,
      radius: this.skill1Radius,
      createdAt: time,
      expiresAt: time + 500, // 500ms duration
      damage: -healAmount, // Negative damage = heal
      data: {
        healAmount: healAmount
      }
    };

    // Check for panic
    const panicTriggered = Math.random() < this.panicChance && this.panicCooldown === 0;
    let panicBuff: PlayerBuff | undefined;

    if (panicTriggered) {
      this.panicCooldown = this.panicDuration / 1000;
      const panicType = Math.random() < 0.5 ? 'freeze' : 'reverse'; // 50/50 freeze or reverse

      panicBuff = {
        type: panicType === 'freeze' ? 'juhee_panic_freeze' : 'juhee_panic_reverse',
        expiresAt: time + this.panicDuration,
        data: {
          panicType: panicType
        }
      };
    }

    return {
      success: true,
      manaCost: this.skill1ManaCost,
      effect: effect,
      panicTriggered: panicTriggered,
      panicBuff: panicBuff
    };
  }

  useSkill2(currentMana: number, playerX: number, playerY: number, time: number): {
    success: boolean;
    manaCost: number;
    effect?: SkillEffect;
    panicTriggered: boolean;
    panicBuff?: PlayerBuff;
  } {
    if (this.skill2Cooldown > 0 || currentMana < this.skill2ManaCost) {
      return { success: false, manaCost: 0, panicTriggered: false };
    }

    // Set cooldown
    this.skill2Cooldown = this.skill2CooldownMax;

    // Create buff effect (will be applied to nearby allies)
    const effect: SkillEffect = {
      id: `${this.ownerId}_juhee_blessing_${this.skillEffectCounter++}`,
      ownerId: this.ownerId,
      ownerName: this.ownerName,
      characterId: 'juhee',
      skillType: 'skill2',
      effectType: 'juhee_blessing',
      x: playerX,
      y: playerY,
      radius: this.skill2Radius,
      createdAt: time,
      expiresAt: time + 500, // 500ms to apply buff
      damage: 0,
      data: {
        atkBonus: this.skill2AtkBonus,
        defBonus: this.skill2DefBonus,
        atkSpeedBonus: this.skill2AtkSpeedBonus,
        duration: this.skill2Duration
      }
    };

    // Check for panic
    const panicTriggered = Math.random() < this.panicChance && this.panicCooldown === 0;
    let panicBuff: PlayerBuff | undefined;

    if (panicTriggered) {
      this.panicCooldown = this.panicDuration / 1000;
      const panicType = Math.random() < 0.5 ? 'freeze' : 'reverse';

      panicBuff = {
        type: panicType === 'freeze' ? 'juhee_panic_freeze' : 'juhee_panic_reverse',
        expiresAt: time + this.panicDuration,
        data: {
          panicType: panicType
        }
      };
    }

    return {
      success: true,
      manaCost: this.skill2ManaCost,
      effect: effect,
      panicTriggered: panicTriggered,
      panicBuff: panicBuff
    };
  }

  // Right-click properties
  private rightClickCooldown = 0;
  private rightClickCooldownMax = 1; // 1 second cooldown

  // Right-click heal (targeted heal that can heal allies OR damage boss)
  useRightClickHeal(currentMana: number, maxHp: number, playerX: number, playerY: number, targetX: number, targetY: number, time: number): {
    success: boolean;
    manaCost: number;
    effect?: SkillEffect;
  } {
    // Check cooldown
    if (this.rightClickCooldown > 0) {
      return { success: false, manaCost: 0 };
    }

    // No mana cost for right-click heal
    const manaCost = 0;

    if (currentMana < manaCost) {
      return { success: false, manaCost: 0 };
    }

    // Set cooldown
    this.rightClickCooldown = this.rightClickCooldownMax;

    // Scale heal and damage with HP
    const healAmount = Math.floor(30 * (1 + maxHp / 1000)); // Heal amount for allies
    const bossAmount = Math.floor(30 * (1 + maxHp / 1000)); // Damage amount for boss

    // Create projectile heal/damage effect
    const effect: SkillEffect = {
      id: `${this.ownerId}_juhee_heal_proj_${this.skillEffectCounter++}`,
      ownerId: this.ownerId,
      ownerName: this.ownerName,
      characterId: 'juhee',
      skillType: 'rightclick',
      effectType: 'juhee_heal_projectile',
      x: playerX,
      y: playerY,
      radius: 20,
      createdAt: time,
      expiresAt: time + 5000, // 5 seconds max travel time
      damage: bossAmount, // Positive for damage on boss, will heal allies
      data: {
        targetX: targetX,
        targetY: targetY,
        speed: 400, // pixels per second
        healAmount: healAmount,
        bossAmount: bossAmount
      }
    };

    return {
      success: true,
      manaCost: manaCost,
      effect: effect
    };
  }

  // Check if can resurrect Sung
  canResurrectSung(sungDeathTime: number, currentTime: number): boolean {
    return (currentTime - sungDeathTime) <= 5000; // Within 5 seconds
  }

  getCooldowns(): { skill1: number; skill2: number } {
    return {
      skill1: this.skill1Cooldown / this.skill1CooldownMax,
      skill2: this.skill2Cooldown / this.skill2CooldownMax
    };
  }
}
