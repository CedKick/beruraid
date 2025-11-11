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

    // Create dark projectile with better animation
    const projectile = this.scene.add.circle(
      startX,
      startY,
      10,
      0x8b00ff, // Purple/dark color
      1
    );
    projectile.setStrokeStyle(3, 0xda70d6, 1);
    projectile.setDepth(12);

    this.activeSkill1Effects.push(projectile);

    // Add trail effect
    const trail = this.scene.add.circle(
      startX,
      startY,
      8,
      0x8b00ff,
      0.5
    );
    trail.setDepth(11);

    // Calculate angle
    const angle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY);
    const distance = Phaser.Math.Distance.Between(startX, startY, targetX, targetY);
    const duration = Math.min(distance / 1.5, 500); // Faster projectile

    // Pulsing animation for projectile
    this.scene.tweens.add({
      targets: projectile,
      scale: { from: 1, to: 1.2 },
      duration: 150,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Animate projectile to target
    this.scene.tweens.add({
      targets: projectile,
      x: targetX,
      y: targetY,
      duration: duration,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // Impact effect - multiple circles
        for (let i = 0; i < 3; i++) {
          const delay = i * 50;
          this.scene.time.delayedCall(delay, () => {
            const impact = this.scene.add.circle(targetX, targetY, 10 + i * 5, 0x8b00ff, 0.7 - i * 0.2);
            impact.setDepth(12);
            impact.setStrokeStyle(2, 0xda70d6, 0.8);

            this.scene.tweens.add({
              targets: impact,
              scale: 2.5,
              alpha: 0,
              duration: 400,
              ease: 'Cubic.easeOut',
              onComplete: () => impact.destroy()
            });
          });
        }

        projectile.destroy();
        const index = this.activeSkill1Effects.indexOf(projectile);
        if (index > -1) {
          this.activeSkill1Effects.splice(index, 1);
        }
      }
    });

    // Animate trail to follow (with delay)
    this.scene.tweens.add({
      targets: trail,
      x: targetX,
      y: targetY,
      duration: duration,
      ease: 'Cubic.easeOut',
      alpha: 0,
      onComplete: () => trail.destroy()
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
    const glowColor = isBlue ? 0x87ceeb : 0xff6347; // Lighter shade for glow
    const duration = 5000; // 5 seconds

    // Create main circle around player
    const circle = this.scene.add.circle(
      this.player.x,
      this.player.y,
      radius,
      color,
      0.35
    );
    circle.setStrokeStyle(5, glowColor, 0.9);
    circle.setDepth(9);

    this.activeSkill2Effects.push(circle);

    // Create inner circle for more depth
    const innerCircle = this.scene.add.circle(
      this.player.x,
      this.player.y,
      radius * 0.6,
      color,
      0.2
    );
    innerCircle.setStrokeStyle(3, glowColor, 0.7);
    innerCircle.setDepth(9);

    // Pulse animation for main circle
    this.scene.tweens.add({
      targets: circle,
      scale: { from: 1, to: 1.2 },
      alpha: { from: 0.35, to: 0.55 },
      duration: 600,
      yoyo: true,
      repeat: Math.floor(duration / 1200),
      ease: 'Sine.easeInOut'
    });

    // Counter-pulse animation for inner circle
    this.scene.tweens.add({
      targets: innerCircle,
      scale: { from: 1, to: 0.85 },
      alpha: { from: 0.2, to: 0.4 },
      duration: 600,
      yoyo: true,
      repeat: Math.floor(duration / 1200),
      ease: 'Sine.easeInOut'
    });

    // Add rotating energy particles
    const particleCount = isBlue ? 8 : 12; // More particles for red (more dangerous)
    const particles: Phaser.GameObjects.Arc[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const distance = radius * 0.75;
      const particle = this.scene.add.circle(
        this.player.x + Math.cos(angle) * distance,
        this.player.y + Math.sin(angle) * distance,
        4,
        glowColor,
        0.8
      );
      particle.setDepth(10);
      particles.push(particle);
    }

    // Make circles and particles follow player
    const updatePositions = () => {
      if (circle && circle.scene) {
        circle.x = this.player.x;
        circle.y = this.player.y;
        innerCircle.x = this.player.x;
        innerCircle.y = this.player.y;

        // Rotate particles around player
        const rotationSpeed = isBlue ? 0.02 : 0.04; // Red rotates faster
        particles.forEach((particle, i) => {
          if (particle && particle.scene) {
            const baseAngle = (Math.PI * 2 * i) / particleCount;
            const currentTime = Date.now() / 1000;
            const angle = baseAngle + currentTime * rotationSpeed;
            const distance = radius * 0.75;
            particle.x = this.player.x + Math.cos(angle) * distance;
            particle.y = this.player.y + Math.sin(angle) * distance;
          }
        });
      }
    };

    const updateEvent = this.scene.time.addEvent({
      delay: 16, // ~60 FPS
      callback: updatePositions,
      loop: true
    });

    // Destroy after duration
    this.scene.time.delayedCall(duration, () => {
      updateEvent.remove();

      // Fade out animation
      if (circle && circle.scene) {
        this.scene.tweens.add({
          targets: [circle, innerCircle, ...particles],
          alpha: 0,
          scale: 0.3,
          duration: 300,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            if (circle && circle.scene) circle.destroy();
            if (innerCircle && innerCircle.scene) innerCircle.destroy();
            particles.forEach(p => {
              if (p && p.scene) p.destroy();
            });
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
