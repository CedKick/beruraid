import Phaser from 'phaser';
import { StatsManager } from '../systems/PlayerStats';
import { FernSkills } from '../skills/FernSkills';
import { StarkSkills } from '../skills/StarkSkills';
import { GutsSkills } from '../skills/GutsSkills';

export class Player {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Image;
  private characterId: string;
  private currentDirection: 'up' | 'down' | 'left' | 'right' = 'down';
  private statsManager: StatsManager;
  private speed = 300;
  private isDodging = false;
  private dodgeDuration = 500; // 0.5 seconds
  private dodgeCooldown = 2000;
  private lastDodgeTime = 0;

  // Character-specific skills
  private fernSkills: FernSkills | null = null;
  private starkSkills: StarkSkills | null = null;
  private gutsSkills: GutsSkills | null = null;

  // Skills (for non-Fern characters)
  private skill1Cooldown = 3000;
  private skill2Cooldown = 5000;
  private lastSkill1Time = 0;
  private lastSkill2Time = 0;

  // Auto-attack system
  private lastMeleeAttackTime = 0;
  private lastRangedAttackTime = 0;
  private isAutoAttacking = false;
  private autoAttackTarget: { x: number; y: number } | null = null;
  private attackType: 'melee' | 'ranged' | null = null;

  // Mana regeneration
  private manaRegenRate = 2; // mana per second

  // Projectiles
  private projectiles: Phaser.Physics.Arcade.Group;
  private rangedProjectiles: Phaser.Physics.Arcade.Sprite[] = []; // Manage ranged separately

  constructor(scene: Phaser.Scene, x: number, y: number, characterId: string = 'stark') {
    this.scene = scene;
    this.characterId = characterId;
    this.statsManager = new StatsManager();

    // Create player sprite with character image
    this.sprite = scene.add.image(x, y, `${characterId}_down`);
    this.sprite.setScale(0.35); // Smaller player size
    scene.physics.add.existing(this.sprite);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);

    // Set physics body size
    const width = this.sprite.width * this.sprite.scaleX;
    const height = this.sprite.height * this.sprite.scaleY;
    body.setSize(width * 0.6, height * 0.6);

    // Create projectile group with proper config
    // NOTE: DO NOT set velocity defaults here - it resets projectile velocities!
    this.projectiles = scene.physics.add.group({
      maxSize: 50,
      runChildUpdate: false,
      allowGravity: false,
      velocityX: 0, // Explicitly set to 0 so it doesn't override
      velocityY: 0,
      immovable: false, // Allow projectiles to move
    });

    // Setup mouse input
    this.setupMouseInput();

