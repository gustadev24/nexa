import type { Edge } from '@/core/entities/edge';
import type { Node } from '@/core/entities/node/node';
import type { ID } from '@/core/types/common';

export class Graph {
  private _id: ID;
  private _adjacencyMatrix: (ID | null)[][]; // ID of Edges
  private _nodesToIndex = new Map<ID, number>(); // Map from Node ID to its index in the adjacency matrix

  private _nodes = new Set<Node>();
  private _edges = new Set<Edge>();

  constructor(id: ID, nodeCount: number) {
    this._id = id;
    if (nodeCount <= 0) {
      throw new Error('Graph must have at least one node.');
    }
    this._adjacencyMatrix = Array.from({ length: nodeCount }, () => new Array(nodeCount).fill(null));
  }

  get id(): ID {
    return this._id;
  }

  get nodes(): ReadonlySet<Node> {
    return this._nodes;
  }

  get edges(): ReadonlySet<Edge> {
    return this._edges;
  }

  registerNode(node: Node): void {
    if (this.hasNode(node)) {
      throw new Error('Node already exists in the graph.');
    }
    if (this.isFull()) {
      throw new Error('Graph has reached its maximum node capacity.');
    }
    this._nodes.add(node);
    this._nodesToIndex.set(node.id, this._nodes.size - 1);
  }

  registerEdge(edge: Edge, fromNode: Node, toNode: Node): void {
    const fromIndex = this.getNodeIndex(fromNode);
    const toIndex = this.getNodeIndex(toNode);
    if (fromIndex === null || toIndex === null) {
      throw new Error('Both nodes must be registered in the graph before adding an edge.');
    }
    if (this._adjacencyMatrix[fromIndex][toIndex] !== null) {
      throw new Error('An edge already exists between the specified nodes.');
    }
    this._adjacencyMatrix[fromIndex][toIndex] = edge.id;
    this._adjacencyMatrix[toIndex][fromIndex] = edge.id; // Undirected graph
    this._edges.add(edge);
  }

  reset(): void {
    this._nodes.forEach((node) => {
      node.setOwner(null);
      node.clearAssignments();
    });
    this._edges.forEach(edge => edge.clearEnergyPackets());
  }

  hasNode(node: Node): boolean {
    return this._nodes.has(node);
  }

  hasEdgeBetween(fromNode: Node, toNode: Node): boolean {
    const fromIndex = this.getNodeIndex(fromNode);
    const toIndex = this.getNodeIndex(toNode);
    if (fromIndex === null || toIndex === null) {
      return false;
    }
    return this._adjacencyMatrix[fromIndex][toIndex] !== null;
  }

  isFull(): boolean {
    return this._nodes.size >= this._adjacencyMatrix.length;
  }

  private getNodeIndex(node: Node): number | null {
    const index = this._nodesToIndex.get(node.id);
    return index !== undefined ? index : null;
  }
}
