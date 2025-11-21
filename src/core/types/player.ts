import type { Color, ID } from '@/core/types/common';

// La implementación de subtipos puede ser una opción  si es necesaria
// export const PlayerType = {
//   HUMAN: 'HUMAN',
//   AI: 'AI',
// } as const;

// export type PlayerType = typeof PlayerType[keyof typeof PlayerType];

export interface PlayerConfig {
  id: ID;
  username: string;
  color: Color;
}
