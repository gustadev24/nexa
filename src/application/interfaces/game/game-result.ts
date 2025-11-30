import type { GameResultReason } from '@/application/interfaces/game/game-result-reason';
import type { Player } from '@/core/entities/player';

/**
 * Resultado final de una partida
 * @deprecated Usar VictoryResult en su lugar
 */
export interface GameResult {
  winner: Player | null;
  reason: GameResultReason;
}
