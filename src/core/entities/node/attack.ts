import { Node } from '@/core/entities/node/node';

export class AttackNode extends Node {
  protected readonly _attackInterval = 1000; // 1 second - emite paquete cada segundo
  protected readonly _defenseInterval = 1000; // 1 second
  protected readonly _attackMultiplier = 2;
  protected readonly _defenseMultiplier = 1;
  protected readonly _energyAddition = 0; // No añade energía, solo duplica ataque
}
