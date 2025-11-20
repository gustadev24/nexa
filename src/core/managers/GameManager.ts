/**
 * GameManager - NEXA
 *
 * Central game state manager using singleton pattern.
 * Manages players, nodes, connections, and game lifecycle.
 *
 * Refactored to align with NEXA game document:
 * - Conservative energy system (distributed, not consumed)
 * - Real-time gameplay with intervals (20ms attack, 30ms defense)
 * - Energy in transit through connections
 * - Initial node tracking (losing it = defeat)
 * - Victory by controlling 70% nodes for 10 seconds
 */

import type {
  IConnection,
  IEnergyPacket,
  ID,
  IGameConfig,
  IGameState,
  INode,
  IPlayer,
} from "@/core/types";

import { DEFAULT_GAME_CONFIG, GamePhase, NodeType } from "@/core/types";

/**
 * GameManager Singleton
 *
 * Manages the complete game state and provides methods for game lifecycle.
 * Refactored for NEXA document specifications.
 */
export class GameManager {
  private static instance: GameManager | null = null;

  // Core game state
  private gameState: IGameState | null = null;
  private activeScene: Phaser.Scene | null = null;

  // Real-time intervals
  private attackIntervalTimer: number = 0;
  private defenseUpdateTimer: number = 0;

  // Victory condition tracking
  private dominationStartTime: number | null = null;
  private dominationPlayerId: ID | null = null;

  // Private constructor for singleton
  private constructor() {
    console.log("[GameManager] Instance created (NEXA Document Aligned)");
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
    console.log("[GameManager] Initializing game (NEXA System)...");

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

    // Reset timers
    this.attackIntervalTimer = 0;
    this.defenseUpdateTimer = 0;
    this.dominationStartTime = null;
    this.dominationPlayerId = null;

    console.log("[GameManager] Game initialized with NEXA config:", gameConfig);
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

    // Validate each player has an initial node
    for (const [playerId, player] of this.gameState.players) {
      const initialNode = this.gameState.nodes.get(player.initialNodeId);
      if (!initialNode) {
        console.error(`[GameManager] Cannot start: Player ${playerId} missing initial node`);
        return false;
      }
      if (initialNode.owner !== playerId) {
        console.error(
          `[GameManager] Cannot start: Player ${playerId} doesn't own their initial node`,
        );
        return false;
      }
    }

    // Transition to PLAYING phase
    this.gameState.phase = GamePhase.PLAYING;
    this.gameState.startTime = Date.now();
    this.gameState.lastUpdateTime = Date.now();

    console.log("[GameManager] Game started! (NEXA Real-Time System)");
    console.log(`[GameManager] Players: ${this.gameState.players.size}`);
    console.log(`[GameManager] Nodes: ${this.gameState.nodes.size}`);
    console.log(`[GameManager] Time Limit: ${this.gameState.config.timeLimit}ms (3 minutes)`);

    return true;
  }

  /**
   * Real-time update loop
   * Called every frame with delta time
   *
   * According to NEXA document:
   * - Attack energy sent at 20ms intervals
   * - Defense updated at 30ms intervals
   * - Check victory conditions
   * - Check time limit
   */
  public update(deltaTime: number): void {
    if (!this.gameState || this.gameState.phase !== GamePhase.PLAYING) {
      return;
    }

    // Update timers
    this.attackIntervalTimer += deltaTime;
    this.defenseUpdateTimer += deltaTime;

    // Defense update at 30ms intervals
    if (this.defenseUpdateTimer >= this.gameState.config.defenseUpdateInterval) {
      this.updateDefense();
      this.defenseUpdateTimer = 0;
    }

    // Attack energy emission at 20ms intervals
    if (this.attackIntervalTimer >= this.gameState.config.attackInterval) {
      this.processAttackEnergy();
      this.attackIntervalTimer = 0;
    }

    // Update energy packets in transit
    this.updateEnergyPackets(deltaTime);

    // Check victory conditions
    this.checkVictoryConditions();

    // Check time limit (3 minutes)
    this.checkTimeLimit();

    // Update timestamp
    this.gameState.lastUpdateTime = Date.now();
  }

