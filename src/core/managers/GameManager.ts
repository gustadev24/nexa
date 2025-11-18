/**
 * GameManager - NEXA
 *
 * Central game state manager using singleton pattern.
 * Manages players, nodes, connections, and game lifecycle.
 */

import type { IPlayer, INode, IConnection, IGameState, IGameConfig, ID } from "@/core/types";

import { GamePhase, DEFAULT_GAME_CONFIG } from "@/core/types";

/**
 * GameManager Singleton
 *
 * Manages the complete game state and provides methods for game lifecycle.
 */
export class GameManager {
  private static instance: GameManager | null = null;

  // Core game state
  private gameState: IGameState | null = null;
  private activeScene: Phaser.Scene | null = null;

  // Private constructor for singleton
  private constructor() {
    console.log("[GameManager] Instance created");
  }

  /**
   * Get the singleton instance of GameManager
   */
  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  /**
   * Initialize the game with configuration
   */
  public initialize(config?: Partial<IGameConfig>): void {
    console.log("[GameManager] Initializing game...");

    const gameConfig: IGameConfig = {
      ...DEFAULT_GAME_CONFIG,
      ...config,
    };

    this.gameState = {
      id: `game-${Date.now()}`,
      phase: GamePhase.SETUP,
      currentTurn: 0,
      currentPlayerId: null,
      players: new Map(),
      nodes: new Map(),
      connections: new Map(),
      startTime: Date.now(),
      lastUpdateTime: Date.now(),
      winner: null,
      config: gameConfig,
    };

    console.log("[GameManager] Game initialized with config:", gameConfig);
  }

  /**
   * Start the game
   * Transitions from SETUP to PLAYING phase
   */
  public startGame(): boolean {
    if (!this.gameState) {
      console.error("[GameManager] Cannot start game: Not initialized");
      return false;
    }

    if (this.gameState.phase !== GamePhase.SETUP) {
      console.warn("[GameManager] Game already started");
      return false;
    }

    // Validate minimum requirements
    if (this.gameState.players.size < this.gameState.config.minPlayers) {
      console.error(
        "[GameManager] Cannot start: Not enough players",
        `(${this.gameState.players.size}/${this.gameState.config.minPlayers})`,
      );
      return false;
    }

    // Transition to PLAYING phase
    this.gameState.phase = GamePhase.PLAYING;
    this.gameState.startTime = Date.now();
    this.gameState.lastUpdateTime = Date.now();

    // Set first player as active
    const firstPlayer = Array.from(this.gameState.players.values())[0];
    if (firstPlayer) {
      this.gameState.currentPlayerId = firstPlayer.id;
    }

    console.log("[GameManager] Game started!");
    console.log(`[GameManager] Players: ${this.gameState.players.size}`);
    console.log(`[GameManager] Nodes: ${this.gameState.nodes.size}`);

    return true;
  }

  /**
   * Reset the game to initial state
   * Can optionally preserve configuration
   */
  public resetGame(preserveConfig: boolean = true): void {
    console.log("[GameManager] Resetting game...");

    if (!this.gameState) {
      console.warn("[GameManager] No game state to reset");
      return;
    }

    const config = preserveConfig ? this.gameState.config : DEFAULT_GAME_CONFIG;

    // Clear all game data
    this.gameState.players.clear();
    this.gameState.nodes.clear();
    this.gameState.connections.clear();

    // Reset state
    this.gameState.phase = GamePhase.SETUP;
    this.gameState.currentTurn = 0;
    this.gameState.currentPlayerId = null;
    this.gameState.winner = null;
    this.gameState.startTime = Date.now();
    this.gameState.lastUpdateTime = Date.now();
    this.gameState.config = config;

    console.log("[GameManager] Game reset complete");
  }

  /**
   * Pause the game
   */
  public pauseGame(): void {
    if (!this.gameState) return;

    if (this.gameState.phase === GamePhase.PLAYING) {
      this.gameState.phase = GamePhase.PAUSED;
      console.log("[GameManager] Game paused");
    }
  }

  /**
   * Resume the game
   */
  public resumeGame(): void {
    if (!this.gameState) return;

    if (this.gameState.phase === GamePhase.PAUSED) {
      this.gameState.phase = GamePhase.PLAYING;
      console.log("[GameManager] Game resumed");
    }
  }

  /**
   * End the game
   */
  public endGame(winnerId?: ID): void {
    if (!this.gameState) return;

    this.gameState.phase = GamePhase.GAME_OVER;
    this.gameState.winner = winnerId ?? null;

    console.log("[GameManager] Game ended");
    if (winnerId) {
      console.log(`[GameManager] Winner: ${winnerId}`);
    }
  }

  /**
   * Set the active Phaser scene
   */
  public setActiveScene(scene: Phaser.Scene): void {
    this.activeScene = scene;
    console.log(`[GameManager] Active scene set: ${scene.scene.key}`);
  }

  /**
   * Get the active Phaser scene
   */
  public getActiveScene(): Phaser.Scene | null {
    return this.activeScene;
  }

