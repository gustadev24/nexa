# NEXA - GameManager Documentation

Complete guide to the GameManager class and its integration with the game.

## 📋 Overview

**GameManager** is a singleton class that serves as the central hub for all game state management in NEXA. It manages players, nodes, connections, and controls the complete game lifecycle.

```
┌─────────────────────────────────────────────────────────┐
│                     GameManager                         │
│                      (Singleton)                        │
├─────────────────────────────────────────────────────────┤
│  Game State                                             │
│  ├─ Players Map<ID, IPlayer>                            │
│  ├─ Nodes Map<ID, INode>                                │
│  ├─ Connections Map<ID, IConnection>                    │
│  ├─ Current Turn                                        │
│  ├─ Current Player                                      │
│  └─ Game Phase                                          │
├─────────────────────────────────────────────────────────┤
│  Active Scene: Phaser.Scene                             │
│  Config: IGameConfig                                    │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Key Features

- ✅ **Singleton Pattern** - Single source of truth
- ✅ **Type-Safe** - Full TypeScript support
- ✅ **Scene Integration** - Works with Phaser scenes
- ✅ **Lifecycle Management** - Start, pause, resume, reset, end
- ✅ **Entity Management** - Players, nodes, connections
- ✅ **Turn System** - Automatic turn rotation
- ✅ **Statistics** - Real-time game stats

## 🚀 Quick Start

### Get Instance

```typescript
import { GameManager } from '@/core/managers';

const gameManager = GameManager.getInstance();
```

### Basic Setup

```typescript
// 1. Initialize
gameManager.initialize();

// 2. Add players
gameManager.addPlayer(player1);
gameManager.addPlayer(player2);

// 3. Start game
gameManager.startGame();
```

## 📊 Game Lifecycle

### State Flow Diagram

```
┌──────────┐
│  SETUP   │ ← initialize()
└────┬─────┘
     │ startGame()
     ▼
┌──────────┐     pauseGame()      ┌─────────┐
│ PLAYING  │◄───────────────────►│ PAUSED  │
└────┬─────┘     resumeGame()     └─────────┘
     │
     │ endGame()
     ▼
┌──────────┐
│GAME_OVER │
└────┬─────┘
     │ resetGame()
     └──────────────┐
                    │
     ┌──────────────┘
     ▼
┌──────────┐
│  SETUP   │
└──────────┘
```

### Phase Descriptions

| Phase | Description | Available Actions |
|-------|-------------|-------------------|
| **SETUP** | Initial state, adding players/config | `addPlayer()`, `startGame()` |
| **PLAYING** | Active gameplay | `nextTurn()`, `pauseGame()`, `endGame()` |
| **PAUSED** | Game temporarily stopped | `resumeGame()` |
| **GAME_OVER** | Game completed | `resetGame()` |

## 🔧 Core Methods

### Initialize Game

```typescript
gameManager.initialize({
  maxPlayers: 4,
  minPlayers: 2,
  mapWidth: 1024,
  mapHeight: 768,
  difficulty: GameDifficulty.NORMAL,
  victoryConditions: {
    type: VictoryType.DOMINATION,
    nodeControlPercentage: 75
  }
});
```

**When to call**: At game boot or before starting new game

### Start Game

```typescript
const started = gameManager.startGame();

if (started) {
  console.log('Game started successfully!');
} else {
  console.error('Failed to start game');
}
```

**Requirements**:
- Minimum 2 players added
- Phase must be SETUP
- Game must be initialized

**Effect**: Changes phase to PLAYING, sets first player active

### Reset Game

```typescript
// Keep configuration
gameManager.resetGame(true);

// Use default configuration
gameManager.resetGame(false);
```

**Effect**: 
- Clears all players, nodes, connections
- Resets phase to SETUP
- Resets turn counter to 0
- Clears winner

### Pause/Resume

```typescript
// Pause
gameManager.pauseGame();

