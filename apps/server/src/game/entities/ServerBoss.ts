/**
 * Server-side Boss entity
 * Authoritative boss state and AI logic
 */

export interface BossAttack {
  id: string;
  type: 'laser' | 'aoe' | 'expandingCircle';
  damage: number;
  x: number;
  y: number;
  angle?: number; // For laser
  radius?: number; // For AOE and expanding circles
  width?: number; // For laser
  height?: number; // For laser
  active: boolean;
  spawnTime: number;
  expiresAt: number;
}

export interface BossState {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  rageCount: number;
  barsDefeated: number;
  isStunned: boolean;
  stunEndTime: number;
  attacks: BossAttack[];
  velocityX: number;
  velocityY: number;
  defense: number;
  defPen: number;
}

export class ServerBoss {
  private x: number;
  private y: number;
  private hp: number;
  private maxHp: number;
  private rageCount = 0;
  private barsDefeated = 0;
  private barHpIncrement = 500;

  private defense = 5000;
  private defPen = 0;
  private speed = 100;

  // Attack damages
  private laserDamage = 8;
  private aoeDamage = 10;
  private expandingCircleDamage = 15;

  // Attack cooldowns
  private lastLaserTime = 0;
  private laserCooldown = 5000;
  private lastAoeTime = 0;
  private aoeCooldown = 7000;
  private lastExpandingCircleTime = 0;
  private expandingCircleCooldown = 8000;

  // Movement
  private velocityX = 0;
  private velocityY = 0;
  private moveDirection = { x: 1, y: 0 };
  private moveTime = 0;
  private moveChangeCooldown = 3000;
  private speedMultiplier = 1;

  // Stun system
  private isStunned = false;
  private stunEndTime = 0;

  // Attacks
  private attacks: BossAttack[] = [];
  private attackIdCounter = 0;

  // World bounds
  private worldWidth: number;
  private worldHeight: number;

  constructor(x: number, y: number, playerCount: number, worldWidth: number, worldHeight: number) {
    this.x = x;
    this.y = y;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    // Calculate initial HP with player scaling
    const baseHp = 100;
    this.maxHp = baseHp * Math.pow(1.5, playerCount - 1);
    this.hp = this.maxHp;
  }

  update(time: number, delta: number, playerPositions: { x: number; y: number }[]): void {
    // Check if stun has expired
    if (this.isStunned && time >= this.stunEndTime) {
      this.isStunned = false;
    }

    // If stunned, skip all actions
    if (this.isStunned) {
      this.velocityX = 0;
      this.velocityY = 0;
      return;
    }

    // Get closest player position for targeting
    const targetPos = this.getClosestPlayer(playerPositions);

    // Movement
    this.updateMovement(time, targetPos, delta);

    // Laser attack
    if (time - this.lastLaserTime > this.laserCooldown) {
      this.shootLaser(targetPos, time);
      this.lastLaserTime = time;
    }

    // AOE attack
    if (time - this.lastAoeTime > this.aoeCooldown) {
      this.spawnAoeCircle(targetPos, time);
      this.lastAoeTime = time;
    }

    // Expanding circle attack
    if (time - this.lastExpandingCircleTime > this.expandingCircleCooldown) {
      this.spawnExpandingCircle(time);
      this.lastExpandingCircleTime = time;
    }

    // Update attacks (remove expired ones)
    this.updateAttacks(time);
  }

  private getClosestPlayer(playerPositions: { x: number; y: number }[]): { x: number; y: number } {
    if (playerPositions.length === 0) {
      return { x: this.worldWidth / 2, y: this.worldHeight / 2 };
    }

    let closestPos = playerPositions[0];
    let closestDist = this.distance(this.x, this.y, closestPos.x, closestPos.y);

    for (let i = 1; i < playerPositions.length; i++) {
      const dist = this.distance(this.x, this.y, playerPositions[i].x, playerPositions[i].y);
      if (dist < closestDist) {
        closestDist = dist;
        closestPos = playerPositions[i];
      }
    }

    return closestPos;
  }

