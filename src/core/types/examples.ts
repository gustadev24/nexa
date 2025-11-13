/**
 * NEXA - Type Usage Examples
 *
 * This file demonstrates how to use the core types and interfaces
 * defined in the NEXA game system. These examples serve as documentation
 * and reference for developers working with the game logic.
 */

import type {
  INode,
  IConnection,
  IPlayer,
  IGameState,
  IGameConfig,
  IGameAction,
  IVector2D,
  IPlayerCreateParams,
  INodeCreateParams,
  IConnectionCreateParams,
  IExpandAction,
  IAttackAction,
  ITransferAction,
  IAIStrategy,
} from "./index";

import {
  NodeType,
  PlayerType,
  GamePhase,
  ConnectionState,
  ActionType,
  AIStrategyType,
  AIDifficulty,
  VictoryType,
  PLAYER_COLORS,
  GAME_CONSTANTS,
  DEFAULT_GAME_CONFIG,
  NODE_TYPE_CONFIGS,
} from "./index";

/**
 * Example 1: Creating a basic node
 */
export function exampleCreateNode(): INode {
  const nodeParams: INodeCreateParams = {
    id: "node-001",
    position: { x: 100, y: 150 },
    type: NodeType.STANDARD,
    owner: null,
    energy: GAME_CONSTANTS.DEFAULT_ENERGY,
  };

  const node: INode = {
    id: nodeParams.id,
    owner: nodeParams.owner ?? null,
    energy: nodeParams.energy ?? GAME_CONSTANTS.DEFAULT_ENERGY,
    connections: [],
    position: nodeParams.position,
    type: nodeParams.type ?? NodeType.STANDARD,
    maxEnergy: NODE_TYPE_CONFIGS[NodeType.STANDARD].maxEnergy,
    generationRate: NODE_TYPE_CONFIGS[NodeType.STANDARD].generationRate,
    lastUpdateTime: Date.now(),
    isUnderAttack: false,
    defenseLevel: 0,
  };

  return node;
}

/**
 * Example 2: Creating a specialized node (Generator)
 */
export function exampleCreateGeneratorNode(): INode {
  const config = NODE_TYPE_CONFIGS[NodeType.GENERATOR];

  return {
    id: "generator-001",
    owner: "player-001",
    energy: 50,
    connections: ["node-002", "node-003"],
    position: { x: 200, y: 300 },
    type: NodeType.GENERATOR,
    maxEnergy: config.maxEnergy,
    generationRate: config.generationRate,
    lastUpdateTime: Date.now(),
    isUnderAttack: false,
    defenseLevel: 0,
  };
}

/**
 * Example 3: Creating a connection between nodes
 */
export function exampleCreateConnection(): IConnection {
  const params: IConnectionCreateParams = {
    sourceNodeId: "node-001",
    targetNodeId: "node-002",
    transferRate: 1,
    capacity: 50,
    isBidirectional: true,
  };

  return {
    id: "connection-001",
    sourceNodeId: params.sourceNodeId,
    targetNodeId: params.targetNodeId,
    state: ConnectionState.ACTIVE,
    energyFlow: 0,
    transferRate: params.transferRate ?? 1,
    capacity: params.capacity ?? 50,
    buildProgress: 100,
    lastTransferTime: Date.now(),
    isBidirectional: params.isBidirectional ?? true,
  };
}

/**
 * Example 4: Creating a human player
 */
export function exampleCreateHumanPlayer(): IPlayer {
  const params: IPlayerCreateParams = {
    id: "player-001",
    name: "Player One",
    color: PLAYER_COLORS.BLUE,
    type: PlayerType.HUMAN,
  };

  return {
    id: params.id,
    name: params.name,
    color: params.color,
    score: 0,
    type: params.type,
    isActive: true,
    isEliminated: false,
    totalEnergy: GAME_CONSTANTS.DEFAULT_ENERGY,
    controlledNodes: [],
  };
}

/**
 * Example 5: Creating an AI player with strategy
 */
export function exampleCreateAIPlayer(): IPlayer {
  const params: IPlayerCreateParams = {
    id: "ai-001",
    name: "AI Opponent",
    color: PLAYER_COLORS.RED,
    type: PlayerType.AI,
    aiStrategy: {
      type: AIStrategyType.AGGRESSIVE,
      difficulty: AIDifficulty.HARD,
      aggressiveness: 75,
      expansionPriority: 70,
      defensePriority: 50,
      economicPriority: 40,
      reactionTime: 500,
      decisionInterval: 1500,
    },
  };

  return {
    id: params.id,
    name: params.name,
    color: params.color,
    score: 0,
    type: params.type,
    isActive: true,
    isEliminated: false,
    totalEnergy: GAME_CONSTANTS.DEFAULT_ENERGY,
    controlledNodes: [],
    aiStrategy: params.aiStrategy as IAIStrategy,
  };
}

