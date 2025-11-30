import type { WasteWarning } from '@/application/interfaces/collision/waste-warning';
import type { EnergyPacket } from '@/core/entities/energy-packet';

export interface CollisionResult {
  packetsDestroyed: EnergyPacket[];
  packetsSurvived: EnergyPacket[];
  wasteWarnings: WasteWarning[];
}
