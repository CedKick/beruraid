/**
 * GameRoom - Manages a single raid instance with 2-6 players
 * Handles game state, player synchronization, and boss mechanics
 */

import type { Player, Boss, GameState } from '@beruraid/shared';

export class GameRoom {
  public readonly id: string;
  private players: Map<string, Player> = new Map();
  private boss: Boss | null = null;
  private isActive: boolean = false;
  private startTime: number = 0;

  constructor(roomId: string) {
    this.id = roomId;
  }

  /**
   * Add a player to the room
   */
  public addPlayer(player: Player): boolean {
    if (this.players.size >= 6) {
      return false; // Room full
    }

    this.players.set(player.id, player);
    console.log(`👤 Player ${player.name} joined room ${this.id}`);
    return true;
  }

  /**
   * Remove a player from the room
   */
  public removePlayer(playerId: string): void {
    this.players.delete(playerId);
    console.log(`👋 Player ${playerId} left room ${this.id}`);

    // If room empty, mark for cleanup
    if (this.players.size === 0) {
      this.isActive = false;
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
    this.startTime = Date.now();

    // Initialize boss
    this.boss = this.createBoss();

    console.log(`🎮 Raid started in room ${this.id} with ${this.players.size} players`);
  }

  /**
   * Update game state (called every tick)
   */
  public update(deltaTime: number): GameState | null {
    if (!this.isActive || !this.boss) {
      return null;
    }

    // TODO: Update boss AI, collision detection, projectiles
    // This will be implemented in later phases

    return this.getGameState();
  }

  /**
   * Get current game state
   */
  public getGameState(): GameState {
    return {
      tick: Date.now() - this.startTime,
      players: Array.from(this.players.values()),
      boss: this.boss!,
      projectiles: []
    };
  }

  /**
   * Create boss entity
   */
  private createBoss(): Boss {
    return {
      id: `boss_${this.id}`,
      position: { x: 400, y: 300 },
      hp: 100000,
      maxHp: 100000,
      phase: 1
    };
  }

  // Getters
  public getPlayerCount(): number {
    return this.players.size;
  }

  public isFull(): boolean {
    return this.players.size >= 6;
  }

  public isEmpty(): boolean {
    return this.players.size === 0;
  }
}
