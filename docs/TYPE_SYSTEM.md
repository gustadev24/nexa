# NEXA - Type System Overview

A comprehensive visual guide to the NEXA game type system.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      NEXA Type System                       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Common     │  │    Node      │  │  Connection  │    │
│  │    Types     │  │    Types     │  │    Types     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │   Player     │  │    Game      │                       │
│  │    Types     │  │    Types     │                       │
│  └──────────────┘  └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Core Interfaces

### INode - Strategic Points

```typescript
interface INode {
  id: ID                    // Unique identifier
  owner: ID | null          // Controlling player (null = neutral)
  energy: number            // Current energy stored
  connections: ID[]         // Connected node IDs
  position: IVector2D       // Map coordinates {x, y}
  type: NodeType            // Node specialization
  maxEnergy: number         // Storage capacity
  generationRate: number    // Energy per second
  lastUpdateTime: number    // Last update timestamp
  isUnderAttack: boolean    // Combat status
  defenseLevel: number      // Defense strength
}
```

**Node Types Hierarchy:**
```
NodeType
├── STANDARD    ⚡ Balanced properties
├── GENERATOR   ⚡⚡⚡ High energy generation
├── FORTRESS    🛡️ Heavy defense
├── AMPLIFIER   📡 Boosts transfers
├── HARVESTER   💎 Resource boost
└── RELAY       🔗 Extended range
```

### IConnection - Network Links

```typescript
interface IConnection {
  id: ID                      // Unique identifier
  sourceNodeId: ID            // Origin node
  targetNodeId: ID            // Destination node
  state: ConnectionState      // Current state
  energyFlow: number          // Current transfer rate
  transferRate: number        // Max transfer speed
  capacity: number            // Max energy per transfer
  buildProgress: number       // Construction % (0-100)
  lastTransferTime: number    // Last transfer timestamp
  isBidirectional: boolean    // Two-way transfer
}
```

**Connection States:**
```
ConnectionState
├── ACTIVE     ✅ Fully operational
├── INACTIVE   ⭕ Disabled
├── BUILDING   🚧 Under construction
└── DAMAGED    ⚠️ Reduced capacity
```

### IPlayer - Competitors

```typescript
interface IPlayer {
  id: ID                    // Unique identifier
  name: string              // Display name
  color: IColor             // Player color {r, g, b, hex}
  score: number             // Current score
  type: PlayerType          // HUMAN | AI
  isActive: boolean         // Playing status
  isEliminated: boolean     // Defeat status
  totalEnergy: number       // Sum across all nodes
  controlledNodes: ID[]     // Owned node IDs
  aiStrategy?: IAIStrategy  // AI configuration
}
```

**Player Types:**
```
PlayerType
├── HUMAN  👤 Human controlled
└── AI     🤖 Computer controlled
    ├── Strategy: AGGRESSIVE    ⚔️
    ├── Strategy: DEFENSIVE     🛡️
    ├── Strategy: BALANCED      ⚖️
    ├── Strategy: EXPANSIONIST  🌍
    └── Strategy: ECONOMIC      💰
```

### IGameState - World State

```typescript
interface IGameState {
  id: ID                          // Game session ID
  phase: GamePhase                // Current phase
  currentTurn: number             // Turn counter
  currentPlayerId: ID | null      // Active player
  players: Map<ID, IPlayer>       // All players
  nodes: Map<ID, INode>           // All nodes
  connections: Map<ID, IConnection> // All connections
  startTime: Timestamp            // Game start
  lastUpdateTime: Timestamp       // Last update
  winner: ID | null               // Winner (if game over)
  config: IGameConfig             // Game settings
}
```

**Game Phases:**
```
GamePhase Flow
┌─────────┐    ┌─────────┐    ┌────────┐    ┌───────────┐
│  SETUP  │───▶│ PLAYING │───▶│ PAUSED │───▶│ GAME_OVER │
└─────────┘    └─────────┘    └────────┘    └───────────┘
     │              │              │               │
     │              │              │               │
     └──────────────┴──────────────┴───────────────┘
                    Victory Achieved
```

## 🎮 Action System

### Action Types

```
ActionType
├── EXPAND              🆕 Claim neutral node
├── ATTACK              ⚔️ Assault enemy node
├── DEFEND              🛡️ Fortify defenses
├── TRANSFER            🔄 Move energy
├── BUILD_CONNECTION    🔗 Create link
└── UPGRADE             ⬆️ Improve node
```

### Action Flow

```
┌──────────────┐
│ Player Input │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Validation  │──── ❌ Invalid ───▶ Reject
└──────┬───────┘
       │ ✅ Valid
       ▼
┌──────────────┐
│   Execute    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Update State │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Check Victory│
└──────────────┘
```

## 🤖 AI System

### AI Difficulty Levels

```
Difficulty → Reaction Time → Decision Quality
──────────────────────────────────────────────
EASY       2000ms           ★☆☆☆
MEDIUM     1000ms           ★★☆☆
HARD        500ms           ★★★☆
EXPERT      200ms           ★★★★
```

### AI Strategy Matrix

```
Strategy        | Aggression | Expansion | Defense | Economic |
────────────────|──────────--|────────---|──────---|────────--|
AGGRESSIVE      |    ⚔️⚔️⚔️    |    🌍🌍     |   🛡️    |    💰    |
DEFENSIVE       |    ⚔️      |    🌍      |  🛡️🛡️🛡️  |   💰💰   |
BALANCED        |    ⚔️⚔️    |   🌍🌍     |  🛡️🛡️   |   💰💰   |
EXPANSIONIST    |    ⚔️⚔️    |  🌍🌍🌍    |   🛡️    |    💰    |
ECONOMIC        |    ⚔️      |    🌍      |  🛡️🛡️   |  💰💰💰  |
```

