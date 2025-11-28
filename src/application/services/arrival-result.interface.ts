import type { Node } from '@/core/entities/node/node';
import type { Player } from '@/core/entities/player';
import type { EnergyPacket } from '@/core/entities/energy-packet';

export enum ArrivalOutcome {
  INTEGRATED = 'INTEGRATED',
  CAPTURED = 'CAPTURED',
  NEUTRALIZED = 'NEUTRALIZED',
  DEFEATED = 'DEFEATED',
}

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
