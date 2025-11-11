/**
 * GameRoom - Manages a single raid instance with 2-6 players
 * Handles game state, player synchronization, and boss mechanics
 */

import type { PlayerState, GameState, RoomStatus, SkillEffect } from '@beruraid/shared';
import { ServerBoss, type BossState as ServerBossState } from './entities/ServerBoss.js';
import { ServerPlayer } from './entities/ServerPlayer.js';

export class GameRoom {
  public readonly id: string;
  private code: string;
  private maxPlayers: number;
  private hostId: string = '';
  private status: RoomStatus = 'waiting';
  private players: Map<string, PlayerState> = new Map();
  private isPrivate: boolean = false;

  // Server-side game entities
  private serverPlayers: Map<string, ServerPlayer> = new Map();
  private serverBoss: ServerBoss | null = null;

  // Track all active skill effects
  private skillEffects: SkillEffect[] = [];

  private isActive: boolean = false;
  private startTime: number = 0;
  private lastUpdateTime: number = 0;

  // World bounds (match client game canvas size)
  private worldWidth = 1600;
  private worldHeight = 1000;

  constructor(roomId: string, roomCode: string, maxPlayers: number = 6, isPrivate: boolean = false) {
    this.id = roomId;
    this.code = roomCode;
    this.maxPlayers = maxPlayers;
    this.isPrivate = isPrivate;
  }

  /**
   * Set host player
   */
  public setHost(playerId: string): void {
    this.hostId = playerId;
  }

  /**
   * Add a player to the room
   */
  public addPlayer(player: PlayerState): boolean {
    if (this.players.size >= this.maxPlayers) {
      return false; // Room full
    }

    this.players.set(player.id, player);

    // Create server-side player entity
    const serverPlayer = new ServerPlayer(
      player.socketId,
      player.name,
      player.characterId,
      this.worldWidth / 2,
      this.worldHeight - 100
    );
    this.serverPlayers.set(player.socketId, serverPlayer);

    console.log(`👤 Player ${player.name} joined room ${this.id}`);
    return true;
  }

  /**
   * Remove a player from the room
   */
  public removePlayer(socketId: string): void {
    // Find player by socket ID
    let playerToRemove: PlayerState | undefined;
    for (const [playerId, player] of this.players.entries()) {
      if (player.socketId === socketId) {
        playerToRemove = player;
        this.players.delete(playerId);
        break;
      }
    }

    // Remove server player entity
    this.serverPlayers.delete(socketId);

    if (playerToRemove) {
      console.log(`👋 Player ${playerToRemove.name} left room ${this.id}`);
    }

    // If room empty, mark for cleanup
    if (this.players.size === 0) {
      this.isActive = false;
      this.status = 'completed';
    }
  }

  /**
   * Start the raid
   */
  public startRaid(): void {
    if (this.players.size < 1) {
      throw new Error('Cannot start raid with no players');
    }

    this.isActive = true;
    this.status = 'active';
    this.startTime = Date.now();
    this.lastUpdateTime = Date.now();

    // Initialize server-side boss
    this.serverBoss = new ServerBoss(
      this.worldWidth / 2,
      150,
      this.players.size,
      this.worldWidth,
      this.worldHeight
    );

    console.log(`🎮 Raid started in room ${this.id} with ${this.players.size} players`);
  }

