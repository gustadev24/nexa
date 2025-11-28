import { Node } from '@/core/entities/node/node';
import { NodeType } from '@/core/types/node-type';

export class AttackNode extends Node {
  protected readonly _attackInterval = 1000; // 1 second - emite paquete cada segundo
  protected readonly _defenseInterval = 1500; // 1.5 seconds
  protected readonly _attackMultiplier = 2;
  protected readonly _defenseMultiplier = 1;
  protected readonly _energyAddition = 20; // No añade energía, solo duplica ataque
  protected readonly _nodeType = NodeType.ATTACK;
}
