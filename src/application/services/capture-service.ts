import type { Player } from '@/core/entities/player';
import type { Node } from '@/core/entities/node/node';

/**
 * Resultado de un intento de captura de nodo
 */
export interface CaptureResult {
  /** Indica si la captura fue exitosa */
  captured: boolean;
  /** Lista de nodos perdidos por el jugador afectado (por articulación) */
  nodesLost: Node[];
  /** Indica si el jugador fue eliminado */
  playerEliminated: boolean;
  /** Nodo que fue capturado */
  node: Node;
  /** Jugador atacante */
  attacker: Player;
  /** Jugador previo (null si era neutral) */
  previousOwner: Player | null;
  /** Bonificación de energía aplicada */
  energyBonus: number;
}

/**
 * Representa el estado del grafo para análisis de conectividad
 */
/**
 * Servicio que gestiona la lógica de captura de nodos
 *
 * Responsabilidades:
 * - Ejecutar capturas de nodos con todas las validaciones
 * - Aplicar bonificaciones de energía según tipo de nodo
 * - Manejar neutralización de nodos
 * - Detectar y procesar capturas de nodos de articulación
 * - Gestionar eliminación de jugadores
 *
 * @example
 * ```ts
 * const captureService = new CaptureService();
 *
 * const result = captureService.captureNode(
 *   targetNode,
 *   attackerPlayer,
 *   defenderPlayer,
 * );
 *
 * if (result.playerEliminated) {
 *   console.log('¡Jugador eliminado!');
 * }
 *
 * if (result.nodesLost.length > 0) {
 *   console.log(`Nodos desconectados: ${result.nodesLost.length}`);
 * }
 * ```
 */
export class CaptureService {
  /**
   * Captura un nodo para el jugador atacante
   *
   * Proceso:
   * 1. Si hay dueño previo, llamar previousOwner.loseNode(node)
   * 2. Llamar attacker.captureNode(node)
   * 3. Llamar node.setOwner(attacker)
   * 4. Aplicar bonificación de energía: attacker.increaseEnergy(node.energyAddition)
   * 5. Verificar si previousOwner perdió su nodo inicial
   * 6. Si perdió nodo inicial, eliminar jugador
   *
   * @param node - Nodo a capturar
   * @param attacker - Jugador que captura el nodo
   * @param previousOwner - Dueño anterior del nodo (null si era neutral)
   * @returns CaptureResult con información completa de la captura
   */
  public captureNode(
    node: Node,
    attacker: Player,
    previousOwner: Player | null,
  ): CaptureResult {
    // Validaciones
    if (!attacker.isInGame) {
      throw new Error(
        `El jugador ${attacker.username} no está en una partida activa.`,
      );
    }

    if (node.owner && node.owner.equals(attacker)) {
      throw new Error(
        `El jugador ${attacker.username} ya controla el nodo ${String(node.id)}.`,
      );
    }

    // Variables para el resultado
    let playerEliminated = false;
    const energyBonus = node.energyAddition;

    // Paso 1: Si hay dueño previo, hacer que pierda el nodo
    if (previousOwner) {
      previousOwner.loseNode(node);
    }

    // Paso 2: Atacante captura el nodo
    attacker.captureNode(node);

    // Paso 3: Asignar nuevo dueño al nodo
    node.setOwner(attacker);

    // Paso 4: Aplicar bonificación de energía
    attacker.increaseEnergy(energyBonus);

    // Paso 5 y 6: Verificar si el dueño anterior perdió su nodo inicial
    if (previousOwner) {
      const lostInitialNode = previousOwner.initialNode?.equals(node) ?? false;

      if (lostInitialNode) {
        previousOwner.eliminate();
        playerEliminated = true;

        console.log(
          `[CaptureService] ⚠️  Jugador ${previousOwner.username} ELIMINADO por perder nodo inicial ${String(node.id)}`,
        );
      }
    }

    const result: CaptureResult = {
      captured: true,
      nodesLost: [],
      playerEliminated,
      node,
      attacker,
      previousOwner,
      energyBonus,
    };

    console.log(
      `[CaptureService] ✅ Nodo ${String(node.id)} capturado por ${attacker.username}. Energía +${energyBonus}`,
    );

    return result;
  }

