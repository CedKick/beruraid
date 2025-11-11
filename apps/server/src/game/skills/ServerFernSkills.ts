import { SkillEffect } from '@beruraid/shared';

export class ServerFernSkills {
  private ownerId: string;
  private ownerName: string;

  // Skill A (AOE Fire) properties
  private skill1Cooldown = 0;
  private skill1CooldownMax = 0.8; // 0.8 second cooldown (spammable)
  private skill1ManaCost = 5;
  private skill1StackCount = 1; // Start at 1 stack
  private skill1MaxStacks = 30;
  private lastSkill1Position: { x: number; y: number } | null = null;
  private skill1MoveThreshold = 10;

  // Skill E (Zoltraak) properties
  private skill2Cooldown = 0;
  private skill2CooldownMax = 10; // 10 second cooldown
  private skill2ManaCost = 15;
  private skill2DamageMultiplier = 30;

  private skillEffectCounter = 0;

  constructor(ownerId: string, ownerName: string) {
    this.ownerId = ownerId;
    this.ownerName = ownerName;
  }

  update(delta: number, playerX: number, playerY: number): void {
    // Update cooldowns
    const deltaInSeconds = delta / 1000;
    if (this.skill1Cooldown > 0) {
      this.skill1Cooldown = Math.max(0, this.skill1Cooldown - deltaInSeconds);
    }
    if (this.skill2Cooldown > 0) {
      this.skill2Cooldown = Math.max(0, this.skill2Cooldown - deltaInSeconds);
    }

    // Check if player moved significantly (reset stacks if moved)
    if (this.lastSkill1Position) {
      const distance = Math.sqrt(
        Math.pow(this.lastSkill1Position.x - playerX, 2) +
        Math.pow(this.lastSkill1Position.y - playerY, 2)
      );

      if (distance > this.skill1MoveThreshold) {
        this.skill1StackCount = 1;
        this.lastSkill1Position = null;
      }
    }
  }

  useSkill1(currentMana: number, playerX: number, playerY: number, time: number): {
    success: boolean;
    manaCost: number;
    damage: number;
    effect?: SkillEffect;
  } {
    if (this.skill1Cooldown > 0 || currentMana < this.skill1ManaCost) {
      return { success: false, manaCost: 0, damage: 0 };
    }

    // Check if player moved since last cast
    if (this.lastSkill1Position) {
      const distance = Math.sqrt(
        Math.pow(this.lastSkill1Position.x - playerX, 2) +
        Math.pow(this.lastSkill1Position.y - playerY, 2)
      );

      if (distance > this.skill1MoveThreshold) {
        this.skill1StackCount = 1;
      } else {
        if (this.skill1StackCount < this.skill1MaxStacks) {
          this.skill1StackCount++;
        }
      }
    }

    // Calculate damage with stacks
    const baseDamage = 15;
    const damageMultiplier = Math.pow(1.2, this.skill1StackCount - 1);
    const totalDamage = baseDamage * damageMultiplier;

    // Update position tracking
    this.lastSkill1Position = { x: playerX, y: playerY };

    // Set cooldown
    this.skill1Cooldown = this.skill1CooldownMax;

    // Create skill effect
    const effect: SkillEffect = {
      id: `${this.ownerId}_fern_fire_${this.skillEffectCounter++}`,
      ownerId: this.ownerId,
      ownerName: this.ownerName,
      characterId: 'fern',
      skillType: 'skill1',
      effectType: 'fern_fire_aoe',
      x: playerX,
      y: playerY,
      radius: 30, // Start radius
      createdAt: time,
      expiresAt: time + 800, // 800ms duration
      damage: totalDamage,
      data: {
        maxRadius: 180,
        stackCount: this.skill1StackCount,
        damageMultiplier: damageMultiplier
      }
    };

    return {
      success: true,
      manaCost: this.skill1ManaCost,
      damage: totalDamage,
      effect
    };
  }

  useSkill2(currentMana: number, playerX: number, playerY: number, targetX: number, targetY: number, time: number): {
    success: boolean;
    manaCost: number;
    damage: number;
    effect?: SkillEffect;
  } {
    if (this.skill2Cooldown > 0 || currentMana < this.skill2ManaCost) {
      return { success: false, manaCost: 0, damage: 0 };
    }

    // Calculate damage
    const baseDamage = 15 * this.skill2DamageMultiplier;

    // Calculate angle
    const angle = Math.atan2(targetY - playerY, targetX - playerX);
    const speed = 800;

    // Set cooldown
    this.skill2Cooldown = this.skill2CooldownMax;

    // Create skill effect
    const effect: SkillEffect = {
      id: `${this.ownerId}_fern_zoltraak_${this.skillEffectCounter++}`,
      ownerId: this.ownerId,
      ownerName: this.ownerName,
      characterId: 'fern',
      skillType: 'skill2',
      effectType: 'fern_zoltraak',
      x: playerX,
      y: playerY,
      angle: angle,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
      createdAt: time,
      expiresAt: time + 1500, // 1.5s duration
      damage: baseDamage,
      data: {}
    };

    return {
      success: true,
      manaCost: this.skill2ManaCost,
      damage: baseDamage,
      effect
    };
  }

  getSkill1StackCount(): number {
    return this.skill1StackCount;
  }

  getCooldowns(): { skill1: number; skill2: number } {
    return {
      skill1: this.skill1Cooldown / this.skill1CooldownMax,
      skill2: this.skill2Cooldown / this.skill2CooldownMax
    };
  }
}
