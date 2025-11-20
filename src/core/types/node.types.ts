/**
 * Node Types for NEXA Game
 *
 * Defines interfaces and types related to nodes in the game.
 * Nodes are the core strategic points on the map that players control.
 *
 * Aligned with NEXA game document specifications
 */

import type { IVector2D, ID } from "./common.types";
import { NodeType } from "./common.types";

/**
 * Node type configuration
 * Defines the properties and effects for each node type
 */
export interface INodeTypeConfig {
  type: NodeType;
  name: string;
  description: string;
  energyBonus: number; // Energy added to player's total when captured
  attackMultiplier: number; // Multiplier for attack energy on outgoing edges
  defenseMultiplier: number; // Multiplier for defense energy
  emissionSpeedBonus: number; // Bonus to energy emission speed (percentage)
}

/**
 * Main Node interface
 * Represents a node on the game map
 *
 * According to NEXA document:
 * - Energy is distributed from player's total pool
 * - Defense energy is calculated as energy not assigned to edges
 * - Attack energy is assigned to edges and travels to adjacent nodes
 */
export interface INode {
  id: ID;
  owner: ID | null; // null for neutral nodes
  defenseEnergy: number; // Energy allocated for defense
  connections: ID[]; // Connected edge IDs
  position: IVector2D;
  type: NodeType;
  lastUpdateTime: number;
  isUnderAttack: boolean;
  isInitialNode: boolean; // True if this is a player's starting node
}

/**
 * Node creation parameters
 */
export interface INodeCreateParams {
  id: ID;
  position: IVector2D;
  type?: NodeType;
  owner?: ID | null;
  energy?: number;
}

/**
 * Node update data
 */
export interface INodeUpdateData {
  energy?: number;
  owner?: ID | null;
  defenseLevel?: number;
  isUnderAttack?: boolean;
}

/**
 * Node statistics
 */
export interface INodeStats {
  totalEnergyGenerated: number;
  timesAttacked: number;
  timesDefended: number;
  ownershipChanges: number;
  connectedNodesCount: number;
}

/**
 * Default node type configurations
 * Aligned with NEXA game document specifications
 */
export const NODE_TYPE_CONFIGS: Record<NodeType, INodeTypeConfig> = {
  [NodeType.BASIC]: {
    type: NodeType.BASIC,
    name: "Basic Node",
    description: "Standard node with basic properties for energy assignment and defense",
    energyBonus: 0,
    attackMultiplier: 1.0,
    defenseMultiplier: 1.0,
    emissionSpeedBonus: 0,
  },
  [NodeType.ENERGY]: {
    type: NodeType.ENERGY,
    name: "Energy Node",
    description: "Immediately increases player's total energy when captured",
    energyBonus: 50, // Increases player's total energy
    attackMultiplier: 1.0,
    defenseMultiplier: 1.0,
    emissionSpeedBonus: 0,
  },
  [NodeType.ATTACK]: {
    type: NodeType.ATTACK,
    name: "Attack Node",
    description: "Doubles energy assigned to outgoing edges",
    energyBonus: 0,
    attackMultiplier: 2.0, // Doubles attack energy on outgoing edges
    defenseMultiplier: 1.0,
    emissionSpeedBonus: 0,
  },
  [NodeType.DEFENSE]: {
    type: NodeType.DEFENSE,
    name: "Defense Node",
    description: "Doubles defense energy when receiving attacks",
    energyBonus: 0,
    attackMultiplier: 1.0,
    defenseMultiplier: 2.0, // Doubles defense energy
    emissionSpeedBonus: 0,
  },
  [NodeType.SUPER_ENERGY]: {
    type: NodeType.SUPER_ENERGY,
    name: "Super Energy Node",
    description: "Significantly increases total energy and provides emission speed bonus",
    energyBonus: 150, // Major energy boost
    attackMultiplier: 1.0,
    defenseMultiplier: 1.0,
    emissionSpeedBonus: 50, // 50% faster emission
  },
  [NodeType.NEUTRAL]: {
    type: NodeType.NEUTRAL,
    name: "Neutral Node",
    description: "Initially unowned, can be captured by any player",
    energyBonus: 0,
    attackMultiplier: 1.0,
    defenseMultiplier: 1.0,
    emissionSpeedBonus: 0,
  },
};
