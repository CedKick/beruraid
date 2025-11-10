export class CombatStats {
  private totalDamage: number = 0;
  private totalHeal: number = 0;
  private combatStartTime: number = 0;
  private lastDamageTime: number = 0;
  private lastHealTime: number = 0;
  private damageHistory: Array<{ amount: number; time: number }> = [];
  private healHistory: Array<{ amount: number; time: number }> = [];
  private dpsWindow: number = 5000; // 5 seconds window for DPS calculation
  private hpsWindow: number = 5000; // 5 seconds window for HPS calculation

  constructor() {
    this.combatStartTime = Date.now();
  }

  addDamage(amount: number): void {
    const now = Date.now();
    this.totalDamage += amount;
    this.lastDamageTime = now;
    this.damageHistory.push({ amount, time: now });

    // Clean old entries
    this.cleanHistory(this.damageHistory, this.dpsWindow);
  }

  addHeal(amount: number): void {
    const now = Date.now();
    this.totalHeal += amount;
    this.lastHealTime = now;
    this.healHistory.push({ amount, time: now });

    // Clean old entries
    this.cleanHistory(this.healHistory, this.hpsWindow);
  }

  private cleanHistory(history: Array<{ amount: number; time: number }>, window: number): void {
    const now = Date.now();
    const cutoffTime = now - window;

    // Remove entries older than the window
    while (history.length > 0 && history[0].time < cutoffTime) {
      history.shift();
    }
  }

  getDPS(): number {
    this.cleanHistory(this.damageHistory, this.dpsWindow);

    if (this.damageHistory.length === 0) {
      return 0;
    }

    const now = Date.now();
    const oldestTime = this.damageHistory[0].time;
    const timeSpan = Math.max(1, (now - oldestTime) / 1000); // At least 1 second to avoid division issues

    const damageInWindow = this.damageHistory.reduce((sum, entry) => sum + entry.amount, 0);

    // If we have less than 1 second of data, scale it up
    if (timeSpan < 1) {
      return damageInWindow;
    }

    return damageInWindow / timeSpan;
  }

  getHPS(): number {
    this.cleanHistory(this.healHistory, this.hpsWindow);

    if (this.healHistory.length === 0) {
      return 0;
    }

    const now = Date.now();
    const oldestTime = this.healHistory[0].time;
    const timeSpan = (now - oldestTime) / 1000; // Convert to seconds

    if (timeSpan === 0) {
      return 0;
    }

    const healInWindow = this.healHistory.reduce((sum, entry) => sum + entry.amount, 0);
    return healInWindow / timeSpan;
  }

  getTotalDamage(): number {
    return this.totalDamage;
  }

  getTotalHeal(): number {
    return this.totalHeal;
  }

  getCombatDuration(): number {
    return (Date.now() - this.combatStartTime) / 1000; // in seconds
  }

  reset(): void {
    this.totalDamage = 0;
    this.totalHeal = 0;
    this.combatStartTime = Date.now();
    this.lastDamageTime = 0;
    this.lastHealTime = 0;
    this.damageHistory = [];
    this.healHistory = [];
  }
}
