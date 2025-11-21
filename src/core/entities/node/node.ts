// node.ts
import type { Edge } from '@/core/entities/edge';
import type { Player } from '@/core/entities/player';
import type { ID } from '@/core/types/common';

export abstract class Node {
  protected _id: ID;
  protected _owner: Player | null;
  protected _energyPool: number;
  protected _edges: Set<Edge>;
  protected _edgeAssignments: Map<Edge, number>;

  // Comportamiento específico por tipo de nodo
  protected abstract readonly _attackInterval: number;
  protected abstract readonly _defenseInterval: number;
  protected abstract readonly _attackMultiplier: number;
  protected abstract readonly _defenseMultiplier: number;
  protected abstract readonly _energyAddition: number;

  constructor(id: ID) {
    this._id = id;
    this._owner = null;
    this._energyPool = 0;
    this._edges = new Set();
    this._edgeAssignments = new Map();
  }

  // Getters
  get id(): ID { return this._id; }
  get owner(): Player | null { return this._owner; }
  get energyAddition(): number { return this._energyAddition; }
  get energyPool(): number { return this._energyPool; }
  get attackInterval(): number { return this._attackInterval; }
  get defenseInterval(): number { return this._defenseInterval; }
  get attackMultiplier(): number { return this._attackMultiplier; }
  get defenseMultiplier(): number { return this._defenseMultiplier; }
  get edges(): ReadonlySet<Edge> { return this._edges; }

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
  hasEdge(edge: Edge): boolean { return this._edges.has(edge); }

  // Modificadores
  setOwner(player: Player | null): void { this._owner = player; }
  addEdge(edge: Edge): void { this._edges.add(edge); }

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

  clearAssignments(): void {
    this._edgeAssignments.clear();
  }

  equals(other: Node): boolean {
    return this._id === other._id;
  }
}
