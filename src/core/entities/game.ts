import type { Player } from '@/core/entities/player';
import type { Graph } from '@/core/entities/graph';
import type { ID } from '@/core/types/id';
import type { Timestamp } from '@/core/types/timestamp';

export class Game {
  private _id: ID;
  private _isActive = true;
  private _startTime: number;

  constructor(
    id: ID,
    startTime: number,
    private _players: Player[],
    private _graph: Graph,
    private _duration: Timestamp,
  ) {
    this._id = id;
    this._startTime = startTime;
  }

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

  get id(): ID {
    return this._id;
  }

  remainingTime(now: Timestamp): Timestamp {
    const elapsed = now - this._startTime;
    return Math.max(this._duration - elapsed, 0);
  }

  activePlayers(): Player[] {
    return this._players.filter(p => !p.isEliminated);
  }

  eliminatedPlayers(): Player[] {
    return this._players.filter(p => p.isEliminated);
  }
}
