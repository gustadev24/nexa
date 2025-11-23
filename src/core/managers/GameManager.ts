import { Edge } from '../entities/edge';
import { Node } from '../entities/node/node';
import { Player } from '../entities/player';
import { EventEmitter } from '../events/EventEmitter';
import { GameOverState, MenuState, PausedState, PlayingState } from '../states/concrete-states';
import type { GameContext, IGameState } from '../states/game-state.interface';
import { AttackResolver } from '../strategies/attack-strategy';
import { CollisionResolver } from '../strategies/collision-strategy';
import type { ID } from '../types/common';
import { GAME_CONSTANTS, GameState, VictoryCondition } from '../types/common';
import { GameEventType } from '../types/events.types';

/**
 * GameManager - Singleton Pattern
 * Orquestador central del juego NEXA
 * Gestiona el grafo, jugadores, ciclos de juego y eventos
 */
export class GameManager implements GameContext {
  private static instance: GameManager | null = null;
  
  // Estado del juego
  private currentState: IGameState;
  private nodes: Map<ID, Node>;
  private edges: Map<ID, Edge>;
  private players: Map<ID, Player>;
  
  // Sistemas
  private events: EventEmitter;
  private collisionResolver: CollisionResolver;
  private attackResolver: AttackResolver;
  
  // Timers
  private elapsedTime: number;
  private lastDefenseUpdate: number;
  private lastAttackUpdate: number;
  private gameStartTime: number;
  
  // Configuración
  private readonly defenseInterval = GAME_CONSTANTS.DEFENSE_INTERVAL;
  private readonly attackInterval = GAME_CONSTANTS.ATTACK_INTERVAL;
  private readonly gameDuration = GAME_CONSTANTS.GAME_DURATION;

  /**
   * Constructor privado (Singleton)
   */
  private constructor() {
    this.currentState = new MenuState();
    this.nodes = new Map();
    this.edges = new Map();
    this.players = new Map();
    this.events = new EventEmitter();
    this.collisionResolver = new CollisionResolver();
    this.attackResolver = new AttackResolver();
    this.elapsedTime = 0;
    this.lastDefenseUpdate = 0;
    this.lastAttackUpdate = 0;
    this.gameStartTime = 0;
  }

  /**
   * Obtiene la instancia única del GameManager (Singleton)
   */
  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  /**
   * Destruye la instancia actual (útil para testing o reinicio completo)
   */
  static destroyInstance(): void {
    if (GameManager.instance) {
      GameManager.instance.cleanup();
      GameManager.instance = null;
    }
  }

  // ============ GameContext Implementation ============

  setState(state: IGameState): void {
    this.currentState.onExit(this);
    this.currentState = state;
    this.currentState.onEnter(this);
    
    // Event will be emitted with custom payload if needed
  }

  getCurrentState(): GameState {
    return this.currentState.name;
  }

  startGame(): void {
    if (this.players.size < 2) {
      throw new Error('Need at least 2 players to start the game');
    }
    
    this.gameStartTime = Date.now();
    this.elapsedTime = 0;
    this.lastDefenseUpdate = 0;
    this.lastAttackUpdate = 0;
    
    this.setState(new PlayingState());
    this.events.emit(GameEventType.GAME_STARTED, {
      timestamp: this.gameStartTime,
    });
  }

  pauseGame(): void {
    this.setState(new PausedState());
    this.events.emit(GameEventType.GAME_PAUSED, {
      timestamp: Date.now(),
    });
  }

  resumeGame(): void {
    this.setState(new PlayingState());
    this.events.emit(GameEventType.GAME_RESUMED, {
      timestamp: Date.now(),
    });
  }

  endGame(winner: string | null, reason: string): void {
    this.setState(new GameOverState(winner, reason));
    this.events.emit(GameEventType.GAME_OVER, {
      winner,
      reason,
      elapsedTime: this.elapsedTime,
      timestamp: Date.now(),
    });
  }

  getElapsedTime(): number {
    return this.elapsedTime;
  }

  // ============ Graph Management ============

  addNode(node: Node): void {
    this.nodes.set(node.id, node);
  }

  addEdge(edge: Edge): void {
    this.edges.set(edge.id, edge);
  }

  addPlayer(player: Player): void {
    this.players.set(player.id, player);
  }

  getNode(id: ID): Node | undefined {
    return this.nodes.get(id);
  }

  getEdge(id: ID): Edge | undefined {
    return this.edges.get(id);
  }

