import type { GameService } from '@/application/services/game-service';
import type { TickService } from '@/application/services/tick.service';
import type { VictoryResult, VictoryService } from '@/application/services/victory-service';
import type { GameStateManager } from '@/infrastructure/state/GameStateManager';
import type { GameRenderer } from '@/presentation/renderer/game-renderer';
import type { GameState as InfraGameState } from '@/infrastructure/state/types';
import type { GameState as AppGameState } from '@/application/services/game-state.interface';

/**
 * GameController - Coordinador principal del ciclo de juego
 *
 * Responsabilidades:
 * - Orquestar el game loop principal
 * - Coordinar servicios (tick, victory, render)
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
  private animationFrameId: number | null = null;
  private lastTickTime = 0;

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
   * Inicia el juego y el game loop
   */
  startGame(gameState: InfraGameState): void {
    if (this.animationFrameId !== null) {
      console.warn('[GameController] El juego ya está en ejecución');
      return;
    }

    this.gameState = gameState;
    this.lastTickTime = performance.now();
    this.gameStateManager.setGameStatus(gameState, 'playing');

    console.log('[GameController] Iniciando juego...');
    this.gameLoop(this.lastTickTime);
  }

  /**
   * Game loop principal - ejecuta cada frame
   */
  private gameLoop(currentTime: number): void {
    if (!this.gameState) {
      console.error('[GameController] No hay estado de juego activo');
      return;
    }

    // Calcular delta time en milisegundos
    const deltaTime = currentTime - this.lastTickTime;
    this.lastTickTime = currentTime;

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
      return;
    }

    // 5. Renderizar el estado actual (si tiene método render)
    if ('render' in this.gameRenderer && typeof this.gameRenderer.render === 'function') {
      this.gameRenderer.render(this.gameState);
    }

    // 6. Continuar el loop
    this.animationFrameId = requestAnimationFrame(time => this.gameLoop(time));
  }

  /**
   * Maneja el fin del juego
   */
  private handleGameEnd(victoryResult: VictoryResult): void {
    if (!this.gameState) return;

    console.log('[GameController] Juego terminado:', victoryResult);
    this.gameStateManager.setGameStatus(this.gameState, 'finished');

    // Renderizar estado final (si tiene método render)
    if ('render' in this.gameRenderer && typeof this.gameRenderer.render === 'function') {
      this.gameRenderer.render(this.gameState);
    }

    // Finalizar el juego a través del servicio
    const gameResult = this.gameService.endGame();
    console.log('[GameController] Resultado final:', gameResult);

    // Detener el loop
    this.stopGame();
  }

  /**
   * Detiene el juego
   */
  stopGame(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    console.log('[GameController] Juego detenido');
  }

  /**
   * Pausa el juego
   */
  pauseGame(): void {
    if (this.gameState && this.animationFrameId !== null) {
      // Pausar simplemente deteniendo el loop
      this.stopGame();
      console.log('[GameController] Juego pausado');
    }
  }

  /**
   * Reanuda el juego
   */
  resumeGame(): void {
    if (this.gameState && this.gameState.status === 'playing') {
      this.lastTickTime = performance.now();
      this.gameLoop(this.lastTickTime);
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
    return this.animationFrameId !== null && this.gameState !== null;
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
