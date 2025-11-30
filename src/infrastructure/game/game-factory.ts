import { TickService } from '@/application/services/tick-service';
import { VictoryService } from '@/application/services/victory-service';
import { GameRenderer } from '@/infrastructure/renderer/game-renderer';
import { LoggerFactory } from '@/infrastructure/logging/logger-factory';
import { GraphService } from '@/application/services/graph-service';
import type { PlayerConfig } from '@/application/interfaces/player/player-config';
import { GameStateManagerService } from '@/application/services/game-state-manager-service';
import { CollisionService } from '@/application/services/collision-service';
import { CaptureService } from '@/application/services/capture-service';
import { TimeService } from '@/application/services/time-service';
import { UuidGenerator } from '@/infrastructure/implementations/id-generator/uuid-generator';
import { GameController } from '@/infrastructure/game/game-controller';
import { PhaserRadialLayoutStrategy } from '@/infrastructure/implementations/layout/phaser-radial-layout';
import type { Scale } from 'phaser';
import { PlayerService } from '@/application/services/player-service';

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
class GameFactory {
  NODE_COUNT_RANGE = { min: 8, max: 10 };

  /**
   * Crea un juego completo con todos sus componentes
   */
  createGame(playerConfigs: PlayerConfig[], scale: Scale.ScaleManager): GameController {
    console.log('[GameFactory] Iniciando creación del juego...');

    const idGenerator = new UuidGenerator();
    const logger = LoggerFactory.create();

    const { width, height } = scale;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;

    const phaserRadialLayoutStrategy = new PhaserRadialLayoutStrategy(centerX, centerY, radius);

    // 2. Crear el grafo
    const graphService = new GraphService(idGenerator, phaserRadialLayoutStrategy, logger);
    const nodeCount = Math.floor(Math.random() * (this.NODE_COUNT_RANGE.max - this.NODE_COUNT_RANGE.min + 1)) + this.NODE_COUNT_RANGE.min;
    graphService.generateRandomGraph(nodeCount);
    console.log('[GameFactory] Grafo creado con GraphService');

    // 3. Crear servicios de aplicación
    const timeService = new TimeService();
    const collisionService = new CollisionService();
    const captureService = new CaptureService(logger);
    const tickService = new TickService(collisionService, captureService);
    const victoryService = new VictoryService();
    const playerService = new PlayerService(idGenerator);
    playerService.createPlayers(playerConfigs);
    console.log('[GameFactory] Servicios de aplicación creados');

    // 5. Crear GameStateManager
    const gameStateManager = new GameStateManagerService(timeService, playerService, graphService);
    console.log('[GameFactory] GameStateManager creado');

    // 6. Inicializar el juego con GameService (esto llama prepareForGame internamente)
    console.log('[GameFactory] Game inicializado con GameService');

    // 6. Asignar y capturar nodos iniciales (después de prepareForGame)
    // this.assignInitialNodes(graph, players, playerConfigs, gameService);
    // console.log('[GameFactory] Nodos iniciales asignados y capturados');

    // 7. Crear renderer
    const gameRenderer = new GameRenderer();
    // Nota: El canvas debe ser inicializado externamente si se usa
    console.log('[GameFactory] GameRenderer creado');

    // 8. Crear y configurar el GameController
    const gameController = new GameController(
      tickService,
      victoryService,
      gameStateManager,
      gameRenderer,
      captureService,
      graphService,
      playerService,
    );
    console.log('[GameFactory] GameController creado');

    return gameController;
  }
}

const gameFactory = new GameFactory();

export { gameFactory as GameFactory };
