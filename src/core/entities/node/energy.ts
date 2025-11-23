import { Node } from '@/core/entities/node/node';
import { NodeType, GAME_CONSTANTS } from '@/core/types/common';
import type { NodeProperties } from '@/core/types/node.types';
import type { ID, Position } from '@/core/types/common';

/**
 * Nodo de Energía
 * - Otorga bonus de energía al ser capturado
 * - La pérdida del nodo NO reduce la energía total del jugador
 * - Energía en tránsito continúa su curso
 */
export class EnergyNode extends Node {
  protected readonly properties: NodeProperties = {
    attackMultiplier: 1,
    defenseMultiplier: 1,
    energyBonus: 100, // Bonus al capturar
    attackInterval: GAME_CONSTANTS.ATTACK_INTERVAL,
    defenseInterval: GAME_CONSTANTS.DEFENSE_INTERVAL,
  };

  constructor(id: ID, position: Position, initialEnergy: number = 50) {
    super(id, NodeType.ENERGY, position, initialEnergy);
  }
}
