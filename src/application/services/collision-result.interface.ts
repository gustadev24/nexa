import type { EnergyPacket } from '@/core/entities/energy-packets';
import type { Player } from '@/core/entities/player';
import type { Edge } from '@/core/entities/edge';

export interface CollisionResult {
  packetsDestroyed: EnergyPacket[];
  packetsSurvived: EnergyPacket[];
  wasteWarnings: WasteWarning[];
}

export interface WasteWarning {
  player: Player;
  edge: Edge;
  amountLost: number;
}