  /**
   * Update defense energy in all nodes
   * Called at 30ms intervals as per document
   *
   * Defense = Energy not assigned to edges
   */
  private updateDefense(): void {
    if (!this.gameState) return;

    for (const [nodeId, node] of this.gameState.nodes) {
      if (node.owner === null) continue;

      const player = this.gameState.players.get(node.owner);
      if (!player) continue;

      // Calculate energy assigned to outgoing edges from this node
      let assignedToEdges = 0;
      for (const [, conn] of this.gameState.connections) {
        if (conn.sourceNodeId === nodeId && conn.assignedEnergy > 0) {
          assignedToEdges += conn.assignedEnergy;
        }
      }

      // Defense = Total player energy - energy assigned to all edges from all nodes
      // For simplicity, we calculate per-node defense based on node's proportion
      // In a full implementation, this would be more sophisticated
      const totalAssignedByPlayer = this.getTotalAssignedEnergyByPlayer(player.id);
      node.defenseEnergy = Math.max(0, player.totalEnergy - totalAssignedByPlayer);

      this.gameState.nodes.set(nodeId, node);
    }
  }

  /**
   * Process attack energy emission at 20ms intervals
   * Sends energy packets through connections
   */
  private processAttackEnergy(): void {
    if (!this.gameState) return;

    for (const [connectionId, connection] of this.gameState.connections) {
      if (connection.assignedEnergy <= 0) continue;

      const sourceNode = this.gameState.nodes.get(connection.sourceNodeId);
      if (!sourceNode || sourceNode.owner === null) continue;

      // Apply attack multiplier if source node is an ATTACK type
      let effectiveEnergy = connection.assignedEnergy;
      if (sourceNode.type === NodeType.ATTACK) {
        effectiveEnergy *= 2.0; // Double attack energy
      }

      // Create energy packet
      const packet: IEnergyPacket = {
        id: `packet-${Date.now()}-${Math.random()}`,
        ownerId: sourceNode.owner,
        amount: effectiveEnergy,
        sourceNodeId: connection.sourceNodeId,
        targetNodeId: connection.targetNodeId,
        progress: 0,
        timestamp: Date.now(),
      };

      connection.energyPackets.push(packet);
      this.gameState.connections.set(connectionId, connection);
    }
  }

  /**
   * Update energy packets traveling through connections
   * Move packets based on connection weight and energy speed
   */
  private updateEnergyPackets(deltaTime: number): void {
    if (!this.gameState) return;

    for (const [connectionId, connection] of this.gameState.connections) {
      const packetsToRemove: ID[] = [];

      for (const packet of connection.energyPackets) {
        // Calculate progress based on connection weight and energy speed
        const speed = 1 / connection.weight; // Inverse of weight
        packet.progress += speed * deltaTime;

        // Check if packet reached destination
        if (packet.progress >= 1.0) {
          this.handlePacketArrival(packet, connection);
          packetsToRemove.push(packet.id);
        }
      }

      // Remove arrived packets
      connection.energyPackets = connection.energyPackets.filter(
        (p) => !packetsToRemove.includes(p.id),
      );

      // Check for collisions between enemy packets
      this.resolvePacketCollisions(connection);

      this.gameState.connections.set(connectionId, connection);
    }
  }

  /**
   * Handle energy packet arrival at target node
   * Implements attack vs defense logic from document
   */
  private handlePacketArrival(packet: IEnergyPacket, connection: IConnection): void {
    if (!this.gameState) return;

    const targetNode = this.gameState.nodes.get(connection.targetNodeId);
    if (!targetNode) return;

    // Case 1: Friendly energy arriving at friendly node - add to defense
    if (targetNode.owner === packet.ownerId) {
      targetNode.defenseEnergy += packet.amount;
      this.gameState.nodes.set(targetNode.id, targetNode);
      return;
    }

    // Case 2: Enemy energy arriving at enemy node - attack!
    if (targetNode.owner !== null && targetNode.owner !== packet.ownerId) {
      this.resolveAttack(packet, targetNode);
      return;
    }

    // Case 3: Energy arriving at neutral node - capture if enough energy
    if (targetNode.owner === null) {
      this.captureNeutralNode(packet, targetNode);
      return;
    }
  }

