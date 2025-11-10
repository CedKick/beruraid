/**
 * Server-side Player entity
 * Authoritative player state and combat logic
 */

export interface PlayerStats {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  statPoints: number;
  maxHp: number;
  currentHp: number;
  maxMana: number;
  currentMana: number;
  attack: number;
  defense: number;
  defPen: number;
  critDamage: number;
  critRate: number;
  attackSpeed: number;
  damageBoost: number;
}

export interface ServerPlayerState {
  socketId: string;
  name: string;
  characterId: string;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  stats: PlayerStats;
  isDodging: boolean;
  isAlive: boolean;
  velocityX: number;
  velocityY: number;
}

export class ServerPlayer {
  public socketId: string;
  public name: string;
  public characterId: string;
  public x: number;
  public y: number;
  public direction: 'up' | 'down' | 'left' | 'right' = 'down';

  private stats: PlayerStats;
  private speed = 300;
  private velocityX = 0;
  private velocityY = 0;

  // Dodge system
  private isDodging = false;
  private dodgeDuration = 500;
  private dodgeEndTime = 0;

  // Mana regen
  private manaRegenRate = 2; // per second

  // Alive state
  private isAlive = true;

  constructor(socketId: string, name: string, characterId: string, x: number, y: number) {
    this.socketId = socketId;
    this.name = name;
    this.characterId = characterId;
    this.x = x;
    this.y = y;

    // Initialize default stats
    this.stats = {
      level: 1,
      experience: 0,
      experienceToNextLevel: 100,
      statPoints: 0,
      maxHp: 100,
      currentHp: 100,
      maxMana: 50,
      currentMana: 50,
      attack: 10,
      defense: 5,
      defPen: 0,
      critDamage: 1.5,
      critRate: 0.05,
      attackSpeed: 1,
      damageBoost: 0
    };
  }

  update(time: number, delta: number): void {
    // Update dodge state
    if (this.isDodging && time >= this.dodgeEndTime) {
      this.isDodging = false;
    }

    // Mana regeneration
    const deltaSeconds = delta / 1000;
    this.regenerateMana(this.manaRegenRate * deltaSeconds);
  }

  // Handle movement input from client
  handleMovement(input: { up: boolean; down: boolean; left: boolean; right: boolean }, delta: number): void {
    let velocityX = 0;
    let velocityY = 0;

    if (input.left) velocityX -= this.speed;
    if (input.right) velocityX += this.speed;
    if (input.up) velocityY -= this.speed;
    if (input.down) velocityY += this.speed;

    // Normalize diagonal movement
    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= 0.707;
      velocityY *= 0.707;
    }

    // Update direction
    if (velocityX !== 0 || velocityY !== 0) {
      if (Math.abs(velocityY) > Math.abs(velocityX)) {
        this.direction = velocityY < 0 ? 'up' : 'down';
      } else if (velocityX !== 0) {
        this.direction = velocityX < 0 ? 'left' : 'right';
      }
    }

    this.velocityX = velocityX;
    this.velocityY = velocityY;

    // Update position
    const deltaSeconds = delta / 1000;
    this.x += velocityX * deltaSeconds;
    this.y += velocityY * deltaSeconds;

    // Clamp to world bounds (assuming 1920x1080)
    this.x = Math.max(0, Math.min(1920, this.x));
    this.y = Math.max(0, Math.min(1080, this.y));
  }

  // Handle dodge action
  dodge(time: number): boolean {
    if (this.isDodging) return false;

    this.isDodging = true;
    this.dodgeEndTime = time + this.dodgeDuration;
    return true;
  }

  // Take damage
  takeDamage(amount: number, attackerDefPen: number = 0): number {
    if (this.isDodging) return 0;

    // Calculate damage with defense
    const effectiveDefense = Math.max(0, this.stats.defense - attackerDefPen);
    const damageReduction = effectiveDefense / (effectiveDefense + 100);
    const finalDamage = amount * (1 - damageReduction);

    this.stats.currentHp = Math.max(0, this.stats.currentHp - finalDamage);

    if (this.stats.currentHp <= 0) {
      this.isAlive = false;
    }

    return finalDamage;
  }

  // Use mana
  useMana(amount: number): boolean {
    if (this.stats.currentMana < amount) return false;
    this.stats.currentMana -= amount;
    return true;
  }

  // Regenerate mana
  private regenerateMana(amount: number): void {
    this.stats.currentMana = Math.min(this.stats.maxMana, this.stats.currentMana + amount);
  }

  // Calculate damage dealt to target
  calculateDamage(
    baseDamage: number,
    targetDefense: number,
    isCrit?: boolean
  ): { damage: number; isCrit: boolean; critTier?: number } {
    // Apply attack stat
    let damage = baseDamage * (1 + this.stats.attack / 100);

    // Apply defense penetration
    const effectiveDefense = Math.max(0, targetDefense - this.stats.defPen);
    const damageReduction = effectiveDefense / (effectiveDefense + 1000);
    damage *= (1 - damageReduction);

    // Determine crit
    const didCrit = isCrit !== undefined ? isCrit : Math.random() < this.stats.critRate;

    if (didCrit) {
      damage *= this.stats.critDamage;

      // Determine crit tier
      let critTier = 1;
      if (this.stats.critDamage >= 3) critTier = 3;
      else if (this.stats.critDamage >= 2) critTier = 2;

      return { damage, isCrit: true, critTier };
    }

    // Apply damage boost
    damage *= (1 + this.stats.damageBoost);

    return { damage, isCrit: false };
  }

  getState(): ServerPlayerState {
    return {
      socketId: this.socketId,
      name: this.name,
      characterId: this.characterId,
      x: this.x,
      y: this.y,
      direction: this.direction,
      stats: { ...this.stats },
      isDodging: this.isDodging,
      isAlive: this.isAlive,
      velocityX: this.velocityX,
      velocityY: this.velocityY
    };
  }

  getStats(): PlayerStats {
    return { ...this.stats };
  }

  isInvincible(): boolean {
    return this.isDodging;
  }

  getIsAlive(): boolean {
    return this.isAlive;
  }
}
