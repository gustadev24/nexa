import type { VictoryResult } from '@/application/interfaces/victory/victory-result';
import type { GameStats, PlayerNodeStat } from '@/application/interfaces/victory/game-stats';
import type { VictoryReason } from '@/application/interfaces/victory/victory-reason';
import type { Graph } from '@/core/entities/graph';
import type { Player } from '@/core/entities/player';
import type { ID } from '@/core/types/id';
import { GAME_CONSTANTS } from '@/application/constants/game-constants';

/**
 * VictoryService - Servicio responsable de verificar condiciones de victoria
 *
 * Responsabilidades:
 * - Trackear tiempo de dominancia de jugadores
 * - Verificar todas las condiciones de victoria
 * - Generar resultados de victoria con estadísticas
 *
 * Condiciones de victoria:
 * 1. Eliminación: Un jugador pierde su nodo inicial
 * 2. Dominancia: 70% de nodos durante 10 segundos continuos
 * 3. Tiempo límite: Mayor cantidad de nodos al finalizar 3 minutos
 */
export class VictoryService {
  // Trackers de tiempo de dominancia por jugador
  private dominanceTimers = new Map<ID, number>();

  /**
   * Obtiene el tiempo de dominancia acumulado de un jugador
   * @param playerId ID del jugador
   * @returns Tiempo en milisegundos que el jugador ha estado dominando
   */
  getDominanceTime(playerId: ID): number {
    return this.dominanceTimers.get(playerId) ?? 0;
  }

  /**
   * Obtiene el porcentaje de progreso hacia la victoria por dominancia
   * @param playerId ID del jugador
   * @returns Porcentaje de 0 a 100
   */
  getDominanceProgress(playerId: ID): number {
    const time = this.getDominanceTime(playerId);
    return Math.min(100, (time / GAME_CONSTANTS.DOMINANCE_DURATION_MS) * 100);
  }

  /**
   * Rastrea dominancia de jugadores y actualiza sus timers
   * Debe llamarse en cada tick del juego
   *
   * @param players Lista de jugadores
   * @param graph Grafo del juego
   * @param deltaTime Tiempo transcurrido desde último tick (ms)
   */
  trackDominance(players: Player[], graph: Graph, deltaTime: number): void {
    const total = graph.nodes.size;
    if (total === 0) return;

    for (const player of players) {
      const nodes = player.controlledNodeCount;
      const percent = (nodes / total) * 100;
      const current = this.dominanceTimers.get(player.id) ?? 0;

      if (percent >= GAME_CONSTANTS.DOMINANCE_PERCENT) {
        // Jugador mantiene dominancia, acumular tiempo
        this.dominanceTimers.set(player.id, current + deltaTime);
      }
      else {
        // Jugador no cumple threshold, resetear timer
        this.dominanceTimers.set(player.id, 0);
      }
    }
  }

  /**
   * Verifica todas las condiciones de victoria
   *
   * Orden de verificación:
   * 1. Eliminación (pérdida de nodo inicial)
   * 2. Dominancia (70% durante 10 segundos)
   * 3. Tiempo límite (más nodos al finalizar)
   *
   * @param players Lista de jugadores
   * @param graph Grafo del juego
   * @param elapsedTime Tiempo transcurrido del juego (ms)
   * @returns Resultado de victoria (gameEnded indica si terminó el juego)
   */
  checkVictory(players: Player[], graph: Graph, elapsedTime: number): VictoryResult {
    const totalNodes = graph.nodes.size;

    // 1. Victoria por eliminación
    const eliminationResult = this.checkEliminationVictory(players, totalNodes, elapsedTime);
    if (eliminationResult.gameEnded) {
      return eliminationResult;
    }

    // 2. Victoria por dominancia (verificar timers)
    for (const player of players) {
      const timer = this.dominanceTimers.get(player.id) ?? 0;
      if (timer >= GAME_CONSTANTS.DOMINANCE_DURATION_MS) {
        return this.buildResult(player, 'dominance', players, totalNodes, elapsedTime);
      }
    }

    // 3. Victoria por tiempo límite
    const timeResult = this.checkTimeLimit(players, totalNodes, elapsedTime);
    if (timeResult.gameEnded) {
      return timeResult;
    }

    // Juego continúa
    return {
      gameEnded: false,
      winner: null,
      reason: 'draw',
      stats: this.buildStats(players, totalNodes, elapsedTime),
    };
  }

  /**
   * Verifica condición de victoria por eliminación
   * Un jugador gana si todos los demás perdieron su nodo inicial
   */
  private checkEliminationVictory(
    players: Player[],
    totalNodes: number,
    elapsedTime: number,
  ): VictoryResult {
    const remaining = players.filter(p => !p.isEliminated);

    if (remaining.length === 1) {
      return this.buildResult(remaining[0], 'elimination', players, totalNodes, elapsedTime);
    }

    if (remaining.length === 0) {
      // Todos eliminados simultáneamente - empate
      return this.buildResult(null, 'draw', players, totalNodes, elapsedTime);
    }

    return {
      gameEnded: false,
      winner: null,
      reason: 'draw',
      stats: this.buildStats(players, totalNodes, elapsedTime),
    };
  }

  /**
   * Verifica condición de victoria por tiempo límite
   * Gana el jugador con más nodos al alcanzar el límite de tiempo
   */
  private checkTimeLimit(
    players: Player[],
    totalNodes: number,
    elapsedTime: number,
  ): VictoryResult {
    if (elapsedTime < GAME_CONSTANTS.TIME_LIMIT_MS) {
      return {
        gameEnded: false,
        winner: null,
        reason: 'draw',
        stats: this.buildStats(players, totalNodes, elapsedTime),
      };
    }

    // Tiempo límite alcanzado - determinar ganador por cantidad de nodos
    const counts = players.map(p => ({ player: p, nodes: p.controlledNodeCount }));
    const maxNodes = Math.max(...counts.map(c => c.nodes));
    const winners = counts.filter(c => c.nodes === maxNodes);

    if (winners.length === 1) {
      return this.buildResult(winners[0].player, 'timeout', players, totalNodes, elapsedTime);
    }

    // Empate - misma cantidad de nodos
    return this.buildResult(null, 'draw', players, totalNodes, elapsedTime);
  }

  /**
   * Construye el resultado de victoria con estadísticas
   */
  private buildResult(
    winner: Player | null,
    reason: VictoryReason,
    players: Player[],
    totalNodes: number,
    elapsedTime: number,
  ): VictoryResult {
    return {
      gameEnded: true,
      winner,
      reason,
      stats: this.buildStats(players, totalNodes, elapsedTime),
    };
  }

  /**
   * Construye estadísticas del juego
   */
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
}

export default VictoryService;
