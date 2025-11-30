import type { Node } from '@/core/entities/node/node';
import type { Player } from '@/core/entities/player';
import type { EnergyPacket } from '@/core/entities/energy-packet';
import type { ArrivalOutcome } from '@/application/interfaces/arrival/arrival-outcome';

export interface ArrivalResult {
  outcome: ArrivalOutcome;
  node: Node;
  packet: EnergyPacket;
  capturedBy?: Player;
  previousOwner?: Player; // Added this field
  energyIntegrated?: number;
  energyLost?: number;
  returnPacket?: EnergyPacket;
}
