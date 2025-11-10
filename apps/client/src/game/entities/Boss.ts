import Phaser from 'phaser';
import { ProgressiveBossHealth } from '../systems/ProgressiveBossHealth';

interface LaserData {
  laser: Phaser.GameObjects.Rectangle;
  warning: Phaser.GameObjects.Rectangle | null;
  startTime: number;
  active: boolean;
}

export class Boss {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Image;
  private healthSystem: ProgressiveBossHealth;
  private speed = 100;
  private laserDamage = 8;
  private aoeDamage = 10;
  private expandingCircleDamage = 15;
  private defPen = 0;
  private defense = 5000; // Boss defense stat
  private critResistance = 2000; // Boss resistance to crits
  private experienceReward = 500;

  // Attack groups
  private activeLasers: LaserData[] = [];
  private aoeCircles: Phaser.Physics.Arcade.Group;
  private expandingCircles: Phaser.Physics.Arcade.Group;
  private allAttacks: Phaser.Physics.Arcade.Group;

  // Attack timers
  private lastLaserTime = 0;
  private laserCooldown = 5000;
  private lastAoeTime = 0;
  private aoeCooldown = 7000;
  private lastExpandingCircleTime = 0;
  private expandingCircleCooldown = 8000;

  // Movement
  private moveDirection = { x: 1, y: 0 };
  private moveTime = 0;
  private moveChangeCooldown = 3000;
  private speedMultiplier = 1; // For acceleration bursts

