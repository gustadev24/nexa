// node.ts
import type { Edge } from '@/core/entities/edge';
import type { Player } from '@/core/entities/player';
import type { ID, Position } from '@/core/types/common';
import { NodeType } from '@/core/types/common';
import type { NodeProperties } from '@/core/types/node.types';

/**
 * Clase abstracta base para todos los tipos de nodos
 * Implementa la lógica común de gestión de energía
 */
export abstract class Node {
  protected _id: ID;
  protected _type: NodeType;
  protected _position: Position;
  protected _owner: Player | null;
  protected _energyPool: number;
  protected _edges: Set<Edge>;
  protected _edgeAssignments: Map<Edge, number>;
  protected _isInitialNode: boolean;

  // Propiedades específicas por tipo de nodo (abstract)
  protected abstract readonly properties: NodeProperties;

  constructor(id: ID, type: NodeType, position: Position, initialEnergy: number = 0) {
    this._id = id;
    this._type = type;
    this._position = position;
    this._owner = null;
    this._energyPool = initialEnergy;
    this._edges = new Set();
    this._edgeAssignments = new Map();
    this._isInitialNode = false;
  }

  // Getters
  get id(): ID { return this._id; }
  get type(): NodeType { return this._type; }
  get position(): Position { return this._position; }
  get owner(): Player | null { return this._owner; }
  get energyPool(): number { return this._energyPool; }
  get currentEnergy(): number { return this._energyPool; } // Alias para compatibilidad
  get edges(): ReadonlySet<Edge> { return this._edges; }
  get isInitialNode(): boolean { return this._isInitialNode; }
  
  // Properties getters
  get attackInterval(): number { return this.properties.attackInterval; }
  get defenseInterval(): number { return this.properties.defenseInterval; }
  get attackMultiplier(): number { return this.properties.attackMultiplier; }
  get defenseMultiplier(): number { return this.properties.defenseMultiplier; }
  get energyBonus(): number { return this.properties.energyBonus; }

  /**
   * Calcula la energía de defensa efectiva
   * (Energía en pool - energía asignada) * multiplicador de defensa
   */
  getDefenseEnergy(): number {
    const assignedEnergy = this.getTotalAssignedEnergy();
    const availableDefense = Math.max(0, this._energyPool - assignedEnergy);
    return availableDefense * this.defenseMultiplier;
  }

  /**
   * Obtiene la energía de ataque para una arista específica
   * Aplica el multiplicador de ataque del nodo
   */
  getAttackEnergy(edge: Edge): number {
    const baseEnergy = this._edgeAssignments.get(edge) ?? 0;
    return baseEnergy * this.attackMultiplier;
  }

  /**
   * Calcula el total de energía asignada a todas las aristas
   */
  getTotalAssignedEnergy(): number {
    let total = 0;
    for (const energy of this._edgeAssignments.values()) {
      total += energy;
    }
    return total;
  }

  /**
   * Obtiene la energía disponible para asignar
   */
  getAvailableEnergy(): number {
    return Math.max(0, this._energyPool - this.getTotalAssignedEnergy());
  }

  // Estado
  isNeutral(): boolean { return this._owner === null; }
  hasEdge(edge: Edge): boolean { return this._edges.has(edge); }
  isOwnedBy(player: Player): boolean { return this._owner === player; }

  // Modificadores
  setOwner(player: Player | null): void { this._owner = player; }
  setAsInitialNode(): void { this._isInitialNode = true; }
  
  addEdge(edge: Edge): void { 
    this._edges.add(edge); 
  }

  removeEdge(edge: Edge): void {
    this._edges.delete(edge);
    this._edgeAssignments.delete(edge);
  }

  /**
   * Agrega energía al pool del nodo
   */
  addEnergy(amount: number): void {
    if (amount < 0) throw new Error('Amount must be positive.');
    this._energyPool += amount;
  }

  /**
   * Alias para addEnergy (compatibilidad)
   */
  increaseEnergy(amount: number): void {
    this.addEnergy(amount);
  }

  /**
   * Remueve energía del pool del nodo
   */
  removeEnergy(amount: number): void {
    if (amount < 0) throw new Error('Amount must be positive.');
    this._energyPool = Math.max(0, this._energyPool - amount);
  }

  /**
   * Establece la energía del nodo a un valor específico
   */
  setEnergy(amount: number): void {
    if (amount < 0) throw new Error('Energy cannot be negative.');
    this._energyPool = amount;
  }

  /**
   * Asigna energía a una arista para ataque
   */
  assignEnergyToEdge(edge: Edge, amount: number): boolean {
    if (!this.hasEdge(edge)) {
      throw new Error('Edge not connected to this node.');
    }
    
    const available = this.getAvailableEnergy();
    if (amount > available) {
      return false; // No hay suficiente energía disponible
    }
    
    const current = this._edgeAssignments.get(edge) ?? 0;
    this._edgeAssignments.set(edge, current + amount);
    return true;
  }

  /**
   * Remueve asignación de energía de una arista
   */
  removeEnergyFromEdge(edge: Edge, amount: number): void {
    if (!this.hasEdge(edge)) {
      throw new Error('Edge not connected to this node.');
    }
    const current = this._edgeAssignments.get(edge) ?? 0;
    this._edgeAssignments.set(edge, Math.max(0, current - amount));
  }

  /**
   * Alias para removeEnergyFromEdge
   */
  unassignEnergyFromEdge(edge: Edge, amount: number): void {
    this.removeEnergyFromEdge(edge, amount);
  }

  /**
   * Obtiene la energía asignada a una arista específica
   */
  getAssignedEnergy(edge: Edge): number {
    return this._edgeAssignments.get(edge) ?? 0;
  }

  /**
   * Alias para getAssignedEnergy
   */
  getEdgeAssignment(edge: Edge): number {
    return this.getAssignedEnergy(edge);
  }

  /**
   * Limpia todas las asignaciones de energía
   */
  clearAssignments(): void {
    this._edgeAssignments.clear();
  }

  /**
   * Recibe un ataque y calcula el resultado
   * @returns true si el nodo fue capturado
   */
  receiveAttack(attackEnergy: number, attacker: Player): boolean {
    const defense = this.getDefenseEnergy();
    
    if (attackEnergy > defense) {
      // Nodo capturado
      const remaining = attackEnergy - defense;
      this._owner = attacker;
      this._energyPool = remaining;
      this.clearAssignments();
      return true;
    } else if (attackEnergy === defense) {
      // Nodo neutralizado
      this._owner = null;
      this._energyPool = 0;
      this.clearAssignments();
      return false;
    } else {
      // Ataque repelido
      const damageToDefense = attackEnergy / this.defenseMultiplier;
      this.removeEnergy(damageToDefense);
      return false;
    }
  }

  equals(other: Node): boolean {
    return this._id === other._id;
  }

  toString(): string {
    return `${this.type}Node(${this._id})`;
  }
}
