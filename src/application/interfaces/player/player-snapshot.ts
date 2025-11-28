/**
 * Estadísticas de un jugador en un momento dado
 */
export interface PlayerSnapshot {
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
