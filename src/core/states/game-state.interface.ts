import type { GameState as GameStateEnum } from '../types/common';

/**
 * Contexto del juego que usa la máquina de estados
 * Este objeto será pasado a los estados para que puedan manipularlo
 */
export interface GameContext {
  setState(state: IGameState): void;
  getCurrentState(): GameStateEnum;
  startGame(): void;
  pauseGame(): void;
  resumeGame(): void;
  endGame(winner: string | null, reason: string): void;
  getElapsedTime(): number;
}

/**
 * Interfaz para los estados del juego (State Pattern)
 * Cada estado concreto implementará estos métodos
 */
export interface IGameState {
  readonly name: GameStateEnum;
  
  /**
   * Acciones que se ejecutan al entrar al estado
   */
  onEnter(context: GameContext): void;
  
  /**
   * Acciones que se ejecutan al salir del estado
   */
  onExit(context: GameContext): void;
  
  /**
   * Actualización del estado (llamado cada frame)
   */
  update(context: GameContext, deltaTime: number): void;
  
  /**
   * Transición a jugando
   */
  play(context: GameContext): void;
  
  /**
   * Transición a pausa
   */
  pause(context: GameContext): void;
  
  /**
   * Transición a Game Over
   */
  gameOver(context: GameContext, winner: string | null, reason: string): void;
  
  /**
   * Retornar al menú
   */
  returnToMenu(context: GameContext): void;
}

/**
 * Estado abstracto base con implementaciones por defecto
 */
export abstract class BaseGameState implements IGameState {
  abstract readonly name: GameStateEnum;
  
  onEnter(_context: GameContext): void {
    // Override in subclasses if needed
  }
  
  onExit(_context: GameContext): void {
    // Override in subclasses if needed
  }
  
  update(_context: GameContext, _deltaTime: number): void {
    // Override in subclasses if needed
  }
  
  play(context: GameContext): void {
    console.warn(`Cannot transition to play from ${this.name}`);
  }
  
  pause(context: GameContext): void {
    console.warn(`Cannot transition to pause from ${this.name}`);
  }
  
  gameOver(context: GameContext, _winner: string | null, _reason: string): void {
    console.warn(`Cannot transition to game over from ${this.name}`);
  }
  
  returnToMenu(context: GameContext): void {
    console.warn(`Cannot transition to menu from ${this.name}`);
  }
}
