import type { Player } from '@/core/entities/player';
import type { Graph } from '@/core/entities/graph';

/**
 * Estado del juego en un momento dado
 */
export type GameStatus = 'waiting' | 'playing' | 'finished';

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
 * Estadísticas de un jugador en un momento dado
 */
export interface PlayerStats {
  /** ID del jugador */
  playerId: string | number;

  /** Nombre del jugador */
  username: string;

  /** Número de nodos controlados */
  controlledNodes: number;

  /** Energía total del jugador (en nodos + en tránsito) */
  totalEnergy: number;

  /** Energía almacenada en nodos */
  storedEnergy: number;

  /** Energía en tránsito (paquetes viajando) */
  transitEnergy: number;

  /** Porcentaje de nodos controlados (0-100) */
  dominancePercentage: number;

  /** Tiempo acumulado de dominancia en ms (>=70% de nodos) */
  dominanceTime: number;

  /** Si el jugador está eliminado */
  isEliminated: boolean;

  /** Si el jugador tiene el control de su nodo inicial */
  hasInitialNode: boolean;
}

/**
 * Snapshot inmutable del estado del juego para la UI
 * No contiene referencias mutables a entidades del dominio
 */
export interface GameSnapshot {
  /** Timestamp del snapshot */
  timestamp: number;

  /** Tick actual */
  currentTick: number;

  /** Tiempo transcurrido en ms */
  elapsedTime: number;

  /** Tiempo transcurrido en formato legible (mm:ss) */
  elapsedTimeFormatted: string;

  /** Tiempo restante en ms (180000ms - elapsedTime) */
  remainingTime: number;

  /** Tiempo restante en formato legible (mm:ss) */
  remainingTimeFormatted: string;

  /** Estado del juego */
  status: GameStatus;

  /** Número total de nodos en el mapa */
  totalNodes: number;

  /** Número total de jugadores */
  totalPlayers: number;

  /** Estadísticas de cada jugador */
  playerStats: PlayerStats[];

  /** ID del jugador ganador (si hay) */
  winnerId?: string | number;

  /** Razón de victoria/derrota */
  victoryReason?: 'dominance' | 'time_limit' | 'elimination';

  /** Si algún jugador está cerca de ganar por dominancia */
  dominanceWarning?: {
    playerId: string | number;
    timeRemaining: number; // ms restantes para victoria
  };

  /** Snapshots de nodos para renderizado */
  nodes?: NodeSnapshot[];

  /** Snapshots de aristas para renderizado */
  edges?: EdgeSnapshot[];

  /** Snapshots de paquetes de energía para renderizado */
  energyPackets?: EnergyPacketSnapshot[];
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

/**
 * Snapshot de un nodo para renderizado
 * Representa el estado visual de un nodo en un momento dado
 */
export interface NodeSnapshot {
  /** ID único del nodo */
  id: string | number;

  /** Posición X en el canvas */
  x: number;

  /** Posición Y en el canvas */
  y: number;

  /** Radio del nodo (tamaño) */
  radius: number;

  /** ID del jugador propietario (null si neutral) */
  ownerId: string | number | null;

  /** Color del propietario (gris si neutral) */
  color: string;

  /** Tipo de nodo */
  nodeType: 'basic' | 'attack' | 'defense' | 'energy' | 'super-energy';

  /** Energía almacenada en el nodo */
  energyPool: number;

  /** Energía de defensa efectiva */
  defenseEnergy: number;

  /** Si es el nodo inicial del jugador */
  isInitialNode: boolean;

  /** Si el nodo es neutral */
  isNeutral: boolean;
}

/**
 * Snapshot de una arista para renderizado
 * Representa el estado visual de una conexión entre nodos
 */
export interface EdgeSnapshot {
  /** ID único de la arista */
  id: string | number;

  /** ID del nodo origen (endpoint 1) */
  fromNodeId: string | number;

  /** ID del nodo destino (endpoint 2) */
  toNodeId: string | number;

  /** Posición X del nodo origen */
  fromX: number;

  /** Posición Y del nodo origen */
  fromY: number;

  /** Posición X del nodo destino */
  toX: number;

  /** Posición Y del nodo destino */
  toY: number;

  /** Longitud/peso de la arista (tiempo de viaje) */
  length: number;

  /** Grosor de la línea proporcional al peso */
  thickness: number;
}

/**
 * Snapshot de un paquete de energía para renderizado
 * Representa el estado visual de energía en tránsito
 */
export interface EnergyPacketSnapshot {
  /** ID único del paquete */
  id: string | number;

  /** ID del jugador propietario */
  ownerId: string | number;

  /** Color del propietario */
  color: string;

  /** Cantidad de energía */
  amount: number;

  /** ID del nodo origen */
  originNodeId: string | number;

  /** ID del nodo destino */
  targetNodeId: string | number;

  /** Progreso del viaje (0 = origen, 1 = destino) */
  progress: number;

  /** Posición X actual en el canvas */
  x: number;

  /** Posición Y actual en el canvas */
  y: number;

  /** Radio del paquete (proporcional a amount) */
  radius: number;
}
