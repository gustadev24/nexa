import { GameState } from '@/core/types/common';
import { BaseGameState, type GameContext } from './game-state.interface';

/**
 * Estado: Menú Principal
 * Estado inicial del juego, permite iniciar partida
 */
export class MenuState extends BaseGameState {
  readonly name = GameState.MENU;
  
  onEnter(_context: GameContext): void {
    console.log('[State] Entered Menu');
  }
  
  play(context: GameContext): void {
    console.log('[State] Menu -> Playing');
    context.startGame();
  }
}

/**
 * Estado: Jugando
 * El juego está activo, procesa lógica y recibe input
 */
export class PlayingState extends BaseGameState {
  readonly name = GameState.PLAYING;
  
  onEnter(_context: GameContext): void {
    console.log('[State] Entered Playing');
  }
  
  update(context: GameContext, deltaTime: number): void {
    // Aquí se ejecutaría la lógica del juego
    // El GameManager procesará los ciclos de defensa/ataque
  }
  
  pause(context: GameContext): void {
    console.log('[State] Playing -> Paused');
    context.pauseGame();
  }
  
  gameOver(context: GameContext, winner: string | null, reason: string): void {
    console.log(`[State] Playing -> Game Over (Winner: ${winner}, Reason: ${reason})`);
    context.endGame(winner, reason);
  }
  
  returnToMenu(context: GameContext): void {
    console.log('[State] Playing -> Menu');
    // Cleanup game
    context.setState(new MenuState());
  }
}

/**
 * Estado: Pausado
 * El juego está pausado, no procesa lógica pero mantiene estado
 */
export class PausedState extends BaseGameState {
  readonly name = GameState.PAUSED;
  
  onEnter(_context: GameContext): void {
    console.log('[State] Entered Paused');
  }
  
  play(context: GameContext): void {
    console.log('[State] Paused -> Playing');
    context.resumeGame();
  }
  
  returnToMenu(context: GameContext): void {
    console.log('[State] Paused -> Menu');
    context.setState(new MenuState());
  }
}

/**
 * Estado: Game Over
 * El juego terminó, muestra resultados y permite volver al menú
 */
export class GameOverState extends BaseGameState {
  readonly name = GameState.GAME_OVER;
  
  private winner: string | null;
  private reason: string;
  
  constructor(winner: string | null = null, reason: string = 'Unknown') {
    super();
    this.winner = winner;
    this.reason = reason;
  }
  
  onEnter(_context: GameContext): void {
    console.log(`[State] Game Over - Winner: ${this.winner}, Reason: ${this.reason}`);
  }
  
  returnToMenu(context: GameContext): void {
    console.log('[State] Game Over -> Menu');
    context.setState(new MenuState());
  }
  
  getWinner(): string | null {
    return this.winner;
  }
  
  getReason(): string {
    return this.reason;
  }
}
