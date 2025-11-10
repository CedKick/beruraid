// Using const object instead of enum for erasableSyntaxOnly compatibility
export const CritTier = {
  SMALL: 1,   // x2.0 to x2.1 - Orange
  MEDIUM: 2,  // x2.1 to x2.2 - Yellow
  BIG: 3,     // x2.2 to x2.5 - Green
} as const;

export type CritTier = typeof CritTier[keyof typeof CritTier];

export interface DamageResult {
  damage: number;
  isCrit: boolean;
  critTier?: CritTier;
  variance: number;
  baseDamage: number;
}

export class DamageCalculator {
  /**
   * Calculate stat effectiveness using formula: stat / (50000 + stat)
   */
  static calculateStatEffectiveness(stat: number): number {
    return stat / (50000 + stat);
  }

  /**
   * Get random variance for normal hits (1.0 to 1.19)
   */
  static getNormalVariance(): number {
    return 1.0 + Math.random() * 0.19;
  }

  /**
   * Determine crit tier and get multiplier
   */
  static getCritMultiplier(critDamagePercent: number): { tier: CritTier; multiplier: number } {
    // Base crit is x2.0
    const baseCrit = 2.0;

    // Calculate bonus from crit damage stat using the formula
    const critDamageBonus = this.calculateStatEffectiveness(critDamagePercent);

    // Determine the total crit range based on crit damage stat
    // Higher crit damage stat = better crits more often
    const maxCritMultiplier = baseCrit + (critDamageBonus * 0.5); // Max +0.5 multiplier from stat

    // Random value to determine tier
    const roll = Math.random();

    // Distribution: 50% small, 35% medium, 15% big
    if (roll < 0.50) {
      // Small crit: x2.0 to x2.1
      const multiplier = baseCrit + Math.random() * 0.1;
      return { tier: CritTier.SMALL, multiplier };
    } else if (roll < 0.85) {
      // Medium crit: x2.1 to x2.2 (influenced by crit damage stat)
      const min = 2.1;
      const max = Math.min(2.2, 2.1 + (critDamageBonus * 0.3));
      const multiplier = min + Math.random() * (max - min);
      return { tier: CritTier.MEDIUM, multiplier };
    } else {
      // Big crit: x2.2 to x2.5 (heavily influenced by crit damage stat)
      const min = 2.2;
      const max = Math.min(2.5, 2.2 + (critDamageBonus * 0.5));
      const multiplier = min + Math.random() * (max - min);
      return { tier: CritTier.BIG, multiplier };
    }
  }

  /**
   * Calculate final damage with all modifiers
   */
  static calculateDamage(
    baseDamage: number,
    attackPower: number,
    defPen: number,
    targetDefense: number,
    critRate: number,
    critDamage: number,
    damageBoost: number
  ): DamageResult {
    // Apply attack power boost
    const attackBonus = this.calculateStatEffectiveness(attackPower);
    let totalDamage = baseDamage * (1 + attackBonus);

    // Apply damage boost
    const damageBoostBonus = this.calculateStatEffectiveness(damageBoost);
    totalDamage *= (1 + damageBoostBonus);

    // Apply defense reduction
    const effectiveDefPen = this.calculateStatEffectiveness(defPen);
    const effectiveDefense = this.calculateStatEffectiveness(targetDefense);
    const defenseReduction = Math.max(0, effectiveDefense - effectiveDefPen);
    totalDamage *= (1 - defenseReduction * 0.5); // Defense reduces up to 50% damage

    // Check for crit
    const critRateChance = this.calculateStatEffectiveness(critRate);
    const isCrit = Math.random() < critRateChance;

    let critTier: CritTier | undefined;
    let critMultiplier = 1.0;

    if (isCrit) {
      const critResult = this.getCritMultiplier(critDamage);
      critTier = critResult.tier;
      critMultiplier = critResult.multiplier;
      totalDamage *= critMultiplier;
    } else {
      // Normal hit variance
      const variance = this.getNormalVariance();
      totalDamage *= variance;
    }

    return {
      damage: Math.max(1, Math.floor(totalDamage)),
      isCrit,
      critTier,
      variance: isCrit ? critMultiplier : 1.0,
      baseDamage,
    };
  }

  /**
   * Get color for crit tier
   */
  static getCritColor(tier: CritTier): number {
    switch (tier) {
      case CritTier.SMALL:
        return 0xffa500; // Orange
      case CritTier.MEDIUM:
        return 0xffff00; // Yellow
      case CritTier.BIG:
        return 0x00ff00; // Green
      default:
        return 0xffffff; // White
    }
  }

  /**
   * Get font size for crit tier
   */
  static getCritFontSize(tier: CritTier): string {
    switch (tier) {
      case CritTier.SMALL:
        return '32px';
      case CritTier.MEDIUM:
        return '40px';
      case CritTier.BIG:
        return '52px';
      default:
        return '24px';
    }
  }
}
