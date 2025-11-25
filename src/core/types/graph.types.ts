import type { Edge } from '@/core/entities/edge';
import type { Node } from '@/core/entities/node/node';
import type { NodeType } from '@/core/types/common';

/**
 * Representa la estructura completa del grafo del juego
 */
export interface Graph {
  /** Conjunto de todos los nodos del grafo */
  nodes: Set<Node>;

  /** Conjunto de todas las aristas del grafo */
  edges: Set<Edge>;
}

/**
 * Configuración para un nodo individual
 */
export interface NodeConfig {
  /** ID único del nodo */
  id: string;

  /** Tipo de nodo (BASIC, ATTACK, DEFENSE, ENERGY, SUPER_ENERGY) */
  type: NodeType;

  /** Posición en el plano 2D */
  position: { x: number; y: number };

  /** Energía inicial del nodo (por defecto 0) */
  initialEnergy?: number;

  /** Si es un nodo inicial de algún jugador */
  isInitialNode?: boolean;
}

/**
 * Configuración para una arista individual
 */
export interface EdgeConfig {
  /** ID único de la arista */
  id: string;

  /** ID del primer nodo */
  nodeAId: string;

  /** ID del segundo nodo */
  nodeBId: string;

  /** Peso de la arista (tiempo de viaje en ticks) */
  weight?: number;

  /** Si no se especifica peso, se calcula automáticamente basado en la distancia */
  autoCalculateWeight?: boolean;
}

/**
 * Configuración completa para crear un grafo
 */
export interface GraphConfig {
  /** Configuraciones de todos los nodos */
  nodeConfigs: NodeConfig[];

  /** Configuraciones de todas las aristas */
  edgeConfigs: EdgeConfig[];
}

/**
 * Resultado del análisis de conectividad
 */
export interface ConnectivityAnalysis {
  /** Componentes conectadas del grafo (cada Set es una componente) */
  components: Set<Node>[];

  /** Puntos de articulación (nodos críticos) */
  articulationPoints: Node[];

  /** Indica si el grafo es conexo */
  isConnected: boolean;
}