  getPlayer(id: ID): Player | undefined {
    return this.players.get(id);
  }

  getAllNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  getAllEdges(): Edge[] {
    return Array.from(this.edges.values());
  }

  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  // ============ AI Helper Methods ============

  /**
   * Obtiene todos los nodos controlados por un jugador
   */
  getNodesByOwner(player: Player): Node[] {
    return Array.from(this.nodes.values()).filter(
      node => node.owner?.id === player.id
    );
  }

  /**
   * Obtiene los paquetes de energía que están llegando a un nodo
   */
  getIncomingPackets(node: Node): Array<{ owner: Player; amount: number; progress: number }> {
    const incomingPackets: Array<{ owner: Player; amount: number; progress: number }> = [];
    
    for (const edge of this.edges.values()) {
      // Verificar si la arista llega a este nodo
      if (edge.nodeB.id === node.id) {
        // Agregar todos los paquetes de esta arista
        for (const packet of edge.energyPackets) {
          incomingPackets.push({
            owner: packet.owner,
            amount: packet.amount,
            progress: packet.progress,
          });
        }
      }
    }
    
    return incomingPackets;
  }

  /**
   * Obtiene todos los nodos adyacentes a un nodo dado
   */
  getAdjacentNodes(node: Node): Node[] {
    const adjacentNodes: Node[] = [];
    
    for (const edge of this.edges.values()) {
      if (edge.nodeA.id === node.id) {
        adjacentNodes.push(edge.nodeB);
      } else if (edge.nodeB.id === node.id) {
        adjacentNodes.push(edge.nodeA);
      }
    }
    
    return adjacentNodes;
  }

  /**
   * Encuentra la arista entre dos nodos
   */
  findEdge(nodeA: Node, nodeB: Node): Edge | null {
    for (const edge of this.edges.values()) {
      const matchesAB = edge.nodeA.id === nodeA.id && edge.nodeB.id === nodeB.id;
      const matchesBA = edge.nodeA.id === nodeB.id && edge.nodeB.id === nodeA.id;
      
      if (matchesAB || matchesBA) {
        return edge;
      }
    }
    
    return null;
  }

  /**
   * Obtiene todas las aristas conectadas a un nodo
   */
  getEdgesFromNode(node: Node): Edge[] {
    const connectedEdges: Edge[] = [];
    
    for (const edge of this.edges.values()) {
      if (edge.nodeA.id === node.id || edge.nodeB.id === node.id) {
        connectedEdges.push(edge);
      }
    }
    
    return connectedEdges;
  }

  // ============ Game Loop ============

  /**
   * Actualización principal del juego (llamado cada frame)
   */
  update(deltaTime: number): void {
    this.currentState.update(this, deltaTime);
    
    if (this.getCurrentState() !== GameState.PLAYING) {
      return; // No procesar lógica si no está jugando
    }
    
    this.elapsedTime += deltaTime;
    
    // Ciclo de Defensa (30ms)
    if (this.elapsedTime - this.lastDefenseUpdate >= this.defenseInterval) {
      this.processDefenseCycle();
      this.lastDefenseUpdate = this.elapsedTime;
    }
    
    // Ciclo de Ataque (20ms)
    if (this.elapsedTime - this.lastAttackUpdate >= this.attackInterval) {
      this.processAttackCycle();
      this.lastAttackUpdate = this.elapsedTime;
    }
    
    // Verificar condiciones de victoria
    this.checkVictoryConditions();
  }

  /**
   * Ciclo de Defensa: Actualiza energía de nodos según asignaciones
   */
  private processDefenseCycle(): void {
    this.events.emit(GameEventType.TICK_DEFENSE, {
      timestamp: this.elapsedTime,
    });
  }

