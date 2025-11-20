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
 * Aligned with NEXA game document
 */
export enum NodeType {
  BASIC = 'BASIC', // Basic node with standard properties
  ENERGY = 'ENERGY', // Increases total energy when captured
  ATTACK = 'ATTACK', // Doubles energy assigned to outgoing edges
  DEFENSE = 'DEFENSE', // Doubles defense energy against attacks
  SUPER_ENERGY = 'SUPER_ENERGY', // Significantly increases total energy and emission speed
  NEUTRAL = 'NEUTRAL', // Initially unowned, can be captured by any player
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
  EXPAND = 'EXPAND', // Expand to neutral node
  ATTACK = 'ATTACK', // Attack enemy node
  DEFEND = 'DEFEND', // Strengthen node defense
  TRANSFER = 'TRANSFER', // Transfer energy between nodes
  BUILD_CONNECTION = 'BUILD_CONNECTION', // Create new connection
  UPGRADE = 'UPGRADE', // Upgrade node type
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
  AGGRESSIVE = 'AGGRESSIVE', // Focus on attacking
  DEFENSIVE = 'DEFENSIVE', // Focus on defense
  BALANCED = 'BALANCED', // Balance between offense and defense
  EXPANSIONIST = 'EXPANSIONIST', // Focus on rapid expansion
  ECONOMIC = 'ECONOMIC', // Focus on resource generation
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