  /**
   * Resolve attack on a node
   * Compare attack energy with defense energy (with multipliers)
   */
  private resolveAttack(packet: IEnergyPacket, targetNode: INode): void {
    if (!this.gameState) return;

    let effectiveDefense = targetNode.defenseEnergy;

    // Apply defense multiplier if node is DEFENSE type
    if (targetNode.type === NodeType.DEFENSE) {
      effectiveDefense *= 2.0;
    }

    console.log(
      `[GameManager] Attack on node ${targetNode.id}: ${packet.amount} vs ${effectiveDefense} defense`,
    );

    // Attack > Defense: Node captured
    if (packet.amount > effectiveDefense) {
      this.captureNode(targetNode, packet.ownerId);
    }
    // Attack == Defense: Node becomes neutral
    else if (packet.amount === effectiveDefense) {
      this.neutralizeNode(targetNode);
    }
    // Attack < Defense: Attack fails, defense reduced
    else {
      targetNode.defenseEnergy -= packet.amount;
      this.gameState.nodes.set(targetNode.id, targetNode);
      console.log(`[GameManager] Attack failed. Remaining defense: ${targetNode.defenseEnergy}`);
    }
  }

  /**
   * Capture a node
   * Updates owner, applies energy bonuses, checks for initial node loss
   */
  private captureNode(node: INode, newOwnerId: ID): void {
    if (!this.gameState) return;

    const previousOwner = node.owner;
    console.log(`[GameManager] Node ${node.id} captured by ${newOwnerId} from ${previousOwner}`);

    // Check if this is an initial node - if so, previous owner is defeated
    if (node.isInitialNode && previousOwner !== null) {
      console.log(`[GameManager] INITIAL NODE CAPTURED! Player ${previousOwner} is DEFEATED!`);
      this.eliminatePlayer(previousOwner);
    }

    // Remove from previous owner's controlled nodes
    if (previousOwner !== null) {
      const prevPlayer = this.gameState.players.get(previousOwner);
      if (prevPlayer) {
        prevPlayer.controlledNodes = prevPlayer.controlledNodes.filter((id) => id !== node.id);
        this.gameState.players.set(previousOwner, prevPlayer);
      }
    }

    // Update node owner
    node.owner = newOwnerId;
    node.defenseEnergy = 0; // Reset defense after capture
    this.gameState.nodes.set(node.id, node);

    // Add to new owner's controlled nodes
    const newOwner = this.gameState.players.get(newOwnerId);
    if (newOwner) {
      if (!newOwner.controlledNodes.includes(node.id)) {
        newOwner.controlledNodes.push(node.id);
      }

      // Apply energy bonus if node is ENERGY or SUPER_ENERGY type
      if (node.type === NodeType.ENERGY) {
        newOwner.totalEnergy += 50;
        console.log(
          `[GameManager] Energy bonus! Player ${newOwnerId} total energy: ${newOwner.totalEnergy}`,
        );
      } else if (node.type === NodeType.SUPER_ENERGY) {
        newOwner.totalEnergy += 150;
        console.log(
          `[GameManager] Super Energy bonus! Player ${newOwnerId} total energy: ${newOwner.totalEnergy}`,
        );
      }

      this.gameState.players.set(newOwnerId, newOwner);
    }

    // Notify scene of capture
    this.notifySceneUpdate("node-captured", {
      nodeId: node.id,
      newOwnerId: newOwnerId,
      previousOwner: previousOwner,
    });
  }

  /**
   * Capture a neutral node
   */
  private captureNeutralNode(packet: IEnergyPacket, node: INode): void {
    this.captureNode(node, packet.ownerId);
  }

  /**
   * Neutralize a node (when attack == defense)
   */
  private neutralizeNode(node: INode): void {
    if (!this.gameState) return;

    const previousOwner = node.owner;
    console.log(`[GameManager] Node ${node.id} neutralized (exact defense)`);

    // Check if this is an initial node
    if (node.isInitialNode && previousOwner !== null) {
      console.log(`[GameManager] INITIAL NODE NEUTRALIZED! Player ${previousOwner} is DEFEATED!`);
      this.eliminatePlayer(previousOwner);
    }

    // Remove from owner's controlled nodes
    if (previousOwner !== null) {
      const player = this.gameState.players.get(previousOwner);
      if (player) {
        player.controlledNodes = player.controlledNodes.filter((id) => id !== node.id);
        this.gameState.players.set(previousOwner, player);
      }
    }

    node.owner = null;
    node.defenseEnergy = 0;
    this.gameState.nodes.set(node.id, node);

    this.notifySceneUpdate("node-neutralized", {
      nodeId: node.id,
      previousOwner: previousOwner,
    });
  }

