/**
 * GameRoom - Manages a single raid instance with 2-6 players
 * Handles game state, player synchronization, and boss mechanics
 */

import type { PlayerState, GameState, RoomStatus } from '@beruraid/shared';
import { ServerBoss, type BossState as ServerBossState } from './entities/ServerBoss.js';
import { ServerPlayer } from './entities/ServerPlayer.js';

export class GameRoom {
  public readonly id: string;
  private code: string;
  private maxPlayers: number;
  private hostId: string = '';
  private status: RoomStatus = 'waiting';
  private players: Map<string, PlayerState> = new Map();

  // Server-side game entities
  private serverPlayers: Map<string, ServerPlayer> = new Map();
  private serverBoss: ServerBoss | null = null;

  private isActive: boolean = false;
  private startTime: number = 0;
  private lastUpdateTime: number = 0;

  // World bounds (match client game canvas size)
  private worldWidth = 1600;
  private worldHeight = 1000;

  constructor(roomId: string, roomCode: string, maxPlayers: number = 6) {
    this.id = roomId;
    this.code = roomCode;
    this.maxPlayers = maxPlayers;
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
        dps: combatStats.dps,
        hps: combatStats.hps,
        totalDamage: combatStats.totalDamage,
        totalHeal: combatStats.totalHeal
      } as any; // TODO: Update PlayerState type to include combat stats
    });

    // Collect all projectiles from all players
    const allProjectiles = Array.from(this.serverPlayers.values())
      .flatMap(player => player.getProjectiles());

    return {
      roomId: this.id,
      players: playerStates,
      boss: {
        hp: bossState.hp,
        maxHp: bossState.maxHp,
        position: { x: bossState.x, y: bossState.y },
        rageCount: bossState.rageCount,
        barsDefeated: bossState.barsDefeated,
        isStunned: bossState.isStunned,
        stunEndTime: bossState.stunEndTime,
        totalDamageDealt: 0, // TODO: track this
        attacks: bossState.attacks,
        velocityX: bossState.velocityX,
        velocityY: bossState.velocityY
      },
      projectiles: allProjectiles,
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

          // Apply damage to boss
          const result = this.serverBoss.takeDamage(damageResult.damage);

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
   * Handle player skill
   */
  public handlePlayerSkill(
    socketId: string,
    skillData: { skillId: number; targetX?: number; targetY?: number }
  ): void {
    const serverPlayer = this.serverPlayers.get(socketId);
    if (!serverPlayer || !this.serverBoss) return;

    // TODO: Implement skill-specific logic
    // For now, just handle basic damage skills
    const manaCost = skillData.skillId === 1 ? 10 : 20;

    if (serverPlayer.useMana(manaCost)) {
      const baseDamage = skillData.skillId === 1 ? 20 : 50;
      const damageResult = serverPlayer.calculateDamage(baseDamage, this.serverBoss.getState().defense);

      this.serverBoss.takeDamage(damageResult.damage);

      console.log(`✨ Player ${serverPlayer.name} used skill ${skillData.skillId} for ${damageResult.damage.toFixed(1)} damage`);
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
}
