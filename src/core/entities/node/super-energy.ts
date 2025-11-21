import { Node } from '@/core/entities/node/node';

export class SuperEnergyNode extends Node {
  protected readonly _attackInterval = 10; // Más rápido
  protected readonly _defenseInterval = 20;
  protected readonly _attackMultiplier = 1;
  protected readonly _defenseMultiplier = 1;
  protected readonly _energyAddition = 10;
}