// Resume
gameManager.resumeGame();
```

### End Game

```typescript
gameManager.endGame('player-1');
```

**Parameters**: Winner ID (optional)

## 👥 Player Management

### Add Player

```typescript
import { IPlayer, PlayerType, PLAYER_COLORS } from '@/core/types';

const player: IPlayer = {
  id: 'player-1',
  name: 'Alice',
  color: PLAYER_COLORS.BLUE,
  score: 0,
  type: PlayerType.HUMAN,
  isActive: true,
  isEliminated: false,
  totalEnergy: 100,
  controlledNodes: [],
};

const added = gameManager.addPlayer(player);
```

**Returns**: `boolean` - Success status

**Validation**:
- Max players not exceeded
- Player ID is unique

### Query Players

```typescript
// Get specific player
const player = gameManager.getPlayer('player-1');

// Get all players
const allPlayers = gameManager.getPlayers();

// Iterate
for (const [id, player] of allPlayers) {
  console.log(`${player.name}: ${player.score} points`);
}
```

### Remove Player

```typescript
gameManager.removePlayer('player-1');
```

## 🔵 Node Management

### Add Node

```typescript
import { INode, NodeType, NODE_TYPE_CONFIGS } from '@/core/types';

const node: INode = {
  id: 'node-1',
  owner: 'player-1',
  energy: 50,
  connections: [],
  position: { x: 100, y: 150 },
  type: NodeType.STANDARD,
  maxEnergy: NODE_TYPE_CONFIGS[NodeType.STANDARD].maxEnergy,
  generationRate: NODE_TYPE_CONFIGS[NodeType.STANDARD].generationRate,
  lastUpdateTime: Date.now(),
  isUnderAttack: false,
  defenseLevel: 0,
};

gameManager.addNode(node);
```

### Query Nodes

```typescript
// Get specific node
const node = gameManager.getNode('node-1');

// Get all nodes
const allNodes = gameManager.getNodes();

// Count nodes
console.log(`Total nodes: ${allNodes.size}`);
```

## 🔗 Connection Management

### Add Connection

```typescript
import { IConnection, ConnectionState } from '@/core/types';

const connection: IConnection = {
  id: 'conn-1',
  sourceNodeId: 'node-1',
  targetNodeId: 'node-2',
  state: ConnectionState.ACTIVE,
  energyFlow: 1,
  transferRate: 1,
  capacity: 50,
  buildProgress: 100,
  lastTransferTime: Date.now(),
  isBidirectional: true,
};

gameManager.addConnection(connection);
```

### Query Connections

```typescript
// Get specific connection
const conn = gameManager.getConnection('conn-1');

// Get all connections
const allConnections = gameManager.getConnections();
```

## 🎮 Scene Integration

### Set Active Scene

```typescript
export class Game extends Scene {
  private gameManager: GameManager;

  constructor() {
    super('Game');
    this.gameManager = GameManager.getInstance();
  }

  create() {
    // Register this scene as active
    this.gameManager.setActiveScene(this);

    // Initialize if needed
    if (!this.gameManager.isInitialized()) {
      this.initializeGame();
    }

    // Start game
    this.gameManager.startGame();
  }
}
```

### Get Active Scene

```typescript
const scene = gameManager.getActiveScene();
if (scene) {
  scene.cameras.main.flash(200);
}
```

## 🔄 Turn System

### Advance Turn

```typescript
gameManager.nextTurn();
```

**Effect**:
- Increments turn counter
- Rotates to next player
- Updates timestamp
- Logs to console

### Query Turn Info

```typescript
// Current turn number
const turn = gameManager.getCurrentTurn();

// Active player
const playerId = gameManager.getCurrentPlayerId();
const player = gameManager.getPlayer(playerId!);

console.log(`Turn ${turn}: ${player?.name}`);
```

## 📊 Game Statistics

### Get Stats

```typescript
const stats = gameManager.getStats();

