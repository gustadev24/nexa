import { Edge } from '@/core/entities/edge';
import { Graph } from '@/core/entities/graph';
import { AttackNode } from '@/core/entities/node/attack';
import { BasicNode } from '@/core/entities/node/basic';
import { DefenseNode } from '@/core/entities/node/defense';
import { EnergyNode } from '@/core/entities/node/energy';
import type { Node } from '@/core/entities/node/node';

import type { Loggeable } from '@/application/interfaces/logging/loggeable';
import type { Logger } from '@/application/interfaces/logging/logger';
import { NodeType } from '@/core/types/node-type';
import type { LayoutStrategy } from '@/application/strategies/layout/layout-strategy';
import type { Position } from '@/application/interfaces/types/position';
import type { IdGeneratorStrategy } from '@/application/strategies/id-generator/id-generator-strategy';
import { VISUAL_CONSTANTS } from '@/application/constants/visual-constants';

export class GraphService implements Loggeable {
  _logContext = 'GraphService';

  private _graph: Graph;
  private _nodesPositionMap = new Map<Node, Position>();

  constructor(
    private idGenerator: IdGeneratorStrategy,
    private layoutStrategy: LayoutStrategy,
    private log: Logger,
  ) { }

  get graph(): Graph {
    // Warning: Puede ser null si no se ha generado aún
    return this._graph;
  }

  get nodesPositionMap(): Map<Node, Position> {
    return this._nodesPositionMap;
  }

  // Este método genera un grafo con el número de nodos deseado. 2/3 de los nodos deben ser básicos, y el resto de tipos especiales distribuidos aleatoriamente. El número de aristas es el doble del número de nodos, las conexiones son aleatorias, la única condición es que el grafo debe ser conexo.
  generateRandomGraph(nodeCount: number): void {
    this._graph = new Graph(this.idGenerator.generate(), nodeCount);
    this._nodesPositionMap.clear();
    // 1. Obtener posiciones
    const positions = this.layoutStrategy.generatePositions(nodeCount);
    // 2. Crear nodos básicos y especiales
    const basicNodeCount = this.computeBasicNodeCount(nodeCount);
    const specialNodeCount = nodeCount - basicNodeCount;
    const nodes = this.createNodes(basicNodeCount, specialNodeCount);

    // 3. Asignar posiciones a nodos
    nodes.forEach((node, index) => {
      this._nodesPositionMap.set(node, positions[index]);
    });

    // 5. Añadir aristas aleatorias asegurando conectividad
    const edgeCount = nodeCount * 2;
    this.createRandomEdges(edgeCount);
  }

  private computeBasicNodeCount(totalCount: number): number {
    return Math.floor((2 * totalCount) / 3);
  }

  private createNodes(basicNodeCount: number, specialNodeCount: number): Node[] {
    const nodes: Node[] = [
      ...this.createBasicNodes(basicNodeCount),
      ...this.createSpecialNodes(specialNodeCount),
    ];
    return nodes;
  }

  private createBasicNodes(count: number): Node[] {
    if (!this.graph) {
      throw new Error('Graph is not initialized.');
    }
    const nodes: Node[] = [];
    for (let i = 0; i < count; i++) {
      const nodeId = this.idGenerator.generate();
      const nodeName = `N${i + 1}`; // N1, N2, N3, etc.
      // Crear nodo básico y registrarlo en el grafo
      const basicNode = new BasicNode(nodeId, undefined, nodeName);
      // Inicializar energyPool con energyAddition (debe hacerse después del constructor)
      basicNode.addEnergy(basicNode.energyAddition);
      this.graph.registerNode(basicNode);
      nodes.push(basicNode);
    }
    return nodes;
  }

  private createSpecialNodes(count: number): Node[] {
    if (!this.graph) {
      throw new Error('Graph is not initialized.');
    }
    const counters = { attack: 0, defense: 0, energy: 0 };
    const nodes: Node[] = [];
    for (let i = 0; i < count; i++) {
      // Crear nodo especial aleatorio y registrarlo en el grafo
      const specialNode = this.generateRandomSpecialNode(counters);
      this.graph.registerNode(specialNode);
      nodes.push(specialNode);
    }
    return nodes;
  }

  private createRandomEdges(edgeCount: number): void {
    if (!this.graph) {
      throw new Error('Graph is not initialized.');
    }
    const nodesArray = Array.from(this.graph.nodes);
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
      const edge = this.createEdge(fromNode, toNode);
      this.graph.registerEdge(edge, fromNode, toNode);
    }
    // Añadir aristas adicionales aleatorias hasta alcanzar edgeCount
    while (this.graph.edges.size < edgeCount) {
      const fromNode = nodesArray[Math.floor(Math.random() * nodeCount)];
      const toNode = nodesArray[Math.floor(Math.random() * nodeCount)];
      // Evitar bucles y aristas duplicadas
      if (fromNode.id !== toNode.id && !this.graph.hasEdgeBetween(fromNode, toNode)) {
        const edge = this.createEdge(fromNode, toNode);
        this.graph.registerEdge(edge, fromNode, toNode);
      }
    }
  }

  private createEdge(from: Node, to: Node): Edge {
    const posA = this._nodesPositionMap.get(from);
    const posB = this._nodesPositionMap.get(to);

    // CÁLCULO INMEDIATO: Si tenemos posiciones, calculamos la distancia real
    let distance = 1; // Valor default
    if (posA && posB) {
      const pixelDistance = this.layoutStrategy.calculateDistance(posA, posB);
      const borderToBorderPixels = pixelDistance - (2 * VISUAL_CONSTANTS.NODE_RADIUS);
      distance = Math.max(1, borderToBorderPixels / VISUAL_CONSTANTS.NORMALIZATION);
    }

    const edgeId = this.idGenerator.generate();
    // ¡La arista nace con la distancia correcta!
    return new Edge(edgeId, [from, to], distance);
  };

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
