import type { GameService } from '@/application/services/game/game-service';
import type { TickService } from '@/application/services/tick.service';
import type { VictoryResult, VictoryService } from '@/application/services/victory-service';
import type { GameStateManager } from '@/application/services/game/game-state-manager';
import type { GameRenderer } from '@/presentation/renderer/game-renderer';
import type { GameState as InfraGameState } from '@/application/interfaces/game/game-state';
import type { GameState as AppGameState } from '@/application/services/game-state.interface';

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
  private gameService: GameService;
  private tickService: TickService;
  private victoryService: VictoryService;
  private gameStateManager: GameStateManager;
  private gameRenderer: GameRenderer;

  private gameState: InfraGameState | null = null;

  constructor(
    gameService: GameService,
    tickService: TickService,
    victoryService: VictoryService,
    gameStateManager: GameStateManager,
    gameRenderer: GameRenderer,
  ) {
    this.gameService = gameService;
    this.tickService = tickService;
    this.victoryService = victoryService;
    this.gameStateManager = gameStateManager;
    this.gameRenderer = gameRenderer;
  }

  /**
   * Inicia el juego
   */
  startGame(gameState: InfraGameState): void {
    this.gameState = gameState;
    this.gameStateManager.setGameStatus(gameState, 'playing');
    console.log('[GameController] Iniciando juego...');

    // Render inicial
    if (this.gameRenderer) {
      this.gameRenderer.renderGraph(this.gameStateManager.getGameSnapshot(gameState));
      this.gameRenderer.renderUI(this.gameStateManager.getGameSnapshot(gameState));
    }
  }

  /**
   * Actualiza el estado del juego (debe ser llamado por el loop externo)
   * @param deltaTime Tiempo transcurrido en milisegundos
   */
  update(deltaTime: number): void {
    if (!this.gameState || this.gameState.status !== 'playing') {
      return;
    }

    // 1. Ejecutar tick del juego
    const appGameState: AppGameState = {
      nodes: Array.from(this.gameState.graph.nodes),
      edges: Array.from(this.gameState.graph.edges),
      players: this.gameState.players,
    };
    this.tickService.executeTick(appGameState, deltaTime);

    // 2. Actualizar tiempo transcurrido
    this.gameStateManager.updateElapsedTime(this.gameState, deltaTime);

    // 3. Actualizar trackers de dominancia
    this.gameStateManager.updateAllDominanceTrackers(this.gameState, deltaTime);

    // 4. Verificar condiciones de victoria
    const snapshot = this.gameStateManager.getGameSnapshot(this.gameState);
    const victoryResult = this.victoryService.checkVictory(
      this.gameState.players,
      this.gameState.graph,
      snapshot.elapsedTime,
    );

    if (victoryResult.gameEnded) {
      this.handleGameEnd(victoryResult);
    }

    // 5. Renderizar (opcional, si se usa el renderer de canvas)
    if (this.gameRenderer) {
      // Nota: GameScene de Phaser ya renderiza por su cuenta,
      // pero mantenemos esto por si se usa un canvas overlay o debug.
      // Si gameRenderer requiere snapshot:
      this.gameRenderer.renderGraph(snapshot);
      this.gameRenderer.renderUI(snapshot);
    }
  }

  /**
   * Maneja el fin del juego
   */
  private handleGameEnd(victoryResult: VictoryResult): void {
    if (!this.gameState) return;

    console.log('[GameController] Juego terminado:', victoryResult);
    this.gameStateManager.setGameStatus(this.gameState, 'finished');

    // Renderizar estado final
    if (this.gameRenderer) {
      const snapshot = this.gameStateManager.getGameSnapshot(this.gameState);
      this.gameRenderer.renderGraph(snapshot);
      this.gameRenderer.renderUI(snapshot);
    }

    // Finalizar el juego a través del servicio
    const gameResult = this.gameService.endGame();
    console.log('[GameController] Resultado final:', gameResult);
  }

  /**
   * Detiene el juego
   */
  stopGame(): void {
    if (this.gameState) {
      this.gameStateManager.setGameStatus(this.gameState, 'finished');
    }
    console.log('[GameController] Juego detenido');
  }

  /**
   * Pausa el juego
   */
  pauseGame(): void {
    if (this.gameState) {
      this.gameStateManager.setGameStatus(this.gameState, 'waiting'); // Or 'paused' if added to enum
      console.log('[GameController] Juego pausado');
    }
  }

  /**
   * Reanuda el juego
   */
  resumeGame(): void {
    if (this.gameState && this.gameState.status === 'waiting') {
      this.gameStateManager.setGameStatus(this.gameState, 'playing');
      console.log('[GameController] Juego reanudado');
    }
  }

  /**
   * Obtiene el estado actual del juego
   */
  getGameState(): InfraGameState | null {
    return this.gameState;
  }

  /**
   * Obtiene un snapshot del estado actual
   */
  getSnapshot() {
    if (!this.gameState) return null;
    return this.gameStateManager.getGameSnapshot(this.gameState);
  }

  /**
   * Verifica si el juego está activo
   */
  isGameActive(): boolean {
    return this.gameState !== null && this.gameState.status === 'playing';
  }

  /**
   * Limpia recursos al destruir el controller
   */
  destroy(): void {
    this.stopGame();
    this.gameState = null;
    console.log('[GameController] Controller destruido');
  }
}
