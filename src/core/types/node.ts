/**
 * Node Types for NEXA Game
 *
 * Defines interfaces and types related to nodes in the game.
 * Nodes are the core strategic points on the map that players control.
 *
 * Aligned with NEXA game document specifications
 */

import { type ID, type IVector2D, NodeType } from '@/core/types/common';

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
