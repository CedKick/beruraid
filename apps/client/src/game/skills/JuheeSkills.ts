import Phaser from 'phaser';

export class JuheeSkills {
  private scene: Phaser.Scene;
  private player: Phaser.GameObjects.Image;

  // Skill A (Healing Circle) properties
  private skill1Cooldown = 0;
  private skill1CooldownMax = 10; // 10 second cooldown
  private skill1ManaCost = 15;

  // Skill E (Blessing of Courage) properties
  private skill2Cooldown = 0;
  private skill2CooldownMax = 15; // 15 second cooldown
  private skill2ManaCost = 30;

  private activeSkill1Effects: Phaser.GameObjects.Arc[] = [];
  private activeSkill2Effects: Phaser.GameObjects.Arc[] = [];
  private activeHealProjectiles: Phaser.GameObjects.Arc[] = [];

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

  // Skill A: Healing Circle
  useSkill1(currentMana: number): { success: boolean; manaCost: number } {
    if (this.skill1Cooldown > 0 || currentMana < this.skill1ManaCost) {
      return { success: false, manaCost: 0 };
    }

    // Create healing circle
    this.createHealingCircle();

    // Set cooldown
    this.skill1Cooldown = this.skill1CooldownMax;

    return {
      success: true,
      manaCost: this.skill1ManaCost
    };
  }

  private createHealingCircle() {
    const radius = 120;
    const duration = 500;

    // Create green healing circle
    const healCircle = this.scene.add.circle(
      this.player.x,
      this.player.y,
      radius,
      0x00ff00, // Green
      0.4
    );
    healCircle.setStrokeStyle(3, 0x32cd32, 0.8);
    healCircle.setDepth(10);

    this.activeSkill1Effects.push(healCircle);

    // Pulse animation
    this.scene.tweens.add({
      targets: healCircle,
      scale: 1.2,
      alpha: 0.2,
      duration: duration,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // Fade out
        this.scene.tweens.add({
          targets: healCircle,
          alpha: 0,
          duration: 200,
          onComplete: () => {
            if (healCircle && healCircle.scene) {
              healCircle.destroy();
            }
            const index = this.activeSkill1Effects.indexOf(healCircle);
            if (index > -1) {
              this.activeSkill1Effects.splice(index, 1);
            }
          }
        });
      }
    });

    // Add sparkle particles
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const x = this.player.x + Math.cos(angle) * radius * 0.7;
      const y = this.player.y + Math.sin(angle) * radius * 0.7;

      const sparkle = this.scene.add.circle(x, y, 5, 0xffffff, 0.8);
      sparkle.setDepth(11);

      this.scene.tweens.add({
        targets: sparkle,
        y: y - 30,
        alpha: 0,
        duration: 600,
        ease: 'Cubic.easeOut',
        onComplete: () => sparkle.destroy()
      });
    }
  }

  // Skill E: Blessing of Courage
  useSkill2(currentMana: number): { success: boolean; manaCost: number } {
    if (this.skill2Cooldown > 0 || currentMana < this.skill2ManaCost) {
      return { success: false, manaCost: 0 };
    }

    // Create blessing buff circle
    this.createBlessingCircle();

    // Set cooldown
    this.skill2Cooldown = this.skill2CooldownMax;

    return {
      success: true,
      manaCost: this.skill2ManaCost
    };
  }

  private createBlessingCircle() {
    const radius = 150;
    const duration = 500;

    // Create golden blessing circle
    const blessCircle = this.scene.add.circle(
      this.player.x,
      this.player.y,
      radius,
      0xffd700, // Gold
      0.3
    );
    blessCircle.setStrokeStyle(4, 0xffa500, 0.8);
    blessCircle.setDepth(10);

    this.activeSkill2Effects.push(blessCircle);

    // Expand animation
    this.scene.tweens.add({
      targets: blessCircle,
      scale: 1.3,
      alpha: 0.1,
      duration: duration,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // Fade out
        this.scene.tweens.add({
          targets: blessCircle,
          alpha: 0,
          duration: 200,
          onComplete: () => {
            if (blessCircle && blessCircle.scene) {
              blessCircle.destroy();
            }
            const index = this.activeSkill2Effects.indexOf(blessCircle);
            if (index > -1) {
              this.activeSkill2Effects.splice(index, 1);
            }
          }
        });
      }
    });

    // Add burst effect
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const startX = this.player.x;
      const startY = this.player.y;
      const endX = startX + Math.cos(angle) * radius;
      const endY = startY + Math.sin(angle) * radius;

      const ray = this.scene.add.line(
        0, 0,
        startX, startY,
        startX, startY,
        0xffd700,
        0.6
      );
      ray.setLineWidth(3);
      ray.setDepth(11);

      this.scene.tweens.add({
        targets: ray,
        scaleX: 1.5,
        alpha: 0,
        duration: 400,
        ease: 'Cubic.easeOut',
        onUpdate: () => {
          const progress = ray.alpha;
          const currentEndX = startX + (endX - startX) * (1 - progress);
          const currentEndY = startY + (endY - startY) * (1 - progress);
          ray.setTo(startX, startY, currentEndX, currentEndY);
        },
        onComplete: () => ray.destroy()
      });
    }
  }

  // Right-click: Heal Projectile (costs 0 mana)
  useRightClick(currentMana: number, targetX: number, targetY: number): { success: boolean; manaCost: number } {
    // No mana cost for right-click
    const manaCost = 0;

    // Create heal projectile
    this.createHealProjectile(targetX, targetY);

    return {
      success: true,
      manaCost: manaCost
    };
  }

  private createHealProjectile(targetX: number, targetY: number) {
    const startX = this.player.x;
    const startY = this.player.y;

    // Create green healing projectile
    const projectile = this.scene.add.circle(
      startX,
      startY,
      12,
      0x00ff88, // Light green
      0.8
    );
    projectile.setStrokeStyle(2, 0x00ff00, 1);
    projectile.setDepth(12);

    // Add physics for the projectile
    this.scene.physics.add.existing(projectile);
    const body = projectile.body as Phaser.Physics.Arcade.Body;
    body.setCircle(12);

    this.activeHealProjectiles.push(projectile);

    // Store heal info
    (projectile as any).healAmount = 30;
    (projectile as any).isJuheeHeal = true;

    // Calculate direction
    const angle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY);
    const speed = 400; // pixels per second

    // Set velocity
    body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    // Pulse animation
    this.scene.tweens.add({
      targets: projectile,
      scale: { from: 1, to: 1.3 },
      alpha: { from: 0.8, to: 1 },
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Auto-destroy after 5 seconds
    this.scene.time.delayedCall(5000, () => {
      if (projectile && projectile.scene) {
        projectile.destroy();
      }
      const index = this.activeHealProjectiles.indexOf(projectile);
      if (index > -1) {
        this.activeHealProjectiles.splice(index, 1);
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

  getHealProjectiles(): Phaser.GameObjects.Arc[] {
    return this.activeHealProjectiles;
  }
}
