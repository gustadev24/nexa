// node.ts
import type { Edge } from '@/core/entities/edge';
import type { Player } from '@/core/entities/player';
import type { ID } from '@/core/types/id';
import type { NodeType } from '@/core/types/node-type';

export abstract class Node {
  // Comportamiento específico por tipo de nodo
  protected abstract readonly _attackInterval: number;
  protected abstract readonly _defenseInterval: number;
  protected abstract readonly _attackMultiplier: number;
  protected abstract readonly _defenseMultiplier: number;
  protected abstract readonly _energyAddition: number;
  protected abstract readonly _nodeType: NodeType;

  protected _id: ID;
  protected _owner: Player | null = null;
  protected _energyPool: number;
  protected _edges: Set<Edge>;
  protected _edgeAssignments = new Map<Edge, number>();

  constructor(id: ID, edges?: Set<Edge>) {
    this._id = id;
    this._energyPool = this.energyAddition;
    this._edges = edges ?? new Set();
  }

  // Getters
  get id(): ID { return this._id; }
  get owner(): Player | null { return this._owner; }
  set owner(player: Player | null) { this._owner = player; }
  get energyAddition(): number { return this._energyAddition; }
  get energyPool(): number { return this._energyPool; }
  get attackInterval(): number { return this._attackInterval; }
  get defenseInterval(): number { return this._defenseInterval; }
  get attackMultiplier(): number { return this._attackMultiplier; }
  get defenseMultiplier(): number { return this._defenseMultiplier; }
  get edges(): ReadonlySet<Edge> { return this._edges; }
  get nodeType(): NodeType { return this._nodeType; }
  get edgeAssignments(): ReadonlyMap<Edge, number> { return this._edgeAssignments; }

  // Defensa efectiva
  defenseEnergy(): number {
    let assigned = 0;
    for (const energy of this._edgeAssignments.values()) {
      assigned += energy;
    }
    return (this._energyPool - assigned) * this._defenseMultiplier;
  }

  // Energía de ataque para una arista
  getAttackEnergy(edge: Edge): number {
    const base = this._edgeAssignments.get(edge) ?? 0;
    return base * this._attackMultiplier;
  }

  // Estado
  isNeutral(): boolean { return this._owner === null; }
  hasEdge(edge: Edge): boolean {
    return this._edges.has(edge);
  }

  hasEdgeTo(node: Node): boolean {
    for (const edge of this._edges) {
      if (edge.flipSide(this).equals(node)) {
        return true;
      }
    }
    return false;
  }

  // Modificadores
  addEdge(edge: Edge): void {
    if (!edge.hasNode(this)) {
      throw new Error('Edge does not connect to this node.');
    }
    this._edges.add(edge);
  }

  addEnergy(amount: number): void {
    if (amount < 0) throw new Error('Amount must be positive.');
    this._energyPool += amount;
  }

  removeEnergy(amount: number): void {
    if (amount < 0) throw new Error('Amount must be positive.');
    this._energyPool = Math.max(0, this._energyPool - amount);
  }

  assignEnergyToEdge(edge: Edge, amount: number): void {
    if (!this.hasEdge(edge)) {
      throw new Error('Edge not connected to this node.');
    }
    const current = this._edgeAssignments.get(edge) ?? 0;
    this._edgeAssignments.set(edge, current + amount);
  }

  removeEnergyFromEdge(edge: Edge, amount: number): void {
    if (!this.hasEdge(edge)) {
      throw new Error('Edge not connected to this node.');
    }
    const current = this._edgeAssignments.get(edge) ?? 0;
    this._edgeAssignments.set(edge, Math.max(0, current - amount));
  }

  getAssignedEnergy(edge: Edge): number {
    return this._edgeAssignments.get(edge) ?? 0;
  }

  resetToNeutral(): void {
    this._owner = null;
    this._energyPool = this.energyAddition;
    this.clearAssignments();
  }

  clearAssignments(): void {
    this._edgeAssignments.clear();
  }

  equals(other: Node): boolean {
    return this._id === other._id;
  }
}
