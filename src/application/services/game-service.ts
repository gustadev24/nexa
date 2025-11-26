import { Game, type GameResult } from '@/core/entities/game';
import { Graph } from '@/core/entities/graph';
import { BasicNode } from '@/core/entities/node/basic';
import { Node } from '@/core/entities/node/node';
import { Player } from '@/core/entities/player';

export class GameService {
  private currentGame: Game | null = null;
  private readonly INITIAL_ENERGY = 100;

  /**
   * Inicializa una nueva partida
   */
  public initializeGame(players: Player[], graph: Graph): Game {
    // Validación 1: Mínimo 2 jugadores
    if (players.length < 2) {
      throw new Error('Se requieren al menos 2 jugadores para iniciar una partida.');
    }

    // PASO 1: Configurar estado de los jugadores PRIMERO
    // Esto evita el error "Player is not in a game" al asignar nodos
    players.forEach((player) => {
      player.setInGame(true);
      player.increaseEnergy(this.INITIAL_ENERGY);
    });

    // PASO 2: Crear la instancia del juego
    this.currentGame = new Game([...players], graph);

    // PASO 3: Asignar y capturar nodos iniciales
    // Los jugadores ya deben tener su initialNode configurado por GameFactory
    players.forEach((player) => {
      const initialNode = player.initialNode;
      if (!initialNode) {
        throw new Error(`El jugador ${player.username} no tiene nodo inicial configurado.`);
      }

      // Cualquier tipo de nodo puede ser inicial según la especificación
      // No hay restricción de que deba ser BasicNode

      // Capturar el nodo inicial del jugador
      this.captureInitialNode(player, initialNode);
    });

    console.log(`[GameService] Partida inicializada con ${players.length} jugadores`);
    return this.currentGame;
  }

  /**
   * Captura un nodo inicial para un jugador
   * El nodo ya debe estar configurado como initialNode del jugador
   */
  private captureInitialNode(player: Player, node: Node): void {
    // Capturar el nodo (añadirlo a controlledNodes del jugador)
    player.captureNode(node);
    // Asignar ownership del nodo
    node.setOwner(player);

    console.log(`[GameService] Jugador ${player.username} capturó nodo inicial ${node.id}`);
  }

  /**
   * Finaliza la partida y calcula el resultado
   */
  public endGame(): GameResult {
    if (!this.currentGame || !this.currentGame.isActive) {
      throw new Error('No hay una partida activa para finalizar.');
    }

    const game = this.currentGame;
    const activePlayers = game.players.filter(p => !p.isEliminated);

    let winner: Player | null = null;
    let reason: GameResult['reason'] = 'draw';

    // Lógica de determinación de ganador
    if (activePlayers.length === 1) {
      winner = activePlayers[0];
      reason = 'elimination';
    }
    else if (activePlayers.length > 1) {
      const maxNodes = Math.max(...activePlayers.map(p => p.controlledNodeCount));
      const topPlayers = activePlayers.filter(p => p.controlledNodeCount === maxNodes);

      if (topPlayers.length === 1) {
        winner = topPlayers[0];
        reason = 'victory';
      }
      else {
        reason = 'draw';
      }
    }

    // Limpieza General
    game.players.forEach(player => this.removePlayerFromGame(player, false)); // false = no sacar del array todavía
    game.graph.reset();
    game.isActive = false;

    const result: GameResult = {
      hasWinner: winner !== null,
      winner,
      players: [...game.players],
      reason,
      endTime: Date.now(),
    };

    this.currentGame = null;
    return result;
  }

  /**
   * Remueve a un jugador.
   * @param forceRemove Si es true, lo saca del array de jugadores (útil para desconexiones en medio de la partida)
   */
  public removePlayerFromGame(player: Player, forceRemove = true): void {
    // 1. Liberar nodos
    const nodesToFree = Array.from(player.controlledNodes);
    nodesToFree.forEach((node) => {
      node.setOwner(null);
      node.clearAssignments();
    });

    // 2. Resetear jugador
    player.reset();

    // 3. Sacar de la lista de la partida actual (solo si forceRemove es true)
    if (this.currentGame && forceRemove) {
      const idx = this.currentGame.players.findIndex(p => p.equals(player));
      if (idx !== -1) {
        this.currentGame.players.splice(idx, 1);
      }
    }
  }

  public getCurrentGame(): Game | null {
    return this.currentGame;
  }
}