  /**
   * Neutraliza un nodo, dejándolo sin dueño
   *
   * Esto ocurre cuando:
   * - Un ataque iguala exactamente la defensa
   * - Se necesita liberar un nodo manualmente
   *
   * Proceso:
   * 1. Llamar previousOwner.loseNode(node)
   * 2. Llamar node.setOwner(null)
   * 3. Llamar node.clearAssignments()
   *
   * @param node - Nodo a neutralizar
   * @param previousOwner - Dueño actual del nodo
   */
  public neutralizeNode(node: Node, previousOwner: Player): void {
    // Validaciones
    if (!previousOwner.ownsNode(node)) {
      throw new Error(
        `El jugador ${previousOwner.username} no controla el nodo ${String(node.id)}.`,
      );
    }

    // Paso 1: Jugador pierde el nodo
    previousOwner.loseNode(node);

    // Paso 2: Nodo queda sin dueño
    node.setOwner(null);

    // Paso 3: Limpiar asignaciones de energía
    node.clearAssignments();

    console.log(
      `[CaptureService] ⚪ Nodo ${String(node.id)} neutralizado (antes de ${previousOwner.username})`,
    );
  }

  /**
   * Maneja la captura de un nodo de articulación
   *
   * Un nodo de articulación es aquel cuya captura puede dividir el grafo
   * del jugador afectado, desconectando nodos de su nodo inicial.
   *
   * Algoritmo:
   * 1. Identificar el nodo inicial del jugador afectado
   * 2. Realizar BFS/DFS desde el nodo inicial
   * 3. Identificar nodos del jugador que quedaron desconectados
   * 4. Hacer que el jugador pierda esos nodos
   * 5. Neutralizar los nodos desconectados
   *
   * @param capturedNode - Nodo que fue capturado (posible articulación)
   * @param affectedPlayer - Jugador que puede perder nodos
   * @param graph - Grafo completo del juego
   * @returns Lista de nodos que el jugador perdió por desconexión
   */
  public handleArticulationCapture(
    capturedNode: Node,
    affectedPlayer: Player,
  ): Node[] {
    // Si el jugador no tiene nodo inicial, no puede perder más nodos
    if (!affectedPlayer.initialNode) {
      console.log(
        `[CaptureService] Jugador ${affectedPlayer.username} no tiene nodo inicial`,
      );
      return [];
    }

    // Si el nodo capturado era el inicial, el jugador ya fue eliminado
    if (affectedPlayer.initialNode.equals(capturedNode)) {
      console.log(
        `[CaptureService] Nodo capturado era el inicial, jugador ya eliminado`,
      );
      return [];
    }

    // Encontrar todos los nodos conectados al nodo inicial del jugador
    const connectedNodes = this.findConnectedNodes(
      affectedPlayer.initialNode,
      affectedPlayer,
    );

    // Identificar nodos desconectados
    const disconnectedNodes: Node[] = [];

    for (const node of affectedPlayer.controlledNodes) {
      if (!connectedNodes.has(node)) {
        disconnectedNodes.push(node);
      }
    }

    // Si no hay nodos desconectados, retornar vacío
    if (disconnectedNodes.length === 0) {
      return [];
    }

    // Hacer que el jugador pierda los nodos desconectados
    // Nota: Iteramos usando loseNode() en lugar de loseMultipleNodes()
    // para mantener la entidad Player simple y la lógica en el servicio
    disconnectedNodes.forEach((node) => {
      affectedPlayer.loseNode(node);
      node.setOwner(null);
      node.clearAssignments();
    });

    console.log(
      `[CaptureService] ⚠️  Nodo de articulación detectado! ${disconnectedNodes.length} nodos desconectados de ${affectedPlayer.username}`,
    );

    return disconnectedNodes;
  }

  /**
   * Encuentra todos los nodos conectados a un nodo inicial mediante BFS
   *
   * Solo considera:
   * - Nodos del jugador especificado
   * - Conexiones a través de aristas del grafo
   *
   * @param startNode - Nodo inicial desde donde buscar
   * @param player - Jugador cuyos nodos se buscan
   * @param graph - Grafo completo
   * @returns Set con todos los nodos conectados
   */
  private findConnectedNodes(
    startNode: Node,
    player: Player,
  ): Set<Node> {
    const connected = new Set<Node>();
    const queue: Node[] = [startNode];
    const visited = new Set<Node>();

    visited.add(startNode);
    connected.add(startNode);

    while (queue.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const currentNode = queue.shift()!;

      // Examinar todas las aristas del nodo actual
      for (const edge of currentNode.edges) {
        // Obtener el nodo del otro lado de la arista
        const neighborNode = edge.flipSide(currentNode);

        // Solo considerar nodos no visitados y del mismo jugador
        if (
          !visited.has(neighborNode)
          && neighborNode.owner
          && neighborNode.owner.equals(player)
        ) {
          visited.add(neighborNode);
          connected.add(neighborNode);
          queue.push(neighborNode);
        }
      }
    }

    return connected;
  }