  /**
   * Add a player to the game
   */
  public addPlayer(player: IPlayer): boolean {
    if (!this.gameState) {
      console.error("[GameManager] Cannot add player: Game not initialized");
      return false;
    }

    if (this.gameState.players.size >= this.gameState.config.maxPlayers) {
      console.error("[GameManager] Cannot add player: Max players reached");
      return false;
    }

    if (this.gameState.players.has(player.id)) {
      console.warn(`[GameManager] Player ${player.id} already exists`);
      return false;
    }

    this.gameState.players.set(player.id, player);
    console.log(`[GameManager] Player added: ${player.name} (${player.id})`);
    return true;
  }

  /**
   * Remove a player from the game
   */
  public removePlayer(playerId: ID): boolean {
    if (!this.gameState) return false;

    const removed = this.gameState.players.delete(playerId);
    if (removed) {
      console.log(`[GameManager] Player removed: ${playerId}`);
    }
    return removed;
  }

  /**
   * Get a player by ID
   */
  public getPlayer(playerId: ID): IPlayer | undefined {
    return this.gameState?.players.get(playerId);
  }

  /**
   * Get all players
   */
  public getPlayers(): Map<ID, IPlayer> {
    return this.gameState?.players ?? new Map();
  }

  /**
   * Add a node to the game
   */
  public addNode(node: INode): boolean {
    if (!this.gameState) {
      console.error("[GameManager] Cannot add node: Game not initialized");
      return false;
    }

    if (this.gameState.nodes.has(node.id)) {
      console.warn(`[GameManager] Node ${node.id} already exists`);
      return false;
    }

    this.gameState.nodes.set(node.id, node);
    console.log(`[GameManager] Node added: ${node.id} at (${node.position.x}, ${node.position.y})`);
    return true;
  }

  /**
   * Remove a node from the game
   */
  public removeNode(nodeId: ID): boolean {
    if (!this.gameState) return false;

    const removed = this.gameState.nodes.delete(nodeId);
    if (removed) {
      console.log(`[GameManager] Node removed: ${nodeId}`);
    }
    return removed;
  }

  /**
   * Get a node by ID
   */
  public getNode(nodeId: ID): INode | undefined {
    return this.gameState?.nodes.get(nodeId);
  }

  /**
   * Get all nodes
   */
  public getNodes(): Map<ID, INode> {
    return this.gameState?.nodes ?? new Map();
  }

  /**
   * Add a connection to the game
   */
  public addConnection(connection: IConnection): boolean {
    if (!this.gameState) {
      console.error("[GameManager] Cannot add connection: Game not initialized");
      return false;
    }

    if (this.gameState.connections.has(connection.id)) {
      console.warn(`[GameManager] Connection ${connection.id} already exists`);
      return false;
    }

    this.gameState.connections.set(connection.id, connection);
    console.log(
      `[GameManager] Connection added: ${connection.sourceNodeId} -> ${connection.targetNodeId}`,
    );
    return true;
  }

  /**
   * Remove a connection from the game
   */
  public removeConnection(connectionId: ID): boolean {
    if (!this.gameState) return false;

    const removed = this.gameState.connections.delete(connectionId);
    if (removed) {
      console.log(`[GameManager] Connection removed: ${connectionId}`);
    }
    return removed;
  }

  /**
   * Get a connection by ID
   */
  public getConnection(connectionId: ID): IConnection | undefined {
    return this.gameState?.connections.get(connectionId);
  }

  /**
   * Get all connections
   */
  public getConnections(): Map<ID, IConnection> {
    return this.gameState?.connections ?? new Map();
  }

  /**
   * Get the complete game state
   */
  public getGameState(): IGameState | null {
    return this.gameState;
  }

  /**
   * Get current game phase
   */
  public getGamePhase(): GamePhase | null {
    return this.gameState?.phase ?? null;
  }

  /**
   * Get current turn
   */
  public getCurrentTurn(): number {
    return this.gameState?.currentTurn ?? 0;
  }

  /**
   * Get current player ID
   */
  public getCurrentPlayerId(): ID | null {
    return this.gameState?.currentPlayerId ?? null;
  }

  /**
   * Advance to next turn
   */
  public nextTurn(): void {
    if (!this.gameState) return;

    this.gameState.currentTurn++;
    this.gameState.lastUpdateTime = Date.now();

    // Rotate to next player
    const playerIds = Array.from(this.gameState.players.keys());
    const currentIndex = playerIds.indexOf(this.gameState.currentPlayerId as any);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    this.gameState.currentPlayerId = playerIds[nextIndex];

    console.log(
      `[GameManager] Turn ${this.gameState.currentTurn} - Player: ${this.gameState.currentPlayerId}`,
    );
  }

  /**
   * Update game state timestamp
   */
  public updateTimestamp(): void {
    if (this.gameState) {
      this.gameState.lastUpdateTime = Date.now();
    }
  }

  /**
   * Get game statistics
   */
  public getStats(): {
    players: number;
    nodes: number;
    connections: number;
    turn: number;
    phase: GamePhase | null;
    duration: number;
  } {
    if (!this.gameState) {
      return {
        players: 0,
        nodes: 0,
        connections: 0,
        turn: 0,
        phase: null,
        duration: 0,
      };
    }

    return {
      players: this.gameState.players.size,
      nodes: this.gameState.nodes.size,
      connections: this.gameState.connections.size,
      turn: this.gameState.currentTurn,
      phase: this.gameState.phase,
      duration: Date.now() - this.gameState.startTime,
    };
  }