  /**
   * Update game state (called every tick - 60 FPS)
   */
  public update(): GameState | null {
    if (!this.isActive || !this.serverBoss) {
      return null;
    }

    const now = Date.now();
    const deltaTime = now - this.lastUpdateTime;
    this.lastUpdateTime = now;

    // Update all server players
    for (const serverPlayer of this.serverPlayers.values()) {
      serverPlayer.update(now, deltaTime);

      // Check collision with boss attacks
      const collision = this.serverBoss.checkCollision(serverPlayer.x, serverPlayer.y);
      if (collision.hit && !serverPlayer.isInvincible()) {
        const damageTaken = serverPlayer.takeDamage(collision.damage, this.serverBoss.getState().defPen);
        console.log(`⚔️ Player ${serverPlayer.name} hit by ${collision.attackType} for ${damageTaken.toFixed(1)} damage`);
      }
    }

    // Get player positions for boss AI
    const playerPositions = Array.from(this.serverPlayers.values()).map(p => ({ x: p.x, y: p.y }));

    // Update boss
    this.serverBoss.update(now, deltaTime, playerPositions);

    // Check projectile-boss collisions
    this.checkProjectileCollisions();

    // Update skill effects (remove expired)
    this.skillEffects = this.skillEffects.filter(effect => now < effect.expiresAt);

    // Update moving skill effects (like Fern's Zoltraak and Juhee heal projectiles)
    for (const effect of this.skillEffects) {
      if (effect.velocityX !== undefined && effect.velocityY !== undefined) {
        const deltaSeconds = deltaTime / 1000;
        effect.x += effect.velocityX * deltaSeconds;
        effect.y += effect.velocityY * deltaSeconds;
      }

      // Update position of player-following effects
      if (effect.effectType === 'sung_death_gamble' ||
          effect.effectType === 'stark_shield' ||
          effect.effectType === 'guts_beast_aura') {
        const owner = this.serverPlayers.get(effect.ownerId);
        if (owner) {
          effect.x = owner.x;
          effect.y = owner.y;
        }
      }
    }

    // Check skill-boss collisions
    this.checkSkillCollisions();

    // Check victory condition (boss defeated)
    if (this.serverBoss.isDead()) {
      this.onBossDefeated();
    }

    // Check defeat condition (time's up or all players dead)
    const elapsedTime = now - this.startTime;
    const allPlayersDead = Array.from(this.serverPlayers.values()).every(p => !p.getIsAlive());

    if (elapsedTime >= 180000 || allPlayersDead) {
      this.onRaidFailed();
    }

    return this.getGameState();
  }

  /**
   * Get current game state (converted to shared types)
   */
  public getGameState(): GameState {
    if (!this.serverBoss) {
      throw new Error('Cannot get game state without boss');
    }

    const bossState = this.serverBoss.getState();

    // Convert server player states to shared PlayerState format
    const playerStates: PlayerState[] = Array.from(this.serverPlayers.values()).map(sp => {
      const state = sp.getState();
      const combatStats = sp.getCombatStats();
      const cooldowns = sp.getSkillCooldowns();
      // Find the original player state to get isReady
      const originalPlayer = Array.from(this.players.values()).find(p => p.socketId === state.socketId);
      return {
        id: state.socketId,
        socketId: state.socketId,
        name: state.name,
        characterId: state.characterId,
        position: { x: state.x, y: state.y },
        direction: state.direction,
        stats: state.stats,
        isDodging: state.isDodging,
        isAlive: state.isAlive,
        isReady: originalPlayer?.isReady || false,
        lastUpdateTime: Date.now(),
        skill1Cooldown: cooldowns.skill1 || 0,
        skill2Cooldown: cooldowns.skill2 || 0,
        ultimateCooldown: cooldowns.ultimate || 0,
        dps: combatStats.dps,
        hps: combatStats.hps,
        totalDamage: combatStats.totalDamage,
        totalHeal: combatStats.totalHeal
      } as any; // TODO: Update PlayerState type to include combat stats
    });

    // Collect all projectiles from all players
    const allProjectiles = Array.from(this.serverPlayers.values())
      .flatMap(player => player.getProjectiles());

    // LOG skillEffects BEFORE sending
    if (this.skillEffects.length > 0) {
      console.log(`📡 [GET_STATE] Sending ${this.skillEffects.length} skillEffects to clients:`);
      this.skillEffects.forEach(effect => {
        console.log(`  - ${effect.effectType} (${effect.id}) at (${effect.x.toFixed(0)}, ${effect.y.toFixed(0)}) owner: ${effect.ownerName}`);
      });
    }

    return {
      roomId: this.id,
      players: playerStates,
      boss: {
        hp: bossState.hp,
        maxHp: bossState.maxHp,
        nextBarMaxHp: this.serverBoss.getNextBarMaxHp(),
        position: { x: bossState.x, y: bossState.y },
        rageCount: bossState.rageCount,
        barsDefeated: bossState.barsDefeated,
        isStunned: bossState.isStunned,
        stunEndTime: bossState.stunEndTime,
        totalDamageDealt: this.serverBoss.getTotalDamageDealt(),
        attacks: bossState.attacks,
        velocityX: bossState.velocityX,
        velocityY: bossState.velocityY
      },
      projectiles: allProjectiles,
      skillEffects: this.skillEffects,
      startTime: this.startTime,
      elapsedTime: Date.now() - this.startTime,
      remainingTime: Math.max(0, 180000 - (Date.now() - this.startTime)),
      isActive: this.isActive,
      isCompleted: this.status === 'completed',
    };
  }

