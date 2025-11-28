import type { EnergyPacket } from '@/core/entities/energy-packet';
import type { Node } from '@/core/entities/node/node';
import type { ID } from '@/core/types/id';

export class Edge {
  private _id: ID;
  private _length: number;

  private _nodes: [Node, Node];

  private _transitEnergy: EnergyPacket[];

  constructor(id: ID, nodes: [Node, Node], length: number) {
    this._length = length;
    this._id = id;
    this._nodes = nodes;
    this._transitEnergy = [];
  }

  get id(): ID {
    return this._id;
  }

  get length(): number {
    return this._length;
  }

  set length(value: number) {
    if (value <= 0) {
      throw new Error('Edge length must be positive.');
    }
    this._length = value;
  }

  get endpoints(): [Node, Node] {
    return this._nodes;
  }

  get transitEnergy(): EnergyPacket[] {
    return this._transitEnergy;
  }

  get energyPackets(): EnergyPacket[] {
    return this._transitEnergy;
  }

  addEnergyPacket(packet: EnergyPacket): void {
    this._transitEnergy.push(packet);
  }

  removeEnergyPacket(packet: EnergyPacket): void {
    const index = this._transitEnergy.indexOf(packet);
    if (index !== -1) {
      this._transitEnergy.splice(index, 1);
    }
    else {
      throw new Error('EnergyPacket packet not found on this edge.');
    }
  }

  clearEnergyPackets(): void {
    this._transitEnergy = [];
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
