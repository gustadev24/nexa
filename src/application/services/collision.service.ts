import type { Edge } from '@/core/entities/edge';
import type { EnergyPacket } from '@/core/entities/energy-packets';
import type { Node } from '@/core/entities/node/node';
import type { Player } from '@/core/entities/player';
import {
  type ArrivalResult,
  ArrivalOutcome,
} from '@/application/services/arrival-result.interface';
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

  resolveNodeArrival(packet: EnergyPacket, node: Node): ArrivalResult {
    const attackingPlayer = packet.owner;

    if (node.isNeutral()) {
      return this.resolveNeutralNodeArrival(packet, node, attackingPlayer);
    }

    if (node.owner?.equals(attackingPlayer)) {
      return this.resolveFriendlyNodeArrival(packet, node);
    }

    return this.resolveEnemyNodeArrival(packet, node, attackingPlayer);
  }

  private resolveFriendlyNodeArrival(
    packet: EnergyPacket,
    node: Node,
  ): ArrivalResult {
    node.addEnergy(packet.amount);

    return {
      outcome: ArrivalOutcome.INTEGRATED,
      node,
      packet,
      energyIntegrated: packet.amount,
    };
  }

  private resolveNeutralNodeArrival(
    packet: EnergyPacket,
    node: Node,
    attacker: Player,
  ): ArrivalResult {
    const defenseEnergy = node.defenseEnergy();
    const attackEnergy = packet.amount;

    if (attackEnergy > defenseEnergy) {
      node.setOwner(attacker);
      node.addEnergy(attackEnergy);
      attacker.captureNode(node);

      if (node.energyAddition > 0) {
        attacker.increaseEnergy(node.energyAddition);
      }

      return {
        outcome: ArrivalOutcome.CAPTURED,
        node,
        packet,
        capturedBy: attacker,
        energyIntegrated: attackEnergy,
      };
    }

    if (attackEnergy === defenseEnergy) {
      return {
        outcome: ArrivalOutcome.NEUTRALIZED,
        node,
        packet,
        energyLost: attackEnergy,
      };
    }

    return {
      outcome: ArrivalOutcome.DEFEATED,
      node,
      packet,
      energyLost: attackEnergy,
    };
  }

  private resolveEnemyNodeArrival(
    packet: EnergyPacket,
    node: Node,
    attacker: Player,
  ): ArrivalResult {
    const defenseEnergy = node.defenseEnergy();
    const attackEnergy = packet.amount;

    if (attackEnergy > defenseEnergy) {
      const previousOwner = node.owner;

      if (previousOwner) {
        const energyAdditionLost = node.energyAddition;
        previousOwner.loseNode(node);

        if (energyAdditionLost > 0) {
          previousOwner.decreaseEnergy(energyAdditionLost);
        }
      }

      node.setOwner(attacker);
      node.clearAssignments();

      const remainingEnergy = attackEnergy - defenseEnergy;
      node.removeEnergy(node.energyPool);
      node.addEnergy(remainingEnergy);

      attacker.captureNode(node);

      if (node.energyAddition > 0) {
        attacker.increaseEnergy(node.energyAddition);
      }

      return {
        outcome: ArrivalOutcome.CAPTURED,
        node,
        packet,
        capturedBy: attacker,
        energyIntegrated: remainingEnergy,
      };
    }

    if (attackEnergy === defenseEnergy) {
      const previousOwner = node.owner;

      if (previousOwner) {
        previousOwner.loseNode(node);

        if (node.energyAddition > 0) {
          previousOwner.decreaseEnergy(node.energyAddition);
        }
      }

      node.setOwner(null);
      node.removeEnergy(node.energyPool);
      node.clearAssignments();

      return {
        outcome: ArrivalOutcome.NEUTRALIZED,
        node,
        packet,
        energyLost: attackEnergy,
      };
    }

    const actualDefenseEnergy = defenseEnergy / node.defenseMultiplier;
    node.removeEnergy(actualDefenseEnergy);

    const returnPacket = this.handleDefeatedEnergy(packet, packet.origin);

    return {
      outcome: ArrivalOutcome.DEFEATED,
      node,
      packet,
      energyLost: attackEnergy,
      returnPacket: returnPacket ?? undefined,
    };
  }

  handleDefeatedEnergy(
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
