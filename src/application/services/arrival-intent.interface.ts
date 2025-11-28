import type { EnergyPacket } from '@/core/entities/energy-packet';
import type { Node } from '@/core/entities/node/node';
import type { Player } from '@/core/entities/player';
import { ArrivalOutcome } from '@/application/services/arrival-result.interface';

/**
 * Representa la intención de lo que debe ocurrir tras la llegada de un paquete de energía a un nodo,
 * sin ejecutar directamente las mutaciones.
 *
 * `CollisionService` generará esta intención, y `TickService` la ejecutará,
 * delegando en `CaptureService` si es necesario.
 */
export interface ArrivalIntent {
  outcome: ArrivalOutcome;
  node: Node;
  packet: EnergyPacket;
  attacker: Player;
  previousOwner: Player | null; // El propietario del nodo ANTES de esta llegada
  energyAmount: number; // La cantidad de energía del paquete que llega
  energyIntegrated?: number; // Cuánta energía se integraría al nodo (ej: en llegada amistosa)
  returnPacket?: EnergyPacket; // Paquete de retorno si la energía es derrotada
  clearNodeAssignments?: boolean; // Si las asignaciones del nodo deben limpiarse (ej: neutralización)
}