  /**
   * Handle boss defeated
   */
  private onBossDefeated(): void {
    console.log(`🎉 Boss defeated in room ${this.id}!`);
    this.isActive = false;
    this.status = 'completed';
    // TODO: Calculate rewards, XP, etc.
  }

  /**
   * Handle raid failed
   */
  private onRaidFailed(): void {
    console.log(`💀 Raid failed in room ${this.id}`);
    this.isActive = false;
    this.status = 'completed';
  }

  /**
   * Handle player movement input
   */
  public handlePlayerMovement(
    socketId: string,
    input: { up: boolean; down: boolean; left: boolean; right: boolean }
  ): void {
    const serverPlayer = this.serverPlayers.get(socketId);
    if (!serverPlayer) return;

    // Just store the input - it will be applied in the update loop
    // This makes movement frame-rate independent
    serverPlayer.handleMovement(input);
  }

  /**
   * Handle player dodge action
   */
  public handlePlayerDodge(socketId: string): void {
    const serverPlayer = this.serverPlayers.get(socketId);
    if (!serverPlayer) return;

    const success = serverPlayer.dodge(Date.now());
    if (success) {
      console.log(`🏃 Player ${serverPlayer.name} dodged`);
    }
  }

  /**
   * Handle player attack - creates projectile
   */
  public handlePlayerAttack(
    socketId: string,
    attackData: { type: 'melee' | 'ranged'; targetX: number; targetY: number }
  ): void {
    const serverPlayer = this.serverPlayers.get(socketId);
    if (!serverPlayer || !this.serverBoss) return;

    const now = Date.now();

    // Create projectile based on attack type
    let projectile;
    if (attackData.type === 'melee') {
      projectile = serverPlayer.createMeleeAttack(now, attackData.targetX, attackData.targetY);
    } else {
      projectile = serverPlayer.createRangedAttack(now, attackData.targetX, attackData.targetY);
    }

    if (projectile) {
      console.log(`🎯 Player ${serverPlayer.name} created ${attackData.type} projectile`);
    }
  }

  /**
   * Check all projectile-boss collisions
   */
  private checkProjectileCollisions(): void {
    if (!this.serverBoss) return;

    const bossState = this.serverBoss.getState();
    const bossRadius = 50; // Boss collision radius

    for (const serverPlayer of this.serverPlayers.values()) {
      const projectiles = serverPlayer.getProjectiles();

      for (const projectile of projectiles) {
        // Check distance between projectile and boss
        const dx = projectile.x - bossState.x;
        const dy = projectile.y - bossState.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Collision detected
        if (distance <= projectile.radius + bossRadius) {
          // Calculate damage
          const damageResult = serverPlayer.calculateDamage(
            projectile.damage,
            bossState.defense
          );

          // Apply damage to boss (with element for weakness multiplier)
          const result = this.serverBoss.takeDamage(damageResult.damage, serverPlayer.getElement());

          // Track damage dealt for DPS calculation
          serverPlayer.addDamageDealt(damageResult.damage);

          console.log(`💥 Projectile hit! ${serverPlayer.name} dealt ${damageResult.damage.toFixed(1)} damage (crit: ${damageResult.isCrit})`);

          if (result.barDefeated) {
            console.log(`🔥 Boss bar defeated! Rage count: ${result.newRageCount}`);
          }

          // Remove projectile after hit
          serverPlayer.removeProjectile(projectile.id);
        }
      }
    }
  }

