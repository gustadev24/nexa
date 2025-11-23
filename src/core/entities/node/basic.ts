import { Node } from '@/core/entities/node/node';
import type { ID, Position } from '@/core/types/common';
import { GAME_CONSTANTS, NodeType } from '@/core/types/common';
import type { NodeProperties } from '@/core/types/node.types';

/**
 * Nodo Básico
 * - Sin bonificaciones de ataque o defensa
 * - Comportamiento estándar
 */
export class BasicNode extends Node {
  protected readonly properties: NodeProperties = {
    attackMultiplier: 1,
    defenseMultiplier: 1,
    energyBonus: 0,
    attackInterval: GAME_CONSTANTS.ATTACK_INTERVAL,
    defenseInterval: GAME_CONSTANTS.DEFENSE_INTERVAL,
  };

  constructor(id: ID, position: Position, initialEnergy: number = 50) {
    super(id, NodeType.BASIC, position, initialEnergy);
  }
}
