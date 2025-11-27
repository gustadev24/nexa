import type { Player } from '@/core/entities/player';
import type { Graph } from '@/core/entities/graph';

export class Game {
  private _isActive = true;
  private _startTime: number = Date.now();

  constructor(
    private _players: Player[],
    private _graph: Graph,
  ) { }

  get isActive(): boolean {
    return this._isActive;
  }

  set isActive(value: boolean) {
    this._isActive = value;
  }

  get players(): Player[] {
    return this._players;
  }

  get graph(): Graph {
    return this._graph;
  }

  get startTime(): number {
    return this._startTime;
  }

  activePlayers(): Player[] {
    return this._players.filter(p => !p.isEliminated);
  }
}