    // Initialize character-specific skills
    if (characterId === 'fern') {
      this.fernSkills = new FernSkills(scene, this.sprite);
    } else if (characterId === 'stark') {
      this.starkSkills = new StarkSkills(scene, this.sprite);
    } else if (characterId === 'guts') {
      this.gutsSkills = new GutsSkills(scene, this.sprite);
    }
  }

  update(
    time: number,
    delta: number,
    movement: { up: boolean; down: boolean; left: boolean; right: boolean },
    actions: { dodge: boolean; skill1: boolean; skill2: boolean; ultimate?: boolean }
  ) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    // Movement
    let velocityX = 0;
    let velocityY = 0;

    if (movement.left) velocityX -= this.speed;
    if (movement.right) velocityX += this.speed;
    if (movement.up) velocityY -= this.speed;
    if (movement.down) velocityY += this.speed;

    // Update sprite direction based on movement
    if (velocityX !== 0 || velocityY !== 0) {
      let newDirection: 'up' | 'down' | 'left' | 'right' = this.currentDirection;

      // Prioritize vertical movement for sprite direction
      if (Math.abs(velocityY) > Math.abs(velocityX)) {
        newDirection = velocityY < 0 ? 'up' : 'down';
      } else if (velocityX !== 0) {
        newDirection = velocityX < 0 ? 'left' : 'right';
      }

      if (newDirection !== this.currentDirection) {
        this.currentDirection = newDirection;
        this.sprite.setTexture(`${this.characterId}_${newDirection}`);
      }
    }

    // Normalize diagonal movement
    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= 0.707;
      velocityY *= 0.707;
    }

    body.setVelocity(velocityX, velocityY);

    // Dodge
    if (actions.dodge && time - this.lastDodgeTime > this.dodgeCooldown) {
      this.dodge(time);
    }

    // Update dodge state
    if (this.isDodging && time - this.lastDodgeTime > this.dodgeDuration) {
      this.isDodging = false;
      this.sprite.setAlpha(1);
    }

    // Skills - Character specific handling
    if (this.fernSkills) {
      // Update Fern's skill system
      this.fernSkills.update(delta);

      // Fern's Skill A (spammable AOE)
      if (actions.skill1) {
        const stats = this.statsManager.getStats();
        const result = this.fernSkills.useSkill1(stats.currentMana);
        if (result.success) {
          this.statsManager.useMana(result.manaCost);
        }
      }

      // Fern's Skill E (Zoltraak)
      if (actions.skill2) {
        const stats = this.statsManager.getStats();
        const pointer = this.scene.input.activePointer;
        const worldX = pointer.x;
        const worldY = pointer.y;
        const result = this.fernSkills.useSkill2(stats.currentMana, worldX, worldY);
        if (result.success) {
          this.statsManager.useMana(result.manaCost);
        }
      }
    } else if (this.starkSkills) {
      // Update Stark's skill system
      this.starkSkills.update(delta);

      // Stark's Skill A (Stun AOE)
      if (actions.skill1) {
        const stats = this.statsManager.getStats();
        // Emit event to notify scene to handle stun logic
        this.scene.events.emit('starkUseStunSkill', { currentMana: stats.currentMana });
      }

      // Stark's Skill E (Damage Absorption Shield)
      if (actions.skill2) {
        const stats = this.statsManager.getStats();
        const result = this.starkSkills.useSkill2(stats.currentMana);
        if (result.success) {
          this.statsManager.useMana(result.manaCost);
        }
      }
    } else if (this.gutsSkills) {
      // Update Guts' skill system
      this.gutsSkills.update(delta);

      // Guts' Skill A (Berserker Rage - AOE that costs HP)
      if (actions.skill1) {
        const stats = this.statsManager.getStats();
        const isInvincible = this.gutsSkills.isInvincible();
        const result = this.gutsSkills.useSkill1(stats.currentHp, stats.maxHp, isInvincible);
        if (result.success) {
          // Take HP damage only if not invincible
          if (!isInvincible && result.hpCost > 0) {
            this.statsManager.takeDamage(result.hpCost);
          }
          // Emit event to notify scene about the AOE damage
          this.scene.events.emit('gutsUseRageSkill', { damage: result.damage });
        }
      }

      // Guts' Skill B (Beast of Darkness - Invincibility + Stun)
      if (actions.skill2) {
        const stats = this.statsManager.getStats();
        // Emit event to notify scene to handle boss stun logic
        this.scene.events.emit('gutsUseBeastSkill', { currentMana: stats.currentMana });
      }

      // Guts' Ultimate (Berserker Armor)
      if (actions.ultimate) {
        const stats = this.statsManager.getStats();
        const result = this.gutsSkills.useUltimate(stats.currentMana, stats.attack);
        if (result.success) {
          this.statsManager.useMana(result.manaCost);
          // Emit event for the initial burst damage
          this.scene.events.emit('gutsUseUltimate', { damage: result.damage });
        }
      }
    } else {
      // Default skills for other characters
      if (actions.skill1 && time - this.lastSkill1Time > this.skill1Cooldown) {
        this.useSkill1(time);
      }

      if (actions.skill2 && time - this.lastSkill2Time > this.skill2Cooldown) {
        this.useSkill2(time);
      }
    }

    // Auto-attack system
    this.updateAutoAttack(time);

    // Mana regeneration
    this.updateManaRegen(time, delta);

    // Update projectiles
    this.updateProjectiles();
  }

  private dodge(time: number) {
    this.isDodging = true;
    this.lastDodgeTime = time;
    this.sprite.setAlpha(0.5);

    // Dodge effect - simple visual feedback
    const dodgeCircle = this.scene.add.circle(
      this.sprite.x,
      this.sprite.y,
      30,
      0x00ffff,
      0.3
    );

    this.scene.tweens.add({
      targets: dodgeCircle,
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => dodgeCircle.destroy(),
    });
  }

  private useSkill1(time: number) {
    // Skill 1: Fireball - Shoots a projectile forward
    this.lastSkill1Time = time;

    const projectile = this.scene.add.circle(
      this.sprite.x,
      this.sprite.y - 30,
      10,
      0xff6600
    );

    this.scene.physics.add.existing(projectile);
    const body = projectile.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, -500);

    this.projectiles.add(projectile);

    // Add glow effect
    projectile.setStrokeStyle(2, 0xffaa00);
  }

  private useSkill2(time: number) {
    // Skill 2: AOE Explosion around player
    const manaCost = 20;

    if (!this.statsManager.useMana(manaCost)) {
      return; // Not enough mana
    }

    this.lastSkill2Time = time;

    const explosion = this.scene.add.circle(
      this.sprite.x,
      this.sprite.y,
      30,
      0xff0000,
      0.5
    );

    this.scene.physics.add.existing(explosion);

    // Expand animation - FIXED: use scale instead of radius
    this.scene.tweens.add({
      targets: explosion,
      scale: 3.3, // 30 * 3.3 ≈ 100 radius
      alpha: 0,
      duration: 500,
      onComplete: () => {
        if (explosion && explosion.scene) {
          explosion.destroy();
        }
      },
    });

    this.projectiles.add(explosion);
  }

  private updateProjectiles() {
    this.projectiles.children.entries.forEach((projectile) => {
      const obj = projectile as Phaser.GameObjects.Arc;
      // Remove projectiles that go off screen
      if (
        obj.y < -50 ||
        obj.y > this.scene.scale.height + 50 ||
        obj.x < -50 ||
        obj.x > this.scene.scale.width + 50
      ) {
        this.projectiles.remove(projectile, true, true);
      }
    });
  }

  private setupMouseInput() {
    // Handle both left and right clicks
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        // Left click - Melee attack
        this.isAutoAttacking = true;
        this.attackType = 'melee';
        this.autoAttackTarget = { x: pointer.worldX, y: pointer.worldY };
      } else if (pointer.rightButtonDown()) {
        // Right click - Ranged attack
        this.isAutoAttacking = true;
        this.attackType = 'ranged';
        this.autoAttackTarget = { x: pointer.worldX, y: pointer.worldY };
      }
    });

    // Update target position while holding mouse
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isAutoAttacking) {
        this.autoAttackTarget = { x: pointer.worldX, y: pointer.worldY };
      }
    });

    // Stop attacking on pointer up
    this.scene.input.on('pointerup', () => {
      this.isAutoAttacking = false;
      this.autoAttackTarget = null;
      this.attackType = null;
    });
  }

  private updateAutoAttack(time: number) {
    if (!this.isAutoAttacking || !this.autoAttackTarget) return;

    const stats = this.statsManager.getStats();

    if (this.attackType === 'melee') {
      const attackCooldown = 1000 / stats.attackSpeed;
      if (time - this.lastMeleeAttackTime > attackCooldown) {
        this.performMeleeAttack(time);
      }
    } else if (this.attackType === 'ranged') {
      // FIXED: 1 projectile per second (1000ms cooldown)
      const rangedCooldown = 1000;
      if (time - this.lastRangedAttackTime > rangedCooldown) {
        this.performRangedAttack(time);
      }
    }
  }

  private performMeleeAttack(time: number) {
    // Melee attack - short range slash
    this.lastMeleeAttackTime = time;

    const angle = Phaser.Math.Angle.Between(
      this.sprite.x,
      this.sprite.y,
      this.autoAttackTarget!.x,
      this.autoAttackTarget!.y
    );

    // Visual effect - slash
    const slash = this.scene.add.rectangle(
      this.sprite.x + Math.cos(angle) * 40,
      this.sprite.y + Math.sin(angle) * 40,
      50,
      10,
      0xffffff,
      0.8
    );
    slash.setRotation(angle);

    this.scene.physics.add.existing(slash);
    this.projectiles.add(slash);

    // Short-lived projectile
    this.scene.time.delayedCall(100, () => {
      if (slash && slash.scene) {
        slash.destroy();
      }
    });

    // Animation
    this.scene.tweens.add({
      targets: slash,
      alpha: 0,
      duration: 100,
    });
  }

  private performRangedAttack(time: number) {
    // Ranged attack - MAX 1 projectile per second (NO MANA COST)
    this.lastRangedAttackTime = time;

    if (!this.autoAttackTarget) return;

    // Calculate angle from player to mouse cursor
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x,
      this.sprite.y,
      this.autoAttackTarget.x,
      this.autoAttackTarget.y
    );

    // Calculate velocity components
    const speed = 800;
    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;

    // Create simple circle projectile
    const projectile = this.scene.add.circle(
      this.sprite.x,
      this.sprite.y,
      8,
      0x00ffff
    );
    projectile.setStrokeStyle(2, 0xffffff);

    // Enable physics
    this.scene.physics.add.existing(projectile);
    const body = projectile.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setCircle(8);

    // Set velocity - DON'T add to group, it resets velocity!
    body.velocity.x = velocityX;
    body.velocity.y = velocityY;

    // Store in separate array (NOT in the group!)
    this.rangedProjectiles.push(projectile as any);

    // Store damage info
    (projectile as any).damageAmount = 10;

    // Auto-destroy after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      if (projectile && projectile.scene) {
        const index = this.rangedProjectiles.indexOf(projectile as any);
        if (index > -1) {
          this.rangedProjectiles.splice(index, 1);
        }
        projectile.destroy();
      }
    });
  }

  private updateManaRegen(_time: number, delta: number) {
    // Regenerate mana over time
    const deltaInSeconds = delta / 1000;
    this.statsManager.regenerateMana(this.manaRegenRate * deltaInSeconds);
  }

  takeDamage(amount: number, attackerDefPen: number = 0) {
    // Check if invincible (dodging or Guts' skills)
    const isInvincible = this.isDodging || (this.gutsSkills && this.gutsSkills.isInvincible());

    if (!isInvincible) {
      const finalDamage = this.statsManager.calculateDamageTaken(amount, attackerDefPen);
      this.statsManager.takeDamage(finalDamage);

      // Flash red
      this.sprite.setTint(0xff0000);
      this.scene.time.delayedCall(100, () => {
        if (this.sprite && this.sprite.scene) {
          this.sprite.clearTint();
        }
      });

      // Check if dead
      if (!this.statsManager.isAlive()) {
        this.onDeath();
      }
    }
  }

  private onDeath() {
    // Death animation
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scale: 0,
      duration: 500,
      onComplete: () => {
        // Emit death event
        this.scene.events.emit('playerDeath');
      },
    });
  }

  gainExperience(amount: number) {
    const leveledUp = this.statsManager.gainExperience(amount);
    if (leveledUp) {
      // Level up visual effect
      const levelUpEffect = this.scene.add.circle(
        this.sprite.x,
        this.sprite.y,
        20,
        0xffd700,
        0.6
      );

      this.scene.tweens.add({
        targets: levelUpEffect,
        scale: 3,
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          if (levelUpEffect && levelUpEffect.scene) {
            levelUpEffect.destroy();
          }
        },
      });

      // Emit level up event
      this.scene.events.emit('playerLevelUp', this.statsManager.getStats().level);
    }
  }

  getHp() {
    return this.statsManager.getStats().currentHp;
  }

  getMaxHp() {
    return this.statsManager.getStats().maxHp;
  }

  getStats() {
    return this.statsManager.getStats();
  }

  getStatsManager() {
    return this.statsManager;
  }

  isInvincible() {
    return this.isDodging;
  }

  getSprite() {
    return this.sprite;
  }

  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  getDirection() {
    return this.currentDirection;
  }

  getSkill1Cooldown() {
    if (this.fernSkills) {
      return this.fernSkills.getSkill1Cooldown();
    }
    if (this.starkSkills) {
      return this.starkSkills.getSkill1Cooldown();
    }
    if (this.gutsSkills) {
      return this.gutsSkills.getSkill1Cooldown();
    }
    const remaining = Math.max(
      0,
      this.skill1Cooldown - (Date.now() - this.lastSkill1Time)
    );
    return remaining / this.skill1Cooldown;
  }

  getSkill2Cooldown() {
    if (this.fernSkills) {
      return this.fernSkills.getSkill2Cooldown();
    }
    if (this.starkSkills) {
      return this.starkSkills.getSkill2Cooldown();
    }
    if (this.gutsSkills) {
      return this.gutsSkills.getSkill2Cooldown();
    }
    const remaining = Math.max(
      0,
      this.skill2Cooldown - (Date.now() - this.lastSkill2Time)
    );
    return remaining / this.skill2Cooldown;
  }

  getUltimateCooldown() {
    if (this.gutsSkills) {
      return this.gutsSkills.getUltimateCooldown();
    }
    return 0;
  }

  getFernSkillStacks() {
    if (this.fernSkills) {
      return this.fernSkills.getSkill1StackCount();
    }
    return 0;
  }

  getStarkSkills() {
    return this.starkSkills;
  }

  getGutsSkills() {
    return this.gutsSkills;
  }

  isStarkShieldActive() {
    return this.starkSkills?.isShieldActive() || false;
  }

  getProjectiles() {
    return this.projectiles;
  }

  getRangedProjectiles() {
    return this.rangedProjectiles;
  }

  getFernSkills() {
    return this.fernSkills;
  }
}
