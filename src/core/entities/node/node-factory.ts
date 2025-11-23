import type { Node } from '@/core/entities/node/node';
import { BasicNode } from '@/core/entities/node/basic';
import { AttackNode } from '@/core/entities/node/attack';
import { DefenseNode } from '@/core/entities/node/defense';
import { EnergyNode } from '@/core/entities/node/energy';
import { SuperEnergyNode } from '@/core/entities/node/super-energy';
import { NodeType } from '@/core/types/common';
import type { NodeConfig } from '@/core/types/node.types';

/**
 * Factory Pattern: NodeFactory
 * 
 * Centraliza la creación de nodos según su tipo.
 * Facilita la extensión con nuevos tipos de nodos.
 */
export class NodeFactory {
  /**
   * Crea un nodo según su tipo
   */
  static createNode(config: NodeConfig): Node {
    const { id, type, position, initialEnergy } = config;

    switch (type) {
      case NodeType.BASIC:
        return new BasicNode(id, position, initialEnergy);
      
      case NodeType.ATTACK:
        return new AttackNode(id, position, initialEnergy);
      
      case NodeType.DEFENSE:
        return new DefenseNode(id, position, initialEnergy);
      
      case NodeType.ENERGY:
        return new EnergyNode(id, position, initialEnergy);
      
      case NodeType.SUPER_ENERGY:
        return new SuperEnergyNode(id, position, initialEnergy);
      
      default:
        throw new Error(`Unknown node type: ${type}`);
    }
  }

  /**
   * Crea múltiples nodos a partir de un array de configuraciones
   */
  static createNodes(configs: NodeConfig[]): Node[] {
    return configs.map(config => this.createNode(config));
  }

  /**
   * Crea un nodo básico con configuración por defecto
   */
  static createBasicNode(id: string | number, x: number, y: number): BasicNode {
    return new BasicNode(id, { x, y });
  }

  /**
   * Crea un nodo de ataque con configuración por defecto
   */
  static createAttackNode(id: string | number, x: number, y: number): AttackNode {
    return new AttackNode(id, { x, y });
  }

  /**
   * Crea un nodo de defensa con configuración por defecto
   */
  static createDefenseNode(id: string | number, x: number, y: number): DefenseNode {
    return new DefenseNode(id, { x, y });
  }

  /**
   * Crea un nodo de energía con configuración por defecto
   */
  static createEnergyNode(id: string | number, x: number, y: number): EnergyNode {
    return new EnergyNode(id, { x, y });
  }

  /**
   * Crea un nodo de super energía con configuración por defecto
   */
  static createSuperEnergyNode(id: string | number, x: number, y: number): SuperEnergyNode {
    return new SuperEnergyNode(id, { x, y });
  }
}
