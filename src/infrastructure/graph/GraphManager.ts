import { Edge } from '../../core/entities/edge';
import type { Node } from '../../core/entities/node/node';
import { BasicNode } from '../../core/entities/node/basic';
import { AttackNode } from '../../core/entities/node/attack';
import { DefenseNode } from '../../core/entities/node/defense';
import { EnergyNode } from '../../core/entities/node/energy';
import { SuperEnergyNode } from '../../core/entities/node/super-energy';
import type { Player } from '../../core/entities/player';
import { NodeType } from '../../core/types/common';
import type {
  Graph,
  GraphConfig,
  NodeConfig,
  EdgeConfig,
  ConnectivityAnalysis,
} from '../../core/types/graph.types';

/**
 * GraphManager - Gestor del grafo del juego
 * 
 * Responsable de:
 * - Crear grafos desde configuración
 * - Detectar puntos de articulación (algoritmo de Tarjan)
 * - Calcular componentes conectadas (BFS)
 * - Identificar nodos desconectados de un jugador
 * 
 * Patrón: Manager/Service
 */
export class GraphManager {
  /**
   * Crea un grafo completo a partir de una configuración
   * 
   * @param config Configuración del grafo con nodos y aristas
   * @returns Grafo construido con todas sus entidades
   */
  createGraph(config: GraphConfig): Graph {
    const nodes = new Set<Node>();
    const edges = new Set<Edge>();
    const nodeMap = new Map<string, Node>();

    // 1. Crear todos los nodos según configuración
    for (const nodeConfig of config.nodeConfigs) {
      const node = this.createNode(nodeConfig);
      nodes.add(node);
      nodeMap.set(nodeConfig.id, node);
    }

    // 2. Crear todas las aristas y conectar nodos
    for (const edgeConfig of config.edgeConfigs) {
      const nodeA = nodeMap.get(edgeConfig.nodeAId);
      const nodeB = nodeMap.get(edgeConfig.nodeBId);

      if (!nodeA || !nodeB) {
        throw new Error(
          `Cannot create edge ${edgeConfig.id}: Node ${edgeConfig.nodeAId} or ${edgeConfig.nodeBId} not found`
        );
      }

      // Calcular peso/longitud de la arista
      let weight = edgeConfig.weight;
      if (edgeConfig.autoCalculateWeight || weight === undefined) {
        weight = this.calculateEdgeWeight(nodeA, nodeB);
      }

      // Crear arista
      const edge = new Edge(edgeConfig.id, [nodeA, nodeB], weight);
      edges.add(edge);

      // Conectar nodos con la arista
      nodeA.addEdge(edge);
      nodeB.addEdge(edge);
    }

    return { nodes, edges };
  }

  /**
   * Crea un nodo según su configuración
   * Patrón: Factory Method
   */
  private createNode(config: NodeConfig): Node {
    let node: Node;

    // Factory: crear nodo según tipo
    switch (config.type) {
      case NodeType.BASIC:
        node = new BasicNode(config.id);
        break;
      case NodeType.ATTACK:
        node = new AttackNode(config.id);
        break;
      case NodeType.DEFENSE:
        node = new DefenseNode(config.id);
        break;
      case NodeType.ENERGY:
        node = new EnergyNode(config.id);
        break;
      case NodeType.SUPER_ENERGY:
        node = new SuperEnergyNode(config.id);
        break;
      default:
        throw new Error(`Unknown node type: ${config.type}`);
    }

    // Establecer energía inicial si fue especificada
    if (config.initialEnergy !== undefined && config.initialEnergy > 0) {
      node.addEnergy(config.initialEnergy);
    }

    return node;
  }

  /**
   * Calcula el peso de una arista basándose en la distancia euclidiana
   * entre dos nodos (usando sus posiciones visuales)
   * 
   * @param nodeA Primer nodo
   * @param nodeB Segundo nodo
   * @returns Peso calculado (tiempo de viaje en ticks)
   */
  private calculateEdgeWeight(nodeA: Node, nodeB: Node): number {
    // Por defecto usamos un peso fijo si no tenemos posiciones
    // En una implementación real, esto podría usar las posiciones
    // almacenadas en un mapa separado de datos de renderizado
    const DEFAULT_WEIGHT = 50; // 50 ticks de viaje
    return DEFAULT_WEIGHT;
  }

  /**
   * Obtiene los nodos vecinos de un nodo dado
   * 
   * @param node Nodo del cual obtener vecinos
   * @returns Array de nodos conectados por aristas
   */
  getNeighbors(node: Node): Node[] {
    const neighbors: Node[] = [];
    
    for (const edge of node.edges) {
      const neighbor = edge.flipSide(node);
      neighbors.push(neighbor);
    }
    
    return neighbors;
  }

