import type { GameState } from '@/application/services/game-state.interface';
import type { TickResult } from '@/application/services/tick-result.interface';
import { EnergyPacket } from '@/core/entities/energy-packet';
import type { Node } from '@/core/entities/node/node';

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
        // Regenerar defensa basándose en el pool actual
        node.regenerateDefense();
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

            // El pool es un generador infinito, siempre emitir si hay asignación
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
          { captureCount++;
            // Use CaptureService to perform the capture and articulation check
            const captureResult = this.captureService.captureNodeWithArticulationCheck(
              intent.node,
              intent.attacker,
              intent.previousOwner,
            );

            // If node was successfully captured, handle post-capture effects
            if (captureResult.captured) {
              // Transferir la energía asignada por la arista de captura al nodo capturado
              const sourceNode = packet.origin;
              const capturedNode = intent.node;
              const attacker = intent.attacker;

              // Encontrar la arista que conecta el origen con el nodo capturado
              for (const edge of sourceNode.edges) {
                if (edge.hasNode(capturedNode)) {
                  const assignedEnergy = sourceNode.getAssignedEnergy(edge);

                  if (assignedEnergy > 0) {
                    // Transferir toda la energía asignada al nodo capturado
                    capturedNode.addEnergy(assignedEnergy);

                    // Detener la emisión de paquetes (limpiar asignación)
                    sourceNode.removeEnergyFromEdge(edge, assignedEnergy);

                    // Limpiar paquetes en tránsito de esta arista
                    edge.clearEnergyPackets();
                  }
                  break;
                }
              }

              // CRITICAL: Limpiar asignaciones de TODOS los nodos aliados hacia el nodo recién capturado
              // Esto evita que sigan enviando energía a un nodo que ahora es del mismo dueño
              for (const edge of capturedNode.edges) {
                const neighborNode = edge.flipSide(capturedNode);

                // Si el vecino es del mismo dueño que el atacante (aliado)
                if (neighborNode.owner?.equals(attacker)) {
                  const assignedToCapture = neighborNode.getAssignedEnergy(edge);

                  if (assignedToCapture > 0) {
                    console.log(
                      `[Tick] Limpiando asignación de nodo aliado ${neighborNode.id} hacia nodo recién capturado ${capturedNode.id}: ${assignedToCapture} energía`,
                    );

                    // Devolver la energía asignada al pool del nodo aliado
                    neighborNode.removeEnergyFromEdge(edge, assignedToCapture);

                    // Limpiar paquetes en tránsito de este aliado hacia el nodo capturado
                    const packetsToRemove = edge.energyPackets.filter(
                      p => p.owner.equals(attacker) && p.target.equals(capturedNode),
                    );

                    for (const packetToRemove of packetsToRemove) {
                      edge.removeEnergyPacket(packetToRemove);
                    }
                  }
                }
              }
            }
            // captureResult.playerEliminated is handled by CaptureService internally
            break; }

          case ArrivalOutcome.NEUTRALIZED:
            // Attack equals defense, node becomes neutral
            if (intent.previousOwner) {
              // Neutralize node through CaptureService
              this.captureService.neutralizeNode(intent.node, intent.previousOwner);
            }
            else {
              // If it was already neutral and effectively neutralized, just ensure assignments are clear
              intent.node.clearAssignments();
            }
            break;

          case ArrivalOutcome.DEFEATED:
            // Ataque falló, defensa resistió
            // Según las reglas: el pool es un generador infinito y NUNCA se reduce por ataques
            // PERO la defensa SÍ se reduce por el daño recibido (se regenerará en el próximo intervalo)

            // Reducir la defensa del nodo atacado
            if (intent.energyAmount > 0) {
              intent.node.reduceDefense(intent.energyAmount);
            }

            // Si el ataque proviene de un nodo que aún existe, podría retornar (feature futura)
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

  reset(): void {
    this.lastDefenseUpdate.clear();
    this.lastAttackEmission.clear();
    this.accumulatedTime = 0;
  }
}