  /**
   * Ticket 4: Acción Expandir - Convertir nodo neutral a propio
   * Permite al jugador expandirse a un nodo neutral conectado
   * 
   * @param nodeId - ID del nodo neutral a conquistar
   * @returns true si la expansión fue exitosa, false si falló
   */
  public expand(nodeId: ID): boolean {
    if (!this.gameState) {
      console.error("[GameManager] Cannot expand: Game not initialized");
      return false;
    }

    if (this.gameState.phase !== GamePhase.PLAYING) {
      console.error("[GameManager] Cannot expand: Game not in PLAYING phase");
      return false;
    }

    const currentPlayerId = this.gameState.currentPlayerId;
    if (!currentPlayerId) {
      console.error("[GameManager] Cannot expand: No current player");
      return false;
    }

    const targetNode = this.gameState.nodes.get(nodeId);
    if (!targetNode) {
      console.error(`[GameManager] Cannot expand: Node ${nodeId} not found`);
      return false;
    }

    // Subtarea 1: Validar que el nodo sea neutral
    if (targetNode.owner !== null) {
      console.error(`[GameManager] Cannot expand: Node ${nodeId} is not neutral (owner: ${targetNode.owner})`);
      return false;
    }

    // Subtarea 2: Verificar que esté conectado a un nodo propio
    const { isConnected, sourceNode } = this.findConnectedOwnedNode(targetNode, currentPlayerId);
    if (!isConnected || !sourceNode) {
      console.error(`[GameManager] Cannot expand: Node ${nodeId} is not connected to any owned node`);
      return false;
    }

    // Subtarea 3: Reducir energía del nodo origen
    const expansionCost = 10; // Costo de energía para expandir
    if (sourceNode.energy < expansionCost) {
      console.error(`[GameManager] Cannot expand: Source node ${sourceNode.id} has insufficient energy (${sourceNode.energy}/${expansionCost})`);
      return false;
    }

    sourceNode.energy -= expansionCost;
    this.gameState.nodes.set(sourceNode.id, sourceNode);

    // Subtarea 4: Cambiar dueño del nodo al jugador actual
    targetNode.owner = currentPlayerId;
    this.gameState.nodes.set(targetNode.id, targetNode);

    // Actualizar lista de nodos controlados del jugador
    const player = this.gameState.players.get(currentPlayerId);
    if (player && !player.controlledNodes.includes(nodeId)) {
      player.controlledNodes.push(nodeId);
      this.gameState.players.set(currentPlayerId, player);
    }

    console.log(`[GameManager] Player ${currentPlayerId} expanded to node ${nodeId} (cost: ${expansionCost} energy from ${sourceNode.id})`);

    // Subtarea 5: Notificar a la escena para actualizar colores
    this.notifySceneUpdate('expand', { nodeId, playerId: currentPlayerId, sourceNodeId: sourceNode.id });

    return true;
  }

  /**
   * Buscar un nodo propio conectado al nodo objetivo
   */
  private findConnectedOwnedNode(
    targetNode: INode,
    playerId: ID
  ): { isConnected: boolean; sourceNode: INode | null } {
    if (!this.gameState) {
      return { isConnected: false, sourceNode: null };
    }

    // Buscar en todos los nodos del jugador
    const ownedNodes = Array.from(this.gameState.nodes.values()).filter(
      node => node.owner === playerId
    );

    for (const ownedNode of ownedNodes) {
      // Verificar si el nodo propio tiene conexión al nodo objetivo
      if (ownedNode.connections.includes(targetNode.id)) {
        return { isConnected: true, sourceNode: ownedNode };
      }
    }

    return { isConnected: false, sourceNode: null };
  }

  /**
   * Notificar a la escena sobre actualizaciones del juego
   */
  private notifySceneUpdate(action: string, data: any): void {
    if (this.activeScene) {
      // Emitir evento personalizado en la escena
      this.activeScene.events.emit('game-update', { action, data });
      console.log(`[GameManager] Scene notified: ${action}`, data);
    }
  }

  /**
   * Check if game is initialized
   */
  public isInitialized(): boolean {
    return this.gameState !== null;
  }

  /**
   * Check if game is playing
   */
  public isPlaying(): boolean {
    return this.gameState?.phase === GamePhase.PLAYING;
  }

  /**
   * Check if game is paused
   */
  public isPaused(): boolean {
    return this.gameState?.phase === GamePhase.PAUSED;
  }

  /**
   * Check if game is over
   */
  public isGameOver(): boolean {
    return this.gameState?.phase === GamePhase.GAME_OVER;
  }

  /**
   * Destroy the GameManager instance (for testing/cleanup)
   */
  public static destroy(): void {
    if (GameManager.instance) {
      console.log("[GameManager] Instance destroyed");
      GameManager.instance = null;
    }
  }
}

// Export singleton instance getter as default
export default GameManager.getInstance;
