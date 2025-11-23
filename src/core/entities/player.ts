import type { Node } from '@/core/entities/node/node';
import type { Color, ID } from '@/core/types/common';
import { PlayerType } from '@/core/types/common';
import { type PlayerConfig, type PlayerStats } from '@/core/types/player';

/**
 * Representa un jugador en el juego
 * Gestiona energía total, nodos controlados y estado del jugador
 */
export class Player {
  // Identificación
  private _id: ID;
  private _username: string;
  private _color: Color;
  private _type: PlayerType;

  // Estado del jugador
  private _isInGame: boolean;
  private _isEliminated: boolean;

  // Recursos y control territorial
  private _totalEnergy: number;
  private _initialNode: Node | null;
  private _controlledNodes: Set<Node>;

  // Temporizador de dominancia
  private _dominanceTimer: number;
  private _isDominant: boolean;

  constructor(config: PlayerConfig) {
    this._id = config.id;
    this._username = config.username;
    this._color = config.color;
    this._type = config.type;
    this._isInGame = false;
    this._isEliminated = false;
    this._totalEnergy = 0;
    this._initialNode = null;
    this._controlledNodes = new Set();
    this._dominanceTimer = 0;
    this._isDominant = false;
  }

  // Getters
  get id(): ID { return this._id; }
  get username(): string { return this._username; }
  get color(): Color { return this._color; }
  get type(): PlayerType { return this._type; }
  get isInGame(): boolean { return this._isInGame; }
  get isEliminated(): boolean { return this._isEliminated; }
  get totalEnergy(): number { return this._totalEnergy; }
  get initialNode(): Node | null { return this._initialNode; }
  get controlledNodes(): ReadonlySet<Node> { return this._controlledNodes; }
  get controlledNodeCount(): number { return this._controlledNodes.size; }
  get dominanceTimer(): number { return this._dominanceTimer; }
  get isDominant(): boolean { return this._isDominant; }

  /**
   * Obtiene estadísticas del jugador
   */
  getStats(): PlayerStats {
    let energyInNodes = 0;
    let energyInTransit = 0;

    for (const node of this._controlledNodes) {
      energyInNodes += node.energyPool;
    }

    // La energía en tránsito se calculará desde el GameManager
    // Por ahora es la diferencia
    energyInTransit = Math.max(0, this._totalEnergy - energyInNodes);

    return {
      totalEnergy: this._totalEnergy,
      nodesControlled: this._controlledNodes.size,
      energyInNodes,
      energyInTransit,
    };
  }

  /**
   * Establece el nodo inicial del jugador
   */
  setInitialNode(node: Node): void {
    this._initialNode = node;
    node.setAsInitialNode();
    this.captureNode(node);
  }

  setInGame(value: boolean): void {
    this._isInGame = value;
  }

  /**
   * Resetea el estado del jugador
   */
  reset(): void {
    this._initialNode = null;
    this._controlledNodes.clear();
    this._totalEnergy = 0;
    this._isInGame = false;
    this._isEliminated = false;
    this._dominanceTimer = 0;
    this._isDominant = false;
  }

  /**
   * Verifica si el jugador posee un nodo
   */
  ownsNode(node: Node): boolean {
    return this._controlledNodes.has(node);
  }

  /**
   * Captura un nodo
   * Agrega el bonus de energía si el nodo lo otorga
   */
  captureNode(node: Node): void {
    if (!this.isInGame) {
      throw new Error('Player is not in a game.');
    }
    if (this.ownsNode(node)) {
      return; // Ya lo controla
    }
    
    this._controlledNodes.add(node);
    node.setOwner(this);
    
    // Agregar bonus de energía si el nodo lo otorga
    if (node.energyBonus > 0) {
      this.increaseEnergy(node.energyBonus);
    }
  }

  /**
   * Pierde un nodo
   * Si es el nodo inicial, el jugador es eliminado
   */
  loseNode(node: Node): void {
    if (!this.isInGame) {
      throw new Error('Player is not in a game.');
    }
    if (!this.ownsNode(node)) {
      return; // No lo controla
    }

    this._controlledNodes.delete(node);

    // Si pierde el nodo inicial, es eliminado
    if (node === this._initialNode) {
      this.eliminate();
    }
  }

  /**
   * Aumenta la energía total
   */
  increaseEnergy(amount: number): void {
    if (amount < 0) {
      throw new Error('Amount must be positive.');
    }
    this._totalEnergy += amount;
  }

  /**
   * Disminuye la energía total
   */
  decreaseEnergy(amount: number): void {
    if (amount < 0) {
      throw new Error('Amount must be positive.');
    }
    if (amount > this._totalEnergy) {
      throw new Error('Insufficient energy.');
    }
    this._totalEnergy -= amount;
  }

  /**
   * Actualiza el temporizador de dominancia
   */
  updateDominanceTimer(deltaMs: number): void {
    if (this._isDominant) {
      this._dominanceTimer += deltaMs;
    }
  }

  /**
   * Inicia el temporizador de dominancia
   */
  startDominance(): void {
    this._isDominant = true;
    this._dominanceTimer = 0;
  }

  /**
   * Detiene el temporizador de dominancia
   */
  stopDominance(): void {
    this._isDominant = false;
    this._dominanceTimer = 0;
  }

  /**
   * Elimina al jugador del juego
   * Todos sus nodos pasan a neutros
   */
  eliminate(): void {
    this._isEliminated = true;
    
    // Neutralizar todos los nodos controlados
    for (const node of this._controlledNodes) {
      node.setOwner(null);
      node.clearAssignments();
    }
    
    this._controlledNodes.clear();
  }

  equals(other: Player): boolean {
    return this._id === other._id;
  }
}
