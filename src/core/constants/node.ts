import { NodeType } from '@/core/types/common';
import type { INodeTypeConfig } from '@/core/types/node';

/**
 * Default node type configurations
 * Aligned with NEXA game document specifications
 */
export const NODE_TYPE_CONFIGS: Record<NodeType, INodeTypeConfig> = {
  [NodeType.BASIC]: {
    type: NodeType.BASIC,
    name: 'Basic Node',
    description: 'Standard node with basic properties for energy assignment and defense',
    energyBonus: 0,
    attackMultiplier: 1.0,
    defenseMultiplier: 1.0,
    emissionSpeedBonus: 0,
  },
  [NodeType.ENERGY]: {
    type: NodeType.ENERGY,
    name: 'Energy Node',
    description: 'Immediately increases player\'s total energy when captured',
    energyBonus: 50, // Increases player's total energy
    attackMultiplier: 1.0,
    defenseMultiplier: 1.0,
    emissionSpeedBonus: 0,
  },
  [NodeType.ATTACK]: {
    type: NodeType.ATTACK,
    name: 'Attack Node',
    description: 'Doubles energy assigned to outgoing edges',
    energyBonus: 0,
    attackMultiplier: 2.0, // Doubles attack energy on outgoing edges
    defenseMultiplier: 1.0,
    emissionSpeedBonus: 0,
  },
  [NodeType.DEFENSE]: {
    type: NodeType.DEFENSE,
    name: 'Defense Node',
    description: 'Doubles defense energy when receiving attacks',
    energyBonus: 0,
    attackMultiplier: 1.0,
    defenseMultiplier: 2.0, // Doubles defense energy
    emissionSpeedBonus: 0,
  },
  [NodeType.SUPER_ENERGY]: {
    type: NodeType.SUPER_ENERGY,
    name: 'Super Energy Node',
    description: 'Significantly increases total energy and provides emission speed bonus',
    energyBonus: 150, // Major energy boost
    attackMultiplier: 1.0,
    defenseMultiplier: 1.0,
    emissionSpeedBonus: 50, // 50% faster emission
  },
  [NodeType.NEUTRAL]: {
    type: NodeType.NEUTRAL,
    name: 'Neutral Node',
    description: 'Initially unowned, can be captured by any player',
    energyBonus: 0,
    attackMultiplier: 1.0,
    defenseMultiplier: 1.0,
    emissionSpeedBonus: 0,
  },
};
