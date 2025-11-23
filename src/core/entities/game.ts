import type { Player } from './player';
import type { Graph } from './graph';

export interface GameResult {
  hasWinner: boolean;
  winner: Player | null;
  players: Player[];
  reason: 'victory' | 'time_limit' | 'elimination' | 'draw';
  endTime: number;
}

export class Game {
  public isActive: boolean = true;
  public readonly startTime: number = Date.now();

  constructor(
    public readonly players: Player[],
    public readonly graph: Graph
  ) {}
}