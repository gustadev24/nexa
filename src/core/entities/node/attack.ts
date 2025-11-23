import { Node } from '@/core/entities/node/node';
import { NodeType, GAME_CONSTANTS } from '@/core/types/common';
import type { NodeProperties } from '@/core/types/node.types';
import type { ID, Position } from '@/core/types/common';

/**
 * Nodo de Ataque
 * - Duplica la energía de ataque enviada (x2)
 * - El costo para el jugador es el original
 * - Solo activo mientras el jugador controla el nodo
 */
export class AttackNode extends Node {
  protected readonly properties: NodeProperties = {
    attackMultiplier: 2, // ¡Duplica el ataque!
    defenseMultiplier: 1,
    energyBonus: 0,
    attackInterval: GAME_CONSTANTS.ATTACK_INTERVAL,
    defenseInterval: GAME_CONSTANTS.DEFENSE_INTERVAL,
  };

  constructor(id: ID, position: Position, initialEnergy: number = 50) {
    super(id, NodeType.ATTACK, position, initialEnergy);
  }
}
