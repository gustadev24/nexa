import { GameService } from '@/application/services/game/game-service';
import { TickService } from '@/application/services/tick.service';
import { VictoryService } from '@/application/services/victory-service';
import { GraphService } from '@/application/services/graph/graph-service';

import { GameStateManager } from '@/application/services/game/game-state-manager';
import { GameRenderer } from '@/presentation/renderer/game-renderer';
import { GameController } from '@/presentation/game/game-controller';
import { LoggerFactory } from '@/application/logging/logger-factory';
import { UuidGenerator } from '@/application/services/helpers/uuid-generator';

import { Graph } from '@/core/entities/graph';
import { Player } from '@/core/entities/player';
import { Node } from '@/core/entities/node/node';
import type { GameStateConfig, GameState } from '@/application/interfaces/game/game-state';
import type { ID } from '@/core/types/id';

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
  createGame(playerConfigs: PlayerConfig[], graphOrNodeCount: Graph | number): GameCreationResult {
    console.log('[GameFactory] Iniciando creación del juego...');

    const idGenerator = new UuidGenerator();
    const logger = LoggerFactory.create();

    // 1. Crear jugadores primero
    const players = this.createPlayers(playerConfigs);
    console.log('[GameFactory] Jugadores creados');

    // 2. Obtener o crear el grafo
    let graph: Graph;
    if (typeof graphOrNodeCount === 'number') {
      const graphService = new GraphService(idGenerator, logger);
      graph = graphService.generateRandomGraph(graphOrNodeCount);
      console.log('[GameFactory] Grafo creado con GraphService');
    }
    else {
      graph = graphOrNodeCount;
      console.log('[GameFactory] Grafo proporcionado utilizado');
    }

    // 3. Crear servicios de aplicación
    const gameService = new GameService(idGenerator, logger);
    const tickService = new TickService();
    const victoryService = new VictoryService();
    console.log('[GameFactory] Servicios de aplicación creados');

    // 4. Crear gestor de estado
    const gameStateManager = new GameStateManager();
    console.log('[GameFactory] GameStateManager creado');

    // 5. Inicializar el juego con GameService (esto llama prepareForGame internamente)
    gameService.initializeGame(players, graph);
    console.log('[GameFactory] Game inicializado con GameService');

    // 6. Asignar y capturar nodos iniciales (después de prepareForGame)
    this.assignInitialNodes(graph, players, playerConfigs, gameService);
    console.log('[GameFactory] Nodos iniciales asignados y capturados');

    // 7. Crear estado de juego con GameStateManager
    const gameStateConfig: GameStateConfig = {
      players,
      graph,
      initialTime: 0,
      initialTick: 0,
    };
    const gameState = gameStateManager.createGameState(gameStateConfig);
    console.log('[GameFactory] GameState creado');

    // 8. Crear renderer
    const gameRenderer = new GameRenderer();
    // Nota: El canvas debe ser inicializado externamente si se usa
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
   * Crea los jugadores según la configuración
   */
  private createPlayers(configs: PlayerConfig[]): Player[] {
    return configs.map((config) => {
      const hexColor = config.color.startsWith('#') ? config.color : `#${config.color}`;
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);

      return new Player(
        config.id,
        config.username,
        { r, g, b, hex: hexColor },
      );
    });
  }

  /**
   * Asigna nodos iniciales a los jugadores
   */
  private assignInitialNodes(
    graph: Graph,
    players: Player[],
    playerConfigs: PlayerConfig[],
    gameService: GameService,
  ): void {
    const nodeMap = new Map<ID, Node>();
    graph.nodes.forEach(node => nodeMap.set(node.id as ID, node));

    playerConfigs.forEach((playerConfig) => {
      if (playerConfig.initialNodeId) {
        const player = players.find(p => p.id === playerConfig.id);
        const node = nodeMap.get(playerConfig.initialNodeId);

        if (player && node) {
          // Capturar el nodo inicial usando el servicio
          gameService.captureInitialNode(player, node);
          console.log(`[GameFactory] Jugador ${player.username} capturó nodo inicial ${node.id}`);
        }
      }
    });
  }
}

interface GameCreationResult {
  gameController: GameController;
  gameState: GameState;
  graph: Graph;
  players: Player[];
}

interface PlayerConfig {
  id: ID;
  username: string;
  color: string; // Hex color string
  initialNodeId?: ID;
}