/**
 * Example 6: Creating a game configuration
 */
export function exampleCreateGameConfig(): IGameConfig {
  return {
    ...DEFAULT_GAME_CONFIG,
    maxPlayers: 4,
    minPlayers: 2,
    mapWidth: 1024,
    mapHeight: 768,
    initialNodeCount: 25,
    difficulty: DEFAULT_GAME_CONFIG.difficulty,
    startingEnergy: 100,
    victoryConditions: {
      type: VictoryType.DOMINATION,
      nodeControlPercentage: 75,
    },
    gameSpeed: 1.0,
  };
}

/**
 * Example 7: Creating an initial game state
 */
export function exampleCreateGameState(): IGameState {
  const config = exampleCreateGameConfig();
  const player1 = exampleCreateHumanPlayer();
  const player2 = exampleCreateAIPlayer();

  return {
    id: "game-001",
    phase: GamePhase.SETUP,
    currentTurn: 0,
    currentPlayerId: null,
    players: new Map([
      [player1.id, player1],
      [player2.id, player2],
    ]),
    nodes: new Map(),
    connections: new Map(),
    startTime: Date.now(),
    lastUpdateTime: Date.now(),
    winner: null,
    config,
  };
}

/**
 * Example 8: Creating an expand action
 */
export function exampleCreateExpandAction(): IExpandAction {
  return {
    playerId: "player-001",
    sourceNodeId: "node-001",
    targetNodeId: "node-002",
    energyAmount: 30,
  };
}

/**
 * Example 9: Creating an attack action
 */
export function exampleCreateAttackAction(): IAttackAction {
  return {
    playerId: "player-001",
    sourceNodeId: "node-001",
    targetNodeId: "enemy-node-001",
    attackPower: 50,
  };
}

/**
 * Example 10: Creating a transfer action
 */
export function exampleCreateTransferAction(): ITransferAction {
  return {
    playerId: "player-001",
    sourceNodeId: "node-001",
    targetNodeId: "node-002",
    amount: 25,
  };
}

/**
 * Example 11: Creating a complete game action
 */
export function exampleCreateGameAction(): IGameAction {
  return {
    id: "action-001",
    playerId: "player-001",
    type: ActionType.EXPAND,
    timestamp: Date.now(),
    sourceNodeId: "node-001",
    targetNodeId: "node-002",
    amount: 30,
    isValid: true,
    energyCost: 30,
  };
}

/**
 * Example 12: Working with node types and their configurations
 */
export function exampleWorkWithNodeTypes() {
  // Get configuration for a fortress node
  const fortressConfig = NODE_TYPE_CONFIGS[NodeType.FORTRESS];
  console.log("Fortress max energy:", fortressConfig.maxEnergy);
  console.log("Fortress defense bonus:", fortressConfig.defenseBonus);

  // Create a fortress node with proper configuration
  const fortress: INode = {
    id: "fortress-001",
    owner: "player-001",
    energy: fortressConfig.maxEnergy,
    connections: [],
    position: { x: 500, y: 400 },
    type: NodeType.FORTRESS,
    maxEnergy: fortressConfig.maxEnergy,
    generationRate: fortressConfig.generationRate,
    lastUpdateTime: Date.now(),
    isUnderAttack: false,
    defenseLevel: fortressConfig.defenseBonus,
  };

  return fortress;
}

/**
 * Example 13: Calculating distances between nodes
 */
export function exampleCalculateDistance(pos1: IVector2D, pos2: IVector2D): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Example 14: Checking if two nodes can be connected
 */
export function exampleCanConnect(node1: INode, node2: INode, maxDistance: number = 300): boolean {
  const distance = exampleCalculateDistance(node1.position, node2.position);
  return distance <= maxDistance;
}

/**
 * Example 15: Simulating energy generation for a node
 */
export function exampleGenerateEnergy(node: INode, deltaTime: number): INode {
  const secondsElapsed = deltaTime / 1000;
  const energyGenerated = node.generationRate * secondsElapsed;
  const newEnergy = Math.min(node.energy + energyGenerated, node.maxEnergy);

  return {
    ...node,
    energy: newEnergy,
    lastUpdateTime: Date.now(),
  };
}