  /**
   * Check skill-boss collisions and apply damage
   */
  private checkSkillCollisions(): void {
    if (!this.serverBoss) return;

    const bossState = this.serverBoss.getState();
    const bossRadius = 50; // Boss collision radius
    const now = Date.now();

    // Track which skills have already hit to avoid multi-hits
    const skillsToRemove: string[] = [];

    for (const effect of this.skillEffects) {
      // Skip if already processed
      if (skillsToRemove.includes(effect.id)) continue;

      // Get the owner player
      const ownerPlayer = this.serverPlayers.get(effect.ownerId);
      if (!ownerPlayer) continue;

      let hitDetected = false;
      let damage = effect.damage || 0;

      // Check collision based on effect type
      switch (effect.effectType) {
        case 'fern_fire_aoe': {
          // Expanding AOE - check if boss is within radius
          const distance = Math.sqrt(
            Math.pow(bossState.x - effect.x, 2) + Math.pow(bossState.y - effect.y, 2)
          );

          // Calculate current radius (expands over time)
          const progress = (now - effect.createdAt) / (effect.expiresAt - effect.createdAt);
          const maxRadius = effect.data?.maxRadius || 180;
          const currentRadius = effect.radius! + (maxRadius - effect.radius!) * progress;

          hitDetected = distance <= currentRadius + bossRadius;
          break;
        }

        case 'fern_zoltraak': {
          // Projectile skill - check distance
          const distance = Math.sqrt(
            Math.pow(bossState.x - effect.x, 2) + Math.pow(bossState.y - effect.y, 2)
          );
          hitDetected = distance <= 30 + bossRadius; // Zoltraak radius
          break;
        }

        case 'stark_stun_aoe': {
          // AOE stun - check if boss is within radius
          const distance = Math.sqrt(
            Math.pow(bossState.x - effect.x, 2) + Math.pow(bossState.y - effect.y, 2)
          );
          hitDetected = distance <= (effect.radius || 120) + bossRadius;
          break;
        }

        case 'guts_rage_aoe': {
          // Expanding rage AOE
          const distance = Math.sqrt(
            Math.pow(bossState.x - effect.x, 2) + Math.pow(bossState.y - effect.y, 2)
          );

          // Calculate current radius (expands over time)
          const progress = (now - effect.createdAt) / (effect.expiresAt - effect.createdAt);
          const maxRadius = effect.data?.maxRadius || 120;
          const currentRadius = effect.radius! + (maxRadius - effect.radius!) * progress;

          hitDetected = distance <= currentRadius + bossRadius;
          break;
        }

        case 'sung_barrage_strike': {
          // Melee strike - check if boss is within radius
          const distance = Math.sqrt(
            Math.pow(bossState.x - effect.x, 2) + Math.pow(bossState.y - effect.y, 2)
          );
          hitDetected = distance <= (effect.radius || 40) + bossRadius;
          break;
        }

        case 'juhee_heal_projectile': {
          // Heal projectile - heals players OR damages boss
          const healAmount = effect.data?.healAmount || 30;
          const bossAmount = effect.data?.bossAmount || 30;
          const projectileRadius = effect.radius || 20;

          // Check collision with players first
          let hitApplied = false;
          for (const player of this.serverPlayers.values()) {
            const distance = Math.sqrt(
              Math.pow(player.x - effect.x, 2) + Math.pow(player.y - effect.y, 2)
            );

            if (distance <= projectileRadius + 30) { // Player collision radius
              player.heal(healAmount);
              ownerPlayer.addHealDone(healAmount);
              console.log(`💚 ${ownerPlayer.name}'s heal projectile healed ${player.name} for ${healAmount} HP`);
              skillsToRemove.push(effect.id);
              hitApplied = true;
              break;
            }
          }

          // If no player hit, check boss collision
          if (!hitApplied) {
            const distanceToBoss = Math.sqrt(
              Math.pow(bossState.x - effect.x, 2) + Math.pow(bossState.y - effect.y, 2)
            );

            if (distanceToBoss <= projectileRadius + bossRadius) {
              const damageResult = ownerPlayer.calculateDamage(bossAmount, bossState.defense);
              this.serverBoss.takeDamage(damageResult.damage);
              ownerPlayer.addDamageDealt(damageResult.damage);
              console.log(`💥 ${ownerPlayer.name}'s heal projectile hit the BOSS for ${damageResult.damage.toFixed(1)} damage!`);
              skillsToRemove.push(effect.id);
            }
          }
          break;
        }

        case 'juhee_healing_circle': {
          // Healing Circle (Skill A) - AOE heal for all players including Juhee
          const healAmount = effect.data?.healAmount || 50;
          const healRadius = effect.radius || 120;

          // Heal all players within radius (including Juhee herself)
          for (const player of this.serverPlayers.values()) {
            const distance = Math.sqrt(
              Math.pow(player.x - effect.x, 2) + Math.pow(player.y - effect.y, 2)
            );

            if (distance <= healRadius + 30) { // Player collision radius
              const actualHealed = player.heal(healAmount);
              ownerPlayer.addHealDone(actualHealed);
              console.log(`💚 ${ownerPlayer.name}'s healing circle healed ${player.name} for ${actualHealed} HP`);
            }
          }

          // Remove effect after application (instant effect, 500ms is just for animation)
          skillsToRemove.push(effect.id);
          break;
        }

        case 'juhee_blessing': {
          // Blessing of Courage (Skill E) - AOE buff for all players
          const atkBonus = effect.data?.atkBonus || 1.0;
          const defBonus = effect.data?.defBonus || 0.5;
          const atkSpeedBonus = effect.data?.atkSpeedBonus || 0.3;
          const duration = effect.data?.duration || 15000;
          const buffRadius = effect.radius || 150;

          // Apply buff to all players within radius
          for (const player of this.serverPlayers.values()) {
            const distance = Math.sqrt(
              Math.pow(player.x - effect.x, 2) + Math.pow(player.y - effect.y, 2)
            );

            if (distance <= buffRadius + 30) { // Player collision radius
              player.addBuff({
                type: 'juhee_blessing',
                expiresAt: now + duration,
                data: {
                  atkBonus: atkBonus,
                  defBonus: defBonus,
                  atkSpeedBonus: atkSpeedBonus
                }
              });
              console.log(`✨ ${ownerPlayer.name}'s blessing buffed ${player.name} (+${(atkBonus * 100).toFixed(0)}% ATK, +${(defBonus * 100).toFixed(0)}% DEF, +${(atkSpeedBonus * 100).toFixed(0)}% ATK SPD)`);
            }
          }

          // Remove effect after application
          skillsToRemove.push(effect.id);
          break;
        }
      }

      // Apply damage if hit detected
      if (hitDetected && damage > 0) {
        const damageResult = ownerPlayer.calculateDamage(damage, bossState.defense);
        this.serverBoss.takeDamage(damageResult.damage);
        ownerPlayer.addDamageDealt(damageResult.damage);

        console.log(`💥 ${effect.effectType} hit! ${ownerPlayer.name} dealt ${damageResult.damage.toFixed(1)} damage`);

        // Mark projectile skills for removal after hit
        if (effect.effectType === 'fern_zoltraak') {
          skillsToRemove.push(effect.id);
        }
      }
    }

    // Remove skills that hit
    this.skillEffects = this.skillEffects.filter(effect => !skillsToRemove.includes(effect.id));
  }

