import type { EnergyPacket } from '../entities/energy-packets';
import type { CollisionResult } from '../types/edge.types';

/**
 * Interfaz para estrategias de resolución de colisiones
 * Strategy Pattern: Define cómo se resuelven colisiones entre paquetes
 */
export interface ICollisionStrategy {
  /**
   * Resuelve una colisión entre dos paquetes de energía
   * @param packetA Primer paquete involucrado
   * @param packetB Segundo paquete involucrado
   * @returns Resultado de la colisión con los paquetes resultantes
   */
  resolve(packetA: EnergyPacket, packetB: EnergyPacket): CollisionResult;
}

/**
 * Estrategia para colisiones entre paquetes enemigos (sentidos opuestos)
 * Regla: El paquete menor desaparece, al mayor se le resta el valor del menor
 */
export class OpposingPacketsStrategy implements ICollisionStrategy {
  resolve(packetA: EnergyPacket, packetB: EnergyPacket): CollisionResult {
    // Validar que sean enemigos
    if (packetA.sameOwner(packetB)) {
      throw new Error('OpposingPacketsStrategy requires packets from different owners');
    }

    // Validar que van en sentidos opuestos
    if (!packetA.isOppositeDirection(packetB)) {
      throw new Error('OpposingPacketsStrategy requires packets in opposite directions');
    }

    const amountA = packetA.amount;
    const amountB = packetB.amount;

    // El paquete menor desaparece, al mayor se le resta el menor
    if (amountA > amountB) {
      // A sobrevive, B desaparece
      packetA.reduceAmount(amountB);
      packetB.reduceAmount(amountB); // Esto lo destruye
      
      return {
        survivors: [packetA],
        destroyed: [packetB],
        type: 'opposing_enemy',
      };
    } else if (amountB > amountA) {
      // B sobrevive, A desaparece
      packetB.reduceAmount(amountA);
      packetA.reduceAmount(amountA); // Esto lo destruye
      
      return {
        survivors: [packetB],
        destroyed: [packetA],
        type: 'opposing_enemy',
      };
    } else {
      // Mismo valor: ambos desaparecen
      packetA.reduceAmount(amountA);
      packetB.reduceAmount(amountB);
      
      return {
        survivors: [],
        destroyed: [packetA, packetB],
        type: 'opposing_enemy',
      };
    }
  }
}

/**
 * Estrategia para colisiones entre paquetes aliados (misma dirección)
 * Regla: Ambos regresan al nodo origen
 */
export class SameDirectionAlliesStrategy implements ICollisionStrategy {
  resolve(packetA: EnergyPacket, packetB: EnergyPacket): CollisionResult {
    // Validar que sean aliados
    if (!packetA.sameOwner(packetB)) {
      throw new Error('SameDirectionAlliesStrategy requires packets from same owner');
    }

    // Validar que van en la misma dirección (mismo origen y destino)
    if (packetA.isOppositeDirection(packetB)) {
      throw new Error('SameDirectionAlliesStrategy requires packets in same direction');
    }

    // Ambos regresan al origen
    const reversedA = packetA.reverse();
    const reversedB = packetB.reverse();

    return {
      survivors: [reversedA, reversedB],
      destroyed: [packetA, packetB], // Los originales se destruyen
      type: 'same_direction_ally',
    };
  }
}

/**
 * Estrategia para colisiones entre paquetes aliados en sentidos opuestos
 * Regla: Ambos regresan a sus nodos de origen respectivos
 */
export class OpposingAlliesStrategy implements ICollisionStrategy {
  resolve(packetA: EnergyPacket, packetB: EnergyPacket): CollisionResult {
    // Validar que sean aliados
    if (!packetA.sameOwner(packetB)) {
      throw new Error('OpposingAlliesStrategy requires packets from same owner');
    }

    // Validar que van en sentidos opuestos
    if (!packetA.isOppositeDirection(packetB)) {
      throw new Error('OpposingAlliesStrategy requires packets in opposite directions');
    }

    // Cada uno regresa a su origen
    const reversedA = packetA.reverse();
    const reversedB = packetB.reverse();

    return {
      survivors: [reversedA, reversedB],
      destroyed: [packetA, packetB],
      type: 'opposing_ally',
    };
  }
}

/**
 * Coordinador que selecciona la estrategia apropiada según el contexto
 * Facilita el uso del Strategy Pattern sin exponer las clases concretas
 */
export class CollisionResolver {
  private opposingEnemiesStrategy: OpposingPacketsStrategy;
  private sameDirectionAlliesStrategy: SameDirectionAlliesStrategy;
  private opposingAlliesStrategy: OpposingAlliesStrategy;

  constructor() {
    this.opposingEnemiesStrategy = new OpposingPacketsStrategy();
    this.sameDirectionAlliesStrategy = new SameDirectionAlliesStrategy();
    this.opposingAlliesStrategy = new OpposingAlliesStrategy();
  }

  /**
   * Resuelve una colisión seleccionando automáticamente la estrategia apropiada
   */
  resolve(packetA: EnergyPacket, packetB: EnergyPacket): CollisionResult {
    const sameOwner = packetA.sameOwner(packetB);
    const oppositeDirection = packetA.isOppositeDirection(packetB);

    if (!sameOwner && oppositeDirection) {
      // Enemigos en sentidos opuestos
      return this.opposingEnemiesStrategy.resolve(packetA, packetB);
    } else if (sameOwner && !oppositeDirection) {
      // Aliados en misma dirección
      return this.sameDirectionAlliesStrategy.resolve(packetA, packetB);
    } else if (sameOwner && oppositeDirection) {
      // Aliados en sentidos opuestos
      return this.opposingAlliesStrategy.resolve(packetA, packetB);
    }

    // Caso no contemplado: enemigos en misma dirección (no deberían colisionar)
    throw new Error('Invalid collision scenario: enemies in same direction should not collide');
  }

  /**
   * Detecta y resuelve colisiones entre todos los paquetes en una lista
   * @returns Array de resultados de colisión
   */
  detectAndResolveCollisions(packets: EnergyPacket[]): CollisionResult[] {
    const results: CollisionResult[] = [];
    const processed = new Set<string | number>(); // ID puede ser string o number

    for (let i = 0; i < packets.length; i++) {
      for (let j = i + 1; j < packets.length; j++) {
        const packetA = packets[i];
        const packetB = packets[j];

        // Evitar procesar paquetes ya involucrados en colisiones
        if (processed.has(packetA.id) || processed.has(packetB.id)) {
          continue;
        }

        // Verificar si están en posición de colisión
        if (packetA.sameEdge(packetB) && packetA.isAtSamePosition(packetB)) {
          const result = this.resolve(packetA, packetB);
          results.push(result);

          // Marcar como procesados
          processed.add(packetA.id);
          processed.add(packetB.id);
        }
      }
    }

    return results;
  }
}
