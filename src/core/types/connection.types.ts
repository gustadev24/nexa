/**
 * Connection Types for NEXA Game
 *
 * Defines interfaces and types related to connections between nodes.
 * Connections allow energy transfer and network expansion.
 *
 * According to NEXA document:
 * - Connections (edges) carry energy in transit between nodes
 * - Energy travels at constant speed based on edge weight/distance
 * - Enemy energies can collide on edges (conflict resolution)
 * - Allied energies crossing in opposite directions cancel each other
 */

import type { ID, ConnectionState } from "./common.types";

/**
 * Energy packet traveling through a connection
 */
export interface IEnergyPacket {
  id: ID;
  ownerId: ID; // Player who sent this energy
  amount: number;
  sourceNodeId: ID;
  targetNodeId: ID;
  progress: number; // 0-1, how far along the connection (0 = source, 1 = target)
  timestamp: number; // When the energy was sent
}

/**
 * Main Connection interface
 * Represents a connection (edge) between two nodes
 *
 * According to NEXA document:
 * - Energy packets travel through connections at intervals
 * - Attack energy sent at 20ms intervals
 * - Connection weight determines travel time
 */
export interface IConnection {
  id: ID;
  sourceNodeId: ID;
  targetNodeId: ID;
  state: ConnectionState;
  weight: number; // Distance/weight - affects energy travel time
  energyPackets: IEnergyPacket[]; // Energy currently in transit
  assignedEnergy: number; // Energy assigned to this edge by source node owner
  isBidirectional: boolean;
}

/**
 * Connection creation parameters
 */
export interface IConnectionCreateParams {
  sourceNodeId: ID;
  targetNodeId: ID;
  weight?: number; // Distance/weight for travel time calculation
  isBidirectional?: boolean;
}

/**
 * Connection update data
 */
export interface IConnectionUpdateData {
  state?: ConnectionState;
  assignedEnergy?: number;
  energyPackets?: IEnergyPacket[];
}

/**
 * Connection statistics
 */
export interface IConnectionStats {
  totalEnergyTransferred: number;
  averageFlowRate: number;
  uptime: number;
  timesInterrupted: number;
}

/**
 * Energy transfer request
 * Used to send attack energy through a connection
 */
export interface IEnergyTransferRequest {
  connectionId: ID;
  amount: number;
  ownerId: ID; // Player sending the energy
  sourceNodeId: ID;
  targetNodeId: ID;
  timestamp: number;
}

/**
 * Connection configuration
 * According to NEXA document:
 * - Attack energy sent at 20ms intervals
 * - Energy speed is constant and uniform
 */
export interface IConnectionConfig {
  attackInterval: number; // Interval for sending attack energy (ms)
  defenseUpdateInterval: number; // Interval for updating defense (ms)
  defaultWeight: number; // Default distance/weight for connections
  maxDistance: number;
  energySpeed: number; // Speed of energy travel (units per ms)
}

/**
 * Default connection configuration
 * Aligned with NEXA document specifications
 */
export const DEFAULT_CONNECTION_CONFIG: IConnectionConfig = {
  attackInterval: 20, // 20ms as per document
  defenseUpdateInterval: 30, // 30ms as per document
  defaultWeight: 100, // Default distance
  maxDistance: 500,
  energySpeed: 1, // 1 unit per ms
};

/**
 * Connection validation result
 */
export interface IConnectionValidation {
  isValid: boolean;
  reason?: string;
  distance?: number;
  energyCost?: number;
}
