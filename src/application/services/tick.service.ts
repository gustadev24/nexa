import type { GameState } from '@/application/services/game-state.interface';
import type { TickResult } from '@/application/services/tick-result.interface';
import { EnergyPacket } from '@/core/entities/energy-packets';
import type { Node } from '@/core/entities/node/node';
import type { Player } from '@/core/entities/player';

export class TickService {
  private static readonly DEFAULT_SPEED = 0.0003; // Very slow: ~3-4 seconds to traverse edge of length 1
  private static readonly COLLISION_THRESHOLD = 0.01;

  private lastDefenseUpdate = new Map<Node, number>();
  private lastAttackEmission = new Map<Node, number>();
  private accumulatedTime = 0;

  executeTick(game: GameState, deltaTime: number): TickResult {
    this.accumulatedTime += deltaTime;

    const result: TickResult = {
      collisions: 0,
      arrivals: 0,
      captures: 0,
    };

    this.updateDefenses(game);

    this.emitEnergyPackets(game);

    this.advancePackets(game, deltaTime);

    result.collisions = this.resolveCollisions(game);

    const arrivalResult = this.resolveArrivals(game);
    result.arrivals = arrivalResult.arrivals;
    result.captures = arrivalResult.captures;

    return result;
  }

  updateDefenses(game: GameState): void {
    const currentTime = this.accumulatedTime;

    for (const node of game.nodes) {
      if (node.isNeutral()) {
        continue;
      }

      const lastUpdate = this.lastDefenseUpdate.get(node) ?? 0;
      const timeSinceLastUpdate = currentTime - lastUpdate;

      if (timeSinceLastUpdate >= node.defenseInterval) {
        this.lastDefenseUpdate.set(node, currentTime);
      }
    }
  }

  emitEnergyPackets(game: GameState): void {
    const currentTime = this.accumulatedTime;

    for (const node of game.nodes) {
      if (node.isNeutral() || !node.owner) {
        continue;
      }

      const lastEmission = this.lastAttackEmission.get(node) ?? 0;
      const timeSinceLastEmission = currentTime - lastEmission;

      if (timeSinceLastEmission >= node.attackInterval) {
        for (const edge of node.edges) {
          const assignedEnergy = node.getAssignedEnergy(edge);

          if (assignedEnergy > 0) {
            const attackEnergy = node.getAttackEnergy(edge);

            // Only emit if node has enough energy available
            // Available energy = total - all assignments (defense calculation already accounts for this)
            const availableEnergy = node.energyPool;
            const totalAssigned = Array.from(node.edges).reduce((sum, e) => sum + node.getAssignedEnergy(e), 0);
            const energyForDefense = availableEnergy - totalAssigned;

            if (energyForDefense >= 0 && assignedEnergy <= availableEnergy) {
              if (attackEnergy > 0) {
                const target = edge.flipSide(node);

                // CRITICAL: Do NOT subtract energy when emitting!
                // Nodes are INFINITE GENERATORS while controlled
                // The assignment defines how much energy to GENERATE per interval
                // Energy in the node stays constant - it's a continuous generator
                // Defense = pool - assigned (energy not being used to attack)

                const packet = new EnergyPacket(
                  node.owner,
                  attackEnergy,
                  node,
                  target,
                );

                edge.addEnergyPacket(packet);
              }
            }
          }
        }

        this.lastAttackEmission.set(node, currentTime);
      }
    }
  }

  advancePackets(game: GameState, deltaTime: number): void {
    for (const edge of game.edges) {
      const packets = edge.energyPackets;

      for (const packet of packets) {
        packet.advance(
          deltaTime,
          edge.length,
          TickService.DEFAULT_SPEED,
        );
      }
    }
  }

  resolveCollisions(game: GameState): number {
    let collisionCount = 0;

    for (const edge of game.edges) {
      const packets = edge.energyPackets;

      if (packets.length < 2) {
        continue;
      }

      const toRemove: EnergyPacket[] = [];
      const toAdd: EnergyPacket[] = [];

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
            packet1.isAtSamePosition(packet2, TickService.COLLISION_THRESHOLD)
          ) {
            if (packet1.sameOwner(packet2)) {
              if (packet1.isOppositeDirection(packet2)) {
                toRemove.push(packet1, packet2);
                collisionCount++;
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

              collisionCount++;
            }
          }
        }
      }

      for (const packet of toRemove) {
        edge.removeEnergyPacket(packet);
      }

