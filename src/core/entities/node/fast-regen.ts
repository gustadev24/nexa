import { Node } from '@/core/entities/node/node';

/**
 * FastRegenNode - Nodo de Regeneración Rápida
 *
 * Reduce los intervalos de emisión de energía, incrementando la tasa de envío
 * tanto para defensa como para ataque desde el nodo que lo posee.
 */
export class FastRegenNode extends Node {
  protected readonly _attackInterval = 500; // 500ms - más rápido que básico (1000ms)
  protected readonly _defenseInterval = 500; // 500ms - emite paquetes 2x más rápido
  protected readonly _attackMultiplier = 1;
  protected readonly _defenseMultiplier = 1;
  protected readonly _energyAddition = 0; // No añade energía extra
}
