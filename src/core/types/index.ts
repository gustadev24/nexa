/**
 * NEXA - Core Types Index
 *
 * Central export point for all TypeScript interfaces and types used in the game.
 * This file provides a clean API for importing types throughout the application.
 *
 * @example
 * import { INode, IPlayer, GamePhase } from '@/core/types';
 */

// Common types and enums
export type { IVector2D, IColor, ID, Timestamp, Percentage, Callback } from './common.types';

export {
  PlayerType,
  GamePhase,
  NodeType,
  ConnectionState,
  ActionType,
  AIDifficulty,
  AIStrategyType,
  GameDifficulty,
  PLAYER_COLORS,
  GAME_CONSTANTS,
} from './common.types';

// Node types
export type {
  INode,
  INodeTypeConfig,
  INodeCreateParams,
  INodeUpdateData,
  INodeStats,
} from './node.types';

export { NODE_TYPE_CONFIGS } from './node.types';

// Connection types
export type {
  IConnection,
  IConnectionCreateParams,
  IConnectionUpdateData,
  IConnectionStats,
  IEnergyTransferRequest,
  IConnectionConfig,
  IConnectionValidation,
  IEnergyPacket,
} from './connection.types';

export { DEFAULT_CONNECTION_CONFIG } from './connection.types';

// Player types
export type {
  IPlayer,
  IAIStrategy,
  IPlayerCreateParams,
  IPlayerStats,
  IPlayerUpdateData,
  IPlayerAction,
  IPlayerResources,
  IPlayerRanking,
} from './player.types';

export { DEFAULT_AI_STRATEGIES } from './player.types';

// Game types
export type {
  IGameState,
  IGameConfig,
  IVictoryConditions,
  IGameAction,
  IActionResult,
  IGameStateChanges,
  IActionValidation,
  IExpandAction,
  IAttackAction,
  ITransferAction,
  IDefendAction,
  IBuildConnectionAction,
  IUpgradeNodeAction,
  IGameEvent,
  IGameSnapshot,
  ITurnInfo,
  IGameStatistics,
} from './game.types';

export { VictoryType, GameEventType, DEFAULT_GAME_CONFIG } from './game.types';