  /**
   * Handle player skill 1 (A key)
   */
  public handlePlayerSkill1(socketId: string): void {
    console.log(`🎯 [SKILL1] handlePlayerSkill1 called for socketId: ${socketId}`);

    const serverPlayer = this.serverPlayers.get(socketId);
    if (!serverPlayer) {
      console.log(`❌ [SKILL1] No serverPlayer found for socketId: ${socketId}`);
      return;
    }
    if (!this.serverBoss) {
      console.log(`❌ [SKILL1] No boss found`);
      return;
    }

    const bossState = this.serverBoss.getState();
    console.log(`🎯 [SKILL1] Player ${serverPlayer.name} (${serverPlayer.characterId}) attempting Skill1`);

    const result = serverPlayer.useSkill1(Date.now(), bossState.x, bossState.y);

    console.log(`🎯 [SKILL1] Result:`, {
      success: result.success,
      hasEffect: !!result.effect,
      effectType: result.effect?.effectType,
      effectId: result.effect?.id,
      effectPosition: result.effect ? `(${result.effect.x}, ${result.effect.y})` : 'N/A',
      manaCost: result.manaCost,
      hasBuff: !!result.buff,
      panicTriggered: result.panicTriggered
    });

    if (result.success) {
      // Consume resources
      if (result.manaCost) {
        serverPlayer.useMana(result.manaCost);
        console.log(`💧 [SKILL1] Consumed ${result.manaCost} mana`);
      }
      if (result.hpCost) {
        serverPlayer.takeDamage(result.hpCost);
        console.log(`❤️ [SKILL1] Consumed ${result.hpCost} HP`);
      }

      // Add skill effect to tracking
      if (result.effect) {
        this.skillEffects.push(result.effect);
        console.log(`✅ [SKILL1] Effect added to skillEffects array. Total effects: ${this.skillEffects.length}`);
        console.log(`📊 [SKILL1] Effect details:`, JSON.stringify(result.effect, null, 2));
      } else {
        console.log(`⚠️ [SKILL1] No effect to add!`);
      }

      // Add buff to player (for Sung)
      if (result.buff) {
        serverPlayer.addBuff(result.buff);
        console.log(`💪 [SKILL1] Buff added: ${result.buff.type}`);
      }

      // Apply panic buff to player (for Juhee)
      if (result.panicBuff && result.panicTriggered) {
        serverPlayer.addBuff(result.panicBuff);
        console.log(`😱 [SKILL1] ${serverPlayer.name} PANICKED! (${result.panicBuff.type})`);
      }

      // Apply slow to boss (for Sung)
      if (result.slowTarget && this.serverBoss) {
        this.serverBoss.applySlow(5000); // 5 seconds slow
        console.log(`🐌 [SKILL1] Boss slowed for 5 seconds`);
      }

      console.log(`✨ [SKILL1] ${serverPlayer.name} successfully used Skill 1 (${serverPlayer.characterId})`);
    } else {
      console.log(`❌ [SKILL1] Skill 1 failed for ${serverPlayer.name}`);
    }
  }