  /**
   * Encuentra los puntos de articulación en un grafo
   * usando el algoritmo de Tarjan
   * 
   * Un punto de articulación es un nodo cuya eliminación
   * incrementaría el número de componentes conectadas
   * 
   * @param graph Grafo a analizar
   * @returns Array de nodos que son puntos de articulación
   */
  findArticulationPoints(graph: Graph): Node[] {
    const articulationPoints: Node[] = [];
    const visited = new Set<Node>();
    const disc = new Map<Node, number>(); // Tiempo de descubrimiento
    const low = new Map<Node, number>();  // Valor low (menor alcanzable)
    const parent = new Map<Node, Node | null>();
    let time = 0;

    // Helper: DFS para algoritmo de Tarjan
    const dfs = (u: Node): void => {
      visited.add(u);
      disc.set(u, time);
      low.set(u, time);
      time++;

      let children = 0;
      const neighbors = this.getNeighbors(u);

      for (const v of neighbors) {
        if (!visited.has(v)) {
          children++;
          parent.set(v, u);
          dfs(v);

          // Actualizar low value de u
          low.set(u, Math.min(low.get(u)!, low.get(v)!));

          // Condición 1: u es raíz con más de un hijo
          const uParent = parent.get(u);
          if (uParent === null && children > 1) {
            if (!articulationPoints.includes(u)) {
              articulationPoints.push(u);
            }
          }

          // Condición 2: u no es raíz y low[v] >= disc[u]
          if (uParent !== null && low.get(v)! >= disc.get(u)!) {
            if (!articulationPoints.includes(u)) {
              articulationPoints.push(u);
            }
          }
        } else if (v !== parent.get(u)) {
          // Actualizar low value si v ya fue visitado y no es el padre
          low.set(u, Math.min(low.get(u)!, disc.get(v)!));
        }
      }
    };

    // Ejecutar DFS desde cada nodo no visitado
    for (const node of graph.nodes) {
      if (!visited.has(node)) {
        parent.set(node, null);
        dfs(node);
      }
    }

    return articulationPoints;
  }

  /**
   * Obtiene la componente conectada desde un nodo inicial
   * usando BFS (Breadth-First Search)
   * 
   * @param startNode Nodo desde el cual comenzar la búsqueda
   * @param graph Grafo en el cual buscar
   * @returns Set con todos los nodos alcanzables desde startNode
   */
  getConnectedComponent(startNode: Node, graph: Graph): Set<Node> {
    const component = new Set<Node>();
    const queue: Node[] = [startNode];
    const visited = new Set<Node>([startNode]);

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.add(current);

      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && graph.nodes.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return component;
  }

  /**
   * Identifica nodos de un jugador que están desconectados
   * de su nodo inicial
   * 
   * Esto es crítico para la mecánica del juego: cuando el grafo
   * se fragmenta, el jugador pierde control de nodos que no están
   * conectados a su nodo inicial
   * 
   * @param player Jugador a analizar
   * @param graph Grafo actual del juego
   * @returns Array de nodos controlados pero desconectados
   */
  getDisconnectedNodes(player: Player, graph: Graph): Node[] {
    // Obtener nodo inicial del jugador
    const initialNode = player.initialNode;
    if (!initialNode) {
      // Si no tiene nodo inicial, todos sus nodos están desconectados
      return Array.from(player.controlledNodes);
    }

    // Obtener componente conectada desde el nodo inicial
    const connectedComponent = this.getConnectedComponent(initialNode, graph);

    // Identificar nodos controlados que NO están en la componente
    const disconnectedNodes: Node[] = [];
    for (const node of player.controlledNodes) {
      if (!connectedComponent.has(node)) {
        disconnectedNodes.push(node);
      }
    }

    return disconnectedNodes;
  }

  /**
   * Analiza la conectividad completa del grafo
   * 
   * @param graph Grafo a analizar
   * @returns Análisis completo de conectividad
   */
  analyzeConnectivity(graph: Graph): ConnectivityAnalysis {
    const visited = new Set<Node>();
    const components: Set<Node>[] = [];

    // Encontrar todas las componentes conectadas
    for (const node of graph.nodes) {
      if (!visited.has(node)) {
        const component = this.getConnectedComponent(node, graph);
        components.push(component);
        
        // Marcar todos los nodos de esta componente como visitados
        for (const n of component) {
          visited.add(n);
        }
      }
    }

    // Encontrar puntos de articulación
    const articulationPoints = this.findArticulationPoints(graph);

    // El grafo es conexo si solo tiene una componente
    const isConnected = components.length === 1;

    return {
      components,
      articulationPoints,
      isConnected,
    };
  }
}
