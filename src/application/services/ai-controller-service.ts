import type { Player } from '@/core/entities/player';
import type { Node } from '@/core/entities/node/node';
import type { Edge } from '@/core/entities/edge';
import EnergyCommandService from '@/application/services/energy-command-service';
import type { Logger } from '@/application/interfaces/logging/logger';
import type { Loggeable } from '@/application/interfaces/logging/loggeable';

/**
 * AIControllerService - Controla el comportamiento de jugadores IA
 *
 * Implementa una estrategia básica:
 * 1. Defender nodos propios manteniendo energía de defensa
 * 2. Atacar nodos neutrales cercanos
 * 3. Atacar nodos enemigos débiles cuando sea posible
 */
export class AIControllerService implements Loggeable {
  _logContext = 'AIControllerService';
  private energyCommandService: EnergyCommandService;
  private lastActionTime = 0;
  private readonly ACTION_INTERVAL = 1000; // ms entre decisiones - más activo para ser competitivo

  constructor(
    private log: Logger,
  ) {
    this.energyCommandService = new EnergyCommandService();
  }

  /**
   * Ejecuta una acción de IA para el jugador dado
   */
  public executeAITurn(player: Player, currentTime: number): void {
    // Limitar frecuencia de acciones
    if (currentTime - this.lastActionTime < this.ACTION_INTERVAL) {
      return;
    }

    this.lastActionTime = currentTime;

    // Obtener nodos controlados por el jugador
    const controlledNodes = Array.from(player.controlledNodes);

    if (controlledNodes.length === 0) {
      return; // Jugador eliminado
    }

    // Estrategia: seleccionar nodo con más energía disponible
    const nodesByEnergy = controlledNodes
      .filter(node => node.energyPool >= 10) // Solo nodos con energía suficiente para al menos una acción
      .sort((a, b) => b.energyPool - a.energyPool);

    if (nodesByEnergy.length === 0) {
      return; // No hay nodos con energía suficiente
    }

    const sourceNode = nodesByEnergy[0];

    // Buscar objetivo: prioridad a neutrales, luego enemigos débiles
    const target = this.findBestTarget(sourceNode, player);

    if (target) {
      const { edge } = target;

      // Calcular cuánta energía asignar - SIEMPRE en incrementos de 10
      const availableEnergy = sourceNode.energyPool;

      // Estrategia: asignar 10 de energía por acción (igual que el jugador)
      const amountToAdd = 10;

      // Solo asignar si hay suficiente energía disponible
      if (availableEnergy >= amountToAdd) {
        this.energyCommandService.assignEnergyToEdge(
          player,
          sourceNode,
          edge,
          amountToAdd,
        );
        this.log.info(this, `[AI] Asignando ${amountToAdd} de energía desde nodo ${sourceNode.id} hacia ${target.targetNode.id}`);
      }
    }
    else {
      // No hay objetivos claros - redistribuir energía defensivamente
      this.redistributeDefensively(player, controlledNodes);
    }
  }

  /**
   * Encuentra el mejor objetivo para atacar desde un nodo
   */
  private findBestTarget(
    sourceNode: Node,
    player: Player,
  ): { edge: Edge; targetNode: Node } | null {
    const adjacentEdges = Array.from(sourceNode.edges);

    // Evaluar cada arista adyacente
    const targets: { edge: Edge; targetNode: Node; priority: number }[] = [];

    for (const edge of adjacentEdges) {
      const targetNode = edge.flipSide(sourceNode);

      if (targetNode.owner?.equals(player)) {
        continue; // No atacar nodos propios
      }

      let priority = 0;

      if (targetNode.isNeutral()) {
        // Prioridad ALTA para nodos neutrales
        priority = 100;

        // Mayor prioridad para nodos especiales
        if (targetNode.energyAddition > 0) {
          priority += 50; // Nodos de energía
        }

        // Ajustar por energía de defensa (más fáciles = mayor prioridad)
        priority -= targetNode.defenseEnergy() / 10;
      }
      else {
        // Prioridad MEDIA para nodos enemigos
        const defenseEnergy = targetNode.defenseEnergy();

        if (defenseEnergy < 30) {
          priority = 50; // Enemigo débil
        }
        else if (defenseEnergy < 60) {
          priority = 30; // Enemigo medio
        }
        else {
          priority = 10; // Enemigo fuerte (baja prioridad)
        }

        // Bonus si es el nodo inicial enemigo (ganar la partida)
        if (targetNode === targetNode.owner?.initialNode) {
          priority += 100;
        }
      }

      targets.push({ edge, targetNode, priority });
    }

    // Ordenar por prioridad y seleccionar el mejor
    targets.sort((a, b) => b.priority - a.priority);

    return targets.length > 0 ? targets[0] : null;
  }

  /**
   * Redistribuye energía defensivamente cuando no hay objetivos claros
   */
  private redistributeDefensively(player: Player, controlledNodes: Node[]): void {
    // Estrategia: quitar energía de aristas que no llevan a ningún lado útil
    for (const node of controlledNodes) {
      for (const edge of node.edges) {
        const currentAssignment = node.getAssignedEnergy(edge);

        if (currentAssignment > 0) {
          const target = edge.flipSide(node);

          // Si la arista va a un nodo propio, reducir asignación en incrementos de 10
          if (target.owner?.equals(player)) {
            const amountToRemove = Math.min(10, currentAssignment);
            this.energyCommandService.removeEnergyFromEdge(
              player,
              node,
              edge,
              amountToRemove,
            );
          }
        }
      }
    }
  }

  /**
   * Resetea el estado interno del controlador
   */
  public reset(): void {
    this.lastActionTime = 0;
  }
}
