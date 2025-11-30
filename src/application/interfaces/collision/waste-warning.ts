import type { Edge } from '@/core/entities/edge';
import type { Player } from '@/core/entities/player';

export interface WasteWarning {
  player: Player;
  edge: Edge;
  amountLost: number;
}
