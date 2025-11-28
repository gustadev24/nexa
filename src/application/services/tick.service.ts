import type { GameState } from '@/application/services/game-state.interface';
import type { TickResult } from '@/application/services/tick-result.interface';
import { EnergyPacket } from '@/core/entities/energy-packet';
import type { Node } from '@/core/entities/node/node';
import type { Player } from '@/core/entities/player';
import { CollisionService } from '@/application/services/collision.service';
import { CaptureService } from '@/application/services/capture-service';
import { ArrivalOutcome } from '@/application/services/arrival-result.interface'; // Re-import for type safety
import type { ArrivalIntent } from '@/application/services/arrival-intent.interface'; // Import new intent
import type { Edge } from '@/core/entities/edge'; // Needed for packetsToAddBack

export class TickService {
  private static readonly DEFAULT_SPEED = 0.0003; // Very slow: ~3-4 seconds to traverse edge of length 1
  
  private collisionService: CollisionService;
  private captureService: CaptureService;

  private lastDefenseUpdate = new Map<Node, number>();
  private lastAttackEmission = new Map<Node, number>();
  private accumulatedTime = 0;

  constructor() {
    this.collisionService = new CollisionService();
    this.captureService = new CaptureService();
  }

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
            
            if (assignedEnergy <= node.energyPool) {
              if (attackEnergy > 0) {
                const target = edge.flipSide(node);

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
      const results = this.collisionService.resolveEdgeCollisions(edge);
      for (const res of results) {
        collisionCount += res.packetsDestroyed.length;
      }
    }

    return collisionCount;
  }

  resolveArrivals(game: GameState): { arrivals: number; captures: number } {
    let arrivalCount = 0;
    let captureCount = 0;

    // Use a temporary array to store packets to add back to edges
    const packetsToAddBack: { edge: Edge; packet: EnergyPacket }[] = [];

    for (const edge of game.edges) {
      const packets = edge.energyPackets;
      const arrivedPackets: EnergyPacket[] = [];

      for (const packet of packets) {
        if (packet.hasArrived()) {
          arrivedPackets.push(packet);
        }
      }

      for (const packet of arrivedPackets) {
        // Remove packet from edge immediately as it has arrived
        edge.removeEnergyPacket(packet);
        arrivalCount++;

        const targetNode = packet.target;

        // Get the intent from CollisionService (no mutations yet)
        const intent: ArrivalIntent = this.collisionService.resolveNodeArrivalIntent(packet, targetNode);

        switch (intent.outcome) {
          case ArrivalOutcome.INTEGRATED:
            // Friendly arrival: just add energy to the node's pool
            targetNode.addEnergy(intent.energyIntegrated || 0);
            break;

          case ArrivalOutcome.CAPTURED:
            captureCount++;
            // Use CaptureService to perform the capture and articulation check
            const captureResult = this.captureService.captureNodeWithArticulationCheck(
              intent.node,
              intent.attacker,
              intent.previousOwner,
            );

            // If node was successfully captured, handle post-capture effects
            if (captureResult.captured) {
              if (intent.energyIntegrated) {
                // Clear existing energy and add remaining energy from capture
                intent.node.removeEnergy(intent.node.energyPool); // Clear existing pool
                intent.node.addEnergy(intent.energyIntegrated);
              }
              // Transfer assigned energy from attacker's other nodes to the newly captured node
              this.transferAssignmentsToNode(intent.node, intent.attacker);
            }
            // captureResult.playerEliminated is handled by CaptureService internally
            break;

          case ArrivalOutcome.NEUTRALIZED:
            // Attack equals defense, node becomes neutral
            if (intent.previousOwner) {
                // Neutralize node through CaptureService
                this.captureService.neutralizeNode(intent.node, intent.previousOwner);
            } else {
                // If it was already neutral and effectively neutralized, just ensure assignments are clear
                intent.node.clearAssignments();
            }
            break;

          case ArrivalOutcome.DEFEATED:
            // Attack failed, defense held
            // Reduce target node's energy (defense)
            // The prompt states: "Si la energía de ataque supera la defensa, el nodo es capturado; si es igual, el nodo queda neutral."
            // "Energías enemigas que llegan a un nodo amigo se suman a la defensa del nodo."
            // "La energía enemiga derrotada se pierde si proviene de un nodo que fue capturado; de lo contrario, regresa al nodo de origen."
            // This implies if attack < defense, the *defense* takes damage.
            // And if defense is strong, attack packet is defeated and can return.

            if (intent.node.owner && intent.energyAmount) {
                 // Reduce the node's energy pool based on the attack.
                 // CollisionService determined the actual reduction needed.
                 // We can simply remove energy from the node here.
                 intent.node.removeEnergy(intent.energyAmount); // Assuming intent.energyAmount is the reduction
            }
            
            if (intent.returnPacket) {
                packetsToAddBack.push({ edge, packet: intent.returnPacket });
            }
            break;
        }
      }
    }

    // Re-add any return packets to their respective edges
    for (const { edge, packet } of packetsToAddBack) {
      edge.addEnergyPacket(packet);
    }

    return { arrivals: arrivalCount, captures: captureCount };
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
            // We should also remove any energy packets in transit on this edge
            // that were targeting the now-captured node, as they are now friendly.
            // This is a subtle point, current packets might still be for the old owner.
            // Simplification: assume packets are handled at arrival.
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