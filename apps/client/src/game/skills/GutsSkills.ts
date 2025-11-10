import Phaser from 'phaser';

export class GutsSkills {
  private scene: Phaser.Scene;
  private player: Phaser.GameObjects.Image;

  // Skill A (Berserker Rage) properties
  private skill1Cooldown = 0;
  private skill1CooldownMax = 0.5; // 0.5 second cooldown
  private skill1HpCost = 0.2; // 20% of current HP
  private skill1Damage = 40;

  // Skill B (Beast of Darkness) properties
  private skill2Cooldown = 0;
  private skill2CooldownMax = 10; // 10 second cooldown
  private skill2ManaCost = 30;
  private skill2Duration = 5; // 5 seconds invincibility
  private skill2StunChance = 0.5; // 50% chance to stun
  private skill2StunDuration = 5; // 5 seconds stun
  private skill2Active = false;
  private skill2EndTime = 0;

  // Ultimate (Berserker Armor) properties
  private ultiCooldown = 0;
  private ultiCooldownMax = 45; // 45 second cooldown
  private ultiManaCost = 50;
  private ultiDuration = 10; // 10 seconds
  private ultiDamageMultiplier = 5; // 500% attack damage
  private ultiDpsMultiplierIncrement = 1.2; // Increases by 1.2 every 0.5s
  private ultiDpsMultiplierInterval = 0.5; // Every 0.5 seconds
  private ultiActive = false;
  private ultiEndTime = 0;
  private ultiCurrentDpsMultiplier = 1.0;
  private ultiLastMultiplierUpdate = 0;
  private ultiImageDisplayed = false;

  private activeSkill1Effects: Phaser.GameObjects.Arc[] = [];
  private activeSkill2Effects: Phaser.GameObjects.Graphics[] = [];
  private ultiImage: Phaser.GameObjects.Image | null = null;

  constructor(scene: Phaser.Scene, player: Phaser.GameObjects.Image) {
    this.scene = scene;
    this.player = player;
  }

  update(delta: number) {
    const deltaInSeconds = delta / 1000;

    // Update cooldowns
    if (this.skill1Cooldown > 0) {
      this.skill1Cooldown = Math.max(0, this.skill1Cooldown - deltaInSeconds);
    }
    if (this.skill2Cooldown > 0) {
      this.skill2Cooldown = Math.max(0, this.skill2Cooldown - deltaInSeconds);
    }
    if (this.ultiCooldown > 0) {
      this.ultiCooldown = Math.max(0, this.ultiCooldown - deltaInSeconds);
    }

    // Check skill2 duration
    if (this.skill2Active && Date.now() >= this.skill2EndTime) {
      this.skill2Active = false;
    }

    // Update ultimate status
    if (this.ultiActive) {
      const now = Date.now();

      // Check if ultimate duration ended
      if (now >= this.ultiEndTime) {
        this.ultiActive = false;
        this.ultiCurrentDpsMultiplier = 1.0;
        this.ultiImageDisplayed = false;
      } else {
        // Increment DPS multiplier every 0.5 seconds
        if (now - this.ultiLastMultiplierUpdate >= this.ultiDpsMultiplierInterval * 1000) {
          this.ultiCurrentDpsMultiplier *= this.ultiDpsMultiplierIncrement;
          this.ultiLastMultiplierUpdate = now;
        }
      }
    }
  }

  // Skill A: Berserker Rage (AOE attack that costs HP)
  useSkill1(currentHp: number, maxHp: number, isInvincible: boolean = false): {
    success: boolean;
    hpCost: number;
    damage: number
  } {
    const hpCost = isInvincible ? 0 : Math.floor(currentHp * this.skill1HpCost);

    // If invincible, no HP cost restriction. Otherwise, need at least 21% HP
    if (this.skill1Cooldown > 0) {
      return { success: false, hpCost: 0, damage: 0 };
    }

    if (!isInvincible && (currentHp <= hpCost || currentHp < maxHp * 0.21)) {
      return { success: false, hpCost: 0, damage: 0 };
    }

    // Create berserker AOE
    this.createBerserkerAOE();

    // Set cooldown
    this.skill1Cooldown = this.skill1CooldownMax;

    return {
      success: true,
      hpCost: hpCost,
      damage: this.skill1Damage
    };
  }

