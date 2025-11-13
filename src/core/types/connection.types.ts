/**
 * Connection Types for NEXA Game
 *
 * Defines interfaces and types related to connections between nodes.
 * Connections allow energy transfer and network expansion.
 */

import type { ID, ConnectionState } from './common.types';

/**
 * Main Connection interface
 * Represents a connection between two nodes
 */
export interface IConnection {
  id: ID;
  sourceNodeId: ID;
  targetNodeId: ID;
  state: ConnectionState;
  energyFlow: number;
  transferRate: number;
  capacity: number;
  buildProgress: number;
  lastTransferTime: number;
  isBidirectional: boolean;
}

/**
 * Connection creation parameters
 */
export interface IConnectionCreateParams {
  sourceNodeId: ID;
  targetNodeId: ID;
  transferRate?: number;
  capacity?: number;
  isBidirectional?: boolean;
}

/**
 * Connection update data
 */
export interface IConnectionUpdateData {
  state?: ConnectionState;
  energyFlow?: number;
  buildProgress?: number;
  transferRate?: number;
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
 */
export interface IEnergyTransferRequest {
  connectionId: ID;
  amount: number;
  sourceNodeId: ID;
  targetNodeId: ID;
  timestamp: number;
}

/**
 * Connection configuration
 */
export interface IConnectionConfig {
  defaultTransferRate: number;
  defaultCapacity: number;
  buildTime: number;
  maxDistance: number;
  energyCostPerDistance: number;
}

/**
 * Default connection configuration
 */
export const DEFAULT_CONNECTION_CONFIG: IConnectionConfig = {
  defaultTransferRate: 1,
  defaultCapacity: 50,
  buildTime: 3000,
  maxDistance: 300,
  energyCostPerDistance: 0.1,
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
