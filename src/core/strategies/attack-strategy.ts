import type { Node } from '@/core/entities/node/node';
import type { Player } from '@/core/entities/player';
import type { AttackResult } from '@/core/types/edge.types';

/**
 * Interfaz para estrategias de ataque a nodos
 * Strategy Pattern: Define cómo se resuelven ataques a nodos
 */
export interface IAttackStrategy {
  /**
   * Procesa un ataque a un nodo
   * @param target Nodo que recibe el ataque
   * @param attackAmount Cantidad de energía atacante
   * @param attacker Jugador atacante
   * @returns Resultado del ataque
   */
  execute(target: Node, attackAmount: number, attacker: Player): AttackResult;
}

/**
 * Estrategia de ataque a nodo neutral
 * Regla: El atacante captura directamente si hay suficiente energía
 */
export class NeutralNodeAttackStrategy implements IAttackStrategy {
  execute(target: Node, attackAmount: number, attacker: Player): AttackResult {
    if (target.owner !== null) {
      throw new Error('NeutralNodeAttackStrategy requires unowned target node');
    }

    // Nodo neutral: captura directa sin resistencia
    const result: AttackResult = {
      success: true,
      captured: true,
      neutralized: false,
      remainingDefense: 0,
      newOwner: attacker,
    };

    // Ejecutar captura
    target.setOwner(attacker);
    attacker.captureNode(target);

    return result;
  }
}

/**
 * Estrategia de ataque a nodo aliado
 * Regla: La energía se suma al nodo (refuerzo), no hay combate
 */
export class AllyNodeAttackStrategy implements IAttackStrategy {
  execute(target: Node, attackAmount: number, attacker: Player): AttackResult {
    if (!target.owner || !target.owner.equals(attacker)) {
      throw new Error('AllyNodeAttackStrategy requires owned target node');
    }

    // Nodo aliado: reforzar energía
    target.increaseEnergy(attackAmount);

    return {
      success: true,
      captured: false,
      neutralized: false,
      remainingDefense: target.currentEnergy,
      newOwner: target.owner,
    };
  }
}

/**
 * Estrategia de ataque a nodo enemigo
 * Regla: Compara energía de ataque vs defensa efectiva (con multiplicadores)
 * - Si ataque > defensa: captura y excedente se añade al nodo
 * - Si ataque = defensa: neutralización
 * - Si ataque < defensa: reduce energía del nodo
 */
export class EnemyNodeAttackStrategy implements IAttackStrategy {
  execute(target: Node, attackAmount: number, attacker: Player): AttackResult {
    if (!target.owner || target.owner.equals(attacker)) {
      throw new Error('EnemyNodeAttackStrategy requires enemy-owned target node');
    }

    const previousOwner = target.owner;
    const defenseEnergy = target.getDefenseEnergy();

    if (attackAmount > defenseEnergy) {
      // Captura exitosa
      const surplus = attackAmount - defenseEnergy;
      
      // Notificar pérdida al dueño anterior
      previousOwner.loseNode(target);
      
      // Capturar y asignar energía excedente
      target.setOwner(attacker);
      target.setEnergy(surplus);
      attacker.captureNode(target);

      return {
        success: true,
        captured: true,
        neutralized: false,
        remainingDefense: surplus,
        newOwner: attacker,
      };
    } else if (attackAmount === defenseEnergy) {
      // Neutralización exacta
      previousOwner.loseNode(target);
      target.setOwner(null); // Ahora es neutral
      target.setEnergy(0);

      return {
        success: true,
        captured: false,
        neutralized: true,
        remainingDefense: 0,
        newOwner: null,
      };
    } else {
      // Ataque rechazado: reduce defensa
      const newDefense = defenseEnergy - attackAmount;
      target.setEnergy(newDefense);

      return {
        success: false,
        captured: false,
        neutralized: false,
        remainingDefense: newDefense,
        newOwner: previousOwner,
      };
    }
  }
}

/**
 * Coordinador que selecciona la estrategia de ataque apropiada
 */
export class AttackResolver {
  private neutralStrategy: NeutralNodeAttackStrategy;
  private allyStrategy: AllyNodeAttackStrategy;
  private enemyStrategy: EnemyNodeAttackStrategy;

  constructor() {
    this.neutralStrategy = new NeutralNodeAttackStrategy();
    this.allyStrategy = new AllyNodeAttackStrategy();
    this.enemyStrategy = new EnemyNodeAttackStrategy();
  }

  /**
   * Ejecuta un ataque seleccionando automáticamente la estrategia apropiada
   */
  execute(target: Node, attackAmount: number, attacker: Player): AttackResult {
    if (!target.owner) {
      // Nodo neutral
      return this.neutralStrategy.execute(target, attackAmount, attacker);
    } else if (target.owner.equals(attacker)) {
      // Nodo aliado
      return this.allyStrategy.execute(target, attackAmount, attacker);
    } else {
      // Nodo enemigo
      return this.enemyStrategy.execute(target, attackAmount, attacker);
    }
  }

  /**
   * Procesa múltiples ataques a un nodo (útil cuando llegan varios paquetes al mismo tick)
   * Los ataques se procesan en orden, actualizando el estado del nodo progresivamente
   */
  executeMultiple(
    target: Node,
    attacks: Array<{ amount: number; attacker: Player }>,
  ): AttackResult[] {
    const results: AttackResult[] = [];

    for (const { amount, attacker } of attacks) {
      const result = this.execute(target, amount, attacker);
      results.push(result);

      // Si el nodo cambió de dueño, los siguientes ataques se procesan con el nuevo contexto
    }

    return results;
  }
}
