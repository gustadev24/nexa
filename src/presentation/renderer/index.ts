/**
 * Presentation - Renderer
 * 
 * Módulo de renderizado del grafo del juego NEXA.
 * Exporta el GameRenderer y los tipos necesarios para el renderizado.
 */

export type {
    EdgeSnapshot,
    EnergyPacketSnapshot,
    GameSnapshot, NodeSnapshot
} from '@/infrastructure/state/types';
export { GameRenderer } from './GameRenderer';

