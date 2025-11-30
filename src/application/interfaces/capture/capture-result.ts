import type { Node } from '@/core/entities/node/node';
import type { Player } from '@/core/entities/player';

/**
 * Resultado de un intento de captura de nodo
 */
export interface CaptureResult {
  /** Indica si la captura fue exitosa */
  captured: boolean;
  /** Lista de nodos perdidos por el jugador afectado (por articulación) */
  nodesLost: Node[];
  /** Indica si el jugador fue eliminado */
  playerEliminated: boolean;
  /** Nodo que fue capturado */
  node: Node;
  /** Jugador atacante */
  attacker: Player;
  /** Jugador previo (null si era neutral) */
  previousOwner: Player | null;
  /** Bonificación de energía aplicada */
  energyBonus: number;
}
