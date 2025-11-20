/**
 * Player Types for NEXA Game
 *
 * Defines interfaces and types related to players (human and AI).
 * Players control networks of nodes and compete for dominance.
 */

import type { ID, IColor } from "./common.types";
import { PlayerType, AIStrategyType, AIDifficulty } from "./common.types";

/**
 * Main Player interface
 * Represents a player in the game (human or AI)
 *
 * According to NEXA document:
 * - totalEnergy is conservative and distributable across nodes and edges
 * - Energy assigned to edges/nodes doesn't reduce total, it's just distributed
 * - totalEnergy only changes when capturing energy nodes
 * - Each player has an initialNodeId (losing it means defeat)
 */
export interface IPlayer {
  id: ID;
  name: string;
  color: IColor;
  score: number;
  type: PlayerType;
  isActive: boolean;
  isEliminated: boolean;
  totalEnergy: number; // Conservative total energy pool
  initialNodeId: ID; // Starting node - losing this means defeat
  controlledNodes: ID[];
  aiStrategy?: IAIStrategy;
}

/**
 * AI Strategy configuration
 */
export interface IAIStrategy {
  type: AIStrategyType;
  difficulty: AIDifficulty;
  aggressiveness: number; // 0-100
  expansionPriority: number; // 0-100
  defensePriority: number; // 0-100
  economicPriority: number; // 0-100
  reactionTime: number; // milliseconds
  decisionInterval: number; // milliseconds
}

/**
 * Player creation parameters
 */
export interface IPlayerCreateParams {
  id: ID;
  name: string;
  color: IColor;
  type: PlayerType;
  aiStrategy?: Partial<IAIStrategy>;
}

/**
 * Player statistics
 */
export interface IPlayerStats {
  nodesControlled: number;
  totalEnergyGenerated: number;
  totalEnergySpent: number;
  nodesConquered: number;
  nodesLost: number;
  successfulAttacks: number;
  failedAttacks: number;
  successfulDefenses: number;
  failedDefenses: number;
  connectionsBuilt: number;
  playTime: number;
  peakNodeCount: number;
  peakEnergyCount: number;
}

/**
 * Player update data
 */
export interface IPlayerUpdateData {
  score?: number;
  totalEnergy?: number;
  isActive?: boolean;
  isEliminated?: boolean;
  controlledNodes?: ID[];
}

/**
 * Player action request
 */
export interface IPlayerAction {
  playerId: ID;
  actionType: string;
  timestamp: number;
  data: Record<string, any>;
}

/**
 * Player resource summary
 */
export interface IPlayerResources {
  currentEnergy: number;
  energyPerTick: number;
  nodeCount: number;
  connectionCount: number;
  availableActions: string[];
}

/**
 * Default AI strategies for different difficulty levels
 */
export const DEFAULT_AI_STRATEGIES: Record<AIDifficulty, Partial<IAIStrategy>> = {
  [AIDifficulty.EASY]: {
    difficulty: AIDifficulty.EASY,
    type: AIStrategyType.BALANCED,
    aggressiveness: 30,
    expansionPriority: 50,
    defensePriority: 40,
    economicPriority: 60,
    reactionTime: 2000,
    decisionInterval: 3000,
  },
  [AIDifficulty.MEDIUM]: {
    difficulty: AIDifficulty.MEDIUM,
    type: AIStrategyType.BALANCED,
    aggressiveness: 50,
    expansionPriority: 60,
    defensePriority: 50,
    economicPriority: 50,
    reactionTime: 1000,
    decisionInterval: 2000,
  },
  [AIDifficulty.HARD]: {
    difficulty: AIDifficulty.HARD,
    type: AIStrategyType.AGGRESSIVE,
    aggressiveness: 75,
    expansionPriority: 70,
    defensePriority: 60,
    economicPriority: 40,
    reactionTime: 500,
    decisionInterval: 1500,
  },
  [AIDifficulty.EXPERT]: {
    difficulty: AIDifficulty.EXPERT,
    type: AIStrategyType.AGGRESSIVE,
    aggressiveness: 90,
    expansionPriority: 85,
    defensePriority: 75,
    economicPriority: 60,
    reactionTime: 200,
    decisionInterval: 1000,
  },
};

/**
 * Player ranking information
 */
export interface IPlayerRanking {
  playerId: ID;
  rank: number;
  score: number;
  nodesControlled: number;
  totalEnergy: number;
}
