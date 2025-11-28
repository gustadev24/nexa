import type { EdgeSnapshot } from '@/application/interfaces/edge/edge-snapshot';
import type { EnergyPacketSnapshot } from '@/application/interfaces/energy-packet/energy-packet-snapshot';
import type { GameStatus } from '@/application/interfaces/game/game-status';
import type { NodeSnapshot } from '@/application/interfaces/node/node-snapshot';
import type { PlayerSnapshot } from '@/application/interfaces/player/player-snapshot';

/**
 * Snapshot inmutable del estado del juego para la UI
 * No contiene referencias mutables a entidades del dominio
 */
export interface GameSnapshot {
  /** Timestamp del snapshot */
  timestamp: number;

  /** Tick actual */
  currentTick: number;

  /** Tiempo transcurrido en ms */
  elapsedTime: number;

  /** Tiempo transcurrido en formato legible (mm:ss) */
  elapsedTimeFormatted: string;

  /** Tiempo restante en ms (180000ms - elapsedTime) */
  remainingTime: number;

  /** Tiempo restante en formato legible (mm:ss) */
  remainingTimeFormatted: string;

  /** Estado del juego */
  status: GameStatus;

  /** Número total de nodos en el mapa */
  totalNodes: number;

  /** Número total de jugadores */
  totalPlayers: number;

  /** Estadísticas de cada jugador */
  playerStats: PlayerSnapshot[];

  /** ID del jugador ganador (si hay) */
  winnerId?: string | number;

  /** Razón de victoria/derrota */
  victoryReason?: 'dominance' | 'time_limit' | 'elimination';

  /** Si algún jugador está cerca de ganar por dominancia */
  dominanceWarning?: {
    playerId: string | number;
    timeRemaining: number; // ms restantes para victoria
  };

  /** Snapshots de nodos para renderizado */
  nodes?: NodeSnapshot[];

  /** Snapshots de aristas para renderizado */
  edges?: EdgeSnapshot[];

  /** Snapshots de paquetes de energía para renderizado */
  energyPackets?: EnergyPacketSnapshot[];
}