  private distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  private updateMovement(time: number, targetPos: { x: number; y: number }, delta: number): void {
    // Change direction periodically
    if (time - this.moveTime > this.moveChangeCooldown) {
      const rand = Math.random();

      if (rand < 0.3) {
        // Move horizontally
        this.moveDirection = {
          x: Math.random() > 0.5 ? 1 : -1,
          y: 0
        };
      } else if (rand < 0.5) {
        // Move vertically
        this.moveDirection = {
          x: 0,
          y: Math.random() > 0.5 ? 1 : -1
        };
      } else if (rand < 0.7) {
        // Move diagonally
        this.moveDirection = {
          x: Math.random() > 0.5 ? 1 : -1,
          y: Math.random() > 0.5 ? 1 : -1
        };
      } else {
        // Move towards player
        const angle = Math.atan2(targetPos.y - this.y, targetPos.x - this.x);
        this.moveDirection = {
          x: Math.cos(angle),
          y: Math.sin(angle)
        };
      }

      // Random speed burst
      this.speedMultiplier = Math.random() < 0.4 ? 1.8 : 1;
      this.moveTime = time;
    }

    // Apply movement
    const currentSpeed = this.speed * this.speedMultiplier;
    this.velocityX = currentSpeed * this.moveDirection.x;
    this.velocityY = currentSpeed * this.moveDirection.y;

    // Update position (delta in milliseconds, convert to seconds)
    const deltaSeconds = delta / 1000;
    this.x += this.velocityX * deltaSeconds;
    this.y += this.velocityY * deltaSeconds;

    // Clamp to world bounds
    this.x = Math.max(50, Math.min(this.worldWidth - 50, this.x));
    this.y = Math.max(50, Math.min(this.worldHeight - 50, this.y));
  }

  private shootLaser(targetPos: { x: number; y: number }, time: number): void {
    const angle = Math.atan2(targetPos.y - this.y, targetPos.x - this.x);

    const attackId = `laser_${this.attackIdCounter++}`;

    // Create laser attack (active after 1 second warning)
    const attack: BossAttack = {
      id: attackId,
      type: 'laser',
      damage: this.laserDamage,
      x: this.x,
      y: this.y,
      angle: angle,
      width: 20,
      height: 600,
      active: false,
      spawnTime: time,
      expiresAt: time + 1800 // 1s warning + 0.8s active
    };

    this.attacks.push(attack);

    // Activate laser after 1 second
    setTimeout(() => {
      attack.active = true;
    }, 1000);
  }