      for (const packet of toAdd) {
        edge.addEnergyPacket(packet);
      }
    }

    return collisionCount;
  }

  resolveArrivals(game: GameState): { arrivals: number; captures: number } {
    let arrivalCount = 0;
    let captureCount = 0;

    for (const edge of game.edges) {
      const packets = edge.energyPackets;
      const arrivedPackets: EnergyPacket[] = [];

      for (const packet of packets) {
        if (packet.hasArrived()) {
          arrivedPackets.push(packet);
        }
      }

      for (const packet of arrivedPackets) {
        edge.removeEnergyPacket(packet);
        arrivalCount++;

        const targetNode = packet.target;
        const attackingPlayer = packet.owner;

        if (targetNode.isNeutral()) {
          this.captureNeutralNode(targetNode, attackingPlayer, packet.amount);
          captureCount++;
        }
        else if (targetNode.owner?.equals(attackingPlayer)) {
          // Energy arrives at friendly node - just integrate it
          // This increases the node's pool which increases defense
          targetNode.addEnergy(packet.amount);
        }
        else {
          const defenseEnergy = targetNode.defenseEnergy();
          const attackEnergy = packet.amount;

          if (attackEnergy > defenseEnergy) {
            const captured = this.captureEnemyNode(
              targetNode,
              attackingPlayer,
              attackEnergy,
              defenseEnergy,
            );
            if (captured) {
              captureCount++;
            }
          }
          else if (attackEnergy === defenseEnergy) {
            this.neutralizeNode(targetNode);
          }
          else {
            targetNode.removeEnergy(attackEnergy / targetNode.defenseMultiplier);
          }
        }
      }
    }

    return { arrivals: arrivalCount, captures: captureCount };
  }

  private captureNeutralNode(
    node: Node,
    attacker: Player,
    energy: number,
  ): void {
    node.setOwner(attacker);
    node.addEnergy(energy);
    attacker.captureNode(node);

    if (node.energyAddition > 0) {
      attacker.increaseEnergy(node.energyAddition);
    }

    // Transfer assigned energy from attacking nodes to the captured node
    this.transferAssignmentsToNode(node, attacker);
  }

  private captureEnemyNode(
    node: Node,
    attacker: Player,
    attackEnergy: number,
    defenseEnergy: number,
  ): boolean {
    const previousOwner = node.owner;

    if (!previousOwner) {
      return false;
    }

    const energyAdditionLost = node.energyAddition;

    previousOwner.loseNode(node);

    if (energyAdditionLost > 0) {
      previousOwner.decreaseEnergy(energyAdditionLost);
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

    // Transfer assigned energy from attacking nodes to the captured node
    this.transferAssignmentsToNode(node, attacker);

    return true;
  }

  private neutralizeNode(node: Node): void {
    const previousOwner = node.owner;

    if (previousOwner) {
      // Only call loseNode if the player actually owns the node
      if (previousOwner.ownsNode(node)) {
        previousOwner.loseNode(node);
      }

      if (node.energyAddition > 0) {
        previousOwner.decreaseEnergy(node.energyAddition);
      }
    }

    node.setOwner(null);
    node.removeEnergy(node.energyPool);
    node.clearAssignments();
  }

  /**
   * Transfer assigned energy from attacker's nodes to the captured node
   * When you capture a node, the energy you had assigned to attack it
   * should be transferred to the captured node's pool
   */
  private transferAssignmentsToNode(capturedNode: Node, attacker: Player): void {
    // Find all nodes owned by attacker
    const attackerNodes = Array.from(attacker.controlledNodes);

    // For each attacker node, check if it has assignments to the captured node
    for (const attackerNode of attackerNodes) {
      if (attackerNode === capturedNode) continue;

      // Check all edges of this attacker node
      for (const edge of attackerNode.edges) {
        // If this edge connects to the captured node
        if (edge.hasNode(capturedNode)) {
          const assignedEnergy = attackerNode.getAssignedEnergy(edge);

          if (assignedEnergy > 0) {
            // Transfer the assigned energy to the captured node
            capturedNode.addEnergy(assignedEnergy);

            // Clear the assignment since they're now friendly
            attackerNode.removeEnergyFromEdge(edge, assignedEnergy);

            console.log(
              `[TickService] Transferred ${assignedEnergy} energy from ${attackerNode.id} to captured ${capturedNode.id}`,
            );
          }
        }
      }
    }
  }

  reset(): void {
    this.lastDefenseUpdate.clear();
    this.lastAttackEmission.clear();
    this.accumulatedTime = 0;
  }
}
