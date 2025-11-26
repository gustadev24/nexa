import { Node } from '@/core/entities/node/node';

export class DefenseNode extends Node {
  protected readonly _attackInterval = 1000; // 1 second - emite paquete cada segundo
  protected readonly _defenseInterval = 1000; // 1 second
  protected readonly _attackMultiplier = 1;
  protected readonly _defenseMultiplier = 2;
  protected readonly _energyAddition = 0; // No añade energía, solo duplica defensa
}
