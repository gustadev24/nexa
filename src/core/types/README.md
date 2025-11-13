# NEXA - Core Types Documentation

This directory contains all TypeScript interfaces, types, and enums used throughout the NEXA game.

## 📁 File Structure

```
types/
├── common.types.ts       # Base types, enums, and constants
├── node.types.ts         # Node-related interfaces
├── connection.types.ts   # Connection-related interfaces
├── player.types.ts       # Player and AI strategy interfaces
├── game.types.ts         # Game state and action interfaces
├── examples.ts           # Usage examples and demonstrations
├── index.ts              # Central export point
└── README.md            # This file
```

## 🎯 Core Interfaces

### INode
Represents a strategic point on the game map that can be controlled by players.

**Key Properties:**
- `id` - Unique identifier
- `owner` - Player ID who controls the node (null if neutral)
- `energy` - Current energy stored
- `connections` - Array of connected node IDs
- `position` - 2D coordinates on the map
- `type` - Node type (STANDARD, GENERATOR, FORTRESS, etc.)

**Node Types:**
- **STANDARD**: Basic node with standard properties
- **GENERATOR**: High energy generation rate
- **FORTRESS**: Heavily defended, hard to conquer
- **AMPLIFIER**: Boosts energy transfer efficiency
- **HARVESTER**: Increases resource collection
- **RELAY**: Extends connection range

### IConnection
Represents a connection between two nodes that allows energy transfer.

**Key Properties:**
- `sourceNodeId` - Origin node ID
- `targetNodeId` - Destination node ID
- `state` - Connection state (ACTIVE, INACTIVE, BUILDING, DAMAGED)
- `energyFlow` - Current energy being transferred
- `transferRate` - Energy transfer speed
- `isBidirectional` - Whether energy can flow both ways

### IPlayer
Represents a player in the game (human or AI).

**Key Properties:**
- `id` - Unique player identifier
- `name` - Player name
- `color` - Player color (IColor interface)
- `score` - Current score
- `type` - PlayerType.HUMAN or PlayerType.AI
- `totalEnergy` - Total energy across all nodes
- `controlledNodes` - Array of controlled node IDs
- `aiStrategy` - AI strategy configuration (if AI player)

### IGameState
Complete representation of the game state at any point in time.

**Key Properties:**
- `phase` - Current game phase (SETUP, PLAYING, PAUSED, GAME_OVER)
- `currentTurn` - Turn number
- `currentPlayerId` - Active player's ID
- `players` - Map of all players
- `nodes` - Map of all nodes
- `connections` - Map of all connections
- `config` - Game configuration
- `winner` - Winning player ID (null if game not finished)

## 🎮 Game Actions

### Action Types
- **EXPAND**: Expand to a neutral node
- **ATTACK**: Attack an enemy node
- **DEFEND**: Strengthen node defenses
- **TRANSFER**: Transfer energy between owned nodes
- **BUILD_CONNECTION**: Create a new connection
- **UPGRADE**: Upgrade a node to a different type

### Action Interfaces
Each action type has a corresponding interface:
- `IExpandAction`
- `IAttackAction`
- `ITransferAction`
- `IDefendAction`
- `IBuildConnectionAction`
- `IUpgradeNodeAction`

## 🤖 AI Strategy

### AI Difficulty Levels
- **EASY**: Slower reactions, lower priorities
- **MEDIUM**: Balanced strategy
- **HARD**: Aggressive with quick reactions
- **EXPERT**: Optimal play with minimal reaction time

### AI Strategy Types
- **AGGRESSIVE**: Focus on attacking enemies
- **DEFENSIVE**: Focus on protecting territory
- **BALANCED**: Mix of offense and defense
- **EXPANSIONIST**: Rapid territory expansion
- **ECONOMIC**: Maximize resource generation

## 📊 Enums

### GamePhase
- `SETUP` - Initial game setup
- `PLAYING` - Active gameplay
- `PAUSED` - Game paused
- `GAME_OVER` - Game finished

### VictoryType
- `DOMINATION` - Control X% of nodes
- `ELIMINATION` - Eliminate all opponents
- `SCORE` - Reach target score
- `TIME_LIMIT` - Highest score at time limit
- `ENERGY` - Reach energy threshold

### ConnectionState
- `ACTIVE` - Functioning connection
- `INACTIVE` - Disabled connection
- `BUILDING` - Under construction
- `DAMAGED` - Damaged, reduced capacity

## 🔧 Usage Examples

### Import Types

```typescript
// Import specific types
import { INode, IPlayer, IConnection } from '@/core/types';

// Import enums
import { NodeType, PlayerType, GamePhase } from '@/core/types';

// Import constants
import { GAME_CONSTANTS, PLAYER_COLORS } from '@/core/types';
```

### Create a Node

