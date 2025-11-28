import type { Player } from '@/core/entities/player';
import type { GameSnapshot } from '@/application/interfaces/game/game-snapshot';
import type { GameState, GameStateConfig } from '@/application/interfaces/game/game-state';
import type { GameStatus } from '@/application/interfaces/game/game-status';
import type { PlayerSnapshot as PlayerStats } from '@/application/interfaces/player/player-snapshot';

/**
 * GameStateManager - Gestor del estado de la partida
 *
 * Responsable de:
 * - Mantener el estado completo del juego
 * - Trackear tiempo de dominancia para condición de victoria
 * - Calcular estadísticas de jugadores
 * - Generar snapshots inmutables para la UI
 *
 * Patrón: Manager/Service
 */
export class GameStateManager {
  // Constantes del juego
  private static readonly GAME_DURATION_MS = 180000; // 3 minutos
  private static readonly DOMINANCE_THRESHOLD = 0.7; // 70%
  private static readonly DOMINANCE_DURATION_MS = 10000; // 10 segundos

  /**
   * Crea un nuevo estado de juego
   *
   * @param config Configuración inicial del juego
   * @returns Estado de juego inicializado
   */
  createGameState(config: GameStateConfig): GameState {
    const { players, graph, initialTime = 0, initialTick = 0 } = config;

    // Inicializar trackers de dominancia en 0 para cada jugador
    const dominanceTrackers = new Map<Player, number>();
    for (const player of players) {
      dominanceTrackers.set(player, 0);
    }

    return {
      players,
      graph,
      currentTick: initialTick,
      elapsedTime: initialTime,
      dominanceTrackers,
      status: 'waiting',
    };
  }

  /**
   * Actualiza el tiempo transcurrido en el juego
   *
   * @param state Estado actual del juego
   * @param deltaTime Tiempo a agregar en milisegundos
   */
  updateElapsedTime(state: GameState, deltaTime: number): void {
    state.elapsedTime += deltaTime;
    state.currentTick++;
  }

  /**
   * Actualiza el tracker de dominancia de un jugador
   *
   * Se llama cuando un jugador mantiene >= 70% de los nodos
   * Acumula el tiempo de dominancia para verificar condición de victoria
   *
   * @param state Estado actual del juego
   * @param player Jugador que mantiene dominancia
   * @param deltaTime Tiempo a acumular en milisegundos
   */
  updateDominanceTracker(state: GameState, player: Player, deltaTime: number): void {
    const currentTime = state.dominanceTrackers.get(player) || 0;
    state.dominanceTrackers.set(player, currentTime + deltaTime);
  }

  /**
   * Resetea el tracker de dominancia de un jugador
   *
   * Se llama cuando un jugador pierde el 70% de control de nodos
   *
   * @param state Estado actual del juego
   * @param player Jugador cuyo tracker se reseteará
   */
  resetDominanceTracker(state: GameState, player: Player): void {
    state.dominanceTrackers.set(player, 0);
  }

  /**
   * Obtiene estadísticas detalladas de un jugador
   *
   * @param state Estado actual del juego
   * @param player Jugador del cual obtener estadísticas
   * @returns Estadísticas calculadas del jugador
   */
  getPlayerStats(state: GameState, player: Player): PlayerStats {
    const totalNodes = state.graph.nodes.size;
    const controlledNodes = player.controlledNodes.size;

    // Calcular energía almacenada (suma de energía en todos los nodos controlados)
    let storedEnergy = 0;
    for (const node of player.controlledNodes) {
      storedEnergy += node.energyPool;
    }

    // Calcular energía en tránsito (suma de paquetes de energía en aristas)
    let transitEnergy = 0;
    for (const edge of state.graph.edges) {
      for (const packet of edge.energyPackets) {
        if (packet.owner === player) {
          transitEnergy += packet.amount; // Usar 'amount' en lugar de 'energy'
        }
      }
    }

    // Energía total = almacenada + en tránsito
    const totalEnergy = storedEnergy + transitEnergy;

    // Porcentaje de dominancia
    const dominancePercentage = totalNodes > 0
      ? (controlledNodes / totalNodes) * 100
      : 0;

    // Tiempo de dominancia acumulado
    const dominanceTime = state.dominanceTrackers.get(player) || 0;

    // Verificar si está eliminado (perdió su nodo inicial)
    const initialNode = player.initialNode;
    const hasInitialNode = initialNode ? player.ownsNode(initialNode) : false;
    const isEliminated = !hasInitialNode && initialNode !== null;

    return {
      playerId: player.id,
      username: player.username,
      controlledNodes,
      totalEnergy,
      storedEnergy,
      transitEnergy,
      dominancePercentage,
      dominanceTime,
      isEliminated,
      hasInitialNode,
    };
  }

