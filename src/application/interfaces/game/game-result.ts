import type { GameResultReason } from '@/application/interfaces/game/game-result-reason';
import type { Game } from '@/core/entities/game';
import type { Player } from '@/core/entities/player';

export interface GameResult {
  winner: Player | null;
  reason: GameResultReason;
  game: Game;
}
