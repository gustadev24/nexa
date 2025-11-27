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
 * Tipos de nodos en el grafo
 */
export enum NodeType {
  /** Nodo básico estándar */
  BASIC = 'BASIC',

  /** Nodo de ataque (multiplica x2 la energía saliente) */
  ATTACK = 'ATTACK',

  /** Nodo de defensa (multiplica x2 la defensa efectiva) */
  DEFENSE = 'DEFENSE',

  /** Nodo de energía (genera energía al ser capturado) */
  ENERGY = 'ENERGY',
}

/**
 * Estados de conexión en el grafo
 */
export enum ConnectionState {
  /** Nodo conectado al nodo inicial del jugador */
  CONNECTED = 'CONNECTED',

  /** Nodo desconectado del nodo inicial */
  DISCONNECTED = 'DISCONNECTED',
}