console.log(`
  Players: ${stats.players}
  Nodes: ${stats.nodes}
  Connections: ${stats.connections}
  Turn: ${stats.turn}
  Phase: ${stats.phase}
  Duration: ${stats.duration}ms
`);
```

**Stats Object**:
```typescript
{
  players: number;
  nodes: number;
  connections: number;
  turn: number;
  phase: GamePhase | null;
  duration: number; // milliseconds since start
}
```

### Status Checks

```typescript
// Check initialization
if (!gameManager.isInitialized()) {
  gameManager.initialize();
}

// Check phase
if (gameManager.isPlaying()) {
  // Game active
}

if (gameManager.isPaused()) {
  // Game paused
}

if (gameManager.isGameOver()) {
  // Game ended
}
```

## 🎯 Complete Example

### Full Game Flow

```typescript
import { GameManager } from '@/core/managers';
import { 
  IPlayer, 
  PlayerType, 
  PLAYER_COLORS, 
  GAME_CONSTANTS 
} from '@/core/types';

export class Game extends Scene {
  private gameManager: GameManager;
  private statsText?: Phaser.GameObjects.Text;

  constructor() {
    super('Game');
    this.gameManager = GameManager.getInstance();
  }

  create() {
    // Set active scene
    this.gameManager.setActiveScene(this);

    // Initialize game
    if (!this.gameManager.isInitialized()) {
      this.setupGame();
    }

    // Start game
    const started = this.gameManager.startGame();
    if (started) {
      this.showStartMessage();
    }

    // Setup controls
    this.setupControls();

    // Create HUD
    this.createHUD();
  }

  private setupGame() {
    // Initialize with config
    this.gameManager.initialize({
      maxPlayers: 4,
      minPlayers: 2,
    });

    // Add players
    const player1: IPlayer = {
      id: 'p1',
      name: 'Player 1',
      color: PLAYER_COLORS.BLUE,
      score: 0,
      type: PlayerType.HUMAN,
      isActive: true,
      isEliminated: false,
      totalEnergy: GAME_CONSTANTS.DEFAULT_ENERGY,
      controlledNodes: [],
    };

    const player2: IPlayer = {
      id: 'p2',
      name: 'AI Opponent',
      color: PLAYER_COLORS.RED,
      score: 0,
      type: PlayerType.AI,
      isActive: true,
      isEliminated: false,
      totalEnergy: GAME_CONSTANTS.DEFAULT_ENERGY,
      controlledNodes: [],
    };

    this.gameManager.addPlayer(player1);
    this.gameManager.addPlayer(player2);
  }

  private setupControls() {
    // Space - Next turn
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.gameManager.isPlaying()) {
        this.gameManager.nextTurn();
        this.updateHUD();
      }
    });

    // R - Reset
    this.input.keyboard?.on('keydown-R', () => {
      this.resetGame();
    });

    // P - Pause/Resume
    this.input.keyboard?.on('keydown-P', () => {
      if (this.gameManager.isPlaying()) {
        this.gameManager.pauseGame();
      } else if (this.gameManager.isPaused()) {
        this.gameManager.resumeGame();
      }
      this.updateHUD();
    });
  }

  private createHUD() {
    const { width } = this.scale;

    this.statsText = this.add
      .text(width - 20, 20, this.getStatsText(), {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#00AAAA',
      })
      .setOrigin(1, 0);
  }

  private getStatsText(): string {
    const stats = this.gameManager.getStats();
    return `Turn: ${stats.turn} | Players: ${stats.players} | Nodes: ${stats.nodes}`;
  }

  private updateHUD() {
    if (this.statsText) {
      this.statsText.setText(this.getStatsText());
    }
  }

  private resetGame() {
    this.gameManager.resetGame(true);
    this.setupGame();
    this.gameManager.startGame();
    this.updateHUD();
  }

  update(time: number, delta: number) {
    if (this.gameManager.isPlaying()) {
      this.gameManager.updateTimestamp();
      // Game logic here
    }
  }
}
```

## 🎨 Integration Pattern

### Recommended Structure

```
Scene (Phaser)
    │
    ├─► GameManager (State)
    │      ├─► Players
    │      ├─► Nodes
    │      └─► Connections
    │
    ├─► NodeManager (Entity Logic)
    ├─► PlayerManager (Player Logic)
    └─► AIManager (AI Logic)
