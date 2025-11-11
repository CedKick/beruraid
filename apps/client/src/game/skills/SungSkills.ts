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

  // Skill A: Barrage Strike (AOE attack around player)
  useSkill1(currentMana: number, targetX: number, targetY: number): { success: boolean; manaCost: number } {
    if (this.skill1Cooldown > 0 || currentMana < this.skill1ManaCost) {
      return { success: false, manaCost: 0 };
    }

    // Create visual effect - AOE around player
    this.createBarrageStrike();

    // Set cooldown
    this.skill1Cooldown = this.skill1CooldownMax;

    return {
      success: true,
      manaCost: this.skill1ManaCost
    };
  }

  private createBarrageStrike() {
    this.createBarrageStrikeVisual(this.player.x, this.player.y);
  }

  // Public method to create visual effect at any position (for multiplayer)
  public createBarrageStrikeVisual(x: number, y: number) {
    const startX = x;
    const startY = y;
    const radius = 80; // AOE radius
    const duration = 300; // Quick burst

    // Create main purple AOE circle
    const aoeCircle = this.scene.add.circle(
      startX,
      startY,
      radius,
      0x8b00ff, // Purple/dark color
      0.5
    );
    aoeCircle.setStrokeStyle(4, 0xda70d6, 1);
    aoeCircle.setDepth(12);

    this.activeSkill1Effects.push(aoeCircle);

    // Create inner circle for depth
    const innerCircle = this.scene.add.circle(
      startX,
      startY,
      radius * 0.6,
      0x8b00ff,
      0.3
    );
    innerCircle.setStrokeStyle(3, 0xda70d6, 0.8);
    innerCircle.setDepth(11);

    // Pulse and expand animation
    this.scene.tweens.add({
      targets: aoeCircle,
      scale: 1.4,
      alpha: 0,
      duration: duration,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        if (aoeCircle && aoeCircle.scene) {
          aoeCircle.destroy();
        }
        const index = this.activeSkill1Effects.indexOf(aoeCircle);
        if (index > -1) {
          this.activeSkill1Effects.splice(index, 1);
        }
      }
    });

    // Counter animation for inner circle
    this.scene.tweens.add({
      targets: innerCircle,
      scale: 1.2,
      alpha: 0,
      duration: duration,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        if (innerCircle && innerCircle.scene) {
          innerCircle.destroy();
        }
      }
    });

    // Add multiple dagger burst effects radiating outward
    const daggerCount = 12;
    for (let i = 0; i < daggerCount; i++) {
      const angle = (Math.PI * 2 * i) / daggerCount;
      const distance = radius * 0.8;

      const dagger = this.scene.add.circle(
        startX,
        startY,
        8,
        0xda70d6,
        1
      );
      dagger.setStrokeStyle(2, 0xffffff, 0.8);
      dagger.setDepth(13);

      // Daggers shoot outward
      this.scene.tweens.add({
        targets: dagger,
        x: startX + Math.cos(angle) * distance,
        y: startY + Math.sin(angle) * distance,
        scale: 0.3,
        alpha: 0,
        duration: 300,
        ease: 'Cubic.easeOut',
        onComplete: () => dagger.destroy()
      });
    }

    // Add impact waves
    for (let i = 0; i < 2; i++) {
      const delay = i * 100;
      this.scene.time.delayedCall(delay, () => {
        const wave = this.scene.add.circle(
          startX,
          startY,
          20,
          0x8b00ff,
          0.4
        );
        wave.setStrokeStyle(2, 0xda70d6, 0.6);
        wave.setDepth(10);

        this.scene.tweens.add({
          targets: wave,
          scale: radius / 20,
          alpha: 0,
          duration: 250,
          ease: 'Cubic.easeOut',
          onComplete: () => wave.destroy()
        });
      });
    }
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
    this.createDeathGambleVisual(this.player.x, this.player.y, isBlue, this.player);
  }

  // Public method to create visual effect at any position (for multiplayer)
  // targetPlayer is optional - if provided, the circle will follow the player
  public createDeathGambleVisual(x: number, y: number, isBlue: boolean, targetPlayer?: Phaser.GameObjects.Image) {
    const radius = 80;
    const color = isBlue ? 0x00bfff : 0xff0000; // Blue or Red
    const glowColor = isBlue ? 0x87ceeb : 0xff6347; // Lighter shade for glow
    const duration = 5000; // 5 seconds

    // Create main circle around player
    const circle = this.scene.add.circle(
      x,
      y,
      radius,
      color,
      0.35
    );
    circle.setStrokeStyle(5, glowColor, 0.9);
    circle.setDepth(9);

    this.activeSkill2Effects.push(circle);

    // Create inner circle for more depth
    const innerCircle = this.scene.add.circle(
      x,
      y,
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
        x + Math.cos(angle) * distance,
        y + Math.sin(angle) * distance,
        4,
        glowColor,
        0.8
      );
      particle.setDepth(10);
      particles.push(particle);
    }

    // Make circles and particles follow player (if targetPlayer provided)
    const updatePositions = () => {
      if (circle && circle.scene) {
        if (targetPlayer) {
          circle.x = targetPlayer.x;
          circle.y = targetPlayer.y;
          innerCircle.x = targetPlayer.x;
          innerCircle.y = targetPlayer.y;
        }

        // Rotate particles around center
        const rotationSpeed = isBlue ? 0.02 : 0.04; // Red rotates faster
        const centerX = targetPlayer ? targetPlayer.x : circle.x;
        const centerY = targetPlayer ? targetPlayer.y : circle.y;

        particles.forEach((particle, i) => {
          if (particle && particle.scene) {
            const baseAngle = (Math.PI * 2 * i) / particleCount;
            const currentTime = Date.now() / 1000;
            const angle = baseAngle + currentTime * rotationSpeed;
            const distance = radius * 0.75;
            particle.x = centerX + Math.cos(angle) * distance;
            particle.y = centerY + Math.sin(angle) * distance;
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
