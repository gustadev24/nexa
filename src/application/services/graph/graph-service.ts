import { Edge } from '@/core/entities/edge';
import { Graph } from '@/core/entities/graph';
import { AttackNode } from '@/core/entities/node/attack';
import { BasicNode } from '@/core/entities/node/basic';
import { DefenseNode } from '@/core/entities/node/defense';
import { EnergyNode } from '@/core/entities/node/energy';
import type { Node } from '@/core/entities/node/node';
import type { IdGenerator } from '@/core/helpers/id-generator';
import type { Loggeable } from '@/core/logging/loggeable';
import type { Logger } from '@/core/logging/logger';
import { NodeType } from '@/core/types/node-type';

export class GraphService implements Loggeable {
  _logContext = 'GraphService';

  constructor(
    private idGenerator: IdGenerator,
    private log: Logger,
  ) { }

  // Este método genera un grafo con el número de nodos deseado. 2/3 de los nodos deben ser básicos, y el resto de tipos especiales distribuidos aleatoriamente. El número de aristas es el doble del número de nodos, las conexiones son aleatorias, la única condición es que el grafo debe ser conexo.
  generateRandomGraph(nodeCount: number): Graph {
    const graph = new Graph(this.idGenerator.generate(), nodeCount);
    // 1. Añadir nodos básicos
    const basicNodeCount = this.computeBasicNodeCount(nodeCount);
    this.addBasicNodes(graph, basicNodeCount);
    // 2. Añadir nodos especiales
    const specialNodeCount = nodeCount - basicNodeCount;
    this.addSpecialNodes(graph, specialNodeCount);
    // 3. Añadir aristas aleatorias asegurando conectividad
    const edgeCount = nodeCount * 2;
    this.addRandomEdges(graph, edgeCount);
    // 4. Devolver el grafo
    return graph;
  }

  private computeBasicNodeCount(totalCount: number): number {
    return Math.floor((2 * totalCount) / 3);
  }

  private addBasicNodes(graph: Graph, count: number): void {
    for (let i = 0; i < count; i++) {
      const nodeId = this.idGenerator.generate();
      const nodeName = `N${i + 1}`; // N1, N2, N3, etc.
      // Crear nodo básico y registrarlo en el grafo
      const basicNode = new BasicNode(nodeId, undefined, nodeName);
      // Inicializar energyPool con energyAddition (debe hacerse después del constructor)
      basicNode.addEnergy(basicNode.energyAddition);
      graph.registerNode(basicNode);
    }
  }

  private addSpecialNodes(graph: Graph, count: number): void {
    const counters = { attack: 0, defense: 0, energy: 0 };

    for (let i = 0; i < count; i++) {
      // Crear nodo especial aleatorio y registrarlo en el grafo
      const specialNode = this.generateRandomSpecialNode(counters);
      graph.registerNode(specialNode);
    }
  }

  private addRandomEdges(graph: Graph, edgeCount: number): void {
    const nodesArray = Array.from(graph.nodes);
    const nodeCount = nodesArray.length;

    const minEdgesForConnectivity = nodeCount - 1;
    if (edgeCount < minEdgesForConnectivity) {
      this.log.warn(this, `Se solicitaron ${edgeCount} aristas, pero se necesitan ${minEdgesForConnectivity} para conexidad. Se ajustará el valor.`);
      edgeCount = minEdgesForConnectivity;
    }

    // Asegurar que el grafo es conexo creando un árbol primero
    for (let i = 1; i < nodeCount; i++) {
      const fromNode = nodesArray[i];
      const toNode = nodesArray[Math.floor(Math.random() * i)];
      const edgeId = this.idGenerator.generate();
      const edge = new Edge(edgeId, [fromNode, toNode], Math.floor(Math.random() * 10) + 1);
      graph.registerEdge(edge, fromNode, toNode);
    }
    // Añadir aristas adicionales aleatorias hasta alcanzar edgeCount
    while (graph.edges.size < edgeCount) {
      const fromNode = nodesArray[Math.floor(Math.random() * nodeCount)];
      const toNode = nodesArray[Math.floor(Math.random() * nodeCount)];
      // Evitar bucles y aristas duplicadas
      if (fromNode.id !== toNode.id && !graph.hasEdgeBetween(fromNode, toNode)) {
        const edgeId = this.idGenerator.generate();
        const edge = new Edge(edgeId, [fromNode, toNode], Math.floor(Math.random() * 10) + 1);
        graph.registerEdge(edge, fromNode, toNode);
      }
    }
  }

  private generateRandomSpecialNode(counters: { attack: number; defense: number; energy: number }): Node {
    const nodeId = this.idGenerator.generate();
    const specialTypes = Object.values(NodeType).filter(type => type !== NodeType.BASIC);
    const randomType = specialTypes[Math.floor(Math.random() * specialTypes.length)];

    let node: Node;
    let nodeName: string;

    switch (randomType) {
      case NodeType.ATTACK:
        counters.attack++;
        nodeName = `A${counters.attack}`; // A1, A2, etc.
        node = new AttackNode(nodeId, undefined, nodeName);
        break;
      case NodeType.DEFENSE:
        counters.defense++;
        nodeName = `D${counters.defense}`; // D1, D2, etc.
        node = new DefenseNode(nodeId, undefined, nodeName);
        break;
      case NodeType.ENERGY:
        counters.energy++;
        nodeName = `E${counters.energy}`; // E1, E2, etc.
        node = new EnergyNode(nodeId, undefined, nodeName);
        break;
      default:
        throw new Error('Tipo de nodo especial desconocido.');
    }
    // Inicializar energyPool con energyAddition (debe hacerse después del constructor)
    node.addEnergy(node.energyAddition);
    return node;
  }
}
