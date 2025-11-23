import type { Color, ID } from '@/core/types/common';
import { PlayerType } from '@/core/types/common';

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
