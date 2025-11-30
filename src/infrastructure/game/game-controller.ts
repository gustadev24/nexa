import type { VictoryService } from '@/application/services/victory-service';
import type { GameRenderer } from '@/infrastructure/renderer/game-renderer';
import type { TickService } from '@/application/services/tick-service';
import type { GameStateManagerService } from '@/application/services/game-state-manager-service';
import type { GameState } from '@/application/interfaces/game/game-state';
import { GameStatus } from '@/application/interfaces/game/game-status';
import type { CaptureService } from '@/application/services/capture-service';
import type { Player } from '@/core/entities/player';
import type { Node } from '@/core/entities/node/node';
import type { GraphService } from '@/application/services/graph-service';
import type { VictoryResult } from '@/application/interfaces/victory/victory-result';
import type { PlayerService } from '@/application/services/player-service';

/**
 * GameController - Coordinador principal del ciclo de juego
 *
 * Responsabilidades:
 * - Orquestar el game loop principal (driven by external update)
 * - Coordinar servicios (tick, victory)
 * - Manejar eventos de input
 * - Controlar inicio/pausa/fin del juego
 *
 * Patrón: Controller/Orchestrator
 */
export class GameController {
  private onVictoryCallback: ((result: VictoryResult) => void) | null = null;

  constructor(
    private tickService: TickService,
    private victoryService: VictoryService,
    private gameStateManager: GameStateManagerService,
    private gameRenderer: GameRenderer,
    private captureService: CaptureService,
    private graphService: GraphService,
    private playerService: PlayerService,
  ) {
  }

  /**
   * Establece el callback que se llamará cuando el juego termine
   */
  setOnVictory(callback: (result: VictoryResult) => void): void {
    this.onVictoryCallback = callback;
  }

  /**
   * Inicia el juego
   */
  startGame(): void {
    if (!this.gameStateManager.gameState) {
      throw new Error('No se puede iniciar el juego: el estado del juego no está inicializado.');
    }
    this.gameStateManager.setGameStatus(GameStatus.PLAYING);
    console.log('[GameController] Iniciando juego...');

    // Render inicial - solo si el renderer está inicializado
    if (this.gameRenderer && this.gameRenderer.getContext()) {
      const snapshot = this.gameStateManager.getGameSnapshot();
      this.gameRenderer.renderGraph(snapshot);
      this.gameRenderer.renderUI(snapshot);
    }
  }

  /**
   * Actualiza el estado del juego (debe ser llamado por el loop externo)
   * @param deltaTime Tiempo transcurrido en milisegundos
   */
  update(deltaTime: number): void {
    if (!this.gameStateManager.gameState || this.gameStateManager.gameState.status !== 'playing') {
      return;
    }

    // 1. Ejecutar tick del juego
    this.tickService.executeTick(this.gameStateManager.gameState, deltaTime);

    // 2. Actualizar tiempo transcurrido
    this.gameStateManager.updateElapsedTime(deltaTime);

    // 3. Actualizar trackers de dominancia
    this.gameStateManager.updateAllDominanceTrackers(this.gameStateManager.gameState, deltaTime);

    // 3.5. Actualizar trackers de dominancia en VictoryService
    this.victoryService.trackDominanceDirect(
      this.gameStateManager.gameState.players,
      this.gameStateManager.gameState.graph,
      deltaTime,
    );

    // 4. Verificar condiciones de victoria
    const snapshot = this.gameStateManager.getGameSnapshot();
    const victoryResult = this.victoryService.checkVictory(
      this.gameStateManager.gameState.players,
      this.gameStateManager.gameState.graph,
      snapshot.elapsedTime,
    );

    if (victoryResult.gameEnded) {
      this.handleGameEnd(victoryResult);
    }

    // 5. Renderizar (opcional, si se usa el renderer de canvas)
    if (this.gameRenderer && this.gameRenderer.getContext()) {
      // Nota: GameScene de Phaser ya renderiza por su cuenta,
      // pero mantenemos esto por si se usa un canvas overlay o debug.
      // Si gameRenderer requiere snapshot:
      this.gameRenderer.renderGraph(snapshot);
      this.gameRenderer.renderUI(snapshot);
    }
  }

  /**
   * Asigna nodos iniciales a los jugadores
   */
  assignInitialNodes(
    assignments: Map<Player, Node>,
  ): void {
    assignments.forEach((node, player) => {
      this.captureService.captureInitialNode(player, node);
      console.log(`[GameFactory] Jugador ${player.username} capturó nodo inicial ${node.id}`);
    });
  }

  /**
   * Maneja el fin del juego
   */
  private handleGameEnd(victoryResult: VictoryResult): void {
    console.log('[GameController] Juego terminado:', victoryResult);
    this.gameStateManager.setGameStatus(GameStatus.FINISHED);

    // Renderizar estado final
    if (this.gameRenderer && this.gameRenderer.getContext()) {
      const snapshot = this.gameStateManager.getGameSnapshot();
      this.gameRenderer.renderGraph(snapshot);
      this.gameRenderer.renderUI(snapshot);
    }

    // Notificar a la escena sobre la victoria
    // NO llamamos a endGame() aquí - GameScene lo manejará cuando esté listo
    if (this.onVictoryCallback) {
      this.onVictoryCallback(victoryResult);
    }
  }

  /**
   * Finaliza y limpia el juego (debe llamarse cuando ya no se necesita el estado)
   */
  finalizeGame(): void {
    const gameResult = this.playerService.resetPlayers();
    console.log('[GameController] Juego finalizado y limpiado:', gameResult);
  }

  /**
   * Detiene el juego
   */
  stopGame(): void {
    this.gameStateManager.setGameStatus(GameStatus.FINISHED);
    console.log('[GameController] Juego detenido');
  }

  /**
   * Pausa el juego
   */
  pauseGame(): void {
    this.gameStateManager.setGameStatus(GameStatus.WAITING); // Or 'paused' if added to enum
    console.log('[GameController] Juego pausado');
  }

  /**
   * Reanuda el juego
   */
  resumeGame(): void {
    if (this.gameStateManager.gameState.status === GameStatus.WAITING) {
      this.gameStateManager.setGameStatus(GameStatus.PLAYING);
      console.log('[GameController] Juego reanudado');
    }
  }

  /**
   * Obtiene el estado actual del juego
   */
  get gameState(): Readonly<GameState> {
    return this.gameStateManager.gameState;
  }

  /**
   * Obtiene un snapshot del estado actual
   */
  snapshot() {
    return this.gameStateManager.getGameSnapshot();
  }

  /**
   * Verifica si el juego está activo
   */
  isGameActive(): boolean {
    return this.gameState !== null && this.gameState.status === 'playing';
  }

  generateGraph(nodeCount: number) {
    return this.graphService.generateRandomGraph(nodeCount);
  }
}
