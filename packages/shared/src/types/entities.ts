/**
 * Base entity types
 */

export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  position: Vector2;
}

export interface DamageableEntity extends Entity {
  hp: number;
  maxHp: number;
}
