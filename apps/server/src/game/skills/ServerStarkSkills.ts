import { SkillEffect, PlayerBuff } from '@beruraid/shared';

export class ServerStarkSkills {
  private ownerId: string;
  private ownerName: string;

  // Skill A (Stun AOE) properties
  private skill1Cooldown = 0;
  private skill1CooldownMax = 15; // 15 second cooldown
  private skill1ManaCost = 10;
  private skill1Range = 120; // Melee range for stun
  private skill1Damage = 50;
  private skill1StunDuration = 2000; // 2 seconds

  // Skill E (Damage absorption shield) properties
  private skill2Cooldown = 0;
  private skill2CooldownMax = 30; // 30 second cooldown
  private skill2ManaCost = 20;
  private skill2Duration = 4000; // 4 seconds
  private skill2DamageReduction = 0.9; // Reduces damage to 10%

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
  }

  useSkill1(currentMana: number, baseDef: number, playerX: number, playerY: number, bossX: number, bossY: number, time: number): {
    success: boolean;
    manaCost: number;
    damage: number;
    stunBoss: boolean;
    effect?: SkillEffect;
  } {
    if (this.skill1Cooldown > 0 || currentMana < this.skill1ManaCost) {
      return { success: false, manaCost: 0, damage: 0, stunBoss: false };
    }

    // Check if boss is in melee range
    const distance = Math.sqrt(
      Math.pow(bossX - playerX, 2) + Math.pow(bossY - playerY, 2)
    );

    if (distance > this.skill1Range) {
      // No enemies in range, don't use the skill
      return { success: false, manaCost: 0, damage: 0, stunBoss: false };
    }

    // Set cooldown
    this.skill1Cooldown = this.skill1CooldownMax;

    // Calculate damage with DEF scaling
    const scaledDamage = this.skill1Damage * (1 + baseDef / 100);

    // Create skill effect
    const effect: SkillEffect = {
      id: `${this.ownerId}_stark_stun_${this.skillEffectCounter++}`,
      ownerId: this.ownerId,
      ownerName: this.ownerName,
      characterId: 'stark',
      skillType: 'skill1',
      effectType: 'stark_stun_aoe',
      x: playerX,
      y: playerY,
      radius: this.skill1Range,
      createdAt: time,
      expiresAt: time + 500, // 500ms visual effect
      damage: scaledDamage,
      data: {}
    };

    return {
      success: true,
      manaCost: this.skill1ManaCost,
      damage: scaledDamage,
      stunBoss: true,
      effect
    };
  }

  useSkill2(currentMana: number, time: number): {
    success: boolean;
    manaCost: number;
    buff?: PlayerBuff;
  } {
    if (this.skill2Cooldown > 0 || currentMana < this.skill2ManaCost) {
      return { success: false, manaCost: 0 };
    }

    // Set cooldown
    this.skill2Cooldown = this.skill2CooldownMax;

    // Create buff
    const buff: PlayerBuff = {
      type: 'stark_shield',
      expiresAt: time + this.skill2Duration,
      data: {
        damageReduction: this.skill2DamageReduction
      }
    };

    return {
      success: true,
      manaCost: this.skill2ManaCost,
      buff
    };
  }

  getStunDuration(): number {
    return this.skill1StunDuration;
  }

  getCooldowns(): { skill1: number; skill2: number } {
    return {
      skill1: this.skill1Cooldown / this.skill1CooldownMax,
      skill2: this.skill2Cooldown / this.skill2CooldownMax
    };
  }
}