  /**
   * Handle player skill 2 (E key)
   */
  public handlePlayerSkill2(socketId: string, targetX?: number, targetY?: number): void {
    console.log(`🎯 [SKILL2] handlePlayerSkill2 called for socketId: ${socketId}, target: (${targetX}, ${targetY})`);

    const serverPlayer = this.serverPlayers.get(socketId);
    if (!serverPlayer) {
      console.log(`❌ [SKILL2] No serverPlayer found for socketId: ${socketId}`);
      return;
    }
    if (!this.serverBoss) {
      console.log(`❌ [SKILL2] No boss found`);
      return;
    }

    console.log(`🎯 [SKILL2] Player ${serverPlayer.name} (${serverPlayer.characterId}) attempting Skill2`);

    const result = serverPlayer.useSkill2(Date.now(), targetX, targetY);

    console.log(`🎯 [SKILL2] Result:`, {
      success: result.success,
      hasEffect: !!result.effect,
      effectType: result.effect?.effectType,
      effectId: result.effect?.id,
      effectPosition: result.effect ? `(${result.effect.x}, ${result.effect.y})` : 'N/A',
      manaCost: result.manaCost,
      hasBuff: !!result.buff,
      panicTriggered: result.panicTriggered,
      stunBoss: result.stunBoss
    });

    if (result.success) {
      // Consume mana
      if (result.manaCost) {
        serverPlayer.useMana(result.manaCost);
        console.log(`💧 [SKILL2] Consumed ${result.manaCost} mana`);
      }

      // Add skill effect
      if (result.effect) {
        this.skillEffects.push(result.effect);
        console.log(`✅ [SKILL2] Effect added to skillEffects array. Total effects: ${this.skillEffects.length}`);
        console.log(`📊 [SKILL2] Effect details:`, JSON.stringify(result.effect, null, 2));
      } else {
        console.log(`⚠️ [SKILL2] No effect to add!`);
      }

      // Apply buff to player
      if (result.buff) {
        serverPlayer.addBuff(result.buff);
        console.log(`💪 [SKILL2] Buff added: ${result.buff.type}`);
      }

      // Apply panic buff to player (for Juhee)
      if (result.panicBuff && result.panicTriggered) {
        serverPlayer.addBuff(result.panicBuff);
        console.log(`😱 [SKILL2] ${serverPlayer.name} PANICKED! (${result.panicBuff.type})`);
      }

      // Stun boss if applicable
      if (result.stunBoss) {
        const stunDuration = serverPlayer.getStunDuration();
        this.serverBoss.stun(stunDuration, Date.now());
        console.log(`💫 [SKILL2] ${serverPlayer.name} stunned the boss for ${stunDuration}ms!`);
      }

      console.log(`✨ [SKILL2] ${serverPlayer.name} successfully used Skill 2 (${serverPlayer.characterId})`);
    } else {
      console.log(`❌ [SKILL2] Skill 2 failed for ${serverPlayer.name}`);
    }
  }

