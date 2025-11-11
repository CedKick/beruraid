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

    // Create green healing circle with glow
    const healCircle = this.scene.add.circle(
      this.player.x,
      this.player.y,
      radius,
      0x00ff88, // Brighter green
      0.45
    );
    healCircle.setStrokeStyle(4, 0x00ff00, 1);
    healCircle.setDepth(10);

    this.activeSkill1Effects.push(healCircle);

    // Create inner healing circle
    const innerCircle = this.scene.add.circle(
      this.player.x,
      this.player.y,
      radius * 0.5,
      0x32cd32,
      0.3
    );
    innerCircle.setStrokeStyle(3, 0x98fb98, 0.8);
    innerCircle.setDepth(10);

    // Pulse animation for outer circle
    this.scene.tweens.add({
      targets: healCircle,
      scale: 1.3,
      alpha: 0.15,
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

    // Counter-pulse for inner circle
    this.scene.tweens.add({
      targets: innerCircle,
      scale: 0.7,
      alpha: 0.1,
      duration: duration,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: innerCircle,
          alpha: 0,
          duration: 200,
          onComplete: () => {
            if (innerCircle && innerCircle.scene) {
              innerCircle.destroy();
            }
          }
        });
      }
    });

    // Add sparkle particles with better animation
    const sparkleCount = 12;
    for (let i = 0; i < sparkleCount; i++) {
      const angle = (Math.PI * 2 * i) / sparkleCount;
      const startRadius = radius * 0.4;
      const x = this.player.x + Math.cos(angle) * startRadius;
      const y = this.player.y + Math.sin(angle) * startRadius;

      const sparkle = this.scene.add.circle(x, y, 6, 0xffffff, 1);
      sparkle.setDepth(11);
      sparkle.setStrokeStyle(2, 0x00ff00, 0.8);

      // Sparkles move outward and upward
      this.scene.tweens.add({
        targets: sparkle,
        x: this.player.x + Math.cos(angle) * radius * 1.2,
        y: y - 40,
        scale: 0.3,
        alpha: 0,
        duration: 700,
        ease: 'Cubic.easeOut',
        onComplete: () => sparkle.destroy()
      });
    }

    // Add healing waves
    for (let i = 0; i < 3; i++) {
      const delay = i * 150;
      this.scene.time.delayedCall(delay, () => {
        const wave = this.scene.add.circle(
          this.player.x,
          this.player.y,
          20,
          0x00ff00,
          0.4
        );
        wave.setStrokeStyle(2, 0x98fb98, 0.6);
        wave.setDepth(9);

        this.scene.tweens.add({
          targets: wave,
          scale: radius / 20,
          alpha: 0,
          duration: 400,
          ease: 'Cubic.easeOut',
          onComplete: () => wave.destroy()
        });
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

    // Create golden blessing circle with intense glow
    const blessCircle = this.scene.add.circle(
      this.player.x,
      this.player.y,
      radius,
      0xffd700, // Gold
      0.4
    );
    blessCircle.setStrokeStyle(5, 0xffaa00, 1);
    blessCircle.setDepth(10);

    this.activeSkill2Effects.push(blessCircle);

    // Inner golden ring
    const innerRing = this.scene.add.circle(
      this.player.x,
      this.player.y,
      radius * 0.6,
      0xffa500,
      0.3
    );
    innerRing.setStrokeStyle(4, 0xffd700, 0.9);
    innerRing.setDepth(10);

    // Expand animation for outer circle
    this.scene.tweens.add({
      targets: blessCircle,
      scale: 1.4,
      alpha: 0.05,
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

    // Expand animation for inner ring
    this.scene.tweens.add({
      targets: innerRing,
      scale: 1.2,
      alpha: 0,
      duration: duration,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: innerRing,
          alpha: 0,
          duration: 200,
          onComplete: () => {
            if (innerRing && innerRing.scene) {
              innerRing.destroy();
            }
          }
        });
      }
    });

    // Add radial burst effect with more rays
    const rayCount = 16;
    for (let i = 0; i < rayCount; i++) {
      const angle = (Math.PI * 2 * i) / rayCount;
      const startX = this.player.x;
      const startY = this.player.y;
      const midRadius = radius * 0.3;
      const endRadius = radius * 1.3;

      // Create glowing particles along each ray
      const particlesPerRay = 5;
      for (let j = 0; j < particlesPerRay; j++) {
        const delay = j * 40;
        this.scene.time.delayedCall(delay, () => {
          const distance = midRadius + (endRadius - midRadius) * (j / particlesPerRay);
          const x = startX + Math.cos(angle) * distance;
          const y = startY + Math.sin(angle) * distance;

          const particle = this.scene.add.circle(x, y, 5, 0xffd700, 0.9);
          particle.setDepth(11);
          particle.setStrokeStyle(2, 0xffffff, 0.7);

          this.scene.tweens.add({
            targets: particle,
            x: startX + Math.cos(angle) * endRadius * 1.2,
            y: startY + Math.sin(angle) * endRadius * 1.2,
            scale: 0.2,
            alpha: 0,
            duration: 500 - delay,
            ease: 'Cubic.easeOut',
            onComplete: () => particle.destroy()
          });
        });
      }
    }

    // Add rotating blessing symbols
    const symbolCount = 8;
    for (let i = 0; i < symbolCount; i++) {
      const angle = (Math.PI * 2 * i) / symbolCount;
      const distance = radius * 0.8;
      const x = this.player.x + Math.cos(angle) * distance;
      const y = this.player.y + Math.sin(angle) * distance;

      const symbol = this.scene.add.circle(x, y, 8, 0xffffff, 0.8);
      symbol.setDepth(11);
      symbol.setStrokeStyle(2, 0xffd700, 1);

      this.scene.tweens.add({
        targets: symbol,
        scale: 1.5,
        alpha: 0,
        duration: 600,
        ease: 'Cubic.easeOut',
        onComplete: () => symbol.destroy()
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