## 🏆 Victory Conditions

```
VictoryType
├── DOMINATION    🎯 Control 75% of nodes
├── ELIMINATION   💀 Defeat all opponents
├── SCORE         ⭐ Reach target score
├── TIME_LIMIT    ⏱️ Highest score at time limit
└── ENERGY        ⚡ Accumulate energy threshold
```

## 📊 Data Flow

### Game Loop

```
     ┌─────────────────────────────────────────┐
     │                                         │
     ▼                                         │
┌─────────┐    ┌──────────┐    ┌─────────┐   │
│  Input  │───▶│ Validate │───▶│ Execute │───┤
└─────────┘    └──────────┘    └─────────┘   │
                                  │           │
                                  ▼           │
                            ┌──────────┐      │
                            │  Update  │      │
                            │  Energy  │      │
                            └────┬─────┘      │
                                 │            │
                                 ▼            │
                            ┌──────────┐      │
                            │  Check   │      │
                            │ Victory  │      │
                            └────┬─────┘      │
                                 │            │
                          ┌──────┴──────┐    │
                          │             │    │
                          ▼             ▼    │
                    ┌──────────┐   ┌──────┐ │
                    │Game Over │   │ Next │─┘
                    └──────────┘   │ Turn │
                                   └──────┘
```

### Energy Flow

```
Generator Node (⚡⚡⚡)
       │
       │ generates energy
       ▼
Node Storage (💾)
       │
       │ via Connection (🔗)
       ▼
Transfer (🔄)
       │
       ├──▶ Amplifier (📡) ───▶ Boost +50%
       │
       ▼
Target Node (🎯)
       │
       ├──▶ Attack Enemy (⚔️)
       ├──▶ Upgrade Node (⬆️)
       └──▶ Build Connection (🔗)
```

## 🎨 Type Relationships

```
IGameState
    │
    ├──▶ IGameConfig
    │       └──▶ IVictoryConditions
    │
    ├──▶ Map<ID, IPlayer>
    │       └──▶ IAIStrategy (optional)
    │
    ├──▶ Map<ID, INode>
    │       ├──▶ IVector2D (position)
    │       ├──▶ NodeType (enum)
    │       └──▶ INodeTypeConfig
    │
    └──▶ Map<ID, IConnection>
            ├──▶ ConnectionState (enum)
            └──▶ IConnectionConfig
```

## 📚 Import Examples

### Basic Import

```typescript
import { INode, IPlayer, IConnection } from '@/core/types';
```

### With Enums

```typescript
import { 
  NodeType, 
  PlayerType, 
  GamePhase,
  ActionType 
} from '@/core/types';
```

### With Constants

```typescript
import { 
  GAME_CONSTANTS,
  PLAYER_COLORS,
  NODE_TYPE_CONFIGS,
  DEFAULT_GAME_CONFIG
} from '@/core/types';
```

### Complete Import

```typescript
import type {
  INode,
  IConnection,
  IPlayer,
  IGameState,
  IGameAction,
} from '@/core/types';

import {
  NodeType,
  PlayerType,
  ActionType,
  GAME_CONSTANTS,
} from '@/core/types';
```

## 🔧 Usage Patterns

### Creating a Node

```typescript
const node: INode = {
  id: 'node-001',
  owner: 'player-001',
  energy: GAME_CONSTANTS.DEFAULT_ENERGY,
  connections: [],
  position: { x: 100, y: 150 },
  type: NodeType.GENERATOR,
  maxEnergy: NODE_TYPE_CONFIGS[NodeType.GENERATOR].maxEnergy,
  generationRate: NODE_TYPE_CONFIGS[NodeType.GENERATOR].generationRate,
  lastUpdateTime: Date.now(),
  isUnderAttack: false,
  defenseLevel: 0,
};
```

### Creating a Player

```typescript
const player: IPlayer = {
  id: 'player-001',
  name: 'Nexus Prime',
  color: PLAYER_COLORS.BLUE,
  score: 0,
  type: PlayerType.HUMAN,
  isActive: true,
  isEliminated: false,
  totalEnergy: 100,
  controlledNodes: [],
};
```

### Creating an AI Player

```typescript
const aiPlayer: IPlayer = {
  id: 'ai-001',
  name: 'Digital Overlord',
  color: PLAYER_COLORS.RED,
  score: 0,
  type: PlayerType.AI,
  isActive: true,
  isEliminated: false,
  totalEnergy: 100,
  controlledNodes: [],
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
```

## 🎯 Key Features

### ✅ Type Safety
- Full TypeScript support
- Compile-time error checking
- IntelliSense autocomplete

### 🔒 Immutability Patterns
- Use readonly modifiers
- Create new objects for updates
- Avoid direct mutations

### 🎨 Extensibility
- Easy to add new node types
- Flexible action system
- Customizable victory conditions

### 📦 Modularity
- Separated concerns
- Clean imports via index
- Path aliases support

## 📖 Related Documentation

- [Core Types README](../src/core/types/README.md)
- [Usage Examples](../src/core/types/examples.ts)
- [Entities Documentation](../src/entities/README.md)
- [Game Documentation](../README.md)

## 🚀 Next Steps

1. Implement entity classes based on interfaces
2. Create game managers (NodeManager, PlayerManager, etc.)
3. Build action validation system
4. Implement AI decision-making
5. Create state management system

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: ✅ Complete and verified