import { Node } from '@/core/entities/node/node';
import { NodeType } from '@/core/types/node-type';

export class EnergyNode extends Node {
  protected readonly _attackInterval = 1000; // 1 second - emite paquete cada segundo
  protected readonly _defenseInterval = 1000; // 1 second
  protected readonly _attackMultiplier = 1;
  protected readonly _defenseMultiplier = 1;
  protected readonly _energyAddition = 8;
  protected readonly _nodeType = NodeType.ENERGY;
}
