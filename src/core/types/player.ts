import type { Color, ID } from './common';
import { PlayerType } from './common';

export interface PlayerConfig {
  id: ID;
  username: string;
  color: Color;
  type: PlayerType;
  isInitialNode?: boolean;
}

export interface PlayerStats {
  totalEnergy: number;
  nodesControlled: number;
  energyInTransit: number;
  energyInNodes: number;
}
