import Phaser from 'phaser';

export class FernSkills {
  private scene: Phaser.Scene;
  private player: Phaser.GameObjects.Image;

  // Skill A (AOE Fire) properties
  private skill1Cooldown = 0;
  private skill1CooldownMax = 0.8; // 0.8 second cooldown (spammable)
  private skill1ManaCost = 5;
  private skill1StackCount = 1; // Start at 1 stack, not 0
  private skill1MaxStacks = 30;
  private skill1DamageBonus = 0.2; // 20% per stack
  private lastSkill1Position: { x: number; y: number } | null = null;
  private skill1MoveThreshold = 10; // pixels moved before losing stacks
  private skill1HitCooldown = 0.2; // Can hit once every 0.2 seconds
  private lastSkill1HitTime = 0;

  // Skill E (Zoltraak) properties
  private skill2Cooldown = 0;
  private skill2CooldownMax = 10; // 10 second cooldown
  private skill2ManaCost = 15;
  private skill2DamageMultiplier = 30; // 30x damage of skill A

  private activeSkill1Effects: Phaser.GameObjects.Arc[] = [];
  private activeSkill2Effects: Phaser.GameObjects.Image[] = [];

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

    // Check if player moved significantly (reset stacks if moved)
    if (this.lastSkill1Position) {
      const distance = Phaser.Math.Distance.Between(
        this.lastSkill1Position.x,
        this.lastSkill1Position.y,
        this.player.x,
        this.player.y
      );

      if (distance > this.skill1MoveThreshold) {
        this.skill1StackCount = 1; // Reset to 1, not 0
        this.lastSkill1Position = null;
      }
    }
  }

  canHitWithSkill1(): boolean {
    const now = Date.now();
    if (now - this.lastSkill1HitTime >= this.skill1HitCooldown * 1000) {
      this.lastSkill1HitTime = now;
      return true;
    }
    return false;
  }

  // Skill A: AOE Fire Circle
  useSkill1(currentMana: number): { success: boolean; manaCost: number; damage: number; stackCount: number } {
    if (this.skill1Cooldown > 0 || currentMana < this.skill1ManaCost) {
      return { success: false, manaCost: 0, damage: 0, stackCount: this.skill1StackCount };
    }

    // Check if player moved since last cast
    const currentPos = { x: this.player.x, y: this.player.y };
    if (this.lastSkill1Position) {
      const distance = Phaser.Math.Distance.Between(
        this.lastSkill1Position.x,
        this.lastSkill1Position.y,
        currentPos.x,
        currentPos.y
      );

      if (distance > this.skill1MoveThreshold) {
        // Player moved - reset stacks
        this.skill1StackCount = 1;
      } else {
        // Player didn't move - increment stacks (max 30)
        if (this.skill1StackCount < this.skill1MaxStacks) {
          this.skill1StackCount++;
        }
      }
    }

    // Calculate damage with stacks (multiply by 1.2 per stack)
    const baseDamage = 15;
    const damageMultiplier = Math.pow(1.2, this.skill1StackCount - 1); // Start at 1x for stack 1
    const totalDamage = baseDamage * damageMultiplier;

    // Create expanding fire AOE
    this.createFireAOE(damageMultiplier);

    // Update position tracking
    this.lastSkill1Position = currentPos;

    // Set cooldown
    this.skill1Cooldown = this.skill1CooldownMax;

    return {
      success: true,
      manaCost: this.skill1ManaCost,
      damage: totalDamage,
      stackCount: this.skill1StackCount
    };
  }

  private createFireAOE(damageMultiplier: number) {
    const startRadius = 30;
    const maxRadius = 180;
    const duration = 800;

    // Create blue fire circle
    const fireCircle = this.scene.add.circle(
      this.player.x,
      this.player.y,
      startRadius,
      0x4169e1, // Royal blue for fire
      0.6
    );
    fireCircle.setStrokeStyle(4, 0x1e90ff, 0.9);
    fireCircle.setDepth(10);

    // Add physics
    this.scene.physics.add.existing(fireCircle);
    const body = fireCircle.body as Phaser.Physics.Arcade.Body;
    body.setCircle(startRadius);

    this.activeSkill1Effects.push(fireCircle);

    // Store damage info on the circle
    (fireCircle as any).damageAmount = 15;
    (fireCircle as any).isFernSkill1 = true;
    (fireCircle as any).stackMultiplier = damageMultiplier;
    (fireCircle as any).hasHit = false; // Track if this AOE already hit

    // Expanding animation
    this.scene.tweens.add({
      targets: fireCircle,
      scale: maxRadius / startRadius,
      alpha: 0.3,
      duration: duration,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        // Update physics body to match visual
        if (fireCircle && fireCircle.scene) {
          const currentRadius = startRadius * fireCircle.scale;
          body.setCircle(currentRadius);
          body.setOffset(-currentRadius, -currentRadius);
        }
      },
      onComplete: () => {
        // Fade out
        this.scene.tweens.add({
          targets: fireCircle,
          alpha: 0,
          duration: 200,
          onComplete: () => {
            if (fireCircle && fireCircle.scene) {
              fireCircle.destroy();
            }
            const index = this.activeSkill1Effects.indexOf(fireCircle);
            if (index > -1) {
              this.activeSkill1Effects.splice(index, 1);
            }
          }
        });
      }
    });
  }

  // Skill E: Zoltraak (Laser beam)
  useSkill2(currentMana: number, mouseX: number, mouseY: number): { success: boolean; manaCost: number; damage: number } {
    if (this.skill2Cooldown > 0 || currentMana < this.skill2ManaCost) {
      return { success: false, manaCost: 0, damage: 0 };
    }

    // Calculate damage (30x base skill damage)
    const baseDamage = 15 * this.skill2DamageMultiplier;

    // Create Zoltraak laser
    this.createZoltraak(mouseX, mouseY);

    // Set cooldown
    this.skill2Cooldown = this.skill2CooldownMax;

    return {
      success: true,
      manaCost: this.skill2ManaCost,
      damage: baseDamage
    };
  }

  private createZoltraak(mouseX: number, mouseY: number) {
    // Calculate angle to mouse
    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      mouseX,
      mouseY
    );

    // Create Zoltraak sprite (image is vertical, so we rotate from -90 degrees)
    const zoltraak = this.scene.add.image(this.player.x, this.player.y, 'zoltraak');
    // Image is vertical by default, so we add angle + 90 degrees to orient it correctly
    zoltraak.setRotation(angle + Math.PI / 2);
    zoltraak.setScale(1.2);
    zoltraak.setDepth(15);
    zoltraak.setAlpha(0.9);

    // Add physics
    this.scene.physics.add.existing(zoltraak);
    const body = zoltraak.body as Phaser.Physics.Arcade.Body;

    // Since image is vertical, hitbox should be tall and thin
    // After rotation, we need to set the hitbox based on the original vertical orientation
    body.setSize(zoltraak.width * 0.3, zoltraak.height * 1.2);

    this.activeSkill2Effects.push(zoltraak);

    // Store damage info
    (zoltraak as any).damageAmount = 15 * this.skill2DamageMultiplier;
    (zoltraak as any).isFernSkill2 = true;
    (zoltraak as any).hasHit = false; // Track if already hit

    // Move in direction
    const speed = 800;
    body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    // Auto-destroy after traveling distance or hitting edge
    this.scene.time.delayedCall(1500, () => {
      if (zoltraak && zoltraak.scene) {
        // Fade out effect
        this.scene.tweens.add({
          targets: zoltraak,
          alpha: 0,
          duration: 150,
          onComplete: () => {
            if (zoltraak && zoltraak.scene) {
              zoltraak.destroy();
            }
          }
        });
      }
      const index = this.activeSkill2Effects.indexOf(zoltraak);
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

  getSkill1StackCount(): number {
    return this.skill1StackCount;
  }

  getSkill1Effects(): Phaser.GameObjects.Arc[] {
    return this.activeSkill1Effects;
  }

  getSkill2Effects(): Phaser.GameObjects.Image[] {
    return this.activeSkill2Effects;
  }

  resetStacks() {
    this.skill1StackCount = 0;
  }
}
