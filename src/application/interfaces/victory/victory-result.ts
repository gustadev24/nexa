import type { VictoryReason } from '@/application/interfaces/victory/victory-reason';
import type { GameStats } from '@/application/interfaces/victory/game-stats';
import type { Player } from '@/core/entities/player';

export interface VictoryResult {
  gameEnded: boolean;
  winner: Player | null;
  reason: VictoryReason;
  stats: GameStats;
}
