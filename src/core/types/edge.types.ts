import type { ID } from '@/core/types/common';
import type { Node } from '@/core/entities/node/node';
import type { Player } from '@/core/entities/player';

/**
 * Configuración para crear una arista
 */
export interface EdgeConfig {
  id: ID;
  nodeA: Node;
  nodeB: Node;
  weight: number; // Peso representa tiempo de viaje
}

/**
 * Paquete de energía viajando por una arista
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
 * Resultado de una colisión en arista
 */
export interface CollisionResult {
  type: 'enemy_collision' | 'ally_collision' | 'no_collision';
  survivingPacket?: EnergyPacketData;
  destroyed: EnergyPacketData[];
  isWaste: boolean; // true si es desperdicio de energía aliada
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