```typescript
import { INode, NodeType, NODE_TYPE_CONFIGS } from '@/core/types';

const node: INode = {
  id: 'node-001',
  owner: 'player-001',
  energy: 50,
  connections: ['node-002', 'node-003'],
  position: { x: 100, y: 150 },
  type: NodeType.GENERATOR,
  maxEnergy: NODE_TYPE_CONFIGS[NodeType.GENERATOR].maxEnergy,
  generationRate: NODE_TYPE_CONFIGS[NodeType.GENERATOR].generationRate,
  lastUpdateTime: Date.now(),
  isUnderAttack: false,
  defenseLevel: 0,
};
```

### Create a Player

```typescript
import { IPlayer, PlayerType, PLAYER_COLORS } from '@/core/types';

const player: IPlayer = {
  id: 'player-001',
  name: 'Player One',
  color: PLAYER_COLORS.BLUE,
  score: 0,
  type: PlayerType.HUMAN,
  isActive: true,
  isEliminated: false,
  totalEnergy: 100,
  controlledNodes: ['node-001', 'node-002'],
};
```

### Create a Connection

```typescript
import { IConnection, ConnectionState } from '@/core/types';

const connection: IConnection = {
  id: 'conn-001',
  sourceNodeId: 'node-001',
  targetNodeId: 'node-002',
  state: ConnectionState.ACTIVE,
  energyFlow: 1,
  transferRate: 1,
  capacity: 50,
  buildProgress: 100,
  lastTransferTime: Date.now(),
  isBidirectional: true,
};
```

### Create a Game State

```typescript
import { 
  IGameState, 
  GamePhase, 
  DEFAULT_GAME_CONFIG 
} from '@/core/types';

const gameState: IGameState = {
  id: 'game-001',
  phase: GamePhase.SETUP,
  currentTurn: 0,
  currentPlayerId: null,
  players: new Map(),
  nodes: new Map(),
  connections: new Map(),
  startTime: Date.now(),
  lastUpdateTime: Date.now(),
  winner: null,
  config: DEFAULT_GAME_CONFIG,
};
```

## 📚 Constants

### GAME_CONSTANTS
```typescript
{
  DEFAULT_ENERGY: 50,
  MAX_ENERGY: 100,
  MIN_ENERGY: 0,
  DEFAULT_GENERATION_RATE: 1,
  MAX_PLAYERS: 8,
  MIN_PLAYERS: 2,
  DEFAULT_PLAYERS: 2,
  TICK_RATE: 1000, // milliseconds
}
```

### PLAYER_COLORS
Pre-defined player colors:
- BLUE, RED, GREEN, YELLOW
- PURPLE, CYAN, ORANGE, PINK

### NODE_TYPE_CONFIGS
Configuration for each node type including:
- Max energy capacity
- Generation rate
- Defense bonus
- Transfer bonus
- Connection range bonus
- Upgrade cost

### DEFAULT_GAME_CONFIG
Default game configuration with:
- Map size (1024x768)
- Player limits (2-4)
- Victory conditions
- Game speed
- Starting energy

## 🎨 Type Utilities

### Type Aliases
- `ID` - string | number
- `Timestamp` - number (milliseconds)
- `Percentage` - number (0-100)
- `Callback<T>` - (data: T) => void

### Interface Extensions
All interfaces support partial updates:
```typescript
INodeUpdateData    // Partial node updates
IPlayerUpdateData  // Partial player updates
IConnectionUpdateData // Partial connection updates
```

## 🔍 Type Guards

Use type guards for safe type checking:

```typescript
function isHumanPlayer(player: IPlayer): boolean {
  return player.type === PlayerType.HUMAN;
}

function isAIPlayer(player: IPlayer): boolean {
  return player.type === PlayerType.AI && player.aiStrategy !== undefined;
}

function isNodeOwned(node: INode): boolean {
  return node.owner !== null;
}
```

## 📖 Further Reading

- See `examples.ts` for comprehensive usage examples
- Check individual type files for detailed JSDoc comments
- Refer to game documentation for gameplay mechanics

## 🚀 Best Practices

1. **Always use path aliases**: Import from `@/core/types` instead of relative paths
2. **Use type annotations**: Explicitly type your variables for better IDE support
3. **Leverage enums**: Use enums instead of string literals for better type safety
4. **Use readonly when possible**: Mark properties as readonly if they shouldn't change
5. **Document custom types**: Add JSDoc comments to custom interfaces
6. **Use type guards**: Implement type guards for runtime type checking
7. **Prefer interfaces over types**: Use interfaces for object shapes
8. **Use Maps for lookups**: Use Map<ID, T> for fast lookups by ID

## 🤝 Contributing

When adding new types:

1. Add the interface/type to the appropriate file
2. Export it from that file
3. Re-export it from `index.ts`
4. Add usage examples to `examples.ts`
5. Update this README with the new type
6. Add JSDoc comments for documentation