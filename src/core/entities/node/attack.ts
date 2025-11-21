import { Node } from '@/core/entities/node/node';

export class AttackNode extends Node {
  protected readonly _attackInterval = 20;
  protected readonly _defenseInterval = 30;
  protected readonly _attackMultiplier = 2;
  protected readonly _defenseMultiplier = 1;
  protected readonly _energyAddition = 5;
}