  /**
   * Genera un snapshot inmutable del estado actual para la UI
   *
   * Este snapshot no contiene referencias a entidades mutables,
   * solo datos primitivos y estructuras serializables
   *
   * @param state Estado actual del juego
   * @returns Snapshot del juego para consumo de la UI
   */
  getGameSnapshot(state: GameState): GameSnapshot {
    const timestamp = Date.now();
    const { currentTick, elapsedTime, status, graph } = state;

    // Calcular tiempo restante
    const remainingTime = Math.max(0, GameStateManager.GAME_DURATION_MS - elapsedTime);

    // Formatear tiempos
    const elapsedTimeFormatted = this.formatTime(elapsedTime);
    const remainingTimeFormatted = this.formatTime(remainingTime);

    // Obtener estadísticas de todos los jugadores
    const playerStats: PlayerStats[] = state.players.map(player =>
      this.getPlayerStats(state, player),
    );

    // Determinar ganador y razón si el juego terminó
    let winnerId: string | number | undefined;
    let victoryReason: 'dominance' | 'time_limit' | 'elimination' | undefined;

    if (status === 'finished') {
      const winner = this.determineWinner(state, playerStats);
      if (winner) {
        winnerId = winner.playerId;
        victoryReason = winner.reason;
      }
    }

    // Verificar si hay advertencia de dominancia
    const dominanceWarning = this.checkDominanceWarning(playerStats);

    return {
      timestamp,
      currentTick,
      elapsedTime,
      elapsedTimeFormatted,
      remainingTime,
      remainingTimeFormatted,
      status,
      totalNodes: graph.nodes.size,
      totalPlayers: state.players.length,
      playerStats,
      winnerId,
      victoryReason,
      dominanceWarning,
    };
  }

  /**
   * Cambia el estado del juego
   *
   * @param state Estado actual del juego
   * @param newStatus Nuevo estado
   */
  setGameStatus(state: GameState, newStatus: GameStatus): void {
    state.status = newStatus;
  }

  /**
   * Verifica si el juego ha terminado por alguna condición de victoria
   *
   * @param state Estado actual del juego
   * @param playerStats Estadísticas de los jugadores
   * @returns true si el juego debe terminar
   */
  checkVictoryConditions(state: GameState, playerStats: PlayerStats[]): boolean {
    // 1. Condición de tiempo límite (3 minutos)
    if (state.elapsedTime >= GameStateManager.GAME_DURATION_MS) {
      return true;
    }

    // 2. Condición de dominancia (70% durante 10 segundos)
    for (const stats of playerStats) {
      if (stats.dominanceTime >= GameStateManager.DOMINANCE_DURATION_MS) {
        return true;
      }
    }

    // 3. Condición de eliminación (solo queda un jugador activo)
    const activePlayers = playerStats.filter(p => !p.isEliminated);
    if (activePlayers.length <= 1) {
      return true;
    }

    return false;
  }

