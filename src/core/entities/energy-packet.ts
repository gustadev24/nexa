import type { Node } from '@/core/entities/node/node';
import type { Player } from '@/core/entities/player';

export class EnergyPacket {
  private readonly _owner: Player;
  private readonly _amount: number;
  private readonly _origin: Node;
  private readonly _target: Node;
  private _progress: number; // 0 = en origin, 1 = en target
  private readonly _isTransfer: boolean; // true si es transferencia entre aliados, false si es ataque

  constructor(owner: Player, amount: number, origin: Node, target: Node, isTransfer = false) {
    this._owner = owner;
    this._amount = amount;
    this._origin = origin;
    this._target = target;
    this._progress = 0;
    this._isTransfer = isTransfer;
  }

  get owner(): Player { return this._owner; }
  get amount(): number { return this._amount; }
  get origin(): Node { return this._origin; }
  get target(): Node { return this._target; }
  get progress(): number { return this._progress; }
  get isTransfer(): boolean { return this._isTransfer; }

  advance(delta: number, edgeLength: number, speed: number): void {
    const progressDelta = (speed * delta) / edgeLength;
    this._progress = Math.min(1, this._progress + progressDelta);
  }

  hasArrived(): boolean {
    return this._progress >= 1;
  }

  // Verifica si van en sentidos opuestos
  isOppositeDirection(other: EnergyPacket): boolean {
    return this._origin.equals(other._target) && this._target.equals(other._origin);
  }

  // Verifica si están en la misma posición (aproximadamente)
  isAtSamePosition(other: EnergyPacket, threshold = 0.01): boolean {
    // Si van en direcciones opuestas, calcular si se cruzaron
    if (this.isOppositeDirection(other)) {
      return this._progress + other._progress >= 1;
    }
    // Si van en la misma dirección
    return Math.abs(this._progress - other._progress) < threshold;
  }

  sameOwner(other: EnergyPacket): boolean {
    return this._owner.equals(other._owner);
  }

  // Crear paquete reducido después de colisión
  withReducedAmount(reduction: number): EnergyPacket | null {
    const newAmount = this._amount - reduction;
    if (newAmount <= 0) return null;

    const packet = new EnergyPacket(
      this._owner,
      newAmount,
      this._origin,
      this._target,
      this._isTransfer,
    );
    packet._progress = this._progress;
    return packet;
  }

  reverse(): EnergyPacket {
    const packet = new EnergyPacket(
      this._owner,
      this._amount,
      this._target, // Ahora es origen
      this._origin, // Ahora es destino
      this._isTransfer,
    );
    packet._progress = 1 - this._progress;
    return packet;
  }
}
