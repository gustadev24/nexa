import type { ID } from '@/core/types/id';

/**
 * Estadísticas de un jugador en el contexto de victoria
 */
export interface PlayerNodeStat {
  playerId: ID;
  username: string;
  nodes: number;
  percent: number;
}

/**
 * Estadísticas completas del juego para victoria
 */
export interface GameStats {
  totalNodes: number;
  elapsedTime: number;
  players: PlayerNodeStat[];
  dominanceTimers: Record<string, number>;
}