  /**
   * Determina el ganador según las condiciones del juego
   *
   * @param state Estado del juego
   * @param playerStats Estadísticas de los jugadores
   * @returns Información del ganador o undefined si hay empate
   */
  private determineWinner(
    state: GameState,
    playerStats: PlayerStats[],
  ): { playerId: string | number; reason: 'dominance' | 'time_limit' | 'elimination' } | undefined {
    // 1. Victoria por dominancia (70% durante 10 segundos)
    for (const stats of playerStats) {
      if (stats.dominanceTime >= GameStateManager.DOMINANCE_DURATION_MS) {
        return { playerId: stats.playerId, reason: 'dominance' };
      }
    }

    // 2. Victoria por eliminación (único jugador restante)
    const activePlayers = playerStats.filter(p => !p.isEliminated);
    if (activePlayers.length === 1) {
      return { playerId: activePlayers[0].playerId, reason: 'elimination' };
    }

    // 3. Victoria por tiempo límite (más nodos al finalizar)
    if (state.elapsedTime >= GameStateManager.GAME_DURATION_MS) {
      const sorted = [...activePlayers].sort(
        (a, b) => b.controlledNodes - a.controlledNodes,
      );

      if (sorted.length > 0) {
        // Verificar empate
        if (sorted.length > 1 && sorted[0].controlledNodes === sorted[1].controlledNodes) {
          return undefined; // Empate
        }
        return { playerId: sorted[0].playerId, reason: 'time_limit' };
      }
    }

    return undefined;
  }

  /**
   * Verifica si hay advertencia de dominancia (jugador cerca de ganar)
   *
   * @param playerStats Estadísticas de los jugadores
   * @returns Información de advertencia o undefined
   */
  private checkDominanceWarning(
    playerStats: PlayerStats[],
  ): { playerId: string | number; timeRemaining: number } | undefined {
    for (const stats of playerStats) {
      if (stats.dominancePercentage >= GameStateManager.DOMINANCE_THRESHOLD * 100) {
        const timeRemaining = GameStateManager.DOMINANCE_DURATION_MS - stats.dominanceTime;
        if (timeRemaining > 0 && timeRemaining < GameStateManager.DOMINANCE_DURATION_MS) {
          return {
            playerId: stats.playerId,
            timeRemaining,
          };
        }
      }
    }
    return undefined;
  }

  /**
   * Formatea milisegundos a formato mm:ss
   *
   * @param ms Milisegundos a formatear
   * @returns Tiempo en formato "mm:ss"
   */
  private formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Actualiza los trackers de dominancia según el estado actual
   *
   * Verifica qué jugadores cumplen el threshold de 70% y actualiza
   * o resetea sus trackers según corresponda
   *
   * @param state Estado del juego
   * @param deltaTime Tiempo transcurrido desde última actualización
   */
  updateAllDominanceTrackers(state: GameState, deltaTime: number): void {
    const totalNodes = state.graph.nodes.size;
    const threshold = GameStateManager.DOMINANCE_THRESHOLD;

    for (const player of state.players) {
      const controlledNodes = player.controlledNodes.size;
      const dominancePercentage = totalNodes > 0 ? controlledNodes / totalNodes : 0;

      if (dominancePercentage >= threshold) {
        // Jugador mantiene dominancia, acumular tiempo
        this.updateDominanceTracker(state, player, deltaTime);
      }
      else {
        // Jugador perdió dominancia, resetear
        this.resetDominanceTracker(state, player);
      }
    }
  }

  /**
   * Obtiene el estado actual del juego
   * Útil para debugging y logging
   *
   * @param state Estado del juego
   * @returns Resumen del estado en formato legible
   */
  getStateDebugInfo(state: GameState): string {
    const snapshot = this.getGameSnapshot(state);
    return `
GameState Debug Info:
- Status: ${snapshot.status}
- Tick: ${snapshot.currentTick}
- Time: ${snapshot.elapsedTimeFormatted} / ${this.formatTime(GameStateManager.GAME_DURATION_MS)}
- Total Nodes: ${snapshot.totalNodes}
- Players:
${snapshot.playerStats.map(p => `  - ${p.username}: ${p.controlledNodes} nodes (${p.dominancePercentage.toFixed(1)}%)`).join('\n')}
    `.trim();
  }
}
