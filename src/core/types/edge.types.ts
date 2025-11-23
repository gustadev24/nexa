import type { ID } from '@/core/types/common';
import type { Node } from '@/core/entities/node/node';
import type { Player } from '@/core/entities/player';
import type { EnergyPacket } from '@/core/entities/energy-packets';

/**
 * Configuración para crear una arista
 */
export interface EdgeConfig {
  id: ID;
  nodeA: Node;
  nodeB: Node;
  weight: number; // Peso representa tiempo de viaje en ticks
}

/**
 * Datos para crear un paquete de energía
 */
export interface EnergyPacketData {
  id: ID;
  owner: Player;
  amount: number;
  source: Node;
  target: Node;
  edge: ID;
  progress: number; // 0 a 1, representa progreso en la arista
  ticksRemaining: number;
}

/**
 * Tipo de colisión entre paquetes
 */
export type CollisionType = 
  | 'opposing_enemy'         // Enemigos en sentidos opuestos
  | 'same_direction_ally'    // Aliados en misma dirección
  | 'opposing_ally'          // Aliados en sentidos opuestos
  | 'no_collision';          // Sin colisión

/**
 * Resultado de una colisión entre paquetes de energía
 */
export interface CollisionResult {
  type: CollisionType;
  survivors: EnergyPacket[];   // Paquetes que sobreviven o se crean
  destroyed: EnergyPacket[];   // Paquetes destruidos
}

/**
 * Resultado de un ataque a nodo
 */
export interface AttackResult {
  success: boolean;
  captured: boolean;
  neutralized: boolean;
  remainingDefense: number;
  newOwner: Player | null;
}
