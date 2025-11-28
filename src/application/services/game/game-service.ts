import { GameResultReason, type GameResult } from '@/application/interfaces/game/game-result';
import { Game } from '@/core/entities/game';
import { Graph } from '@/core/entities/graph';
import { Node } from '@/core/entities/node/node';
import { Player } from '@/core/entities/player';
import type { IdGenerator } from '@/core/helpers/id-generator';
import type { Loggeable } from '@/core/logging/loggeable';
import type { Logger } from '@/core/logging/logger';

export class GameService implements Loggeable {
  _logContext = 'GameService';
  private currentGame: Game | null = null;
  private readonly INITIAL_ENERGY = 0;
  private readonly GAME_DURATION_MS = 3 * 60 * 1000; // 3 minutos

  constructor(
    private idGenerator: IdGenerator,
    private log: Logger,
  ) {}

  /**
   * Inicializa una nueva partida
   */
  initializeGame(players: Player[], graph: Graph) {
    // Validación 1: Mínimo 2 jugadores
    if (players.length < 2) {
      throw new Error('Se requieren al menos 2 jugadores para iniciar una partida.');
    }

    // PASO 1: Configurar estado de los jugadores PRIMERO
    // Esto evita el error "Player is not in a game" al asignar nodos
    players.forEach((player) => {
      player.prepareForGame();
      player.increaseEnergy(this.INITIAL_ENERGY);
    });

    // PASO 2: Crear la instancia del juego
    const gameId = this.idGenerator.generate();
    this.currentGame = new Game(gameId, Date.now(), players, graph, this.GAME_DURATION_MS);

    this.log.info(this, `Partida ${gameId} inicializada con ${players.length} jugadores.`);
    return this.currentGame;
  }

  /**
   * Captura un nodo inicial para un jugador
   */
  captureInitialNode(player: Player, node: Node): void {
    // Validar que el nodo no esté asignado
    if (node.owner) {
      throw new Error(`El nodo ${node.id} ya está asignado al jugador ${node.owner.username}.`);
    }

    // Asignar el nodo inicial (el setter ya agrega a controlledNodes automáticamente)
    player.initialNode = node;
    // Asignar ownership del nodo
    node.owner = player;
    // Aumentar la energía del jugador por el nodo capturado
    player.increaseEnergy(node.energyAddition);

    this.log.info(this, `Jugador ${player.username} capturó nodo inicial ${node.id}.`);
  }

  /**
   * Captura un nodo para un jugador (puede estar asignado a otro jugador)
   */
  captureNode(player: Player, node: Node): void {
    // Si el nodo está asignado a otro jugador
    if (node.owner && !node.owner.equals(player)) {
      // Resetear el nodo del jugador anterior
      const previousOwner = node.owner;
      previousOwner.releaseNode(node);

      node.resetToNeutral();
    }

    // Capturar el nodo (añadirlo a controlledNodes del jugador)
    player.captureNode(node);
    // Asignar ownership del nodo
    node.owner = player;

    this.log.info(this, `Jugador ${player.username} capturó nodo ${node.id}.`);
  }

  /**
   * Finaliza la partida y calcula el resultado
   */
  endGame(): GameResult {
    if (!this.currentGame || !this.currentGame.isActive) {
      throw new Error('No hay una partida activa para finalizar.');
    }

    const game = this.currentGame;
    const activePlayers = game.activePlayers();

    let winner: Player | null = null;
    let reason: GameResultReason = GameResultReason.DRAW;

    // Lógica de determinación de ganador
    if (activePlayers.length === 1) {
      winner = activePlayers[0];
      reason = GameResultReason.ELIMINATION;
    }
    else if (activePlayers.length > 1) {
      const maxNodes = Math.max(...activePlayers.map(p => p.controlledNodeCount));
      const topPlayers = activePlayers.filter(p => p.controlledNodeCount === maxNodes);

      if (topPlayers.length === 1) {
        winner = topPlayers[0];
        reason = GameResultReason.VICTORY;
      }
      else {
        reason = GameResultReason.DRAW;
      }
    }

    // Limpieza General
    game.players.forEach(player => this.removePlayerFromGame(player)); // false = no sacar del array todavía
    game.graph.reset();
    game.isActive = false;

    this.currentGame = null;

    return {
      winner,
      reason,
      game,
    };
  }

  removePlayerFromGame(player: Player): void {
    if (!this.currentGame) {
      throw new Error('No hay una partida activa para modificar.');
    }

    player.reset();
    this.log.info(this, `Jugador ${player.username} removido de la partida.`);
  }
}
