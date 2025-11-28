import type { Edge } from '@/core/entities/edge';
import { EnergyPacket } from '@/core/entities/energy-packet';
import type { Node } from '@/core/entities/node/node';
import type { Player } from '@/core/entities/player';
import {
  ArrivalOutcome,
} from '@/application/services/arrival-result.interface';
import { type ArrivalIntent } from '@/application/services/arrival-intent.interface';
import {
  type CollisionResult,
  type WasteWarning,
} from '@/application/services/collision-result.interface';

export class CollisionService {
  private static readonly COLLISION_THRESHOLD = 0.01;

  resolveEdgeCollisions(edge: Edge): CollisionResult[] {
    const results: CollisionResult[] = [];
    const packets = edge.energyPackets;

    if (packets.length < 2) {
      return results;
    }

    const toRemove: EnergyPacket[] = [];
    const toAdd: EnergyPacket[] = [];
    const wasteWarnings: WasteWarning[] = [];

    for (let i = 0; i < packets.length; i++) {
      if (toRemove.includes(packets[i])) {
        continue;
      }

      for (let j = i + 1; j < packets.length; j++) {
        if (toRemove.includes(packets[j])) {
          continue;
        }

        const packet1 = packets[i];
        const packet2 = packets[j];

        if (
          packet1.isAtSamePosition(
            packet2,
            CollisionService.COLLISION_THRESHOLD,
          )
        ) {
          if (packet1.sameOwner(packet2)) {
            if (packet1.isOppositeDirection(packet2)) {
              toRemove.push(packet1, packet2);

              const totalWasted = packet1.amount + packet2.amount;
              wasteWarnings.push({
                player: packet1.owner,
                edge,
                amountLost: totalWasted,
              });
            }
          }
          else {
            const minAmount = Math.min(packet1.amount, packet2.amount);

            const reduced1 = packet1.withReducedAmount(minAmount);
            const reduced2 = packet2.withReducedAmount(minAmount);

            toRemove.push(packet1, packet2);

            if (reduced1) {
              toAdd.push(reduced1);
            }
            if (reduced2) {
              toAdd.push(reduced2);
            }
          }
        }
      }
    }

    if (toRemove.length > 0 || toAdd.length > 0) {
      results.push({
        packetsDestroyed: [...toRemove],
        packetsSurvived: [...toAdd],
        wasteWarnings: [...wasteWarnings],
      });

      for (const packet of toRemove) {
        edge.removeEnergyPacket(packet);
      }

      for (const packet of toAdd) {
        edge.addEnergyPacket(packet);
      }
    }

    return results;
  }

  /**
   * Determina la intención de lo que debe ocurrir cuando un paquete de energía llega a un nodo.
   * NO MUTAR el estado del juego aquí; solo devolver la intención.
   */
  resolveNodeArrivalIntent(packet: EnergyPacket, node: Node): ArrivalIntent {
    const attackingPlayer = packet.owner;
    const previousOwner = node.owner;

    if (node.isNeutral()) {
      return this.determineNeutralNodeArrivalIntent(packet, node, attackingPlayer);
    }

    if (node.owner?.equals(attackingPlayer)) {
      return this.determineFriendlyNodeArrivalIntent(packet, node);
    }

    return this.determineEnemyNodeArrivalIntent(packet, node, attackingPlayer, previousOwner);
  }

  private determineFriendlyNodeArrivalIntent(
    packet: EnergyPacket,
    node: Node,
  ): ArrivalIntent {
    return {
      outcome: ArrivalOutcome.INTEGRATED,
      node,
      packet,
      attacker: packet.owner,
      previousOwner: node.owner,
      energyAmount: packet.amount,
      energyIntegrated: packet.amount,
    };
  }

  private determineNeutralNodeArrivalIntent(
    packet: EnergyPacket,
    node: Node,
    attacker: Player,
  ): ArrivalIntent {
    const defenseEnergy = node.defenseEnergy();
    const attackEnergy = packet.amount;

    if (attackEnergy > defenseEnergy) {
      return {
        outcome: ArrivalOutcome.CAPTURED,
        node,
        packet,
        attacker,
        previousOwner: null,
        energyAmount: attackEnergy,
        energyIntegrated: attackEnergy - defenseEnergy, // Restante después de superar defensa neutral
      };
    }

    if (attackEnergy === defenseEnergy) {
      return {
        outcome: ArrivalOutcome.NEUTRALIZED,
        node,
        packet,
        attacker,
        previousOwner: null,
        energyAmount: attackEnergy,
      };
    }

    return {
      outcome: ArrivalOutcome.DEFEATED,
      node,
      packet,
      attacker,
      previousOwner: null,
      energyAmount: attackEnergy,
    };
  }

  private determineEnemyNodeArrivalIntent(
    packet: EnergyPacket,
    node: Node,
    attacker: Player,
    previousOwner: Player | null,
  ): ArrivalIntent {
    const defenseEnergy = node.defenseEnergy();
    const attackEnergy = packet.amount;

    if (attackEnergy > defenseEnergy) {
      return {
        outcome: ArrivalOutcome.CAPTURED,
        node,
        packet,
        attacker,
        previousOwner,
        energyAmount: attackEnergy,
        energyIntegrated: attackEnergy - defenseEnergy,
        clearNodeAssignments: true, // Debe limpiarse al ser capturado
      };
    }

    if (attackEnergy === defenseEnergy) {
      return {
        outcome: ArrivalOutcome.NEUTRALIZED,
        node,
        packet,
        attacker,
        previousOwner,
        energyAmount: attackEnergy,
        clearNodeAssignments: true,
      };
    }

    // Ataque es menor que la defensa
    // La energía de defensa se reduce, y el paquete atacante podría regresar
    // node.defenseMultiplier unused here for calculation as intention doesn't mutate
    const returnPacket = this.handleDefeatedEnergy(packet, packet.origin);

    return {
      outcome: ArrivalOutcome.DEFEATED,
      node,
      packet,
      attacker,
      previousOwner,
      energyAmount: attackEnergy,
      returnPacket: returnPacket ?? undefined,
    };
  }

  private handleDefeatedEnergy(
    packet: EnergyPacket,
    originNode: Node,
  ): EnergyPacket | null {
    if (originNode.isNeutral()) {
      return null;
    }

    if (originNode.owner?.equals(packet.owner)) {
      return packet.reverse();
    }

    return null;
  }
}
