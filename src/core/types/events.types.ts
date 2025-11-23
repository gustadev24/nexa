import type { ID } from '@/core/types/common';
import type { Node } from '@/core/entities/node/node';
import type { Player } from '@/core/entities/player';
import type { VictoryCondition } from '@/core/types/common';

/**
 * Tipos de eventos del juego
 */
export enum GameEventType {
  // Eventos de nodo
  NODE_CAPTURED = 'node_captured',
  NODE_NEUTRALIZED = 'node_neutralized',
  NODE_ATTACKED = 'node_attacked',
  NODE_DEFENDED = 'node_defended',
  
  // Eventos de energía
  ENERGY_SENT = 'energy_sent',
  ENERGY_ARRIVED = 'energy_arrived',
  ENERGY_COLLISION = 'energy_collision',
  ENERGY_WASTED = 'energy_wasted',
  
  // Eventos de juego
  GAME_STARTED = 'game_started',
  GAME_PAUSED = 'game_paused',
  GAME_RESUMED = 'game_resumed',
  GAME_OVER = 'game_over',
  
  // Eventos de jugador
  PLAYER_ELIMINATED = 'player_eliminated',
  DOMINANCE_STARTED = 'dominance_started',
  DOMINANCE_LOST = 'dominance_lost',
  
  // Eventos de tiempo
  TICK_DEFENSE = 'tick_defense',
  TICK_ATTACK = 'tick_attack',
}

/**
 * Payload base de eventos
 */
export interface GameEventPayload {
  timestamp: number;
}

/**
 * Evento de captura de nodo
 */
export interface NodeCapturedEvent extends GameEventPayload {
  node: Node;
  previousOwner: Player | null;
  newOwner: Player;
  energyRemaining: number;
}

/**
 * Evento de colisión de energía
 */
export interface EnergyCollisionEvent extends GameEventPayload {
  edgeId: ID;
  packet1: { owner: Player; amount: number };
  packet2: { owner: Player; amount: number };
  isWaste: boolean;
}

/**
 * Evento de fin de juego
 */
export interface GameOverEvent extends GameEventPayload {
  winner: Player | null;
  condition: VictoryCondition;
  isDraw: boolean;
}

/**
 * Evento de dominancia
 */
export interface DominanceEvent extends GameEventPayload {
  player: Player;
  percentage: number;
  timeRemaining: number;
}

/**
 * Union type de todos los eventos
 */
export type GameEvent = 
  | NodeCapturedEvent
  | EnergyCollisionEvent
  | GameOverEvent
  | DominanceEvent
  | GameEventPayload;

/**
 * Listener de eventos
 */
export type GameEventListener<T extends GameEvent = GameEvent> = (event: T) => void;
