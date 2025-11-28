import type { Player } from '@/core/entities/player';
import type { Graph } from '@/core/entities/graph';
import type { GameStatus } from '@/application/interfaces/game/game-status';

/**
 * Estado completo de una partida de NEXA
 */
export interface GameState {
  /** Jugadores en la partida */
  players: Player[];

  /** Grafo del mapa (nodos y aristas) */
  graph: Graph;

  /** Tick actual del juego (contador de actualizaciones) */
  currentTick: number;

  /** Tiempo transcurrido en milisegundos */
  elapsedTime: number;

  /** Trackers de dominancia (tiempo manteniendo 70%+ de nodos) */
  dominanceTrackers: Map<Player, number>;

  /** Estado actual del juego */
  status: GameStatus;
}

/**
 * Configuración para crear un nuevo estado de juego
 */
export interface GameStateConfig {
  /** Jugadores participantes */
  players: Player[];

  /** Grafo del mapa */
  graph: Graph;

  /** Tiempo inicial (opcional, por defecto 0) */
  initialTime?: number;

  /** Tick inicial (opcional, por defecto 0) */
  initialTick?: number;
}
