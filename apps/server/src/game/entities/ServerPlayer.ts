/**
 * Server-side Player entity
 * Authoritative player state and combat logic
 */

import { ServerFernSkills } from '../skills/ServerFernSkills.js';
import { ServerStarkSkills } from '../skills/ServerStarkSkills.js';
import { ServerGutsSkills } from '../skills/ServerGutsSkills.js';
import { ServerJuheeSkills } from '../skills/ServerJuheeSkills.js';
import { ServerSungSkills } from '../skills/ServerSungSkills.js';
import { SkillEffect, PlayerBuff, ElementType } from '@beruraid/shared';

export interface Projectile {
  id: string;
  ownerId: string;
  type: 'melee' | 'ranged';
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  damage: number;
  createdAt: number;
  expiresAt: number;
  radius: number;
  angle?: number; // For melee slash rotation
}

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

  // Projectiles
  private projectiles: Projectile[] = [];
  private projectileIdCounter = 0;

  // Attack cooldowns
  private lastMeleeAttackTime = 0;
  private lastRangedAttackTime = 0;
  private meleeAttackCooldown = 1000; // Base cooldown, will be modified by attack speed
  private rangedAttackCooldown = 1000;

  // Current movement input (updated by client, applied in update loop)
  private currentInput: { up: boolean; down: boolean; left: boolean; right: boolean } = {
    up: false,
    down: false,
    left: false,
    right: false
  };

  // Combat stats tracking
  private totalDamageDealt = 0;
  private totalHealReceived = 0;
  private totalHealDone = 0;
  private combatStartTime = Date.now();
  private lastDpsUpdateTime = Date.now();
  private damageDealtSinceLastUpdate = 0;
  private healDoneSinceLastUpdate = 0;
  private currentDps = 0;
  private currentHps = 0;

  // Character-specific skills
  private fernSkills: ServerFernSkills | null = null;
  private starkSkills: ServerStarkSkills | null = null;
  private gutsSkills: ServerGutsSkills | null = null;
  private juheeSkills: ServerJuheeSkills | null = null;
  private sungSkills: ServerSungSkills | null = null;

  // Player buffs
  private buffs: PlayerBuff[] = [];

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

    // Initialize character-specific skills
    if (characterId === 'fern') {
      this.fernSkills = new ServerFernSkills(socketId, name);
    } else if (characterId === 'stark') {
      this.starkSkills = new ServerStarkSkills(socketId, name);
    } else if (characterId === 'guts') {
      this.gutsSkills = new ServerGutsSkills(socketId, name);
    } else if (characterId === 'juhee') {
      this.juheeSkills = new ServerJuheeSkills(socketId, name);
    } else if (characterId === 'sung') {
      this.sungSkills = new ServerSungSkills(socketId, name);
    }
  }

  update(time: number, delta: number): void {
    // Update dodge state
    if (this.isDodging && time >= this.dodgeEndTime) {
      this.isDodging = false;
    }

    // Apply movement from current input
    this.applyMovement(delta);

    // Mana regeneration
    const deltaSeconds = delta / 1000;
    this.regenerateMana(this.manaRegenRate * deltaSeconds);

    // Update projectiles
    this.updateProjectiles(time, deltaSeconds);

    // Update DPS/HPS every second
    if (time - this.lastDpsUpdateTime >= 1000) {
      const timeDiff = (time - this.lastDpsUpdateTime) / 1000;
      this.currentDps = this.damageDealtSinceLastUpdate / timeDiff;
      this.currentHps = this.healDoneSinceLastUpdate / timeDiff;

      this.damageDealtSinceLastUpdate = 0;
      this.healDoneSinceLastUpdate = 0;
      this.lastDpsUpdateTime = time;
    }

    // Update character-specific skills
    if (this.fernSkills) {
      this.fernSkills.update(delta, this.x, this.y);
    } else if (this.starkSkills) {
      this.starkSkills.update(delta);
    } else if (this.gutsSkills) {
      this.gutsSkills.update(delta);
    } else if (this.sungSkills) {
      this.sungSkills.update(delta);
    } else if (this.juheeSkills) {
      this.juheeSkills.update(delta);
    }

    // Update buffs (remove expired)
    this.buffs = this.buffs.filter(buff => time < buff.expiresAt);
  }

  // Track damage dealt
  addDamageDealt(damage: number): void {
    this.totalDamageDealt += damage;
    this.damageDealtSinceLastUpdate += damage;
  }

  // Track healing done
  addHealDone(heal: number): void {
    this.totalHealDone += heal;
    this.healDoneSinceLastUpdate += heal;
  }

  // Get combat stats
  getCombatStats(): { dps: number; hps: number; totalDamage: number; totalHeal: number } {
    return {
      dps: this.currentDps,
      hps: this.currentHps,
      totalDamage: this.totalDamageDealt,
      totalHeal: this.totalHealDone
    };
  }

  private applyMovement(delta: number): void {
    let velocityX = 0;
    let velocityY = 0;

    if (this.currentInput.left) velocityX -= this.speed;
    if (this.currentInput.right) velocityX += this.speed;
    if (this.currentInput.up) velocityY -= this.speed;
    if (this.currentInput.down) velocityY += this.speed;

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

    // Clamp to world bounds (1600x1000)
    this.x = Math.max(0, Math.min(1600, this.x));
    this.y = Math.max(0, Math.min(1000, this.y));
  }

  private updateProjectiles(time: number, deltaSeconds: number): void {
    // Remove expired projectiles
    this.projectiles = this.projectiles.filter(p => time < p.expiresAt);

    // Update projectile positions
    for (const projectile of this.projectiles) {
      projectile.x += projectile.velocityX * deltaSeconds;
      projectile.y += projectile.velocityY * deltaSeconds;
    }
  }

  // Handle movement input from client - just store it, don't apply it
  // Movement is applied in update() loop to be frame-rate independent
  handleMovement(input: { up: boolean; down: boolean; left: boolean; right: boolean }): void {
    this.currentInput = { ...input };
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

    // Check for invincibility buff (Guts Beast of Darkness)
    if (this.hasInvincibilityBuff()) return 0;

    // Calculate damage with defense
    const effectiveDefense = Math.max(0, this.stats.defense - attackerDefPen);
    const damageReduction = effectiveDefense / (effectiveDefense + 100);
    let finalDamage = amount * (1 - damageReduction);

    // Apply shield buff (Stark's damage absorption)
    if (this.hasShieldBuff()) {
      const shieldBuff = this.buffs.find(buff => buff.type === 'stark_shield');
      if (shieldBuff && shieldBuff.data?.damageReduction) {
        finalDamage *= (1 - shieldBuff.data.damageReduction);
      }
    }

    this.stats.currentHp = Math.max(0, this.stats.currentHp - finalDamage);

    if (this.stats.currentHp <= 0) {
      this.isAlive = false;
    }

    return finalDamage;
  }

  // Heal player
  heal(amount: number): number {
    const healAmount = Math.min(amount, this.stats.maxHp - this.stats.currentHp);
    this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + healAmount);
    this.totalHealReceived += healAmount;
    return healAmount;
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

  // Create melee attack
  createMeleeAttack(time: number, targetX: number, targetY: number): Projectile | null {
    const cooldown = this.meleeAttackCooldown / this.stats.attackSpeed;
    if (time - this.lastMeleeAttackTime < cooldown) {
      return null;
    }

    this.lastMeleeAttackTime = time;

    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    const distance = 40;

    const projectile: Projectile = {
      id: `${this.socketId}_melee_${this.projectileIdCounter++}`,
      ownerId: this.socketId,
      type: 'melee',
      x: this.x + Math.cos(angle) * distance,
      y: this.y + Math.sin(angle) * distance,
      velocityX: 0,
      velocityY: 0,
      damage: 10,
      createdAt: time,
      expiresAt: time + 100, // Short-lived (100ms)
      radius: 25, // Melee range
      angle: angle
    };

    this.projectiles.push(projectile);
    return projectile;
  }

  // Create ranged projectile
  createRangedAttack(time: number, targetX: number, targetY: number): Projectile | null {
    if (time - this.lastRangedAttackTime < this.rangedAttackCooldown) {
      return null;
    }

    this.lastRangedAttackTime = time;

    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    const speed = 800;

    const projectile: Projectile = {
      id: `${this.socketId}_ranged_${this.projectileIdCounter++}`,
      ownerId: this.socketId,
      type: 'ranged',
      x: this.x,
      y: this.y,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
      damage: 10,
      createdAt: time,
      expiresAt: time + 3000, // 3 seconds
      radius: 8,
      angle: angle
    };

    this.projectiles.push(projectile);
    return projectile;
  }

  // Get all projectiles
  getProjectiles(): Projectile[] {
    return [...this.projectiles];
  }

  // Remove a specific projectile (used when it hits something)
  removeProjectile(projectileId: string): void {
    const index = this.projectiles.findIndex(p => p.id === projectileId);
    if (index !== -1) {
      this.projectiles.splice(index, 1);
    }
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

    // Apply Sung's Death Gamble buff (multiplies attack)
    const deathGambleBuff = this.buffs.find(buff => buff.type === 'sung_death_gamble_blue' || buff.type === 'sung_death_gamble_red');
    if (deathGambleBuff && deathGambleBuff.data?.atkMultiplier) {
      damage *= deathGambleBuff.data.atkMultiplier;
    }

    // Apply Sung's Barrage Strike crit bonus (stacking)
    let bonusCritRate = 0;
    const barrageBuffs = this.buffs.filter(buff => buff.type === 'sung_barrage_crit');
    if (barrageBuffs.length > 0) {
      const maxStacks = barrageBuffs[0].data?.maxStacks || 10;
      const stackCount = Math.min(barrageBuffs.length, maxStacks);
      const critBonusPerStack = barrageBuffs[0].data?.critBonus || 15;
      bonusCritRate = (stackCount * critBonusPerStack) / 100; // Convert to decimal
    }

    // Determine crit
    const effectiveCritRate = this.stats.critRate + bonusCritRate;
    const didCrit = isCrit !== undefined ? isCrit : Math.random() < effectiveCritRate;

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

    // Apply Berserker buff (Guts ultimate)
    if (this.hasBerserkerBuff()) {
      const berserkerBuff = this.buffs.find(buff => buff.type === 'guts_berserker');
      if (berserkerBuff && berserkerBuff.data?.dpsMultiplierIncrement) {
        const timeActive = Date.now() - (berserkerBuff.expiresAt - 10000); // 10s duration
        const intervals = Math.floor(timeActive / berserkerBuff.data.dpsMultiplierInterval);
        const multiplier = Math.pow(berserkerBuff.data.dpsMultiplierIncrement, intervals);
        damage *= multiplier;
      }
    }

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

  getElement(): ElementType {
    // Map characterId to element
    const elementMap: Record<string, ElementType> = {
      'stark': 'Fire',
      'fern': 'Light',
      'frieren': 'Water',
      'guts': 'Dark'
    };
    return elementMap[this.characterId] || 'Fire';
  }

  // Skill usage methods
  useSkill1(time: number, bossX?: number, bossY?: number): {
    success: boolean;
    manaCost?: number;
    hpCost?: number;
    damage?: number;
    effect?: SkillEffect;
    buff?: PlayerBuff;
    slowTarget?: boolean;
  } {
    if (this.fernSkills) {
      return this.fernSkills.useSkill1(this.stats.currentMana, this.stats.attack, this.x, this.y, time);
    } else if (this.starkSkills && bossX !== undefined && bossY !== undefined) {
      return this.starkSkills.useSkill1(this.stats.currentMana, this.stats.defense, this.x, this.y, bossX, bossY, time);
    } else if (this.gutsSkills) {
      const isInvincible = this.hasInvincibilityBuff();
      return this.gutsSkills.useSkill1(this.stats.currentHp, this.stats.maxHp, this.stats.defense, isInvincible, this.x, this.y, time);
    } else if (this.sungSkills && bossX !== undefined && bossY !== undefined) {
      return this.sungSkills.useSkill1(this.stats.currentMana, this.stats.attack, this.x, this.y, bossX, bossY, time);
    } else if (this.juheeSkills) {
      return this.juheeSkills.useSkill1(this.stats.currentMana, this.stats.maxHp, this.x, this.y, time);
    }
    return { success: false };
  }

  useSkill2(time: number, targetX?: number, targetY?: number): {
    success: boolean;
    manaCost?: number;
    damage?: number;
    stunBoss?: boolean;
    effect?: SkillEffect;
    buff?: PlayerBuff;
    isBlue?: boolean;
    panicTriggered?: boolean;
    panicBuff?: PlayerBuff;
  } {
    if (this.fernSkills && targetX !== undefined && targetY !== undefined) {
      return this.fernSkills.useSkill2(this.stats.currentMana, this.stats.attack, this.x, this.y, targetX, targetY, time);
    } else if (this.starkSkills) {
      return this.starkSkills.useSkill2(this.stats.currentMana, time);
    } else if (this.gutsSkills) {
      return this.gutsSkills.useSkill2(this.stats.currentMana, time);
    } else if (this.sungSkills) {
      return this.sungSkills.useSkill2(this.stats.currentMana, time);
    } else if (this.juheeSkills) {
      return this.juheeSkills.useSkill2(this.stats.currentMana, this.x, this.y, time);
    }
    return { success: false };
  }

  useRightClick(time: number, targetX: number, targetY: number): {
    success: boolean;
    manaCost?: number;
    effect?: SkillEffect;
  } {
    if (this.juheeSkills) {
      return this.juheeSkills.useRightClickHeal(this.stats.currentMana, this.stats.maxHp, this.x, this.y, targetX, targetY, time);
    }
    return { success: false };
  }

  useUltimate(time: number): {
    success: boolean;
    manaCost?: number;
    damage?: number;
    buff?: PlayerBuff;
  } {
    if (this.gutsSkills) {
      return this.gutsSkills.useUltimate(this.stats.currentMana, this.stats.attack, time);
    }
    return { success: false };
  }

  // Buff management
  addBuff(buff: PlayerBuff): void {
    this.buffs.push(buff);
  }

  hasInvincibilityBuff(): boolean {
    return this.buffs.some(buff => buff.type === 'guts_beast');
  }

  hasShieldBuff(): boolean {
    return this.buffs.some(buff => buff.type === 'stark_shield');
  }

  hasBerserkerBuff(): boolean {
    return this.buffs.some(buff => buff.type === 'guts_berserker');
  }

  getBuffs(): PlayerBuff[] {
    return [...this.buffs];
  }

  // Get skill-specific data
  getSkillCooldowns(): any {
    if (this.fernSkills) {
      return this.fernSkills.getCooldowns();
    } else if (this.starkSkills) {
      return this.starkSkills.getCooldowns();
    } else if (this.gutsSkills) {
      return this.gutsSkills.getCooldowns();
    }
    return {};
  }

  getFernStackCount(): number {
    return this.fernSkills ? this.fernSkills.getSkill1StackCount() : 0;
  }

  getStunDuration(): number {
    if (this.starkSkills) {
      return this.starkSkills.getStunDuration();
    } else if (this.gutsSkills) {
      return this.gutsSkills.getStunDuration();
    }
    return 0;
  }
}
