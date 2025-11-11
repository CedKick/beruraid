import Phaser from 'phaser';

export class SungSkills {
  private scene: Phaser.Scene;
  private player: Phaser.GameObjects.Image;

  // Skill A (Barrage Strike) properties
  private skill1Cooldown = 0;
  private skill1CooldownMax = 1; // 1 second cooldown
  private skill1ManaCost = 7;

  // Skill E (Death Gamble) properties
  private skill2Cooldown = 0;
  private skill2CooldownMax = 12; // 12 second cooldown
  private skill2ManaCost = 19;

  private activeSkill1Effects: Phaser.GameObjects.Arc[] = [];
  private activeSkill2Effects: Phaser.GameObjects.Arc[] = [];

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
  }

  // Skill A: Barrage Strike (targeted attack)
  useSkill1(currentMana: number, targetX: number, targetY: number): { success: boolean; manaCost: number } {
    if (this.skill1Cooldown > 0 || currentMana < this.skill1ManaCost) {
      return { success: false, manaCost: 0 };
    }

    // Create visual effect - dagger projectile
    this.createBarrageStrike(targetX, targetY);

    // Set cooldown
    this.skill1Cooldown = this.skill1CooldownMax;

    return {
      success: true,
      manaCost: this.skill1ManaCost
    };
  }

  private createBarrageStrike(targetX: number, targetY: number) {
    const startX = this.player.x;
    const startY = this.player.y;

    // Create dark projectile
    const projectile = this.scene.add.circle(
      startX,
      startY,
      8,
      0x8b00ff, // Purple/dark color
      0.9
    );
    projectile.setStrokeStyle(2, 0x4b0082, 1);
    projectile.setDepth(12);

    this.activeSkill1Effects.push(projectile);

    // Calculate angle
    const angle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY);
    const distance = Phaser.Math.Distance.Between(startX, startY, targetX, targetY);
    const duration = Math.min(distance / 2, 400); // Fast projectile

    // Animate to target
    this.scene.tweens.add({
      targets: projectile,
      x: targetX,
      y: targetY,
      duration: duration,
      ease: 'Linear',
      onComplete: () => {
        // Impact effect
        const impact = this.scene.add.circle(targetX, targetY, 15, 0x8b00ff, 0.6);
        impact.setDepth(12);

        this.scene.tweens.add({
          targets: impact,
          scale: 2,
          alpha: 0,
          duration: 300,
          onComplete: () => impact.destroy()
        });

        projectile.destroy();
        const index = this.activeSkill1Effects.indexOf(projectile);
        if (index > -1) {
          this.activeSkill1Effects.splice(index, 1);
        }
      }
    });
  }

  // Skill E: Death Gamble (buff circle)
  useSkill2(currentMana: number): { success: boolean; manaCost: number; isBlue: boolean } {
    if (this.skill2Cooldown > 0 || currentMana < this.skill2ManaCost) {
      return { success: false, manaCost: 0, isBlue: false };
    }

    // Random color (50/50 blue or red)
    const isBlue = Math.random() < 0.5;

    // Create visual circle effect
    this.createDeathGamble(isBlue);

    // Set cooldown
    this.skill2Cooldown = this.skill2CooldownMax;

    return {
      success: true,
      manaCost: this.skill2ManaCost,
      isBlue: isBlue
    };
  }

  private createDeathGamble(isBlue: boolean) {
    const radius = 80;
    const color = isBlue ? 0x00bfff : 0xff0000; // Blue or Red
    const duration = 5000; // 5 seconds

    // Create circle around player
    const circle = this.scene.add.circle(
      this.player.x,
      this.player.y,
      radius,
      color,
      0.3
    );
    circle.setStrokeStyle(4, color, 0.8);
    circle.setDepth(9);

    this.activeSkill2Effects.push(circle);

    // Pulse animation
    this.scene.tweens.add({
      targets: circle,
      scale: { from: 1, to: 1.15 },
      alpha: { from: 0.3, to: 0.5 },
      duration: 500,
      yoyo: true,
      repeat: Math.floor(duration / 1000) - 1,
      ease: 'Sine.easeInOut'
    });

    // Make circle follow player
    const updateCirclePosition = () => {
      if (circle && circle.scene) {
        circle.x = this.player.x;
        circle.y = this.player.y;
      }
    };

    const updateEvent = this.scene.time.addEvent({
      delay: 16, // ~60 FPS
      callback: updateCirclePosition,
      loop: true
    });

    // Destroy after duration
    this.scene.time.delayedCall(duration, () => {
      updateEvent.remove();
      if (circle && circle.scene) {
        this.scene.tweens.add({
          targets: circle,
          alpha: 0,
          scale: 0.5,
          duration: 200,
          onComplete: () => {
            if (circle && circle.scene) {
              circle.destroy();
            }
          }
        });
      }
      const index = this.activeSkill2Effects.indexOf(circle);
      if (index > -1) {
        this.activeSkill2Effects.splice(index, 1);
      }
    });
  }

  getSkill1Cooldown(): number {
    return this.skill1Cooldown / this.skill1CooldownMax;
  }

  getSkill2Cooldown(): number {
    return this.skill2Cooldown / this.skill2CooldownMax;
  }

  getSkill1Effects(): Phaser.GameObjects.Arc[] {
    return this.activeSkill1Effects;
  }

  getSkill2Effects(): Phaser.GameObjects.Arc[] {
    return this.activeSkill2Effects;
  }
}
