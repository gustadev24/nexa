import { Node } from '@/core/entities/node/node';
import { NodeType, GAME_CONSTANTS } from '@/core/types/common';
import type { NodeProperties } from '@/core/types/node.types';
import type { ID, Position } from '@/core/types/common';

/**
 * Nodo de Super Energía
 * - Otorga un GRAN bonus de energía al capturarlo
 * - Puede tener efectos adicionales sobre velocidad de emisión
 * - Es un nodo estratégico clave
 */
export class SuperEnergyNode extends Node {
  protected readonly properties: NodeProperties = {
    attackMultiplier: 1,
    defenseMultiplier: 1,
    energyBonus: 250, // Gran bonus de energía
    attackInterval: GAME_CONSTANTS.ATTACK_INTERVAL,
    defenseInterval: GAME_CONSTANTS.DEFENSE_INTERVAL,
  };

  constructor(id: ID, position: Position, initialEnergy: number = 100) {
    super(id, NodeType.SUPER_ENERGY, position, initialEnergy);
  }
}