/**
 * Example 16: Creating a network of connected nodes
 */
export function exampleCreateNodeNetwork(): { nodes: INode[]; connections: IConnection[] } {
  const nodes: INode[] = [
    {
      id: "hub-001",
      owner: "player-001",
      energy: 100,
      connections: ["relay-001", "relay-002", "relay-003"],
      position: { x: 512, y: 384 },
      type: NodeType.AMPLIFIER,
      maxEnergy: 100,
      generationRate: 1,
      lastUpdateTime: Date.now(),
      isUnderAttack: false,
      defenseLevel: 0,
    },
    {
      id: "relay-001",
      owner: "player-001",
      energy: 60,
      connections: ["hub-001", "generator-001"],
      position: { x: 300, y: 200 },
      type: NodeType.RELAY,
      maxEnergy: 60,
      generationRate: 0.5,
      lastUpdateTime: Date.now(),
      isUnderAttack: false,
      defenseLevel: 0,
    },
    {
      id: "generator-001",
      owner: "player-001",
      energy: 80,
      connections: ["relay-001"],
      position: { x: 150, y: 100 },
      type: NodeType.GENERATOR,
      maxEnergy: 80,
      generationRate: 3,
      lastUpdateTime: Date.now(),
      isUnderAttack: false,
      defenseLevel: 0,
    },
  ];

  const connections: IConnection[] = [
    {
      id: "conn-001",
      sourceNodeId: "hub-001",
      targetNodeId: "relay-001",
      state: ConnectionState.ACTIVE,
      energyFlow: 1,
      transferRate: 1,
      capacity: 50,
      buildProgress: 100,
      lastTransferTime: Date.now(),
      isBidirectional: true,
    },
    {
      id: "conn-002",
      sourceNodeId: "relay-001",
      targetNodeId: "generator-001",
      state: ConnectionState.ACTIVE,
      energyFlow: 1,
      transferRate: 1,
      capacity: 50,
      buildProgress: 100,
      lastTransferTime: Date.now(),
      isBidirectional: true,
    },
  ];

  return { nodes, connections };
}

/**
 * Example 17: Getting all nodes controlled by a player
 */
export function exampleGetPlayerNodes(gameState: IGameState, playerId: string): INode[] {
  const nodes: INode[] = [];

  for (const node of gameState.nodes.values()) {
    if (node.owner === playerId) {
      nodes.push(node);
    }
  }

  return nodes;
}

/**
 * Example 18: Calculating total energy for a player
 */
export function exampleCalculatePlayerEnergy(gameState: IGameState, playerId: string): number {
  let totalEnergy = 0;

  for (const node of gameState.nodes.values()) {
    if (node.owner === playerId) {
      totalEnergy += node.energy;
    }
  }

  return totalEnergy;
}

/**
 * Example 19: Checking victory conditions
 */
export function exampleCheckVictoryCondition(gameState: IGameState, playerId: string): boolean {
  const { victoryConditions } = gameState.config;
  const totalNodes = gameState.nodes.size;
  const playerNodes = exampleGetPlayerNodes(gameState, playerId).length;

  switch (victoryConditions.type) {
    case VictoryType.DOMINATION:
      const controlPercentage = (playerNodes / totalNodes) * 100;
      return controlPercentage >= (victoryConditions.nodeControlPercentage ?? 75);

    case VictoryType.ELIMINATION:
      const activePlayers = Array.from(gameState.players.values()).filter(
        (p) => !p.isEliminated && p.id !== playerId,
      );
      return activePlayers.length === 0;

    case VictoryType.ENERGY:
      const totalEnergy = exampleCalculatePlayerEnergy(gameState, playerId);
      return totalEnergy >= (victoryConditions.energyThreshold ?? 1000);

    default:
      return false;
  }
}

/**
 * Example 20: Type guards for safer type checking
 */
export function isHumanPlayer(player: IPlayer): boolean {
  return player.type === PlayerType.HUMAN;
}

export function isAIPlayer(player: IPlayer): boolean {
  return player.type === PlayerType.AI && player.aiStrategy !== undefined;
}

export function isNodeOwned(node: INode): boolean {
  return node.owner !== null;
}

export function isConnectionActive(connection: IConnection): boolean {
  return connection.state === ConnectionState.ACTIVE;
}
