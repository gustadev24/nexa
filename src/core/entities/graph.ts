import type { Edge } from '@/core/entities/edge';
import type { Node } from '@/core/entities/node/node';

export class Graph {
  constructor(
    public readonly nodes: Set<Node>,
    public readonly edges: Set<Edge>,
  ) {}

  reset(): void {
    this.nodes.forEach((node) => {
      node.setOwner(null);
      node.clearAssignments();
    });
    this.edges.forEach(edge => edge.clearEnergyPackets());
  }
}