  /**
   * Captura un nodo con verificación de articulación
   *
   * Este es el método principal que combina captura y detección de articulación.
   *
   * @param node - Nodo a capturar
   * @param attacker - Jugador atacante
   * @param previousOwner - Dueño anterior
   * @param graph - Grafo completo (necesario para detección de articulación)
   * @returns CaptureResult completo con nodos desconectados
   */
  public captureNodeWithArticulationCheck(
    node: Node,
    attacker: Player,
    previousOwner: Player | null,
  ): CaptureResult {
    // Realizar captura normal
    const result = this.captureNode(node, attacker, previousOwner);

    // Si había dueño previo y no fue eliminado, verificar articulación
    if (previousOwner && !result.playerEliminated) {
      const disconnectedNodes = this.handleArticulationCapture(
        node,
        previousOwner,
      );

      result.nodesLost = disconnectedNodes;

      // Si el jugador perdió todos sus nodos, eliminarlo
      if (previousOwner.controlledNodeCount === 0) {
        previousOwner.eliminate();
        result.playerEliminated = true;

        console.log(
          `[CaptureService] ⚠️  Jugador ${previousOwner.username} ELIMINADO por perder todos los nodos`,
        );
      }
    }

    return result;
  }

  /**
   * Verifica si un nodo es de articulación para un jugador
   *
   * Un nodo es de articulación si su remoción desconecta el grafo.
   * Útil para análisis estratégico.
   *
   * @param node - Nodo a verificar
   * @param player - Jugador dueño del nodo
   * @param graph - Grafo completo
   * @returns true si el nodo es de articulación
   */
  public isArticulationPoint(
    node: Node,
    player: Player,
  ): boolean {
    if (!player.ownsNode(node)) {
      return false;
    }

    // El nodo inicial siempre es de articulación
    if (player.initialNode && player.initialNode.equals(node)) {
      return true;
    }

    // Si el jugador solo tiene 1 nodo, no puede ser de articulación
    if (player.controlledNodeCount <= 1) {
      return false;
    }

    // Simular remoción temporal del nodo
    const originalOwner = node.owner;
    node.setOwner(null);

    // Encontrar nodos conectados sin este nodo
    const connectedNodes = player.initialNode
      ? this.findConnectedNodes(player.initialNode, player)
      : new Set<Node>();

    // Restaurar propietario
    node.setOwner(originalOwner);

    // Si hay nodos controlados que no están conectados, es articulación
    const allNodesConnected = Array.from(player.controlledNodes).every(
      (playerNode) => {
        return playerNode.equals(node) || connectedNodes.has(playerNode);
      },
    );

    return !allNodesConnected;
  }

  /**
   * Obtiene todos los nodos que se perderían si un nodo es capturado
   *
   * Útil para previsualización y decisiones estratégicas de IA.
   *
   * @param node - Nodo hipotéticamente capturado
   * @param player - Jugador que perdería el nodo
   * @param graph - Grafo completo
   * @returns Lista de nodos que se perderían
   */
  public getNodesAtRisk(
    node: Node,
    player: Player,
  ): Node[] {
    if (!player.ownsNode(node)) {
      return [];
    }

    // Si es el nodo inicial, el jugador pierde todo
    if (player.initialNode && player.initialNode.equals(node)) {
      return Array.from(player.controlledNodes);
    }

    // Simular captura
    const originalOwner = node.owner;
    node.setOwner(null);

    // Encontrar nodos desconectados
    const connectedNodes = player.initialNode
      ? this.findConnectedNodes(player.initialNode, player)
      : new Set<Node>();

    const nodesAtRisk: Node[] = [];

    for (const playerNode of player.controlledNodes) {
      if (!playerNode.equals(node) && !connectedNodes.has(playerNode)) {
        nodesAtRisk.push(playerNode);
      }
    }

    // Restaurar propietario
    node.setOwner(originalOwner);

    return nodesAtRisk;
  }
}
