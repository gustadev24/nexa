import { Node } from '@/core/entities/node/node';
import type { ID, Position } from '@/core/types/common';
import { GAME_CONSTANTS, NodeType } from '@/core/types/common';
import type { NodeProperties } from '@/core/types/node.types';

/**
 * Nodo de Defensa
 * - Duplica la defensa efectiva (x2)
 * - La energía almacenada real no cambia
 * - Solo activo mientras el jugador controla el nodo
 */
export class DefenseNode extends Node {
  protected readonly properties: NodeProperties = {
    attackMultiplier: 1,
    defenseMultiplier: 2, // ¡Duplica la defensa!
    energyBonus: 0,
    attackInterval: GAME_CONSTANTS.ATTACK_INTERVAL,
    defenseInterval: GAME_CONSTANTS.DEFENSE_INTERVAL,
  };

  constructor(id: ID, position: Position, initialEnergy: number = 50) {
    super(id, NodeType.DEFENSE, position, initialEnergy);
  }
}
