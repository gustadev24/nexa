/**
 * Node Types for NEXA Game
 *
 * Defines interfaces and types related to nodes in the game.
 * Nodes are the core strategic points on the map that players control.
 */

import type { IVector2D, ID } from "./common.types";
import { NodeType } from "./common.types";

/**
 * Node type configuration
 * Defines the properties and bonuses for each node type
 */
export interface INodeTypeConfig {
  type: NodeType;
  name: string;
  description: string;
  maxEnergy: number;
  generationRate: number;
  defenseBonus: number;
  transferBonus: number;
  connectionRangeBonus: number;
  cost: number;
}

/**
 * Main Node interface
 * Represents a node on the game map
 */
export interface INode {
  id: ID;
  owner: ID | null;
  energy: number;
  connections: ID[];
  position: IVector2D;
  type: NodeType;
  maxEnergy: number;
  generationRate: number;
  lastUpdateTime: number;
  isUnderAttack: boolean;
  defenseLevel: number;
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
 */
export const NODE_TYPE_CONFIGS: Record<NodeType, INodeTypeConfig> = {
  [NodeType.STANDARD]: {
    type: NodeType.STANDARD,
    name: "Standard Node",
    description: "Basic node with standard properties",
    maxEnergy: 100,
    generationRate: 1,
    defenseBonus: 0,
    transferBonus: 0,
    connectionRangeBonus: 0,
    cost: 0,
  },
  [NodeType.GENERATOR]: {
    type: NodeType.GENERATOR,
    name: "Generator",
    description: "Generates energy at an accelerated rate",
    maxEnergy: 80,
    generationRate: 3,
    defenseBonus: -10,
    transferBonus: 0,
    connectionRangeBonus: 0,
    cost: 100,
  },
  [NodeType.FORTRESS]: {
    type: NodeType.FORTRESS,
    name: "Fortress",
    description: "Heavily defended node, difficult to conquer",
    maxEnergy: 150,
    generationRate: 0.5,
    defenseBonus: 50,
    transferBonus: 0,
    connectionRangeBonus: 0,
    cost: 150,
  },
  [NodeType.AMPLIFIER]: {
    type: NodeType.AMPLIFIER,
    name: "Amplifier",
    description: "Boosts energy transfer efficiency",
    maxEnergy: 100,
    generationRate: 1,
    defenseBonus: 0,
    transferBonus: 50,
    connectionRangeBonus: 0,
    cost: 120,
  },
  [NodeType.HARVESTER]: {
    type: NodeType.HARVESTER,
    name: "Harvester",
    description: "Increases resource collection from territory",
    maxEnergy: 120,
    generationRate: 2,
    defenseBonus: 0,
    transferBonus: 0,
    connectionRangeBonus: 0,
    cost: 100,
  },
  [NodeType.RELAY]: {
    type: NodeType.RELAY,
    name: "Relay",
    description: "Extends connection range to distant nodes",
    maxEnergy: 60,
    generationRate: 0.5,
    defenseBonus: 0,
    transferBonus: 0,
    connectionRangeBonus: 100,
    cost: 80,
  },
};
