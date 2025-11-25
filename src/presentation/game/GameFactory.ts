import { GameService } from '@/application/services/game-service';
import { TickService } from '@/application/services/tick.service';
import { VictoryService } from '@/application/services/victory-service';

import { GameStateManager } from '@/infrastructure/state/GameStateManager';
import { GameRenderer } from '@/presentation/renderer/GameRenderer';
import { GameController } from '@/presentation/game/GameController';

import { Graph } from '@/core/entities/graph';
import { Player } from '@/core/entities/player';
import { Node } from '@/core/entities/node/node';
import { BasicNode } from '@/core/entities/node/basic';
import { SuperEnergyNode } from '@/core/entities/node/super-energy';
import { Edge } from '@/core/entities/edge';
import { NodeType, PlayerType } from '@/core/types/common';
import type { GameStateConfig, GameState } from '@/infrastructure/state/types';

/**
 * Configuración para crear un nodo
 */
export interface NodeConfig {
  id: string;
  type: NodeType;
  ownerId?: string | null;
  defenseEnergy?: number;
  isInitialNode?: boolean;
}

/**
 * Configuración para crear una arista
 */
export interface EdgeConfig {
  sourceId: string;
  targetId: string;
  weight?: number;
}

/**
 * Configuración completa del grafo
 */
export interface GraphConfig {
  nodes: NodeConfig[];
  edges: EdgeConfig[];
}

/**
 * Configuración del jugador
 */
export interface PlayerConfig {
  id: string;
  username: string;
  color: string;
  type?: PlayerType;
  initialNodeId?: string;
}

/**
 * Resultado de la creación del juego
 */
export interface GameCreationResult {
  gameController: GameController;
  gameState: GameState;
  graph: Graph;
  players: Player[];
}

/**
 * GameFactory - Factoría para crear instancias completas del juego NEXA
 *
 * Responsabilidades:
 * - Crear y configurar todos los componentes del sistema
 * - Conectar servicios entre capas
 * - Inicializar el estado del juego
 *
 * Patrón: Factory
 */
export class GameFactory {
  private static instance: GameFactory | null = null;

  private constructor() { /* empty */ }

  /**
   * Obtiene la instancia singleton
   */
  static getInstance(): GameFactory {
    if (!this.instance) {
      this.instance = new GameFactory();
    }
    return this.instance;
  }

  /**
   * Crea un juego completo con todos sus componentes
   */
  createGame(graphConfig: GraphConfig, playerConfigs: PlayerConfig[]): GameCreationResult {
    console.log('[GameFactory] Iniciando creación del juego...');

    // 1. Crear jugadores primero
    const players = this.createPlayers(playerConfigs);
    console.log('[GameFactory] Jugadores creados');

    // 2. Crear el grafo con referencia a los jugadores
    const graph = this.createGraph(graphConfig, players);
    console.log('[GameFactory] Grafo creado');

    // 3. Asignar nodos iniciales a los jugadores
    this.assignInitialNodes(graph, players, graphConfig, playerConfigs);
    console.log('[GameFactory] Nodos iniciales asignados');

    // 4. Crear servicios de aplicación
    const gameService = new GameService();
    const tickService = new TickService();
    const victoryService = new VictoryService();
    console.log('[GameFactory] Servicios de aplicación creados');

    // 5. Crear gestor de estado
    const gameStateManager = new GameStateManager();
    console.log('[GameFactory] GameStateManager creado');

    // 6. Inicializar el juego con GameService
    gameService.initializeGame(players, graph);
    console.log('[GameFactory] Juego inicializado con GameService');

    // 7. Crear estado de juego con GameStateManager
    const gameStateConfig: GameStateConfig = {
      players,
      graph,
      initialTime: 0,
      initialTick: 0,
    };
    const gameState = gameStateManager.createGameState(gameStateConfig);
    console.log('[GameFactory] GameState creado');

    // 8. Crear renderer (sin canvas real, solo para estructura)
    const gameRenderer = new GameRenderer();
    console.log('[GameFactory] GameRenderer creado');

    // 9. Crear y configurar el GameController
    const gameController = new GameController(
      gameService,
      tickService,
      victoryService,
      gameStateManager,
      gameRenderer,
    );
    console.log('[GameFactory] GameController creado');

    return { gameController, gameState, graph, players };
  }

