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

    // Validación 2: Verificar BasicNodes neutrales suficientes
    const neutralBasicNodes = Array.from(graph.nodes).filter(
      (node) => node instanceof BasicNode && node.isNeutral()
    );

    if (neutralBasicNodes.length < players.length) {
      throw new Error(
        `No hay suficientes nodos básicos neutrales. Se requieren ${players.length}, pero solo hay ${neutralBasicNodes.length}.`
      );
    }

    // PASO CRUCIAL: Configurar estado de los jugadores PRIMERO
    // Esto evita el error "Player is not in a game" al asignar nodos
    players.forEach((player) => {
      player.setInGame(true); // <--- Activamos primero
      player.increaseEnergy(this.INITIAL_ENERGY);
    });

    // Crear la instancia del juego
    this.currentGame = new Game([...players], graph);

    // Asignar nodo inicial a cada jugador
    // Ahora sí podemos capturar nodos porque isInGame es true
    players.forEach((player, index) => {
      const initialNode = neutralBasicNodes[index];
      this.assignInitialNode(player, initialNode);
    });

    console.log(`[GameService] Partida inicializada con ${players.length} jugadores`);
    return this.currentGame;
  }

  /**
   * Asigna un nodo inicial a un jugador con validaciones estrictas
   */
  public assignInitialNode(player: Player, node: Node): void {
    if (!(node instanceof BasicNode)) {
      throw new Error(`El nodo inicial debe ser de tipo BasicNode. Se recibió: ${node.constructor.name}`);
    }

    if (!node.isNeutral()) {
      throw new Error(`El nodo ${node.id} no está neutral y no puede ser asignado.`);
    }

    // Secuencia requerida
    player.setInitialNode(node);
    player.captureNode(node);
    node.setOwner(player);
  }

  /**
   * Finaliza la partida y calcula el resultado
   */
  public endGame(): GameResult {
    if (!this.currentGame || !this.currentGame.isActive) {
      throw new Error('No hay una partida activa para finalizar.');
    }

    const game = this.currentGame;
    const activePlayers = game.players.filter((p) => !p.isEliminated);
    
    let winner: Player | null = null;
    let reason: GameResult['reason'] = 'draw';

    // Lógica de determinación de ganador
    if (activePlayers.length === 1) {
      winner = activePlayers[0];
      reason = 'elimination';
    } else if (activePlayers.length > 1) {
      const maxNodes = Math.max(...activePlayers.map((p) => p.controlledNodeCount));
      const topPlayers = activePlayers.filter((p) => p.controlledNodeCount === maxNodes);

      if (topPlayers.length === 1) {
        winner = topPlayers[0];
        reason = 'victory';
      } else {
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
  public removePlayerFromGame(player: Player, forceRemove: boolean = true): void {
    // 1. Liberar nodos
    const nodesToFree = Array.from(player.controlledNodes);
    nodesToFree.forEach(node => {
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