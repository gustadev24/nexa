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
