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