```

### Communication Flow

```
User Input
    ↓
Scene Event Handler
    ↓
GameManager Method Call
    ↓
State Update
    ↓
Scene Visual Update
```

## 🐛 Debugging

### Console Logging

GameManager logs all major operations:

```
[GameManager] Instance created
[GameManager] Initializing game...
[GameManager] Game initialized with config: {...}
[GameManager] Player added: Alice (player-1)
[GameManager] Player added: Bob AI (player-2)
[GameManager] Game started!
[GameManager] Players: 2
[GameManager] Nodes: 0
[GameManager] Turn 1 - Player: player-1
[GameManager] Turn 2 - Player: player-2
```

### Inspect State

```typescript
// Log complete state
console.log('Game State:', gameManager.getGameState());

// Check specific entities
console.log('Players:', Array.from(gameManager.getPlayers().values()));
console.log('Nodes:', Array.from(gameManager.getNodes().values()));

// Check status
console.log('Phase:', gameManager.getGamePhase());
console.log('Turn:', gameManager.getCurrentTurn());
```

## 📝 Best Practices

### ✅ Do's

- Get instance once and reuse it
- Check `isInitialized()` before operations
- Validate `startGame()` return value
- Call `setActiveScene()` in each scene
- Use `getStats()` for HUD updates
- Check phase before state-changing operations

### ❌ Don'ts

- Don't create multiple instances
- Don't modify state directly
- Don't forget to reset between games
- Don't skip initialization
- Don't access internal properties

### Example: Safe Operations

```typescript
// ✅ Good
const gm = GameManager.getInstance();
if (!gm.isInitialized()) {
  gm.initialize();
}
const started = gm.startGame();
if (started) {
  // Continue
}

// ❌ Bad
const gm = GameManager.getInstance();
gm.startGame(); // No initialization check
// No validation of return value
```

## 🔒 Singleton Pattern

### Why Singleton?

- **Single Source of Truth**: All scenes access same state
- **Memory Efficient**: Only one instance exists
- **Easy Access**: Available from anywhere
- **State Consistency**: No synchronization issues

### Usage

```typescript
// ✅ Correct
const gm = GameManager.getInstance();

// ❌ Wrong - Constructor is private
const gm = new GameManager(); // TypeError!
```

### Testing/Cleanup

```typescript
// Destroy instance (testing only)
GameManager.destroy();

// Get fresh instance
const gm = GameManager.getInstance();
```

## 📊 Performance

### Memory Usage

- Players: ~1KB per player
- Nodes: ~500 bytes per node
- Connections: ~300 bytes per connection
- Total: Minimal (<1MB for typical game)

### Operations Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| `addPlayer()` | O(1) | Map insertion |
| `getPlayer()` | O(1) | Map lookup |
| `addNode()` | O(1) | Map insertion |
| `nextTurn()` | O(n) | n = player count |
| `getStats()` | O(1) | Cached sizes |

## 🚀 Future Enhancements

Planned features:

- [ ] **Event System**: Subscribe to state changes
- [ ] **Save/Load**: Persist game state
- [ ] **Undo/Redo**: Action history
- [ ] **Network Sync**: Multiplayer support
- [ ] **Metrics**: Performance profiling
- [ ] **Validation**: Advanced rule checking

## 📚 Related Documentation

- [Core Types](../src/core/types/README.md)
- [Type System Overview](./TYPE_SYSTEM.md)
- [Scenes Documentation](./SCENES.md)
- [Getting Started Guide](./GETTING_STARTED.md)

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: 2024