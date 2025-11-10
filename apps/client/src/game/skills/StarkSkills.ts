import Phaser from 'phaser';

export class StarkSkills {
  private scene: Phaser.Scene;
  private player: Phaser.GameObjects.Image;

  // Skill A (Stun AOE) properties
  private skill1Cooldown = 0;
  private skill1CooldownMax = 15; // 15 second cooldown
  private skill1ManaCost = 10;
  private skill1Range = 120; // Melee range for stun
  private skill1Damage = 50; // High damage for tank

  // Skill E (Damage absorption shield) properties
  private skill2Cooldown = 0;
  private skill2CooldownMax = 30; // 30 second cooldown
  private skill2ManaCost = 20;
  private skill2Duration = 4000; // 4 seconds
  private skill2Active = false;
  private skill2StartTime = 0;
  private skill2DamageReduction = 0.9; // Reduces damage to 10% (absorbs 90%)

  private activeSkill1Effects: Phaser.GameObjects.Arc[] = [];
  private skill2ShieldEffect: Phaser.GameObjects.Arc | null = null;

  constructor(scene: Phaser.Scene, player: Phaser.GameObjects.Image) {
    this.scene = scene;
    this.player = player;
  }

  update(delta: number) {
    // Update cooldowns
    if (this.skill1Cooldown > 0) {
      this.skill1Cooldown = Math.max(0, this.skill1Cooldown - delta / 1000);
    }
    if (this.skill2Cooldown > 0) {
      this.skill2Cooldown = Math.max(0, this.skill2Cooldown - delta / 1000);
    }

    // Update shield duration
    if (this.skill2Active) {
      const elapsed = Date.now() - this.skill2StartTime;
      if (elapsed >= this.skill2Duration) {
        this.deactivateShield();
      } else if (this.skill2ShieldEffect && this.skill2ShieldEffect.scene) {
        // Update shield position to follow player
        this.skill2ShieldEffect.setPosition(this.player.x, this.player.y);
      }
    }
  }

  // Skill A: Stun AOE
  useSkill1(currentMana: number, bosses: any[]): { success: boolean; manaCost: number; damage: number; stunned: any[] } {
    if (this.skill1Cooldown > 0 || currentMana < this.skill1ManaCost) {
      return { success: false, manaCost: 0, damage: 0, stunned: [] };
    }

    const stunnedEnemies: any[] = [];

    // Check if any boss is in melee range
    bosses.forEach(boss => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        boss.x,
        boss.y
      );

      if (distance <= this.skill1Range) {
        stunnedEnemies.push(boss);
      }
    });

    if (stunnedEnemies.length === 0) {
      // No enemies in range, don't use the skill
      return { success: false, manaCost: 0, damage: 0, stunned: [] };
    }

    // Create stun AOE visual effect
    this.createStunAOE();

    // Set cooldown
    this.skill1Cooldown = this.skill1CooldownMax;

    return {
      success: true,
      manaCost: this.skill1ManaCost,
      damage: this.skill1Damage,
      stunned: stunnedEnemies
    };
  }

  private createStunAOE() {
    const radius = this.skill1Range;

    // Create orange/red shockwave circle
    const stunCircle = this.scene.add.circle(
      this.player.x,
      this.player.y,
      30,
      0xff4500, // Orange-red
      0.8
    );
    stunCircle.setStrokeStyle(6, 0xff0000, 1);
    stunCircle.setDepth(20);

    this.activeSkill1Effects.push(stunCircle);

    // Expanding shockwave animation
    this.scene.tweens.add({
      targets: stunCircle,
      scale: radius / 30,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        if (stunCircle && stunCircle.scene) {
          stunCircle.destroy();
        }
        const index = this.activeSkill1Effects.indexOf(stunCircle);
        if (index > -1) {
          this.activeSkill1Effects.splice(index, 1);
        }
      }
    });

    // Impact lines effect
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const line = this.scene.add.line(
        this.player.x,
        this.player.y,
        0,
        0,
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0xffd700,
        1
      );
      line.setLineWidth(4);
      line.setDepth(19);
      line.setOrigin(0, 0);

      this.scene.tweens.add({
        targets: line,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          if (line && line.scene) {
            line.destroy();
          }
        }
      });
    }
  }

  // Skill E: Damage Absorption Shield
  useSkill2(currentMana: number): { success: boolean; manaCost: number } {
    if (this.skill2Cooldown > 0 || currentMana < this.skill2ManaCost || this.skill2Active) {
      return { success: false, manaCost: 0 };
    }

    // Activate shield
    this.skill2Active = true;
    this.skill2StartTime = Date.now();

    // Create shield visual
    this.createShieldEffect();

    // Set cooldown
    this.skill2Cooldown = this.skill2CooldownMax;

    return {
      success: true,
      manaCost: this.skill2ManaCost
    };
  }

  private createShieldEffect() {
    // Create glowing blue shield circle around player
    const shield = this.scene.add.circle(
      this.player.x,
      this.player.y,
      80,
      0x00bfff, // Deep sky blue
      0.3
    );
    shield.setStrokeStyle(5, 0x1e90ff, 0.9);
    shield.setDepth(15);

    this.skill2ShieldEffect = shield;

    // Pulsing animation
    this.scene.tweens.add({
      targets: shield,
      alpha: 0.5,
      scale: 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1, // Infinite repeat
      ease: 'Sine.easeInOut'
    });
  }

  private deactivateShield() {
    this.skill2Active = false;

    // Fade out shield
    if (this.skill2ShieldEffect && this.skill2ShieldEffect.scene) {
      this.scene.tweens.killTweensOf(this.skill2ShieldEffect);
      this.scene.tweens.add({
        targets: this.skill2ShieldEffect,
        alpha: 0,
        scale: 1.5,
        duration: 300,
        onComplete: () => {
          if (this.skill2ShieldEffect && this.skill2ShieldEffect.scene) {
            this.skill2ShieldEffect.destroy();
          }
          this.skill2ShieldEffect = null;
        }
      });
    }
  }

  getSkill1Cooldown(): number {
    return this.skill1Cooldown / this.skill1CooldownMax;
  }

  getSkill2Cooldown(): number {
    return this.skill2Cooldown / this.skill2CooldownMax;
  }

  isShieldActive(): boolean {
    return this.skill2Active;
  }

  getShieldDamageReduction(): number {
    return this.skill2DamageReduction;
  }

  getSkill1Range(): number {
    return this.skill1Range;
  }

  getSkill1Damage(): number {
    return this.skill1Damage;
  }

  getStunDuration(): number {
    return 2000; // 2 seconds in milliseconds
  }
}
