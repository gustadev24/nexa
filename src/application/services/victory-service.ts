import type { Game } from '@/core/entities/game';
import type { Graph } from '@/core/entities/graph';
import type { Player } from '@/core/entities/player';
import type { ID } from '@/core/types/id';

export interface PlayerNodeStat {
  playerId: ID;
  username?: string;
  nodes: number;
  percent: number;
}

export interface GameStats {
  totalNodes: number;
  elapsedTime: number; // ms
  players: PlayerNodeStat[];
  dominanceTimers: Record<string, number>;
}

export type VictoryReason = 'dominance' | 'timeout' | 'elimination' | 'draw';

export interface VictoryResult {
  gameEnded: boolean;
  winner: Player | null;
  reason: VictoryReason;
  stats: GameStats;
}

export class VictoryService {
  private readonly DOMINANCE_PERCENT = 70;
  private readonly DOMINANCE_DURATION_MS = 10_000;
  private readonly TIME_LIMIT_MS = 180_000; // 3 minutes

  // dominance timers keyed by player id
  private dominanceTimers = new Map<ID, number>();

  // Called every tick with the elapsed time since last tick (ms)
  trackDominance(game: Game, deltaTime: number): void {
    const total = game.graph.nodes.size;
    if (total === 0) return;

    for (const player of game.players) {
      const nodes = player.controlledNodeCount;
      const percent = (nodes / total) * 100;
      const current = this.dominanceTimers.get(player.id) ?? 0;

      if (percent >= this.DOMINANCE_PERCENT) {
        this.dominanceTimers.set(player.id, current + deltaTime);
      }
      else {
        this.dominanceTimers.set(player.id, 0);
      }
    }
  }

  /**
   * Verifica condiciones de victoria usando Players y Graph directamente
   * Compatible con GameController
   */
  checkVictory(players: Player[], graph: Graph, elapsedTime: number): VictoryResult {
    const totalNodes = graph.nodes.size;

    // 1) Elimination
    const eliminationResult = this.checkEliminationVictoryDirect(players, graph, elapsedTime);
    if (eliminationResult.gameEnded) return eliminationResult;

    // 2) Dominance (check timers)
    for (const player of players) {
      const timer = this.dominanceTimers.get(player.id) ?? 0;
      if (timer >= this.DOMINANCE_DURATION_MS) {
        return this.buildResultDirect(player, 'dominance', players, totalNodes, elapsedTime);
      }
    }

    // 3) Time limit
    const timeResult = this.checkTimeLimitDirect(players, totalNodes, elapsedTime);
    if (timeResult.gameEnded) return timeResult;

    return {
      gameEnded: false,
      winner: null,
      reason: 'draw',
      stats: this.buildStats(players, totalNodes, elapsedTime),
    };
  }

  checkVictoryCondition(game: Game): VictoryResult | null {
    // 1) Elimination
    const eliminationResult = this.checkEliminationVictory(game);
    if (eliminationResult) return eliminationResult;

    // 2) Dominance (check timers)
    for (const player of game.players) {
      const timer = this.dominanceTimers.get(player.id) ?? 0;
      if (timer >= this.DOMINANCE_DURATION_MS) {
        return this.buildResult(player, 'dominance', game);
      }
    }

    // 3) Time limit
    const timeResult = this.checkTimeLimit(game);
    if (timeResult) return timeResult;

    return null;
  }

  checkTimeLimit(game: Game): VictoryResult | null {
    const elapsed = Date.now() - game.startTime;
    if (elapsed < this.TIME_LIMIT_MS) return null;

    const counts = game.players.map(p => ({ player: p, nodes: p.controlledNodeCount }));
    let max = -1;
    for (const c of counts) {
      if (c.nodes > max) max = c.nodes;
    }

    const top = counts.filter(c => c.nodes === max);

    if (top.length === 1) {
      return this.buildResult(top[0].player, 'timeout', game);
    }

    // tie -> draw
    return this.buildResult(null, 'draw', game);
  }

  checkElimination(player: Player): boolean {
    return player.isEliminated;
  }

  private checkEliminationVictoryDirect(players: Player[], graph: Graph, elapsedTime: number): VictoryResult {
    const remaining = players.filter(p => !p.isEliminated);

    if (remaining.length === 1) {
      return this.buildResultDirect(remaining[0], 'elimination', players, graph.nodes.size, elapsedTime);
    }

    return {
      gameEnded: false,
      winner: null,
      reason: 'draw',
      stats: this.buildStats(players, graph.nodes.size, elapsedTime),
    };
  }

  private checkEliminationVictory(game: Game): VictoryResult | null {
    const eliminated = game.players.filter(p => p.isEliminated);
    if (eliminated.length === 0) return null;

    const remaining = game.players.filter(p => !p.isEliminated);
    if (remaining.length === 1) {
      return this.buildResult(remaining[0], 'elimination', game);
    }

    return null;
  }

  private checkTimeLimitDirect(players: Player[], totalNodes: number, elapsedTime: number): VictoryResult {
    if (elapsedTime < this.TIME_LIMIT_MS) {
      return {
        gameEnded: false,
        winner: null,
        reason: 'draw',
        stats: this.buildStats(players, totalNodes, elapsedTime),
      };
    }

    const counts = players.map(p => ({ player: p, nodes: p.controlledNodeCount }));
    let max = -1;
    for (const c of counts) {
      if (c.nodes > max) max = c.nodes;
    }

    const top = counts.filter(c => c.nodes === max);

    if (top.length === 1) {
      return this.buildResultDirect(top[0].player, 'timeout', players, totalNodes, elapsedTime);
    }

    // tie -> draw
    return this.buildResultDirect(null, 'draw', players, totalNodes, elapsedTime);
  }

  private buildResultDirect(winner: Player | null, reason: VictoryReason, players: Player[], totalNodes: number, elapsedTime: number): VictoryResult {
    return {
      gameEnded: true,
      winner,
      reason,
      stats: this.buildStats(players, totalNodes, elapsedTime),
    };
  }

  private buildStats(players: Player[], totalNodes: number, elapsedTime: number): GameStats {
    const playerStats: PlayerNodeStat[] = players.map(p => ({
      playerId: p.id,
      username: p.username,
      nodes: p.controlledNodeCount,
      percent: totalNodes > 0 ? (p.controlledNodeCount / totalNodes) * 100 : 0,
    }));

    const dominanceTimers: Record<string, number> = {};
    for (const [id, t] of this.dominanceTimers.entries()) {
      dominanceTimers[String(id)] = t;
    }

    return {
      totalNodes,
      elapsedTime,
      players: playerStats,
      dominanceTimers,
    };
  }

  private buildResult(winner: Player | null, reason: VictoryReason, game: Game): VictoryResult {
    const total = game.graph.nodes.size;
    const elapsed = Date.now() - game.startTime;

    const players: PlayerNodeStat[] = game.players.map(p => ({
      playerId: p.id,
      username: p.username,
      nodes: p.controlledNodeCount,
      percent: total > 0 ? (p.controlledNodeCount / total) * 100 : 0,
    }));

    const dominanceTimers: Record<string, number> = {};
    for (const [id, t] of this.dominanceTimers.entries()) {
      dominanceTimers[String(id)] = t;
    }

    const stats: GameStats = {
      totalNodes: total,
      elapsedTime: elapsed,
      players,
      dominanceTimers,
    };

    return { gameEnded: true, winner, reason, stats };
  }
}

export default VictoryService;