  /**
   * Ciclo de Ataque: Procesa movimiento de paquetes y colisiones
   */
  private processAttackCycle(): void {
    this.events.emit(GameEventType.TICK_ATTACK, {
      timestamp: this.elapsedTime,
    });
    
    // 1. Actualizar posición de todos los paquetes
    for (const edge of this.edges.values()) {
      const arrivedPackets = edge.updatePackets();
      
      // 2. Procesar paquetes que llegaron a destino
      for (const packet of arrivedPackets) {
        const result = this.attackResolver.execute(
          packet.target,
          packet.amount,
          packet.owner
        );
        
        // Emitir eventos según resultado
        if (result.captured) {
          this.events.emit(GameEventType.NODE_CAPTURED, {
            nodeId: packet.target.id,
            previousOwner: null,
            newOwner: result.newOwner!.id,
            energy: result.remainingDefense,
          });
        } else if (result.neutralized) {
          this.events.emit(GameEventType.NODE_NEUTRALIZED, {
            nodeId: packet.target.id,
            previousOwner: packet.target.owner?.id ?? null,
          });
        }
      }
      
      // 3. Detectar y resolver colisiones
      const collisions = this.collisionResolver.detectAndResolveCollisions(
        edge.energyPackets
      );
      
      for (const collision of collisions) {
        this.events.emit(GameEventType.ENERGY_COLLISION, {
          edgeId: edge.id,
          packet1: { owner: collision.destroyed[0]?.owner, amount: collision.destroyed[0]?.amount },
          packet2: { owner: collision.destroyed[1]?.owner, amount: collision.destroyed[1]?.amount },
          timestamp: this.elapsedTime,
        });
        
        // Actualizar paquetes en la arista
        for (const destroyed of collision.destroyed) {
          edge.removePacket(destroyed.id);
        }
        for (const survivor of collision.survivors) {
          edge.addPacket(survivor);
        }
      }
    }
  }

  /**
   * Verifica condiciones de victoria
   */
  private checkVictoryConditions(): void {
    const activePlayers = this.getAllPlayers().filter(p => !p.isEliminated);
    
    // Victoria por Eliminación
    if (activePlayers.length === 1) {
      this.endGame(activePlayers[0].id.toString(), VictoryCondition.ELIMINATION);
      return;
    }
    
    // Victoria por Tiempo Límite
    if (this.elapsedTime >= this.gameDuration) {
      const winner = this.getPlayerWithMostNodes();
      this.endGame(winner?.id.toString() ?? null, VictoryCondition.TIME_LIMIT);
      return;
    }
    
    // Victoria por Dominancia (70% de nodos por 10 segundos)
    this.checkDominanceVictory();
  }

  /**
   * Verifica victoria por dominancia
   */
  private checkDominanceVictory(): void {
    const totalNodes = this.nodes.size;
    const threshold = Math.floor(totalNodes * GAME_CONSTANTS.DOMINANCE_THRESHOLD);
    
    for (const player of this.players.values()) {
      const controlledCount = player.controlledNodeCount;
      
      if (controlledCount >= threshold) {
        if (!player.isDominant) {
          player.startDominance();
          this.events.emit(GameEventType.DOMINANCE_STARTED, {
            playerId: player.id,
            timestamp: this.elapsedTime,
          });
        } else {
          player.updateDominanceTimer(this.attackInterval);
          
          // Verificar si cumplió los 10 segundos
          if (player.dominanceTimer >= GAME_CONSTANTS.DOMINANCE_DURATION) {
            this.endGame(player.id.toString(), VictoryCondition.DOMINANCE);
            return;
          }
        }
      } else if (player.isDominant) {
        player.stopDominance();
        this.events.emit(GameEventType.DOMINANCE_LOST, {
          playerId: player.id,
          timestamp: this.elapsedTime,
        });
      }
    }
  }

  /**
   * Obtiene el jugador con más nodos controlados
   */
  private getPlayerWithMostNodes(): Player | null {
    let maxNodes = 0;
    let winner: Player | null = null;
    
    for (const player of this.players.values()) {
      if (player.controlledNodeCount > maxNodes) {
        maxNodes = player.controlledNodeCount;
        winner = player;
      }
    }
    
    return winner;
  }

  // ============ Event System ============

  getEventEmitter(): EventEmitter {
    return this.events;
  }

  /**
   * Limpia todos los recursos del juego
   */
  private cleanup(): void {
    this.nodes.clear();
    this.edges.clear();
    this.players.clear();
    this.events.clear();
    this.elapsedTime = 0;
  }

  /**
   * Reinicia el juego manteniendo la configuración del grafo
   */
  reset(): void {
    // Limpiar asignaciones de nodos
    for (const node of this.nodes.values()) {
      node.setOwner(null);
      node.clearAssignments();
    }
    
    // Limpiar paquetes en aristas
    for (const edge of this.edges.values()) {
      edge.clearPackets();
    }
    
    // Reiniciar jugadores
    // Players are reset externally if needed
    
    this.elapsedTime = 0;
    this.gameStartTime = 0;
    this.setState(new MenuState());
  }
}