  /**
   * Handle player right-click (for Juhee heal projectile)
   */
  public handlePlayerRightClick(socketId: string, targetX: number, targetY: number): void {
    console.log(`🎯 [RIGHT_CLICK] handlePlayerRightClick called for socketId: ${socketId}, target: (${targetX}, ${targetY})`);

    const serverPlayer = this.serverPlayers.get(socketId);
    if (!serverPlayer) {
      console.log(`❌ [RIGHT_CLICK] No serverPlayer found for socketId: ${socketId}`);
      return;
    }

    // Only Juhee can use right-click heal
    if (serverPlayer.characterId !== 'juhee') {
      console.log(`❌ [RIGHT_CLICK] Player ${serverPlayer.name} is not Juhee (${serverPlayer.characterId})`);
      return;
    }

    console.log(`🎯 [RIGHT_CLICK] Juhee ${serverPlayer.name} attempting right-click heal`);

    const result = serverPlayer.useRightClick(Date.now(), targetX, targetY);

    console.log(`🎯 [RIGHT_CLICK] Result:`, {
      success: result.success,
      hasEffect: !!result.effect,
      effectType: result.effect?.effectType,
      effectId: result.effect?.id,
      effectPosition: result.effect ? `(${result.effect.x}, ${result.effect.y})` : 'N/A',
      velocity: result.effect ? `(${result.effect.velocityX}, ${result.effect.velocityY})` : 'N/A',
      manaCost: result.manaCost
    });

    if (result.success) {
      // Consume mana
      if (result.manaCost) {
        serverPlayer.useMana(result.manaCost);
        console.log(`💧 [RIGHT_CLICK] Consumed ${result.manaCost} mana`);
      }

      // Add heal projectile effect
      if (result.effect) {
        this.skillEffects.push(result.effect);
        console.log(`✅ [RIGHT_CLICK] Heal projectile added to skillEffects array. Total effects: ${this.skillEffects.length}`);
        console.log(`📊 [RIGHT_CLICK] Effect details:`, JSON.stringify(result.effect, null, 2));
      } else {
        console.log(`⚠️ [RIGHT_CLICK] No effect to add!`);
      }

      console.log(`💚 [RIGHT_CLICK] ${serverPlayer.name} successfully used Right-click heal projectile`);
    } else {
      console.log(`❌ [RIGHT_CLICK] Right-click heal failed for ${serverPlayer.name}`);
    }
  }

