/**
 * Game Constants
 */

export const GAME_CONFIG = {
  // Tick rate & timing
  TICK_RATE: 60, // Server updates per second
  CLIENT_UPDATE_RATE: 60, // Client render FPS target

  // Room settings
  MIN_PLAYERS: 1,
  MAX_PLAYERS: 6,
  RAID_DURATION: 180, // 3 minutes in seconds

  // Boss settings
  BOSS_BASE_HP: 100000,
  BOSS_MAX_PHASES: 3,
  BREAK_PHASE_THRESHOLD: 0.5, // 50% HP triggers break

  // Player settings
  BASE_SPEED: 200, // pixels per second
  DASH_DISTANCE: 100,
  DASH_COOLDOWN: 3000, // 3 seconds in ms

  // Combat
  AUTO_ATTACK_RANGE: 50,
  PROJECTILE_SPEED: 300,

  // Map
  MAP_WIDTH: 1280,
  MAP_HEIGHT: 720,
} as const;

export const NETWORK_CONFIG = {
  // Interpolation
  INTERPOLATION_DELAY: 100, // ms

  // Prediction
  CLIENT_PREDICTION_ENABLED: true,

  // Reconnection
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000, // ms
} as const;
