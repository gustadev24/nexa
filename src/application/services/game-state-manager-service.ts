import type { Player } from '@/core/entities/player';
import type { GameSnapshot } from '@/application/interfaces/game/game-snapshot';
import type { GameProgressState, GameState } from '@/application/interfaces/game/game-state';
import { GameStatus } from '@/application/interfaces/game/game-status';
import type { PlayerSnapshot } from '@/application/interfaces/player/player-snapshot';
import type { TimeService } from '@/application/services/time-service';
import type { GraphService } from '@/application/services/graph-service';
import type { PlayerService } from '@/application/services/player-service';

/**
 * GameStateManagerService - Gestor del estado de la partida
 *
 * Responsable de:
 * - Mantener el estado completo del juego
 * - Calcular estadísticas de jugadores
 * - Generar snapshots inmutables para la UI
 * - Gestionar tiempo transcurrido y ticks
 *
 * NO responsable de:
 * - Verificar condiciones de victoria (VictoryService)
 * - Ejecutar lógica del juego (TickService)
 *
 * Patrón: Manager/Service
 */
export class GameStateManagerService {
  private static readonly GAME_DURATION_MS = 180000; // 3 minutos
  private static readonly DOMINANCE_THRESHOLD = 0.7; // 70%

  private _gameProgressState: GameProgressState;

  constructor(
    private timeService: TimeService,
    private playerService: PlayerService,
    private graphService: GraphService,
  ) {
    // Inicializar trackers de dominancia en 0 para cada jugador
    const dominanceTrackers = new Map<Player, number>();
    for (const player of this.playerService.players) {
      dominanceTrackers.set(player, 0);
    }

    this._gameProgressState = {
      currentTick: 0,
      elapsedTime: 0,
      dominanceTrackers,
      status: GameStatus.WAITING,
    };
  }

  get gameState(): Readonly<GameState> {
    return { ...this._gameProgressState, players: this.playerService.players, graph: this.graphService.graph };
  }

  /**
   * Actualiza el tiempo transcurrido en el juego
   *
   * @param deltaTime Tiempo a agregar en milisegundos
   */
  updateElapsedTime(deltaTime: number): void {
    this._gameProgressState.elapsedTime += deltaTime;
    this._gameProgressState.currentTick++;
  }

  /**
   * Genera un snapshot inmutable del estado actual para la UI
   *
   * Este snapshot no contiene referencias a entidades mutables,
   * solo datos primitivos y estructuras serializables
   *
   * @returns Snapshot del juego para consumo de la UI
   */
  getGameSnapshot(): GameSnapshot {
    const timestamp = Date.now();
    const { currentTick, elapsedTime, status } = this._gameProgressState;

    // Calcular tiempo restante
    const remainingTime = Math.max(0, GameStateManagerService.GAME_DURATION_MS - elapsedTime);

    // Formatear tiempos
    const elapsedTimeFormatted = this.timeService.formatTime(elapsedTime);
    const remainingTimeFormatted = this.timeService.formatTime(remainingTime);

    // Obtener estadísticas de todos los jugadores
    const playerStats: PlayerSnapshot[] = this.playerService.players.map(player =>
      this.playerSnapshot(player),
    );

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
      totalNodes: this.graphService.graph.nodes.size,
      totalPlayers: this.playerService.playerCount,
      playerStats,
      dominanceWarning,
    };
  }

  /**
   * Cambia el estado del juego
   *
   * @param newStatus Nuevo estado
   */
  setGameStatus(newStatus: GameStatus): void {
    this._gameProgressState.status = newStatus;
  }

  /**
   * Verifica si hay advertencia de dominancia (jugador cerca de ganar)
   *
   * @param playerStats Estadísticas de los jugadores
   * @returns Información de advertencia o undefined
   */
  private checkDominanceWarning(
    playerStats: PlayerSnapshot[],
  ): { playerId: string | number; timeRemaining: number } | undefined {
    for (const stats of playerStats) {
      if (stats.dominancePercentage >= GameStateManagerService.DOMINANCE_THRESHOLD * 100) {
        // El jugador tiene >= 70% pero aún no ha ganado
        // (la verificación de victoria se hace en VictoryService)
        return {
          playerId: stats.playerId,
          timeRemaining: stats.dominanceTime,
        };
      }
    }
    return undefined;
  }

  /**
   * Actualiza los trackers de dominancia según el estado actual
   *
   * Verifica qué jugadores cumplen el threshold de 70% y actualiza
   * o resetea sus trackers según corresponda
   *
   * NOTA: Este método solo actualiza el estado interno para el snapshot.
   * VictoryService mantiene sus propios trackers para verificar victoria.
   *
   * @param state Estado del juego
   * @param deltaTime Tiempo transcurrido desde última actualización
   */
  updateAllDominanceTrackers(state: GameState, deltaTime: number): void {
    const totalNodes = state.graph.nodes.size;
    const threshold = GameStateManagerService.DOMINANCE_THRESHOLD;

    for (const player of state.players) {
      const controlledNodes = player.controlledNodes.size;
      const dominancePercentage = totalNodes > 0 ? controlledNodes / totalNodes : 0;

      if (dominancePercentage >= threshold) {
        // Jugador mantiene dominancia, acumular tiempo
        this.updateDominanceTracker(player, deltaTime);
      }
      else {
        // Jugador perdió dominancia, resetear
        this.resetDominanceTracker(player);
      }
    }
  }

  /**
   * Actualiza el tracker de dominancia de un jugador
   *
   * Se llama cuando un jugador mantiene >= 70% de los nodos
   * Acumula el tiempo de dominancia para mostrar en UI
   *
   * @param player Jugador que mantiene dominancia
   * @param deltaTime Tiempo a acumular en milisegundos
   */
  private updateDominanceTracker(player: Player, deltaTime: number): void {
    const currentTime = this._gameProgressState.dominanceTrackers.get(player) || 0;
    this._gameProgressState.dominanceTrackers.set(player, currentTime + deltaTime);
  }

  /**
   * Resetea el tracker de dominancia de un jugador
   *
   * Se llama cuando un jugador pierde el 70% de control de nodos
   *
   * @param player Jugador cuyo tracker se reseteará
   */
  private resetDominanceTracker(player: Player): void {
    this._gameProgressState.dominanceTrackers.set(player, 0);
  }

  /**
   * Obtiene estadísticas detalladas de un jugador
   *
   * @param player Jugador del cual obtener estadísticas
   * @returns Estadísticas calculadas del jugador
   */
  private playerSnapshot(player: Player): PlayerSnapshot {
    const totalNodes = this.graphService.graph.nodes.size;
    const controlledNodes = player.controlledNodes.size;

    // Calcular energía almacenada (suma de energía en todos los nodos controlados)
    let storedEnergy = 0;
    for (const node of player.controlledNodes) {
      storedEnergy += node.energyPool;
    }

    // Calcular energía en tránsito (suma de paquetes de energía en aristas)
    let transitEnergy = 0;
    for (const edge of this.graphService.graph.edges) {
      for (const packet of edge.energyPackets) {
        if (packet.owner === player) {
          transitEnergy += packet.amount;
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
    const dominanceTime = this._gameProgressState.dominanceTrackers.get(player) || 0;

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
}