  /**
   * Crea el grafo según la configuración
   */
  private createGraph(config: GraphConfig, players: Player[]): Graph {
    // Crear un mapa de players por ID para fácil acceso
    const playerMap = new Map<string, Player>();
    players.forEach(player => playerMap.set(player.id as string, player));
    const nodes = new Set<BasicNode | SuperEnergyNode>();
    const nodeMap = new Map<string, BasicNode | SuperEnergyNode>();

    // Crear nodos
    for (const nodeConfig of config.nodes) {
      let node: BasicNode | SuperEnergyNode;

      if (nodeConfig.type === NodeType.SUPER_ENERGY) {
        node = new SuperEnergyNode(nodeConfig.id);
      }
      else {
        node = new BasicNode(nodeConfig.id);
      }

      // Asignar owner si existe
      if (nodeConfig.ownerId) {
        const owner = playerMap.get(nodeConfig.ownerId);
        if (owner) {
          node.setOwner(owner);
          console.log(`[GameFactory] Nodo ${nodeConfig.id} asignado a ${owner.username}`);
        }
        else {
          console.warn(`[GameFactory] Owner ${nodeConfig.ownerId} no encontrado para nodo ${nodeConfig.id}`);
        }
      }

      // Asignar energía de defensa inicial
      if (nodeConfig.defenseEnergy !== undefined) {
        node.addEnergy(nodeConfig.defenseEnergy);
      }

      nodes.add(node);
      nodeMap.set(nodeConfig.id, node);
    }

    // Crear aristas
    const edges = new Set<Edge>();
    for (const edgeConfig of config.edges) {
      const nodeA = nodeMap.get(edgeConfig.sourceId);
      const nodeB = nodeMap.get(edgeConfig.targetId);

      if (!nodeA || !nodeB) {
        throw new Error(
          `Nodos no encontrados para arista: ${edgeConfig.sourceId}, ${edgeConfig.targetId}`,
        );
      }

      const length = edgeConfig.weight || 100;
      const edgeId = `${edgeConfig.sourceId}-${edgeConfig.targetId}`;
      const edge = new Edge(edgeId, [nodeA, nodeB], length);

      edges.add(edge);
      nodeA.addEdge(edge);
      nodeB.addEdge(edge);
    }

    return new Graph(nodes, edges);
  }

  /**
   * Crea los jugadores según la configuración
   */
  private createPlayers(configs: PlayerConfig[]): Player[] {
    return configs.map((config) => {
      // Convert hex color string to Color object
      const hexColor = config.color.startsWith('#') ? config.color : `#${config.color}`;
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);

      return new Player({
        id: config.id,
        username: config.username,
        color: { r, g, b, hex: hexColor },
      });
    });
  }

  /**
   * Asigna nodos iniciales a los jugadores
   */
  private assignInitialNodes(
    graph: Graph,
    players: Player[],
    _graphConfig: GraphConfig,
    playerConfigs: PlayerConfig[],
  ): void {
    const nodeMap = new Map<string, Node>();
    graph.nodes.forEach(node => nodeMap.set(node.id as string, node));

    playerConfigs.forEach((playerConfig) => {
      if (playerConfig.initialNodeId) {
        const player = players.find(p => p.id === playerConfig.id);
        const node = nodeMap.get(playerConfig.initialNodeId);

        if (player && node) {
          player.setInitialNode(node);
          console.log(`[GameFactory] Jugador ${player.username} tiene nodo inicial ${node.id}`);
        }
      }
    });
  }
}
