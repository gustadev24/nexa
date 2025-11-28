import type { Game } from '@/core/entities/game';
import type { Player } from '@/core/entities/player';

export const GameResultReason = {
  ELIMINATION: 'elimination',
  DRAW: 'draw',
  VICTORY: 'victory',
} as const;

export type GameResultReason = typeof GameResultReason[keyof typeof GameResultReason];

export interface GameResult {
  winner: Player | null;
  reason: GameResultReason;
  game: Game;
}
