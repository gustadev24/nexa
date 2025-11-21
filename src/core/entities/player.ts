import type { Node } from '@/core/entities/node/node';
import type { Color, ID } from '@/core/types/common';
import { type PlayerConfig } from '@/core/types/player';

export class Player {
  // Identificación
  private _id: ID;

  // De configuración
  private _color: Color;
  private _username: string;

  // Posibles subtipos
  // private readonly _type: PlayerType;

  // Estado del jugador en la aplicación
  private _isInGame: boolean;
  private _isEliminated: boolean;

  // Atributo del jugador en una partida
  private _totalEnergy: number;
  private _initialNode: Node | null;
  private _controlledNodes: Set<Node>;

  constructor(config: PlayerConfig) {
    this._id = config.id;
    this._username = config.username;
    this._color = config.color;
    this._isInGame = false;
    this._isEliminated = false;
    this._totalEnergy = 0;
    this._controlledNodes = new Set();
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

  // get type(): PlayerType {
  //   return this._type;
  // }

  get isInGame(): boolean {
    return this._isInGame;
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

  get controlledNodes(): ReadonlySet<Node> {
    return this._controlledNodes;
  }

  get controlledNodeCount(): number {
    return this._controlledNodes.size;
  }

  setInitialNode(node: Node): void {
    this._initialNode = node;
  }

  setInGame(value: boolean): void {
    this._isInGame = value;
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
    if (this.ownsNode(node)) {
      throw new Error('Player already controls this node.');
    }
    this._controlledNodes.add(node);
  }

  loseNode(node: Node) {
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
  }

  equals(other: Player): boolean {
    return this._id === other._id;
  }
}
