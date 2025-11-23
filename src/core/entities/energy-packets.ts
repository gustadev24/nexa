import type { Node } from './node/node';
import type { Player } from './player';
import type { ID } from '../types/common';
import type { EnergyPacketData } from '../types/edge.types';

/**
 * Paquete de energía que viaja por una arista
 * Representa energía en tránsito entre nodos durante los ciclos de ataque
 */
export class EnergyPacket {
  private _id: ID;
  private _owner: Player;
  private _amount: number;
  private readonly _origin: Node;
  private readonly _target: Node;
  private _edgeId: ID;
  private _progress: number; // 0 to 1
  private _ticksRemaining: number;
  private _totalTicks: number;

  constructor(data: EnergyPacketData) {
    this._id = data.id;
    this._owner = data.owner;
    this._amount = data.amount;
    this._origin = data.source;
    this._target = data.target;
    this._edgeId = data.edge;
    this._ticksRemaining = data.ticksRemaining;
    this._totalTicks = data.ticksRemaining;
    this._progress = data.progress;
  }

  get id(): ID { return this._id; }
  get owner(): Player { return this._owner; }
  get amount(): number { return this._amount; }
  get origin(): Node { return this._origin; }
  get target(): Node { return this._target; }
  get edgeId(): ID { return this._edgeId; }
  get progress(): number { return this._progress; }
  get ticksRemaining(): number { return this._ticksRemaining; }

  /**
   * Actualiza el progreso del paquete en cada tick de ataque (20ms)
   * @returns true si llegó al destino
   */
  update(): boolean {
    if (this._ticksRemaining <= 0) {
      return true; // Ya llegó
    }

    this._ticksRemaining--;
    this._progress = 1 - (this._ticksRemaining / this._totalTicks);
    
    return this._ticksRemaining === 0;
  }

  /**
   * Reduce la cantidad de energía del paquete (por colisión)
   */
  reduceAmount(reduction: number): void {
    this._amount = Math.max(0, this._amount - reduction);
  }

  /**
   * Verifica si el paquete está destruido
   */
  isDestroyed(): boolean {
    return this._amount <= 0;
  }

  /**
   * Verifica si van en sentidos opuestos
   */
  isOppositeDirection(other: EnergyPacket): boolean {
    return this._origin.equals(other._target) && this._target.equals(other._origin);
  }

  /**
   * Verifica si pertenecen al mismo jugador
   */
  sameOwner(other: EnergyPacket): boolean {
    return this._owner.equals(other._owner);
  }

  /**
   * Verifica si están en la misma arista
   */
  sameEdge(other: EnergyPacket): boolean {
    return this._edgeId === other._edgeId;
  }

  /**
   * Verifica si están en posición de colisión (threshold configurable)
   */
  isAtSamePosition(other: EnergyPacket, threshold = 0.05): boolean {
    if (!this.sameEdge(other)) return false;
    
    // Si van en direcciones opuestas, calcular si se cruzaron
    if (this.isOppositeDirection(other)) {
      // Se cruzan cuando la suma de progresos >= 1
      return this._progress + other._progress >= 1 - threshold;
    }
    
    // Si van en la misma dirección
    return Math.abs(this._progress - other._progress) < threshold;
  }

  /**
   * Invierte la dirección del paquete (para aliados que regresan)
   */
  reverse(): EnergyPacket {
    const data: EnergyPacketData = {
      id: `${this._id}_reversed`,
      owner: this._owner,
      amount: this._amount,
      source: this._target, // Ahora es origen
      target: this._origin, // Ahora es destino
      edge: this._edgeId,
      progress: 1 - this._progress,
      ticksRemaining: Math.ceil(this._totalTicks * (1 - this._progress)),
    };
    
    return new EnergyPacket(data);
  }

  /**
   * Verifica si ha llegado al destino
   */
  hasArrived(): boolean {
    return this._progress >= 1 || this._ticksRemaining <= 0;
  }

  /**
   * Serializa el paquete a datos
   */
  toData(): EnergyPacketData {
    return {
      id: this._id,
      owner: this._owner,
      amount: this._amount,
      source: this._origin,
      target: this._target,
      edge: this._edgeId,
      progress: this._progress,
      ticksRemaining: this._ticksRemaining,
    };
  }
}