  private spawnAoeCircle(targetPos: { x: number; y: number }, time: number): void {
    // Spawn 3 AOE circles
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const angleToPlayer = Math.atan2(targetPos.y - this.y, targetPos.x - this.x);
        const distance = 150 + Math.random() * 250;
        const angleVariation = (Math.random() * 90 - 45) * Math.PI / 180;
        const finalAngle = angleToPlayer + angleVariation;

        const x = Math.max(100, Math.min(this.worldWidth - 100,
          this.x + Math.cos(finalAngle) * distance));
        const y = Math.max(150, Math.min(this.worldHeight - 100,
          this.y + Math.sin(finalAngle) * distance));

        const attackId = `aoe_${this.attackIdCounter++}`;

        // Create AOE attack (active after 1.5s warning)
        const attack: BossAttack = {
          id: attackId,
          type: 'aoe',
          damage: this.aoeDamage,
          x,
          y,
          radius: 70,
          active: false,
          spawnTime: time + i * 500,
          expiresAt: time + i * 500 + 2000 // 1.5s warning + 0.5s active
        };

        this.attacks.push(attack);

        // Activate AOE after 1.5 seconds
        setTimeout(() => {
          attack.active = true;
        }, 1500);
      }, i * 500);
    }
  }

  private spawnExpandingCircle(time: number): void {
    const attackId = `expanding_${this.attackIdCounter++}`;
    const maxRadius = 250;

    // Create expanding circle attack (active after 2s expansion)
    const attack: BossAttack = {
      id: attackId,
      type: 'expandingCircle',
      damage: this.expandingCircleDamage,
      x: this.x,
      y: this.y,
      radius: 50, // Will expand to maxRadius
      active: false,
      spawnTime: time,
      expiresAt: time + 2300 // 2s expansion + 0.3s explosion
    };

    this.attacks.push(attack);

    // Expand radius over 2 seconds, then activate
    const expandDuration = 2000;
    const expandSteps = 20;
    const stepDuration = expandDuration / expandSteps;
    const radiusIncrement = (maxRadius - 50) / expandSteps;

    let step = 0;
    const expandInterval = setInterval(() => {
      step++;
      attack.radius = 50 + radiusIncrement * step;

      // Update position to follow boss during expansion
      attack.x = this.x;
      attack.y = this.y;

      if (step >= expandSteps) {
        clearInterval(expandInterval);
        attack.active = true;
        attack.radius = maxRadius;
      }
    }, stepDuration);
  }

  private updateAttacks(time: number): void {
    // Remove expired attacks
    this.attacks = this.attacks.filter(attack => time < attack.expiresAt);
  }

  takeDamage(amount: number): { barDefeated: boolean; newBarMaxHp?: number; newRageCount?: number } {
    let remainingDamage = amount;
    let barWasDefeated = false;
    let newMaxHp = this.maxHp;

    // Apply damage, potentially across multiple bars
    while (remainingDamage > 0) {
      const damageToThisBar = Math.min(remainingDamage, this.hp);
      this.hp -= damageToThisBar;
      remainingDamage -= damageToThisBar;

      // Check if bar is defeated
      if (this.hp <= 0 && remainingDamage >= 0) {
        barWasDefeated = true;
        this.barsDefeated++;
        this.rageCount++;

        // Calculate new bar HP
        newMaxHp = this.barHpIncrement * (this.barsDefeated + 1);
        this.maxHp = newMaxHp;
        this.hp = newMaxHp;

        // If there's overflow damage, it will be applied in next iteration
      } else {
        // No more bars to defeat, exit loop
        break;
      }
    }

    if (barWasDefeated) {
      return { barDefeated: true, newBarMaxHp: newMaxHp, newRageCount: this.rageCount };
    }

    return { barDefeated: false };
  }

  stun(duration: number, currentTime: number): void {
    this.isStunned = true;
    this.stunEndTime = currentTime + duration;
  }

  isDead(): boolean {
    return this.hp <= 0 && this.barsDefeated > 0;
  }

  getState(): BossState {
    return {
      x: this.x,
      y: this.y,
      hp: this.hp,
      maxHp: this.maxHp,
      rageCount: this.rageCount,
      barsDefeated: this.barsDefeated,
      isStunned: this.isStunned,
      stunEndTime: this.stunEndTime,
      attacks: this.attacks,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      defense: this.defense,
      defPen: this.defPen
    };
  }

  // Check if a point is hit by any active attack
  checkCollision(x: number, y: number): { hit: boolean; damage: number; attackType?: string } {
    for (const attack of this.attacks) {
      if (!attack.active) continue;

      if (attack.type === 'laser') {
        // Check laser collision (line segment)
        if (this.checkLaserCollision(x, y, attack)) {
          return { hit: true, damage: attack.damage, attackType: 'laser' };
        }
      } else if (attack.type === 'aoe' || attack.type === 'expandingCircle') {
        // Check circle collision
        const dist = this.distance(x, y, attack.x, attack.y);
        if (dist <= attack.radius!) {
          return { hit: true, damage: attack.damage, attackType: attack.type };
        }
      }
    }

    return { hit: false, damage: 0 };
  }

  private checkLaserCollision(x: number, y: number, attack: BossAttack): boolean {
    // Laser is a rotated rectangle
    // Simplified collision: check distance to laser line
    const laserLength = attack.height! / 2;
    const laserEndX = attack.x + Math.cos(attack.angle!) * laserLength;
    const laserEndY = attack.y + Math.sin(attack.angle!) * laserLength;

    // Distance from point to line segment
    const dist = this.distanceToLineSegment(
      x, y,
      attack.x, attack.y,
      laserEndX, laserEndY
    );

    return dist <= attack.width! / 2;
  }

  private distanceToLineSegment(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      return this.distance(px, py, x1, y1);
    }

    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));

    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;

    return this.distance(px, py, closestX, closestY);
  }
}