  /**
   * Handle player ultimate skill
   */
  public handlePlayerUltimate(socketId: string): void {
    const serverPlayer = this.serverPlayers.get(socketId);
    if (!serverPlayer || !this.serverBoss) return;

    const result = serverPlayer.useUltimate(Date.now());

    if (result.success) {
      // Consume mana
      if (result.manaCost) {
        serverPlayer.useMana(result.manaCost);
      }

      // Apply instant damage (for Guts ultimate)
      if (result.damage) {
        const damageResult = serverPlayer.calculateDamage(result.damage, this.serverBoss.getState().defense);
        this.serverBoss.takeDamage(damageResult.damage);
        serverPlayer.addDamageDealt(damageResult.damage);
        console.log(`💥 ${serverPlayer.name} ultimate dealt ${damageResult.damage.toFixed(1)} instant damage!`);
      }

      // Add visual effect
      if (result.effect) {
        this.skillEffects.push(result.effect);
      }

      // Apply buff
      if (result.buff) {
        serverPlayer.addBuff(result.buff);
      }

      console.log(`🔥 ${serverPlayer.name} used ULTIMATE!`);
    }
  }

  /**
   * Set player ready status
   */
  public setPlayerReady(socketId: string, isReady: boolean): boolean {
    // Find player by socket ID
    for (const [playerId, player] of this.players.entries()) {
      if (player.socketId === socketId) {
        player.isReady = isReady;
        this.players.set(playerId, player);
        return true;
      }
    }
    return false;
  }

  /**
   * Check if all players are ready
   */
  public areAllPlayersReady(): boolean {
    if (this.players.size === 0) return false;

    for (const player of this.players.values()) {
      if (!player.isReady) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if socket is the host
   */
  public isHost(socketId: string): boolean {
    const hostPlayer = this.players.get(this.hostId);
    return hostPlayer?.socketId === socketId;
  }

  // Getters
  public getPlayerCount(): number {
    return this.players.size;
  }

  public isFull(): boolean {
    return this.players.size >= this.maxPlayers;
  }

  public isEmpty(): boolean {
    return this.players.size === 0;
  }

  public getCode(): string {
    return this.code;
  }

  public getMaxPlayers(): number {
    return this.maxPlayers;
  }

  public getStatus(): RoomStatus {
    return this.status;
  }

  public getPlayers(): PlayerState[] {
    return Array.from(this.players.values());
  }

  public getHostName(): string {
    const host = this.players.get(this.hostId);
    return host ? host.name : 'Unknown';
  }

  public getHostId(): string {
    return this.hostId;
  }

  public getIsPrivate(): boolean {
    return this.isPrivate;
  }

  /**
   * Kick a player from the room (only host can kick)
   */
  public kickPlayer(hostSocketId: string, targetSocketId: string): boolean {
    // Check if the requester is the host
    if (!this.isHost(hostSocketId)) {
      return false;
    }

    // Cannot kick yourself
    const hostPlayer = this.players.get(this.hostId);
    if (hostPlayer?.socketId === targetSocketId) {
      return false;
    }

    // Find and remove the player
    this.removePlayer(targetSocketId);
    return true;
  }
}
