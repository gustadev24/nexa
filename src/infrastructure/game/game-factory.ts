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
import { AIControllerService } from '@/application/services/ai-controller-service';
import EnergyCommandService from '@/application/services/energy-command-service';
import type { Loggeable } from '@/application/interfaces/logging/loggeable';

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
class GameFactory implements Loggeable {
  _logContext = 'GameFactory';
  NODE_COUNT_RANGE = { min: 8, max: 10 };

  /**
   * Crea un juego completo con todos sus componentes
   */
  createGame(playerConfigs: PlayerConfig[], scale: Scale.ScaleManager): GameController {
    const idGenerator = new UuidGenerator();
    const logger = LoggerFactory.create();

    logger.info(this, 'Iniciando creación del juego...');

    const { width, height } = scale;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;

    const phaserRadialLayoutStrategy = new PhaserRadialLayoutStrategy(centerX, centerY, radius);

    const graphService = new GraphService(idGenerator, phaserRadialLayoutStrategy, logger);
    const nodeCount = Math.floor(Math.random() * (this.NODE_COUNT_RANGE.max - this.NODE_COUNT_RANGE.min + 1)) + this.NODE_COUNT_RANGE.min;
    graphService.generateRandomGraph(nodeCount);
    logger.info(this, 'Grafo creado con GraphService');

    const timeService = new TimeService();
    const collisionService = new CollisionService();
    const captureService = new CaptureService(logger);
    const tickService = new TickService(collisionService, captureService, logger);
    const victoryService = new VictoryService();
    const playerService = new PlayerService(idGenerator);
    const aiController = new AIControllerService(logger);
    const energyCommandService = new EnergyCommandService();
    playerService.createPlayers(playerConfigs);
    logger.info(this, 'Servicios de aplicación creados');

    const gameStateManager = new GameStateManagerService(timeService, playerService, graphService);
    logger.info(this, 'GameStateManager creado');

    logger.info(this, 'Game inicializado con GameService');

    const gameRenderer = new GameRenderer();
    logger.info(this, 'GameRenderer creado');

    const gameController = new GameController(
      tickService,
      victoryService,
      gameStateManager,
      gameRenderer,
      captureService,
      graphService,
      playerService,
      aiController,
      energyCommandService,
      logger,
    );
    logger.info(this, 'GameController creado');

    return gameController;
  }
}

const gameFactory = new GameFactory();

export { gameFactory as GameFactory };
