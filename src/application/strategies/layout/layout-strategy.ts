import type { Position } from '@/application/interfaces/types/position';

export interface LayoutStrategy {
  generatePositions(count: number): Position[];
  calculateDistance(pos1: Position, pos2: Position): number;
}
