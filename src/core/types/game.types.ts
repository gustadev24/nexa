/**
 * Game Types for NEXA Game
 *
 * Defines interfaces and types related to game state, actions, and configuration.
 * This includes the main game state, game actions, and game settings.
 */

import type { ID, Timestamp } from "./common.types";
import { GamePhase, GameDifficulty, ActionType } from "./common.types";
import type { INode } from "./node.types";
import type { IConnection } from "./connection.types";
import type { IPlayer } from "./player.types";

/**
 * Main Game State interface
 * Represents the complete state of the game at any point in time
 */
export interface IGameState {
  id: ID;
  phase: GamePhase;
  currentTurn: number;
  currentPlayerId: ID | null;
  players: Map<ID, IPlayer>;
  nodes: Map<ID, INode>;
  connections: Map<ID, IConnection>;
  startTime: Timestamp;
  lastUpdateTime: Timestamp;
  winner: ID | null;
  config: IGameConfig;
}

/**
 * Game Configuration
 * Defines the rules and settings for a game session
 */
export interface IGameConfig {
  maxPlayers: number;
  minPlayers: number;
  mapWidth: number;
  mapHeight: number;
  initialNodeCount: number;
  difficulty: GameDifficulty;
  turnTimeLimit: number; // milliseconds, 0 for unlimited
  maxTurns: number; // 0 for unlimited
  enableFogOfWar: boolean;
  startingEnergy: number;
  victoryConditions: IVictoryConditions;
  gameSpeed: number; // 1.0 = normal, 0.5 = slow, 2.0 = fast
}

/**
 * Victory conditions for the game
 */
export interface IVictoryConditions {
  type: VictoryType;
  nodeControlPercentage?: number; // For DOMINATION
  scoreThreshold?: number; // For SCORE
  timeLimit?: number; // For TIME_LIMIT (milliseconds)
  energyThreshold?: number; // For ENERGY
}

/**
 * Victory types
 */
export enum VictoryType {
  DOMINATION = "DOMINATION", // Control X% of nodes
  ELIMINATION = "ELIMINATION", // Eliminate all opponents
  SCORE = "SCORE", // Reach target score
  TIME_LIMIT = "TIME_LIMIT", // Highest score at time limit
  ENERGY = "ENERGY", // Reach energy threshold
}

/**
 * Game action interface
 * Represents an action that can be performed in the game
 */
export interface IGameAction {
  id: ID;
  playerId: ID;
  type: ActionType;
  timestamp: Timestamp;
  sourceNodeId?: ID;
  targetNodeId?: ID;
  amount?: number;
  isValid: boolean;
  energyCost: number;
  result?: IActionResult;
}

/**
 * Action result
 */
export interface IActionResult {
  success: boolean;
  message: string;
  changes: IGameStateChanges;
}

/**
 * Game state changes
 * Tracks changes to game state after an action
 */
export interface IGameStateChanges {
  nodesUpdated: ID[];
  connectionsUpdated: ID[];
  playersUpdated: ID[];
  nodesCreated?: ID[];
  connectionsCreated?: ID[];
  nodesDestroyed?: ID[];
  connectionsDestroyed?: ID[];
}

/**
 * Action validation result
 */
export interface IActionValidation {
  isValid: boolean;
  reason?: string;
  requiredEnergy?: number;
  availableEnergy?: number;
}

/**
 * Expand action data
 */
export interface IExpandAction {
  playerId: ID;
  sourceNodeId: ID;
  targetNodeId: ID;
  energyAmount: number;
}

/**
 * Attack action data
 */
export interface IAttackAction {
  playerId: ID;
  sourceNodeId: ID;
  targetNodeId: ID;
  attackPower: number;
}

/**
 * Transfer action data
 */
export interface ITransferAction {
  playerId: ID;
  sourceNodeId: ID;
  targetNodeId: ID;
  amount: number;
}

/**
 * Defend action data
 */
export interface IDefendAction {
  playerId: ID;
  nodeId: ID;
  energyInvestment: number;
}

/**
 * Build connection action data
 */
export interface IBuildConnectionAction {
  playerId: ID;
  sourceNodeId: ID;
  targetNodeId: ID;
}

/**
 * Upgrade node action data
 */
export interface IUpgradeNodeAction {
  playerId: ID;
  nodeId: ID;
  targetType: string;
}

/**
 * Game event interface
 * Represents events that occur during gameplay
 */
export interface IGameEvent {
  id: ID;
  type: GameEventType;
  timestamp: Timestamp;
  playerId?: ID;
  nodeId?: ID;
  connectionId?: ID;
  message: string;
  data?: Record<string, any>;
}

/**
 * Game event types
 */
export enum GameEventType {
  GAME_START = "GAME_START",
  GAME_END = "GAME_END",
  TURN_START = "TURN_START",
  TURN_END = "TURN_END",
  NODE_CAPTURED = "NODE_CAPTURED",
  NODE_LOST = "NODE_LOST",
  CONNECTION_BUILT = "CONNECTION_BUILT",
  CONNECTION_DESTROYED = "CONNECTION_DESTROYED",
  ATTACK_SUCCESS = "ATTACK_SUCCESS",
  ATTACK_FAILED = "ATTACK_FAILED",
  PLAYER_ELIMINATED = "PLAYER_ELIMINATED",
  ENERGY_THRESHOLD_REACHED = "ENERGY_THRESHOLD_REACHED",
  VICTORY = "VICTORY",
}

/**
 * Game snapshot for save/load
 */
export interface IGameSnapshot {
  version: string;
  timestamp: Timestamp;
  gameState: IGameState;
  eventHistory: IGameEvent[];
  actionHistory: IGameAction[];
}

/**
 * Default game configuration
 */
export const DEFAULT_GAME_CONFIG: IGameConfig = {
  maxPlayers: 4,
  minPlayers: 2,
  mapWidth: 1024,
  mapHeight: 768,
  initialNodeCount: 20,
  difficulty: GameDifficulty.NORMAL,
  turnTimeLimit: 0,
  maxTurns: 0,
  enableFogOfWar: false,
  startingEnergy: 100,
  victoryConditions: {
    type: VictoryType.DOMINATION,
    nodeControlPercentage: 75,
  },
  gameSpeed: 1.0,
};

/**
 * Turn information
 */
export interface ITurnInfo {
  turnNumber: number;
  currentPlayerId: ID;
  startTime: Timestamp;
  remainingTime: number;
  actionsThisTurn: number;
}

/**
 * Game statistics
 */
export interface IGameStatistics {
  totalTurns: number;
  totalActions: number;
  gameDuration: number;
  averageTurnTime: number;
  totalEnergyGenerated: number;
  totalEnergySpent: number;
  totalNodesCreated: number;
  totalConnectionsBuilt: number;
  totalBattles: number;
}
