/**
 * Common Types and Enums for NEXA Game
 *
 * This file contains base types, enums, and utility types used throughout the game.
 */

/**
 * 2D Vector for positioning on the game map
 */
export interface IVector2D {
  x: number;
  y: number;
}

/**
 * Player types
 */
export enum PlayerType {
  HUMAN = 'HUMAN',
  AI = 'AI',
}

/**
 * Game phases
 */
export enum GamePhase {
  SETUP = 'SETUP',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
}

/**
 * Node types with different strategic advantages
 */
export enum NodeType {
  STANDARD = 'STANDARD',      // Basic node with standard energy generation
  GENERATOR = 'GENERATOR',    // High energy generation rate
  FORTRESS = 'FORTRESS',      // Defensive bonus, harder to conquer
  AMPLIFIER = 'AMPLIFIER',    // Boosts energy transfer to connected nodes
  HARVESTER = 'HARVESTER',    // Increases resource collection
  RELAY = 'RELAY',            // Extends connection range
}

/**
 * Connection states
 */
export enum ConnectionState {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BUILDING = 'BUILDING',
  DAMAGED = 'DAMAGED',
}

/**
 * Action types that can be performed in the game
 */
export enum ActionType {
  EXPAND = 'EXPAND',              // Expand to neutral node
  ATTACK = 'ATTACK',              // Attack enemy node
  DEFEND = 'DEFEND',              // Strengthen node defense
  TRANSFER = 'TRANSFER',          // Transfer energy between nodes
  BUILD_CONNECTION = 'BUILD_CONNECTION', // Create new connection
  UPGRADE = 'UPGRADE',            // Upgrade node type
}

/**
 * AI difficulty levels
 */
export enum AIDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
}

/**
 * AI strategy types
 */
export enum AIStrategyType {
  AGGRESSIVE = 'AGGRESSIVE',      // Focus on attacking
  DEFENSIVE = 'DEFENSIVE',        // Focus on defense
  BALANCED = 'BALANCED',          // Balance between offense and defense
  EXPANSIONIST = 'EXPANSIONIST',  // Focus on rapid expansion
  ECONOMIC = 'ECONOMIC',          // Focus on resource generation
}

/**
 * Game difficulty settings
 */
export enum GameDifficulty {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
}

/**
 * RGB Color representation
 */
export interface IColor {
  r: number;
  g: number;
  b: number;
  hex?: string;
}

/**
 * Unique identifier type
 */
export type ID = string | number;

/**
 * Timestamp in milliseconds
 */
export type Timestamp = number;

/**
 * Percentage value (0-100)
 */
export type Percentage = number;

/**
 * Generic callback function
 */
export type Callback<T = void> = (data: T) => void;

/**
 * Predefined player colors
 */
export const PLAYER_COLORS: Record<string, IColor> = {
  BLUE: { r: 0, g: 150, b: 255, hex: '#0096FF' },
  RED: { r: 255, g: 50, b: 50, hex: '#FF3232' },
  GREEN: { r: 0, g: 255, b: 100, hex: '#00FF64' },
  YELLOW: { r: 255, g: 220, b: 0, hex: '#FFDC00' },
  PURPLE: { r: 200, g: 50, b: 255, hex: '#C832FF' },
  CYAN: { r: 0, g: 255, b: 255, hex: '#00FFFF' },
  ORANGE: { r: 255, g: 150, b: 0, hex: '#FF9600' },
  PINK: { r: 255, g: 100, b: 200, hex: '#FF64C8' },
};

/**
 * Game constants
 */
export const GAME_CONSTANTS = {
  DEFAULT_ENERGY: 50,
  MAX_ENERGY: 100,
  MIN_ENERGY: 0,
  DEFAULT_GENERATION_RATE: 1,
  MAX_PLAYERS: 8,
  MIN_PLAYERS: 2,
  DEFAULT_PLAYERS: 2,
  TICK_RATE: 1000, // milliseconds
} as const;
