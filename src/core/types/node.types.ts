import type { ID, Position } from '@/core/types/common';
import { NodeType } from '@/core/types/common';
import type { Player } from '@/core/entities/player';

/**
 * Configuración para crear un nodo
 */
export interface NodeConfig {
  id: ID;
  type: NodeType;
  position: Position;
  initialEnergy?: number;
  owner?: Player | null;
}

/**
 * Propiedades específicas de cada tipo de nodo
 */
export interface NodeProperties {
  attackMultiplier: number;   // Multiplicador de ataque (x2 para nodo de ataque)
  defenseMultiplier: number;  // Multiplicador de defensa (x2 para nodo de defensa)
  energyBonus: number;        // Energía adicional al capturar
  attackInterval: number;     // Intervalo de envío de energía (ms)
  defenseInterval: number;    // Intervalo de actualización de defensa (ms)
}

/**
 * Estado de un nodo
 */
export interface NodeState {
  id: ID;
  type: NodeType;
  owner: Player | null;
  energyPool: number;
  defenseEnergy: number;
  isInitialNode: boolean;
}
