export class ProgressiveBossHealth {
  private currentBarHp: number;
  private currentBarMaxHp: number;
  private rageCount: number = 0;
  private hpBarMultiplier: number = 1.69;
  private baseHp: number = 100;
  private barsDefeated: number = 0;

  constructor(baseHp: number = 100, playerCount: number = 1) {
    // Scale base HP based on player count
    this.baseHp = baseHp * Math.pow(1.5, playerCount - 1);
    this.currentBarMaxHp = this.baseHp;
    this.currentBarHp = this.currentBarMaxHp;
  }

  /**
   * Apply damage to the boss and handle overflow to next HP bars
   * Returns array of events: { type: 'damage' | 'barDefeated', damage: number, overflow?: number }
   */
  takeDamage(damage: number): Array<{ type: 'damage' | 'barDefeated'; damage: number; overflow?: number; newBarHp?: number }> {
    const events: Array<{ type: 'damage' | 'barDefeated'; damage: number; overflow?: number; newBarHp?: number }> = [];
    let remainingDamage = damage;

    while (remainingDamage > 0 && this.currentBarHp > 0) {
      const damageToApply = Math.min(remainingDamage, this.currentBarHp);
      this.currentBarHp -= damageToApply;
      remainingDamage -= damageToApply;

      events.push({
        type: 'damage',
        damage: damageToApply,
      });

      // Check if bar is defeated
      if (this.currentBarHp <= 0) {
        this.barsDefeated++;
        this.rageCount++;

        // Calculate next bar HP
        const nextBarMaxHp = Math.floor(this.baseHp * Math.pow(this.hpBarMultiplier, this.barsDefeated));

        events.push({
          type: 'barDefeated',
          damage: damageToApply,
          overflow: remainingDamage,
          newBarHp: nextBarMaxHp,
        });

        // Initialize next bar
        this.currentBarMaxHp = nextBarMaxHp;
        this.currentBarHp = this.currentBarMaxHp;

        // Apply overflow damage to next bar
        if (remainingDamage > 0) {
          // Continue loop to apply remaining damage
          continue;
        }
      }

      break;
    }

    return events;
  }

  getCurrentBarHp(): number {
    return this.currentBarHp;
  }

  getCurrentBarMaxHp(): number {
    return this.currentBarMaxHp;
  }

  getRageCount(): number {
    return this.rageCount;
  }

  getBarsDefeated(): number {
    return this.barsDefeated;
  }

  getBaseHp(): number {
    return this.baseHp;
  }

  /**
   * Get the HP of the next bar (for UI display)
   */
  getNextBarMaxHp(): number {
    return Math.floor(this.baseHp * Math.pow(this.hpBarMultiplier, this.barsDefeated + 1));
  }

  /**
   * Reset the boss health to initial state
   */
  reset(playerCount: number = 1): void {
    this.baseHp = 100 * Math.pow(1.5, playerCount - 1);
    this.currentBarMaxHp = this.baseHp;
    this.currentBarHp = this.currentBarMaxHp;
    this.rageCount = 0;
    this.barsDefeated = 0;
  }

  /**
   * Get health percentage of current bar (0-100)
   */
  getHealthPercentage(): number {
    return (this.currentBarHp / this.currentBarMaxHp) * 100;
  }

  /**
   * Get total damage dealt so far (sum of all defeated bars + current bar damage)
   */
  getTotalDamageDealt(): number {
    let total = 0;

    // Add damage from defeated bars
    for (let i = 0; i < this.barsDefeated; i++) {
      total += Math.floor(this.baseHp * Math.pow(this.hpBarMultiplier, i));
    }

    // Add damage to current bar
    total += (this.currentBarMaxHp - this.currentBarHp);

    return total;
  }
}
