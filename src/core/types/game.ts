/**
 * Game Types for NEXA Game
 *
 * Defines interfaces and types related to game state, actions, and configuration.
 * This includes the main game state, game actions, and game settings.
 */

import { ActionType, GameDifficulty, GamePhase, type ID, type Timestamp } from '@/core/types/common';
import type { IConnection } from '@/core/types/connection';
import type { INode } from '@/core/types/node';
import type { IPlayer } from '@/core/types/player';

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
 *
 * According to NEXA document:
 * - Real-time game with 3 minute time limit
 * - Victory by controlling 70% of nodes for 10 seconds
 * - Losing initial node means instant defeat
 */
export interface IGameConfig {
  maxPlayers: number;
  minPlayers: number;
  mapWidth: number;
  mapHeight: number;
  initialNodeCount: number;
  difficulty: GameDifficulty;
  timeLimit: number; // milliseconds - 3 minutes (180000ms) as per document
  attackInterval: number; // 20ms - interval for sending attack energy
  defenseUpdateInterval: number; // 30ms - interval for updating defense
  enableFogOfWar: boolean;
  startingEnergy: number; // Initial total energy pool for each player
  victoryConditions: IVictoryConditions;
  gameSpeed: number; // 1.0 = normal, 0.5 = slow, 2.0 = fast
}

/**
 * Victory conditions for the game
 *
 * According to NEXA document:
 * - Win by controlling 70% of nodes for 10 consecutive seconds
 * - Win by having most nodes when time limit (3 min) is reached
 * - Lose automatically if initial node is captured
 */
export interface IVictoryConditions {
  type: VictoryType;
  nodeControlPercentage: number; // 70% as per document
  controlDuration: number; // 10 seconds (10000ms) as per document
  timeLimit: number; // 3 minutes (180000ms) as per document
}

/**
 * Victory types
 *
 * According to NEXA document:
 * - DOMINATION: Control 70% of nodes for 10 seconds
 * - TIME_LIMIT: Most nodes when 3-minute timer expires
 * - INITIAL_NODE_LOST: Instant defeat when initial node is captured
 */
export enum VictoryType {
  DOMINATION = 'DOMINATION', // Control 70% of nodes for 10 seconds
  TIME_LIMIT = 'TIME_LIMIT', // Most nodes at 3-minute limit
  INITIAL_NODE_LOST = 'INITIAL_NODE_LOST', // Instant defeat condition
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
  data?: Record<string, unknown>;
}

/**
 * Game event types
 */
export enum GameEventType {
  GAME_START = 'GAME_START',
  GAME_END = 'GAME_END',
  TURN_START = 'TURN_START',
  TURN_END = 'TURN_END',
  NODE_CAPTURED = 'NODE_CAPTURED',
  NODE_LOST = 'NODE_LOST',
  CONNECTION_BUILT = 'CONNECTION_BUILT',
  CONNECTION_DESTROYED = 'CONNECTION_DESTROYED',
  ATTACK_SUCCESS = 'ATTACK_SUCCESS',
  ATTACK_FAILED = 'ATTACK_FAILED',
  PLAYER_ELIMINATED = 'PLAYER_ELIMINATED',
  ENERGY_THRESHOLD_REACHED = 'ENERGY_THRESHOLD_REACHED',
  VICTORY = 'VICTORY',
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