  // Stun system
  private isStunned = false;
  private stunEndTime = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, playerCount: number = 1) {
    this.scene = scene;

    // Initialize progressive health system
    this.healthSystem = new ProgressiveBossHealth(100, playerCount);

    // Create boss sprite using the ant image
    this.sprite = scene.add.image(x, y, 'boss-ant');
    this.sprite.setScale(1.0); // Slightly larger boss
    scene.physics.add.existing(this.sprite);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);

    // Set physics body size to match sprite
    const width = this.sprite.width * this.sprite.scaleX;
    const height = this.sprite.height * this.sprite.scaleY;
    body.setSize(width * 0.7, height * 0.7); // Hitbox légèrement plus petite que le visuel

    // Create attack groups
    this.aoeCircles = scene.physics.add.group();
    this.expandingCircles = scene.physics.add.group();
    this.allAttacks = scene.physics.add.group();
  }

  update(time: number, _delta: number, playerPos: { x: number; y: number }) {
    // Check if stun has expired
    if (this.isStunned && time >= this.stunEndTime) {
      this.isStunned = false;
      this.sprite.clearTint();
    }

    // If stunned, skip all actions
    if (this.isStunned) {
      return;
    }

    // Movement pattern
    this.updateMovement(time);

    // Laser attack
    if (time - this.lastLaserTime > this.laserCooldown) {
      this.shootLaser(playerPos, time);
      this.lastLaserTime = time;
    }

    // AOE attack
    if (time - this.lastAoeTime > this.aoeCooldown) {
      this.spawnAoeCircle(playerPos);
      this.lastAoeTime = time;
    }

    // Expanding circle attack
    if (time - this.lastExpandingCircleTime > this.expandingCircleCooldown) {
      this.spawnExpandingCircle(time);
      this.lastExpandingCircleTime = time;
    }

    // Update lasers to follow boss
    this.updateLasers(time);

    // Update attacks
    this.updateAttacks();
  }

  private updateMovement(time: number) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    // Change direction and speed periodically
    if (time - this.moveTime > this.moveChangeCooldown) {
      const rand = Math.random();

      if (rand < 0.3) {
        // 30% - Move horizontally (left or right)
        this.moveDirection = {
          x: Math.random() > 0.5 ? 1 : -1,
          y: 0
        };
      } else if (rand < 0.5) {
        // 20% - Move vertically (up or down)
        this.moveDirection = {
          x: 0,
          y: Math.random() > 0.5 ? 1 : -1
        };
      } else if (rand < 0.7) {
        // 20% - Move diagonally
        this.moveDirection = {
          x: Math.random() > 0.5 ? 1 : -1,
          y: Math.random() > 0.5 ? 1 : -1
        };
      } else {
        // 30% - Move towards player
        const playerPos = this.scene.data.get('playerPosition');
        if (playerPos) {
          const angle = Phaser.Math.Angle.Between(
            this.sprite.x,
            this.sprite.y,
            playerPos.x,
            playerPos.y
          );
          this.moveDirection = {
            x: Math.cos(angle),
            y: Math.sin(angle)
          };
        }
      }

      // Random speed burst (40% chance)
      this.speedMultiplier = Math.random() < 0.4 ? 1.8 : 1;

      this.moveTime = time;
    }

    // Apply movement with current speed multiplier
    const currentSpeed = this.speed * this.speedMultiplier;
    body.setVelocityX(currentSpeed * this.moveDirection.x);
    body.setVelocityY(currentSpeed * this.moveDirection.y);
  }

  private shootLaser(playerPos: { x: number; y: number }, time: number) {
    // Calculate angle towards player
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x,
      this.sprite.y,
      playerPos.x,
      playerPos.y
    );

    // Warning indicator that follows the boss
    const warning = this.scene.add.rectangle(
      this.sprite.x,
      this.sprite.y,
      15,
      600,
      0xffff00,
      0.3
    );
    warning.setRotation(angle + Math.PI / 2);
    warning.setDepth(1);

    // Create laser data
    const laserData: LaserData = {
      laser: warning as any, // Temporary, will be replaced
      warning: warning,
      startTime: time,
      active: false,
    };

    this.activeLasers.push(laserData);

    // After 1 second, fire the laser
    this.scene.time.delayedCall(1000, () => {
      if (!laserData.warning || !laserData.warning.scene) return;

      const currentAngle = laserData.warning.rotation;
      laserData.warning.destroy();
      laserData.warning = null;

      // Create actual laser - MUCH smaller hitbox
      const laser = this.scene.add.rectangle(
        this.sprite.x,
        this.sprite.y,
        20,
        600,
        0xff00ff,
        1
      );
      laser.setRotation(currentAngle);
      laser.setStrokeStyle(2, 0xffffff);
      laser.setDepth(2);

      this.scene.physics.add.existing(laser);
      const body = laser.body as Phaser.Physics.Arcade.Body;

      // Set proper hitbox for the laser - REDUCED SIZE
      body.setSize(15, 600);
      body.setOffset(2.5, 0);

      laserData.laser = laser;
      laserData.active = true;
      laserData.startTime = time;

      this.allAttacks.add(laser);

      // Store damage info
      (laser as any).damageAmount = this.laserDamage;

      // Auto-destroy after 0.8 seconds (beaucoup plus court)
      this.scene.time.delayedCall(800, () => {
        if (laser && laser.scene) {
          laser.destroy();
        }
        // Remove from activeLasers
        const index = this.activeLasers.indexOf(laserData);
        if (index > -1) {
          this.activeLasers.splice(index, 1);
        }
      });
    });
  }

  private updateLasers(_time: number) {
    // Update all active lasers and warnings to follow the boss
    this.activeLasers.forEach((laserData) => {
      if (laserData.warning && laserData.warning.scene) {
        // Update warning position to follow boss
        laserData.warning.setPosition(this.sprite.x, this.sprite.y);
      } else if (laserData.active && laserData.laser && laserData.laser.scene) {
        // Update active laser position to follow boss
        laserData.laser.setPosition(this.sprite.x, this.sprite.y);
      }
    });

    // Clean up destroyed lasers
    this.activeLasers = this.activeLasers.filter(
      (laserData) =>
        (laserData.warning && laserData.warning.scene) ||
        (laserData.laser && laserData.laser.scene)
    );
  }

  private spawnAoeCircle(playerPos: { x: number; y: number }) {
    // Spawn 3 AOE circles, biased towards player direction
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 500, () => {
        // Calculate direction towards player
        const angleToPlayer = Phaser.Math.Angle.Between(
          this.sprite.x,
          this.sprite.y,
          playerPos.x,
          playerPos.y
        );

        // Random distance from boss
        const distance = Phaser.Math.Between(150, 400);

        // Add some randomness to angle (±45 degrees)
        const angleVariation = Phaser.Math.DegToRad(Phaser.Math.Between(-45, 45));
        const finalAngle = angleToPlayer + angleVariation;

        // Calculate position
        const x = this.sprite.x + Math.cos(finalAngle) * distance;
        const y = this.sprite.y + Math.sin(finalAngle) * distance;

        // Clamp to screen bounds
        const clampedX = Phaser.Math.Clamp(x, 100, this.scene.scale.width - 100);
        const clampedY = Phaser.Math.Clamp(y, 150, this.scene.scale.height - 100);

        // Warning circle
        const warning = this.scene.add.circle(clampedX, clampedY, 70, 0xff0000, 0.3);
        warning.setStrokeStyle(3, 0xff0000);

        // Pulsing animation
        this.scene.tweens.add({
          targets: warning,
          alpha: 0.6,
          scale: 1.1,
          duration: 500,
          yoyo: true,
          repeat: 2,
        });

        // After 1.5 seconds, activate the AOE
        this.scene.time.delayedCall(1500, () => {
          if (!warning || !warning.scene) return;
          warning.destroy();

          // Create damage circle
          const aoe = this.scene.add.circle(clampedX, clampedY, 70, 0xff0000, 0.8);
          this.scene.physics.add.existing(aoe);

          this.aoeCircles.add(aoe);
          this.allAttacks.add(aoe);

          // Store damage info
          (aoe as any).damageAmount = this.aoeDamage;

          // Explosion animation
          this.scene.tweens.add({
            targets: aoe,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              if (aoe && aoe.scene) {
                aoe.destroy();
              }
            },
          });
        });
      });
    }
  }

  private spawnExpandingCircle(_time: number) {
    // Create warning circle that shows the max size
    const maxRadius = 250;
    const warningCircle = this.scene.add.circle(
      this.sprite.x,
      this.sprite.y,
      maxRadius,
      0xff6600,
      0
    );
    warningCircle.setStrokeStyle(4, 0xff6600, 0.5);
    warningCircle.setDepth(0);

    // Pulsing warning animation
    this.scene.tweens.add({
      targets: warningCircle,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: 3,
    });

    // Create the expanding visual circle (NO DAMAGE during expansion)
    const expandingCircle = this.scene.add.circle(
      this.sprite.x,
      this.sprite.y,
      50,
      0xff3300,
      0.4
    );
    expandingCircle.setStrokeStyle(6, 0xff0000);
    expandingCircle.setDepth(1);

    // NO physics during expansion - it's just visual
    this.expandingCircles.add(expandingCircle);

    // Expand animation (2 seconds to reach max size)
    this.scene.tweens.add({
      targets: expandingCircle,
      scale: maxRadius / 50, // Scale from 50 to maxRadius
      duration: 2000,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        // Follow boss position during expansion
        if (expandingCircle && expandingCircle.scene) {
          expandingCircle.setPosition(this.sprite.x, this.sprite.y);
        }
        // Update warning circle position too
        if (warningCircle && warningCircle.scene) {
          warningCircle.setPosition(this.sprite.x, this.sprite.y);
        }
      },
      onComplete: () => {
        // EXPLOSION - Only NOW it does damage
        if (!expandingCircle || !expandingCircle.scene) return;

        // Destroy the visual expanding circle
        expandingCircle.destroy();

        // Create explosion damage circle - EXACT SIZE
        const explosionCircle = this.scene.add.circle(
          this.sprite.x,
          this.sprite.y,
          maxRadius,
          0xffff00,
          0.8
        );
        explosionCircle.setDepth(2);

        this.scene.physics.add.existing(explosionCircle);

        // Set the physics body to match EXACTLY the visual circle
        const explosionBody = explosionCircle.body as Phaser.Physics.Arcade.Body;
        explosionBody.setCircle(maxRadius);
        explosionBody.setOffset(-maxRadius, -maxRadius);

        // Add to attack group for damage detection
        this.allAttacks.add(explosionCircle);

        // Store damage info
        (explosionCircle as any).damageAmount = this.expandingCircleDamage;
        (explosionCircle as any).isExpandingCircle = true;

        // Flash and fade out - NO scale change to keep hitbox accurate
        this.scene.tweens.add({
          targets: explosionCircle,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            if (explosionCircle && explosionCircle.scene) {
              explosionCircle.destroy();
            }
          },
        });
      },
    });

    // Destroy warning circle after 2 seconds
    this.scene.time.delayedCall(2000, () => {
      if (warningCircle && warningCircle.scene) {
        warningCircle.destroy();
      }
    });
  }

  private updateAttacks() {
    // Clean up off-screen attacks from allAttacks group
    const toRemove: Phaser.GameObjects.GameObject[] = [];

    this.allAttacks.children.entries.forEach((attack) => {
      const obj = attack as any;
      if (!obj.scene) {
        toRemove.push(attack);
      } else if (
        obj.x < -200 ||
        obj.x > this.scene.scale.width + 200 ||
        obj.y < -200 ||
        obj.y > this.scene.scale.height + 200
      ) {
        toRemove.push(attack);
      }
    });

    toRemove.forEach((attack) => {
      this.allAttacks.remove(attack, true, true);
    });
  }

  takeDamage(amount: number) {
    const events = this.healthSystem.takeDamage(amount);

    // Check for bar defeats and emit events
    events.forEach(event => {
      if (event.type === 'barDefeated') {
        // Emit event for bar defeated
        this.scene.events.emit('bossBarDefeated', {
          rageCount: this.healthSystem.getRageCount(),
          barsDefeated: this.healthSystem.getBarsDefeated(),
          newBarMaxHp: event.newBarHp,
          overflow: event.overflow,
        });
      }
    });

    // Flash white effect
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (this.sprite && this.sprite.scene) {
        this.sprite.clearTint();
      }
    });
  }

  getHp() {
    return this.healthSystem.getCurrentBarHp();
  }

  getMaxHp() {
    return this.healthSystem.getCurrentBarMaxHp();
  }

  getRageCount() {
    return this.healthSystem.getRageCount();
  }

  getBarsDefeated() {
    return this.healthSystem.getBarsDefeated();
  }

  getNextBarMaxHp() {
    return this.healthSystem.getNextBarMaxHp();
  }

  getTotalDamageDealt() {
    return this.healthSystem.getTotalDamageDealt();
  }

  getDefense() {
    return this.defense;
  }

  getCritResistance() {
    return this.critResistance;
  }

  getSprite() {
    return this.sprite;
  }

  getAttacks() {
    return this.allAttacks;
  }

  getDamage(attackObject?: any) {
    // Return specific damage based on attack type
    if (attackObject) {
      if ((attackObject as any).damageAmount) {
        return (attackObject as any).damageAmount;
      }
    }
    // Default damage
    return this.aoeDamage;
  }

  getDefPen() {
    return this.defPen;
  }

  getExperienceReward() {
    return this.experienceReward;
  }

  isDead() {
    return this.healthSystem.getCurrentBarHp() <= 0 && this.healthSystem.getBarsDefeated() > 0;
  }

  stun(duration: number, currentTime: number) {
    this.isStunned = true;
    this.stunEndTime = currentTime + duration;

    // Visual feedback - yellow tint for stun
    this.sprite.setTint(0xffff00);

    // Stop movement
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
  }

  getIsStunned() {
    return this.isStunned;
  }
}
