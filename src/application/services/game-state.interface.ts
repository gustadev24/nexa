import type { Edge } from '@/core/entities/edge';
import type { Node } from '@/core/entities/node/node';
import type { Player } from '@/core/entities/player';

export interface GameState {
  nodes: Node[];
  edges: Edge[];
  players: Player[];
}
