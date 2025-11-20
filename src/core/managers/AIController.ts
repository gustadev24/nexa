/**
 * AIController -
 NEXA
 *
 * AI controller for enemy players.
 * Refactored to align with NEXA document specifications:
 * - Conservative energy system (distributed, not consumed)
 * - Real-time decision making
 * - Energy assignment to edges for attacks
 * - Strategic node capture
 */

import type { ID, IGameState, INode, IPlayer, IConnection } from "@/core/types";
import { GamePhase, PlayerType, NodeType } from "@/core/types";
import { GameManager } from "./GameManager";

/**
 * AIController Singleton
 * Controls AI player decisions in real-time
 */
export class AIController {
  private static instance: AIController | null = null;
  private gameManager: GameManager;
  private lastDecisionTime: number = 0;

  // AI behavior configuration (aligned with NEXA document)
  private aiDelay: number = 1000; // Decision interval in ms
  private aiAggression: number = 70; // Aggression level (0-100)

  private constructor() {
    this.gameManager = GameManager.getInstance();
    console.log("[AIController] AI Controller created (NEXA System)");
    console.log(
      `[AIController] Config - Delay: ${this.aiDelay}ms, Aggression: ${this.aiAggression}%`,
    );
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AIController {
    if (!AIController.instance) {
      AIController.instance = new AIController();
    }
    return AIController.instance;
  }

  /**
   * Initialize the controller
   */
  public initialize(): void {
    this.lastDecisionTime = 0;
    console.log("[AIController] Initialized");
  }

  /**
   * Main update loop - called every frame
   * @param deltaTime - Time elapsed since last frame (ms)
   */
  public update(deltaTime: number): void {
    const gameState = this.gameManager.getGameState();

    // Only process if game is active
    if (!gameState || gameState.phase !== GamePhase.PLAYING) {
      return;
    }

    // Update timer
    this.lastDecisionTime += deltaTime;

    // Make decisions at intervals
    if (this.lastDecisionTime >= this.aiDelay) {
      this.lastDecisionTime = 0;
      this.makeDecisions(gameState);
    }
  }

  /**
   * Make decisions for all AI players
   */
  private makeDecisions(gameState: IGameState): void {
    const aiPlayers = this.getAIPlayers(gameState);

    for (const player of aiPlayers) {
      this.decideForPlayer(player, gameState);
    }
  }

  /**
   * Make decision for a specific AI player
   * Aligned with NEXA document:
   * - Assign energy to edges for attacks
   * - Manage energy distribution between attack and defense
   * - Target strategic nodes (energy nodes, weak nodes, etc.)
   */
  private decideForPlayer(player: IPlayer, gameState: IGameState): void {
    const controlledNodes = this.getControlledNodes(player.id, gameState);

    if (controlledNodes.length === 0) {
      return;
    }

    // Check aggression roll
    const random = Math.random() * 100;
    if (random > this.aiAggression) {
      console.log(`[AIController] ${player.name} decides NOT to act this round`);
      return;
    }

    // Strategy: Find best attack opportunity
    const attackOpportunity = this.findBestAttackOpportunity(player, controlledNodes, gameState);

    if (attackOpportunity) {
      this.executeAttack(player, attackOpportunity, gameState);
    } else {
      // No good attack found, focus on defense
      this.adjustDefense(player, controlledNodes, gameState);
    }
  }

  /**
   * Find the best attack opportunity
   * Prioritizes:
   * 1. Energy nodes (give energy bonus)
   * 2. Weak enemy nodes (low defense)
   * 3. Neutral nodes
   * 4. Strategic positions
   */
  private findBestAttackOpportunity(
    player: IPlayer,
    controlledNodes: INode[],
    gameState: IGameState,
  ): { connection: IConnection; targetNode: INode; sourceNode: INode } | null {
    let bestOpportunity: {
      connection: IConnection;
      targetNode: INode;
      sourceNode: INode;
      priority: number;
    } | null = null;

    for (const sourceNode of controlledNodes) {
      // Find connections from this node
      for (const [_, connection] of gameState.connections) {
        if (connection.sourceNodeId !== sourceNode.id) continue;

        const targetNode = gameState.nodes.get(connection.targetNodeId);
        if (!targetNode) continue;

        // Skip if already owned by us
        if (targetNode.owner === player.id) continue;

        // Calculate priority
        let priority = 0;

        // Priority 1: Energy nodes (high value)
        if (targetNode.type === NodeType.ENERGY) {
          priority += 100;
        } else if (targetNode.type === NodeType.SUPER_ENERGY) {
          priority += 200;
        }

        // Priority 2: Neutral nodes (easy capture)
        if (targetNode.owner === null) {
          priority += 50;
        }

        // Priority 3: Weak enemy nodes
        if (targetNode.owner !== null && targetNode.owner !== player.id) {
          const defenseStrength = targetNode.defenseEnergy;
          if (defenseStrength < 30) {
            priority += 40;
          } else if (defenseStrength < 60) {
            priority += 20;
          }
        }

        // Priority 4: Initial nodes (high strategic value but dangerous)
        if (targetNode.isInitialNode && targetNode.owner !== player.id) {
          priority += 150; // High reward for eliminating opponent
        }

        // Update best opportunity
        if (!bestOpportunity || priority > bestOpportunity.priority) {
          bestOpportunity = { connection, targetNode, sourceNode, priority };
        }
      }
    }

    if (bestOpportunity) {
      return {
        connection: bestOpportunity.connection,
        targetNode: bestOpportunity.targetNode,
        sourceNode: bestOpportunity.sourceNode,
      };
    }

    return null;
  }

  /**
   * Execute an attack by assigning energy to a connection
   * According to NEXA document:
   * - Energy is assigned to edges, not consumed
   * - Energy travels through connection as packets
   * - Attack energy sent at 20ms intervals
   */
  private executeAttack(
    player: IPlayer,
    opportunity: { connection: IConnection; targetNode: INode; sourceNode: INode },
    gameState: IGameState,
  ): void {
    const { connection, targetNode } = opportunity;

    // Calculate how much energy to assign
    // Strategy: assign enough to overcome defense + some margin
    let targetDefense = targetNode.defenseEnergy;

    // Apply defense multiplier if target is defense node
    if (targetNode.type === NodeType.DEFENSE) {
      targetDefense *= 2.0;
    }

    // Assign energy slightly higher than defense
    const energyToAssign = Math.min(
      player.totalEnergy * 0.3, // Max 30% of total energy
      targetDefense + 20, // Defense + margin
    );

    // Check if we have enough energy available
    const totalAssigned = this.getTotalAssignedEnergyByPlayer(player.id, gameState);
    const availableEnergy = player.totalEnergy - totalAssigned;

    if (availableEnergy < energyToAssign) {
      console.log(
        `[AIController] ${player.name} insufficient energy for attack (${availableEnergy}/${energyToAssign})`,
      );
      return;
    }

    // Assign energy to connection
    const success = this.gameManager.assignEnergyToConnection(connection.id, energyToAssign);

    if (success) {
      console.log(
        `[AIController] ${player.name} assigned ${energyToAssign} energy to attack node ${targetNode.id} (type: ${targetNode.type})`,
      );
    }
  }

  /**
   * Adjust defense by redistributing energy
   * Reduces energy assigned to edges to increase defense
   */
  private adjustDefense(player: IPlayer, _controlledNodes: INode[], gameState: IGameState): void {
    // Find connections with assigned energy
    for (const [_, connection] of gameState.connections) {
      const sourceNode = gameState.nodes.get(connection.sourceNodeId);
      if (!sourceNode || sourceNode.owner !== player.id) continue;

      if (connection.assignedEnergy > 0) {
        // Reduce assigned energy by 10% to increase defense
        const reduction = connection.assignedEnergy * 0.1;
        connection.assignedEnergy = Math.max(0, connection.assignedEnergy - reduction);
        gameState.connections.set(connection.id, connection);

        console.log(
          `[AIController] ${player.name} reduced attack energy on connection ${connection.id} to boost defense`,
        );
        return;
      }
    }
  }

  /**
   * Get total energy assigned to edges by a player
   */
  private getTotalAssignedEnergyByPlayer(playerId: ID, gameState: IGameState): number {
    let total = 0;
    for (const [_, connection] of gameState.connections) {
      const sourceNode = gameState.nodes.get(connection.sourceNodeId);
      if (sourceNode && sourceNode.owner === playerId) {
        total += connection.assignedEnergy;
      }
    }
    return total;
  }

  /**
   * Get all active AI players
   */
  private getAIPlayers(gameState: IGameState): IPlayer[] {
    return Array.from(gameState.players.values()).filter(
      (player) => player.type === PlayerType.AI && !player.isEliminated && player.isActive,
    );
  }

  /**
   * Get nodes controlled by a player
   */
  private getControlledNodes(playerId: ID, gameState: IGameState): INode[] {
    return Array.from(gameState.nodes.values()).filter((node) => node.owner === playerId);
  }

  /**
   * Reset the controller
   */
  public reset(): void {
    this.lastDecisionTime = 0;
    console.log("[AIController] Reset");
  }

  /**
   * Configure AI delay (decision interval)
   * @param delay - Interval in milliseconds between decisions
   */
  public setAiDelay(delay: number): void {
    this.aiDelay = Math.max(100, delay);
    console.log(`[AIController] aiDelay set to ${this.aiDelay}ms`);
  }

  /**
   * Configure AI aggression
   * @param aggression - Aggression percentage (0-100)
   */
  public setAiAggression(aggression: number): void {
    this.aiAggression = Math.max(0, Math.min(100, aggression));
    console.log(`[AIController] aiAggression set to ${this.aiAggression}%`);
  }

  /**
   * Get current configuration
   */
  public getConfig(): { aiDelay: number; aiAggression: number } {
    return {
      aiDelay: this.aiDelay,
      aiAggression: this.aiAggression,
    };
  }

  /**
   * Destroy instance (for testing)
   */
  public static destroy(): void {
    AIController.instance = null;
  }
}