  /**
   * Resolve collisions between enemy energy packets on same connection
   * If equal, both destroyed. If unequal, stronger survives with reduced amount.
   */
  private resolvePacketCollisions(connection: IConnection): void {
    const packets = connection.energyPackets;

    for (let i = 0; i < packets.length; i++) {
      for (let j = i + 1; j < packets.length; j++) {
        const p1 = packets[i];
        const p2 = packets[j];

        // Check if they're enemies and close enough to collide
        if (p1.ownerId !== p2.ownerId && Math.abs(p1.progress - p2.progress) < 0.1) {
          console.log(`[GameManager] Energy collision on connection ${connection.id}`);

          if (p1.amount === p2.amount) {
            // Equal: both destroyed
            packets.splice(j, 1);
            packets.splice(i, 1);
            i--;
            break;
          } else if (p1.amount > p2.amount) {
            // P1 survives
            p1.amount -= p2.amount;
            packets.splice(j, 1);
            j--;
          } else {
            // P2 survives
            p2.amount -= p1.amount;
            packets.splice(i, 1);
            i--;
            break;
          }
        }
      }
    }
  }

  /**
   * Eliminate a player (when initial node is lost)
   */
  private eliminatePlayer(playerId: ID): void {
    if (!this.gameState) return;

    const player = this.gameState.players.get(playerId);
    if (!player) return;

    player.isEliminated = true;
    player.isActive = false;
    this.gameState.players.set(playerId, player);

    console.log(`[GameManager] Player ${playerId} ELIMINATED!`);

    // Check if only one player remains
    const activePlayers = Array.from(this.gameState.players.values()).filter(
      (p) => !p.isEliminated,
    );

    if (activePlayers.length === 1) {
      this.endGame(activePlayers[0].id);
    }
  }

  /**
   * Check victory conditions
   * - 70% node control for 10 seconds
   */
  private checkVictoryConditions(): void {
    if (!this.gameState) return;

    const totalNodes = this.gameState.nodes.size;
    const requiredNodes = Math.ceil(
      (totalNodes * this.gameState.config.victoryConditions.nodeControlPercentage) / 100,
    );

    for (const [playerId, player] of this.gameState.players) {
      if (player.isEliminated) continue;

      const controlledNodes = player.controlledNodes.length;

      // Check if player controls enough nodes
      if (controlledNodes >= requiredNodes) {
        // Start/continue domination timer
        if (this.dominationPlayerId !== playerId) {
          this.dominationPlayerId = playerId;
          this.dominationStartTime = Date.now();
          console.log(
            `[GameManager] Player ${playerId} started domination! (${controlledNodes}/${totalNodes} nodes)`,
          );
        } else if (this.dominationStartTime !== null) {
          const dominationDuration = Date.now() - this.dominationStartTime;
          if (dominationDuration >= this.gameState.config.victoryConditions.controlDuration) {
            console.log(`[GameManager] Player ${playerId} achieved DOMINATION VICTORY!`);
            this.endGame(playerId);
            return;
          }
        }
      } else {
        // Player lost domination
        if (this.dominationPlayerId === playerId) {
          console.log(`[GameManager] Player ${playerId} lost domination`);
          this.dominationPlayerId = null;
          this.dominationStartTime = null;
        }
      }
    }
  }

  /**
   * Check time limit (3 minutes)
   * Winner is player with most nodes
   */
  private checkTimeLimit(): void {
    if (!this.gameState) return;

    const elapsed = Date.now() - this.gameState.startTime;
    if (elapsed >= this.gameState.config.timeLimit) {
      console.log("[GameManager] Time limit reached!");

      // Find player with most nodes
      let maxNodes = 0;
      let winnerId: ID | null = null;
      let tie = false;

      for (const [playerId, player] of this.gameState.players) {
        if (player.isEliminated) continue;

        const nodeCount = player.controlledNodes.length;
        if (nodeCount > maxNodes) {
          maxNodes = nodeCount;
          winnerId = playerId;
          tie = false;
        } else if (nodeCount === maxNodes) {
          tie = true;
        }
      }

      if (tie) {
        console.log("[GameManager] Game ended in TIE!");
        this.endGame(null);
      } else if (winnerId) {
        console.log(`[GameManager] Player ${winnerId} wins by node count!`);
        this.endGame(winnerId);
      }
    }
  }