  private createBerserkerAOE() {
    const startRadius = 40;
    const maxRadius = 120;
    const duration = 600;

    // Create dark red/black energy circle (berserker style)
    const rageCircle = this.scene.add.circle(
      this.player.x,
      this.player.y,
      startRadius,
      0x8b0000, // Dark red
      0.7
    );
    rageCircle.setStrokeStyle(5, 0xff0000, 1.0); // Bright red border
    rageCircle.setDepth(10);

    // Add physics
    this.scene.physics.add.existing(rageCircle);
    const body = rageCircle.body as Phaser.Physics.Arcade.Body;
    body.setCircle(startRadius);

    this.activeSkill1Effects.push(rageCircle);

    // Store damage info
    (rageCircle as any).damageAmount = this.skill1Damage;
    (rageCircle as any).isGutsSkill1 = true;

    // Expanding animation with shake effect
    this.scene.tweens.add({
      targets: rageCircle,
      scale: maxRadius / startRadius,
      alpha: 0.2,
      duration: duration,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        if (rageCircle && rageCircle.scene) {
          const currentRadius = startRadius * rageCircle.scale;
          body.setCircle(currentRadius);
          body.setOffset(-currentRadius, -currentRadius);
        }
      },
      onComplete: () => {
        this.scene.tweens.add({
          targets: rageCircle,
          alpha: 0,
          duration: 150,
          onComplete: () => {
            if (rageCircle && rageCircle.scene) {
              rageCircle.destroy();
            }
            const index = this.activeSkill1Effects.indexOf(rageCircle);
            if (index > -1) {
              this.activeSkill1Effects.splice(index, 1);
            }
          }
        });
      }
    });
  }

  // Skill B: Beast of Darkness (Invincibility + Boss Stun)
  useSkill2(currentMana: number): {
    success: boolean;
    manaCost: number;
    stunned: boolean;
  } {
    if (this.skill2Cooldown > 0 || currentMana < this.skill2ManaCost) {
      return { success: false, manaCost: 0, stunned: false };
    }

    // Activate invincibility
    this.skill2Active = true;
    this.skill2EndTime = Date.now() + (this.skill2Duration * 1000);

    // Create dark aura effect
    this.createBeastAura();

    // Check for boss stun (50% chance)
    const stunSuccess = Math.random() < this.skill2StunChance;

    // Set cooldown
    this.skill2Cooldown = this.skill2CooldownMax;

    return {
      success: true,
      manaCost: this.skill2ManaCost,
      stunned: stunSuccess,
    };
  }

  getStunDuration(): number {
    return this.skill2StunDuration * 1000; // Convert to milliseconds
  }

  private createBeastAura() {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(9);

    const duration = this.skill2Duration * 1000;
    const startTime = Date.now();

    // Store reference for cleanup
    this.activeSkill2Effects.push(graphics);

    // Animate pulsing dark aura
    const updateAura = () => {
      if (!graphics || !graphics.scene) return;

      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        graphics.destroy();
        const index = this.activeSkill2Effects.indexOf(graphics);
        if (index > -1) {
          this.activeSkill2Effects.splice(index, 1);
        }
        return;
      }

      graphics.clear();

      // Pulsing effect
      const pulse = Math.sin(elapsed / 200) * 0.3 + 0.5;
      const radius = 50 + pulse * 20;

      // Dark purple/black aura
      graphics.lineStyle(4, 0x4b0082, pulse);
      graphics.strokeCircle(this.player.x, this.player.y, radius);

      graphics.lineStyle(2, 0x8b008b, pulse * 0.7);
      graphics.strokeCircle(this.player.x, this.player.y, radius + 10);
    };

    // Update every frame
    const interval = this.scene.time.addEvent({
      delay: 16,
      callback: updateAura,
      loop: true
    });

    // Cleanup interval after duration
    this.scene.time.delayedCall(duration, () => {
      interval.remove();
    });
  }

  // Ultimate: Berserker Armor
  useUltimate(currentMana: number, currentAtk: number): {
    success: boolean;
    manaCost: number;
    damage: number;
  } {
    if (this.ultiCooldown > 0 || currentMana < this.ultiManaCost) {
      return { success: false, manaCost: 0, damage: 0 };
    }

    // Activate ultimate
    this.ultiActive = true;
    this.ultiEndTime = Date.now() + (this.ultiDuration * 1000);
    this.ultiCurrentDpsMultiplier = 1.0;
    this.ultiLastMultiplierUpdate = Date.now();

    // Show ultimate image with effects
    this.showUltiImage();

    // Calculate initial burst damage (500% of attack)
    const burstDamage = currentAtk * this.ultiDamageMultiplier;

    // Set cooldown
    this.ultiCooldown = this.ultiCooldownMax;

    return {
      success: true,
      manaCost: this.ultiManaCost,
      damage: burstDamage
    };
  }

  private showUltiImage() {
    // Create fullscreen dark overlay
    const overlay = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0x000000,
      0.8
    );
    overlay.setDepth(100);
    overlay.setScrollFactor(0);

    // Create the ulti image
    this.ultiImage = this.scene.add.image(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      'guts_ulti'
    );
    this.ultiImage.setDepth(101);
    this.ultiImage.setScrollFactor(0);
    this.ultiImage.setScale(0.8);
    this.ultiImage.setAlpha(0);

    // Create blood particles
    this.createBloodEffect();

    // Dramatic entrance animation
    this.scene.tweens.add({
      targets: this.ultiImage,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Power2'
    });

    // Screen shake effect
    this.scene.cameras.main.shake(1000, 0.01);

    // Flash effect
    this.scene.cameras.main.flash(500, 255, 0, 0);

    // Fade out after 1 second
    this.scene.time.delayedCall(1000, () => {
      this.scene.tweens.add({
        targets: [this.ultiImage, overlay],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          if (this.ultiImage) this.ultiImage.destroy();
          overlay.destroy();
          this.ultiImageDisplayed = true;
        }
      });
    });
  }

  private createBloodEffect() {
    // Create blood splatter particles
    const particles = this.scene.add.particles(0, 0, 'guts_ulti', {
      speed: { min: 200, max: 400 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 800,
      blendMode: 'ADD',
      frequency: 50,
      maxParticles: 30,
      tint: 0xff0000,
    });

    particles.setDepth(102);
    particles.setPosition(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY
    );
    particles.setScrollFactor(0);

    // Stop after 1 second
    this.scene.time.delayedCall(1000, () => {
      particles.stop();
      this.scene.time.delayedCall(1000, () => {
        particles.destroy();
      });
    });
  }

  // Getters
  getSkill1Cooldown(): number {
    return this.skill1Cooldown / this.skill1CooldownMax;
  }

  getSkill2Cooldown(): number {
    return this.skill2Cooldown / this.skill2CooldownMax;
  }

  getUltimateCooldown(): number {
    return this.ultiCooldown / this.ultiCooldownMax;
  }

  isSkill2Active(): boolean {
    return this.skill2Active;
  }

  isUltimateActive(): boolean {
    return this.ultiActive;
  }

  getUltimateDpsMultiplier(): number {
    return this.ultiCurrentDpsMultiplier;
  }

  getSkill1Effects(): Phaser.GameObjects.Arc[] {
    return this.activeSkill1Effects;
  }

  getSkill2Effects(): Phaser.GameObjects.Graphics[] {
    return this.activeSkill2Effects;
  }

  // Check if player is invincible (either from skill2 or ultimate)
  isInvincible(): boolean {
    return this.skill2Active || this.ultiActive;
  }
}
