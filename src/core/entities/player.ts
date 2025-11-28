import type { Node } from '@/core/entities/node/node';
import type { Color } from '@/core/types/color';
import type { ID } from '@/core/types/id';

export class Player {
  // Identificación
  private _id: ID;

  // De configuración
  private _color: Color;
  private _username: string;

  // Estado del jugador en la aplicación
  private _isInGame = false;
  private _isEliminated = false;

  // Atributo del jugador en una partida
  private _totalEnergy = 0;
  private _initialNode: Node | null;
  private _controlledNodes = new Set<Node>();

  constructor(
    id: ID,
    username: string,
    color: Color,
  ) {
    this._id = id;
    this._username = username;
    this._color = color;
  }

  get id(): ID {
    return this._id;
  }

  get username(): string {
    return this._username;
  }

  get color(): Color {
    return this._color;
  }

  get isInGame(): boolean {
    return this._isInGame;
  }

  set isInGame(value: boolean) {
    this._isInGame = value;
  }

  get isEliminated(): boolean {
    return this._isEliminated;
  }

  get totalEnergy(): number {
    return this._totalEnergy;
  }

  get initialNode(): Node | null {
    return this._initialNode;
  }

  set initialNode(node: Node) {
    if (!this.isInGame) {
      throw new Error('Player is not in a game.');
    }
    if (this._controlledNodes.size > 0) {
      throw new Error('Initial node can only be set at the start of the game.');
    }
    this._initialNode = node;
    this._controlledNodes.add(node);
  }

  get controlledNodes(): ReadonlySet<Node> {
    return this._controlledNodes;
  }

  get controlledNodeCount(): number {
    return this._controlledNodes.size;
  }

  prepareForGame(): void {
    this._initialNode = null;
    this._controlledNodes.clear();
    this._totalEnergy = 0;
    this._isInGame = true;
    this._isEliminated = false;
  }

  reset(): void {
    this._initialNode = null;
    this._controlledNodes.clear();
    this._totalEnergy = 0;
    this._isInGame = false;
    this._isEliminated = false;
  }

  ownsNode(node: Node): boolean {
    return this._controlledNodes.has(node);
  }

  captureNode(node: Node) {
    if (!this.isInGame) {
      throw new Error('Player is not in a game.');
    }
    if (!this.initialNode) {
      throw new Error('Initial node must be set before capturing nodes.');
    }
    if (this.ownsNode(node)) {
      throw new Error('Player already controls this node.');
    }
    this._controlledNodes.add(node);
  }

  releaseNode(node: Node) {
    if (!this.isInGame) {
      throw new Error('Player is not in a game.');
    }
    if (!this.ownsNode(node)) {
      throw new Error('Player does not control this node.');
    }

    this._controlledNodes.delete(node);

    if (node === this._initialNode) {
      this.eliminate();
    }
  }

  increaseEnergy(amount: number) {
    if (amount < 0) {
      throw new Error('Amount must be positive.');
    }
    this._totalEnergy += amount;
  }

  decreaseEnergy(amount: number) {
    if (amount < 0) {
      throw new Error('Amount must be positive.');
    }
    if (amount > this._totalEnergy) {
      throw new Error('Insufficient energy.');
    }
    this._totalEnergy -= amount;
  }

  eliminate() {
    this._isEliminated = true;
    this._controlledNodes.clear();
  }

  equals(other: Player): boolean {
    return this._id === other._id;
  }
}