  /**
   * Get total energy assigned to edges by a player
   */
  private getTotalAssignedEnergyByPlayer(playerId: ID): number {
    if (!this.gameState) return 0;

    let total = 0;
    for (const [_, connection] of this.gameState.connections) {
      const sourceNode = this.gameState.nodes.get(connection.sourceNodeId);
      if (sourceNode && sourceNode.owner === playerId) {
        total += connection.assignedEnergy;
      }
    }
    return total;
  }

  /**
   * Assign energy to a connection (for attacks)
   */
  public assignEnergyToConnection(connectionId: ID, amount: number): boolean {
    if (!this.gameState) return false;

    const connection = this.gameState.connections.get(connectionId);
    if (!connection) return false;

    const sourceNode = this.gameState.nodes.get(connection.sourceNodeId);
    if (!sourceNode || sourceNode.owner === null) return false;

    const player = this.gameState.players.get(sourceNode.owner);
    if (!player) return false;

    // Check if player has enough total energy to assign
    const totalAssigned = this.getTotalAssignedEnergyByPlayer(player.id);
    if (totalAssigned + amount > player.totalEnergy) {
      console.warn(`[GameManager] Not enough energy to assign ${amount} to connection`);
      return false;
    }

    connection.assignedEnergy = amount;
    this.gameState.connections.set(connectionId, connection);

    console.log(`[GameManager] Assigned ${amount} energy to connection ${connectionId}`);
    return true;
  }

  /**
   * Reset the game to initial state
   */
  public resetGame(preserveConfig: boolean = true): void {
    console.log("[GameManager] Resetting game...");

    if (!this.gameState) {
      console.warn("[GameManager] No game state to reset");
      return;
    }

    const config = preserveConfig ? this.gameState.config : DEFAULT_GAME_CONFIG;

    this.gameState.players.clear();
    this.gameState.nodes.clear();
    this.gameState.connections.clear();

    this.gameState.phase = GamePhase.SETUP;
    this.gameState.currentTurn = 0;
    this.gameState.currentPlayerId = null;
    this.gameState.winner = null;
    this.gameState.startTime = Date.now();
    this.gameState.lastUpdateTime = Date.now();
    this.gameState.config = config;

    this.attackIntervalTimer = 0;
    this.defenseUpdateTimer = 0;
    this.dominationStartTime = null;
    this.dominationPlayerId = null;

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
  public endGame(winnerId?: ID | null): void {
    if (!this.gameState) return;

    this.gameState.phase = GamePhase.GAME_OVER;
    this.gameState.winner = winnerId ?? null;

    console.log("[GameManager] Game ended");
    if (winnerId) {
      console.log(`[GameManager] Winner: ${winnerId}`);
    } else {
      console.log("[GameManager] Game ended in tie");
    }

    this.notifySceneUpdate("game-over", { winnerId });
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
   * Player must have initialNodeId set
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
    console.log(
      `[GameManager] Player added: ${player.name} (${player.id}) - Initial Node: ${player.initialNodeId}`,
    );
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
    console.log(
      `[GameManager] Node added: ${node.id} (${node.type}) at (${node.position.x}, ${node.position.y})`,
    );
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
   * Get current turn (kept for compatibility, but game is real-time now)
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
    timeRemaining: number;
  } {
    if (!this.gameState) {
      return {
        players: 0,
        nodes: 0,
        connections: 0,
        turn: 0,
        phase: null,
        duration: 0,
        timeRemaining: 0,
      };
    }

    const duration = Date.now() - this.gameState.startTime;
    const timeRemaining = Math.max(0, this.gameState.config.timeLimit - duration);

    return {
      players: this.gameState.players.size,
      nodes: this.gameState.nodes.size,
      connections: this.gameState.connections.size,
      turn: this.gameState.currentTurn,
      phase: this.gameState.phase,
      duration: duration,
      timeRemaining: timeRemaining,
    };
  }

  /**
   * Notificar a la escena sobre actualizaciones del juego
   */
  private notifySceneUpdate(action: string, data: any): void {
    if (this.activeScene) {
      this.activeScene.events.emit("game-update", { action, data });
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
