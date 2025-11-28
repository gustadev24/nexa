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
