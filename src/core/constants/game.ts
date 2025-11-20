/**
 * Game constants
 * Aligned with NEXA game document specifications
 */
export const GAME_CONSTANTS = {
  // Energy system (conservative/distributable)
  DEFAULT_ENERGY: 100, // Starting total energy pool per player

  // Time intervals (as per NEXA document)
  ATTACK_INTERVAL: 20, // ms - interval for sending attack energy
  DEFENSE_UPDATE_INTERVAL: 30, // ms - interval for updating defense

  // Game limits
  TIME_LIMIT: 180000, // 3 minutes (180000ms) as per document
  MAX_PLAYERS: 8,
  MIN_PLAYERS: 2,
  DEFAULT_PLAYERS: 2,

  // Victory conditions
  DOMINATION_PERCENTAGE: 70, // 70% of nodes required for domination
  DOMINATION_DURATION: 10000, // 10 seconds (10000ms) to maintain control

  // Energy bonuses from special nodes
  ENERGY_NODE_BONUS: 50,
  SUPER_ENERGY_NODE_BONUS: 150,
} as const;
