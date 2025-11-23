// Posición en el map/tablero
export interface Position {
  x: number;
  y: number;
}

// Representación RGB de Color
export interface Color {
  r: number;
  g: number;
  b: number;
  hex?: string;
}

// Identificador genérico (string o number)
export type ID = string | number;

// Marca de tiempo en milisegundos
export type Timestamp = number;

// Porcentaje representado como número entre 0 y 100
export type Percentage = number;

// Callback genérico que recibe un dato de tipo T
export type Callback<T = void> = (data: T) => void;

/**
 * Tipos de nodos disponibles en el juego
 */
export enum NodeType {
  BASIC = 'basic',
  ATTACK = 'attack',
  DEFENSE = 'defense',
  ENERGY = 'energy',
  SUPER_ENERGY = 'super_energy',
  NEUTRAL = 'neutral'
}

/**
 * Tipos de jugadores
 */
export enum PlayerType {
  HUMAN = 'human',
  AI = 'ai',
  NEUTRAL = 'neutral'
}

/**
 * Estados del juego (FSM)
 */
export enum GameState {
  MENU = 'menu',
  WAITING = 'waiting',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over'
}

/**
 * Condiciones de victoria
 */
export enum VictoryCondition {
  DOMINANCE = 'dominance',      // 70% de nodos por 10 segundos
  TIME_LIMIT = 'time_limit',    // Mayor cantidad de nodos al finalizar tiempo
  ELIMINATION = 'elimination'    // Captura del nodo inicial enemigo
}

/**
 * Estado de una arista
 */
export enum EdgeState {
  IDLE = 'idle',
  ACTIVE = 'active',
  COLLISION = 'collision'
}

/**
 * Configuración de intervalos del juego (en milisegundos)
 */
export const GAME_CONSTANTS = {
  DEFENSE_INTERVAL: 30,      // Ciclo de defensa
  ATTACK_INTERVAL: 20,       // Ciclo de ataque
  DOMINANCE_THRESHOLD: 0.7,  // 70% de nodos
  DOMINANCE_DURATION: 10000, // 10 segundos en ms
  GAME_DURATION: 180000,     // 3 minutos en ms
} as const;
