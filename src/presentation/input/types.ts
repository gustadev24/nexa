import type { Edge } from '@/core/entities/edge';
import type { Node } from '@/core/entities/node/node';
import type { Player } from '@/core/entities/player';

/**
 * Evento generado cuando se hace click en un nodo
 */
export interface NodeClickEvent {
  /** Nodo que fue clickeado */
  node: Node;

  /** Coordenadas del click en el canvas */
  canvasX: number;
  canvasY: number;

  /** Coordenadas del click en el mundo del juego */
  worldX: number;
  worldY: number;

  /** Timestamp del evento */
  timestamp: number;

  /** Si es un click derecho */
  isRightClick: boolean;
}

/**
 * Evento generado cuando se hace click en una arista
 */
export interface EdgeClickEvent {
  /** Arista que fue clickeada */
  edge: Edge;

  /** Nodo origen desde donde se asignaría la energía */
  sourceNode: Node;

  /** Nodo destino hacia donde fluiría la energía */
  targetNode: Node;

  /** Coordenadas del click en el canvas */
  canvasX: number;
  canvasY: number;

  /** Coordenadas del click en el mundo del juego */
  worldX: number;
  worldY: number;

  /** Timestamp del evento */
  timestamp: number;
}

/**
 * Comando para asignar energía a una arista
 */
export interface EnergyCommand {
  /** Tipo de comando */
  type: 'assign' | 'remove' | 'redistribute';

  /** Jugador que ejecuta el comando */
  player: Player;

  /** Nodo origen de la energía */
  sourceNode: Node;

  /** Arista o nodo destino */
  target: Edge | Node;

  /** Cantidad de energía */
  amount: number;

  /** Timestamp del comando */
  timestamp: number;
}

/**
 * Estado de la selección del usuario
 */
export interface SelectionState {
  /** Nodo seleccionado actualmente */
  selectedNode: Node | null;

  /** Arista seleccionada actualmente */
  selectedEdge: Edge | null;

  /** Timestamp de la selección */
  selectionTime: number;
}

/**
 * Configuración para el InputHandler
 */
export interface InputHandlerConfig {
  /** Permitir clicks con botón derecho */
  allowRightClick?: boolean;

  /** Radio de tolerancia para click en nodos (en píxeles) */
  nodeTolerance?: number;

  /** Radio de tolerancia para click en aristas (en píxeles) */
  edgeTolerance?: number;

  /** Habilitar soporte táctil */
  enableTouch?: boolean;

  /** Cantidad de energía por defecto */
  defaultEnergyAmount?: number;

  /** Cantidad mínima de energía */
  minEnergyAmount?: number;

  /** Cantidad máxima de energía */
  maxEnergyAmount?: number;
}

/**
 * Resultado de hit detection
 */
export interface HitTestResult {
  /** Si se detectó un hit */
  hit: boolean;

  /** Nodo detectado (si aplica) */
  node?: Node;

  /** Arista detectada (si aplica) */
  edge?: Edge;

  /** Distancia al objeto más cercano */
  distance: number;
}
