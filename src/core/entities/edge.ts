import type { EnergyPacket } from '@/core/entities/energy-packets';
import type { Node } from '@/core/entities/node/node';
import type { ID } from '@/core/types/common';

export class Edge {
  private _id: ID;
  private _length: number;

  private _nodes: [Node, Node];

  private _energyPackets: EnergyPacket[];

  constructor(id: ID, nodes: [Node, Node], length: number) {
    this._length = length;
    this._id = id;
    this._nodes = nodes;
    this._energyPackets = [];
  }

  get id(): ID {
    return this._id;
  }

  get length(): number {
    return this._length;
  }

  get endpoints(): [Node, Node] {
    return this._nodes;
  }

  get energyPackets(): EnergyPacket[] {
    return this._energyPackets;
  }

  addEnergyPacket(packet: EnergyPacket): void {
    this._energyPackets.push(packet);
  }

  removeEnergyPacket(packet: EnergyPacket): void {
    const index = this._energyPackets.indexOf(packet);
    if (index !== -1) {
      this._energyPackets.splice(index, 1);
    }
    else {
      throw new Error('Energy packet not found on this edge.');
    }
  }

  clearEnergyPackets(): void {
    this._energyPackets = [];
  }

  flipSide(node: Node): Node {
    if (this._nodes[0].equals(node)) {
      return this._nodes[1];
    }
    else if (this._nodes[1].equals(node)) {
      return this._nodes[0];
    }
    throw new Error('The provided node is not an endpoint of this edge.');
  };

  hasNode(node: Node): boolean {
    return this._nodes[0].equals(node) || this._nodes[1].equals(node);
  }

  equals(edge: Edge): boolean {
    return this._id === edge._id;
  }
}
