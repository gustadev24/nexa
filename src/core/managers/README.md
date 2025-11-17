# NEXA - Game Managers

This directory contains manager classes that handle core game systems and state management.

## 📦 Managers

### GameManager

**File**: `GameManager.ts`  
**Pattern**: Singleton  
**Purpose**: Central game state management and lifecycle control

#### Key Responsibilities

- **Game Lifecycle**: Initialize, start, pause, resume, reset, end game
- **State Management**: Maintain complete game state (players, nodes, connections)
- **Scene Integration**: Track and communicate with active Phaser scene
- **Player Management**: Add, remove, query players
- **Node Management**: Add, remove, query nodes
- **Connection Management**: Add, remove, query connections
- **Turn Management**: Advance turns, track current player
- **Statistics**: Provide game statistics and status

---

## 🎯 GameManager Usage

### Singleton Access

```typescript
import { GameManager } from '@/core/managers';

// Get the singleton instance
const gameManager = GameManager.getInstance();
```

### Basic Game Flow

```typescript
// 1. Initialize the game
gameManager.initialize({
  maxPlayers: 4,
  initialNodeCount: 20,
  // ... other config
});

// 2. Add players
gameManager.addPlayer(player1);
gameManager.addPlayer(player2);

// 3. Start the game
const started = gameManager.startGame();

// 4. During gameplay
gameManager.nextTurn();
gameManager.updateTimestamp();

// 5. End the game
gameManager.endGame(winnerId);

// 6. Reset for new game
gameManager.resetGame();
```

---

## 🔧 API Reference

### Initialization

#### `initialize(config?: Partial<IGameConfig>): void`

Initialize the game with optional configuration.

```typescript
gameManager.initialize({
  maxPlayers: 4,
  minPlayers: 2,
  mapWidth: 1024,
  mapHeight: 768,
  difficulty: GameDifficulty.NORMAL,
});
```

**Parameters**:
- `config` (optional): Partial game configuration, merged with defaults

**Effects**:
- Creates new game state
- Sets phase to SETUP
- Initializes empty collections for players, nodes, connections

---

### Game Lifecycle

#### `startGame(): boolean`

Start the game and transition to PLAYING phase.

```typescript
const started = gameManager.startGame();
if (started) {
  console.log('Game started!');
}
```

**Returns**: `boolean` - Success status
**Requires**: 
- Game must be initialized
- Phase must be SETUP
- Minimum players requirement met

**Effects**:
- Sets phase to PLAYING
- Sets first player as active
- Records start time

---

#### `resetGame(preserveConfig: boolean = true): void`

Reset game to initial state.

```typescript
// Reset but keep configuration
gameManager.resetGame(true);

// Reset with default configuration
gameManager.resetGame(false);
```

**Parameters**:
- `preserveConfig`: Keep current game configuration

**Effects**:
- Clears all players, nodes, connections
- Resets turn counter and phase to SETUP
- Clears winner
- Resets timestamps

---

#### `pauseGame(): void`

Pause the game.

```typescript
gameManager.pauseGame();
```

**Requires**: Phase must be PLAYING
**Effects**: Sets phase to PAUSED

---

#### `resumeGame(): void`

Resume a paused game.

```typescript
gameManager.resumeGame();
```

**Requires**: Phase must be PAUSED
**Effects**: Sets phase to PLAYING

---

#### `endGame(winnerId?: ID): void`

End the game and declare winner.

```typescript
gameManager.endGame('player-1');
```

**Parameters**:
- `winnerId` (optional): ID of winning player

**Effects**:
- Sets phase to GAME_OVER
- Records winner

---

### Scene Management

#### `setActiveScene(scene: Phaser.Scene): void`

Set the currently active Phaser scene.

```typescript
gameManager.setActiveScene(this);
```

**Parameters**:
- `scene`: Phaser scene instance

---

#### `getActiveScene(): Phaser.Scene | null`

Get the active Phaser scene.

```typescript
const scene = gameManager.getActiveScene();
```

**Returns**: Active scene or null

---

### Player Management

#### `addPlayer(player: IPlayer): boolean`

Add a player to the game.

```typescript
const player: IPlayer = {
  id: 'player-1',
  name: 'Player One',
  color: PLAYER_COLORS.BLUE,
  type: PlayerType.HUMAN,
  // ... other properties
};

const added = gameManager.addPlayer(player);
```

**Returns**: `boolean` - Success status
**Validates**:
- Max players not exceeded
- Player ID is unique

---

#### `removePlayer(playerId: ID): boolean`

Remove a player from the game.

```typescript
gameManager.removePlayer('player-1');
```

---

#### `getPlayer(playerId: ID): IPlayer | undefined`

Get a specific player.

```typescript
const player = gameManager.getPlayer('player-1');
```

---

#### `getPlayers(): Map<ID, IPlayer>`

Get all players.

```typescript
const players = gameManager.getPlayers();
for (const [id, player] of players) {
  console.log(player.name);
}
```

---

### Node Management

#### `addNode(node: INode): boolean`

Add a node to the game.

```typescript
const node: INode = {
  id: 'node-1',
  position: { x: 100, y: 150 },
  energy: 50,
  // ... other properties
};

gameManager.addNode(node);
```

---

#### `removeNode(nodeId: ID): boolean`

Remove a node from the game.

---

#### `getNode(nodeId: ID): INode | undefined`

Get a specific node.

---

#### `getNodes(): Map<ID, INode>`

Get all nodes.

---

### Connection Management

#### `addConnection(connection: IConnection): boolean`

Add a connection to the game.

```typescript
const connection: IConnection = {
  id: 'conn-1',
  sourceNodeId: 'node-1',
  targetNodeId: 'node-2',
  // ... other properties
};

gameManager.addConnection(connection);
```

---

#### `removeConnection(connectionId: ID): boolean`

Remove a connection from the game.

---

#### `getConnection(connectionId: ID): IConnection | undefined`

Get a specific connection.

---

#### `getConnections(): Map<ID, IConnection>`

Get all connections.

---

### State Queries

#### `getGameState(): IGameState | null`

Get the complete game state.

```typescript
const state = gameManager.getGameState();
if (state) {
  console.log('Phase:', state.phase);
  console.log('Turn:', state.currentTurn);
}
```

---

#### `getGamePhase(): GamePhase | null`

Get current game phase.

```typescript
const phase = gameManager.getGamePhase();
if (phase === GamePhase.PLAYING) {
  // Game is active
}
```

---

#### `getCurrentTurn(): number`

Get current turn number.

---

#### `getCurrentPlayerId(): ID | null`

Get ID of currently active player.

---

#### `getStats(): GameStats`

Get game statistics object.

```typescript
const stats = gameManager.getStats();
console.log(`Players: ${stats.players}`);
console.log(`Nodes: ${stats.nodes}`);
console.log(`Turn: ${stats.turn}`);
console.log(`Duration: ${stats.duration}ms`);
```

**Returns**:
```typescript
{
  players: number;
  nodes: number;
  connections: number;
  turn: number;
  phase: GamePhase | null;
  duration: number; // milliseconds
}
```

---

### Turn Management

#### `nextTurn(): void`

Advance to the next turn.

```typescript
gameManager.nextTurn();
```

**Effects**:
- Increments turn counter
- Rotates to next player
- Updates timestamp

---

#### `updateTimestamp(): void`

Update the last update timestamp.

```typescript
gameManager.updateTimestamp();
```

---

### Status Checks

#### `isInitialized(): boolean`

Check if game is initialized.

```typescript
if (!gameManager.isInitialized()) {
  gameManager.initialize();
}
```

---

#### `isPlaying(): boolean`

Check if game is in PLAYING phase.

---

#### `isPaused(): boolean`

Check if game is in PAUSED phase.

---

#### `isGameOver(): boolean`

Check if game is in GAME_OVER phase.

---

## 🎮 Integration with Scenes

### In Game Scene

```typescript
import { GameManager } from '@/core/managers';

export class Game extends Scene {
  private gameManager: GameManager;

  constructor() {
    super('Game');
    this.gameManager = GameManager.getInstance();
  }

  create() {
    // Set active scene
    this.gameManager.setActiveScene(this);

    // Initialize if needed
    if (!this.gameManager.isInitialized()) {
      this.gameManager.initialize();
    }

    // Add players
    this.gameManager.addPlayer(player1);
    this.gameManager.addPlayer(player2);

    // Start game
    this.gameManager.startGame();
  }

  update(time: number, delta: number) {
    if (this.gameManager.isPlaying()) {
      this.gameManager.updateTimestamp();
      // Game logic here
    }
  }
}
```

---

## 📊 State Management

### Game State Structure

```typescript
interface IGameState {
  id: ID;                          // Unique game session ID
  phase: GamePhase;                // SETUP | PLAYING | PAUSED | GAME_OVER
  currentTurn: number;             // Current turn number
  currentPlayerId: ID | null;      // Active player
  players: Map<ID, IPlayer>;       // All players
  nodes: Map<ID, INode>;           // All nodes
  connections: Map<ID, IConnection>; // All connections
  startTime: Timestamp;            // Game start time
  lastUpdateTime: Timestamp;       // Last state update
  winner: ID | null;               // Winner (if game over)
  config: IGameConfig;             // Game configuration
}
```

### Game Phases

```
SETUP → PLAYING ⇄ PAUSED → GAME_OVER
  ↑                           ↓
  └───────── Reset ───────────┘
```

---

## 🔍 Example: Complete Game Flow

```typescript
import { GameManager } from '@/core/managers';
import { IPlayer, PlayerType, PLAYER_COLORS } from '@/core/types';

// Get manager instance
const gm = GameManager.getInstance();

// Initialize game
gm.initialize({
  maxPlayers: 2,
  initialNodeCount: 15,
});

// Create players
const player1: IPlayer = {
  id: 'p1',
  name: 'Alice',
  color: PLAYER_COLORS.BLUE,
  type: PlayerType.HUMAN,
  score: 0,
  isActive: true,
  isEliminated: false,
  totalEnergy: 100,
  controlledNodes: [],
};

const player2: IPlayer = {
  id: 'p2',
  name: 'Bob AI',
  color: PLAYER_COLORS.RED,
  type: PlayerType.AI,
  score: 0,
  isActive: true,
  isEliminated: false,
  totalEnergy: 100,
  controlledNodes: [],
};

// Add players
gm.addPlayer(player1);
gm.addPlayer(player2);

// Start game
if (gm.startGame()) {
  console.log('Game started!');
  
  // Game loop
  while (!gm.isGameOver()) {
    // Process turn
    const currentPlayer = gm.getCurrentPlayerId();
    console.log(`Turn ${gm.getCurrentTurn()}: Player ${currentPlayer}`);
    
    // ... game logic ...
    
    // Advance turn
    gm.nextTurn();
  }
  
  // Game ended
  const winner = gm.getGameState()?.winner;
  console.log(`Winner: ${winner}`);
}

// Reset for new game
gm.resetGame();
```

---

## 🐛 Debugging

### Console Logs

GameManager provides detailed console logging:

```
[GameManager] Instance created
[GameManager] Initializing game...
[GameManager] Game initialized with config: {...}
[GameManager] Player added: Alice (p1)
[GameManager] Player added: Bob AI (p2)
[GameManager] Game started!
[GameManager] Players: 2
[GameManager] Nodes: 0
[GameManager] Turn 1 - Player: p1
```

### State Inspection

```typescript
// Check current state
const stats = gameManager.getStats();
console.log('Current state:', stats);

// Check phase
console.log('Phase:', gameManager.getGamePhase());

// Check specific entities
console.log('Players:', gameManager.getPlayers().size);
console.log('Nodes:', gameManager.getNodes().size);
```

---

## 🔒 Singleton Pattern

GameManager uses the Singleton pattern to ensure only one instance exists:

```typescript
// ✅ Correct usage
const gm = GameManager.getInstance();

// ❌ Wrong - constructor is private
const gm = new GameManager(); // Error!
```

### Destroy Instance (Testing Only)

```typescript
// For testing/cleanup
GameManager.destroy();
```

---

## 📝 Notes

- **Thread Safety**: Not thread-safe (JavaScript is single-threaded)
- **State Persistence**: State is in-memory only (not persisted)
- **Scene Integration**: Only one active scene at a time
- **Validation**: Most methods validate input and return boolean success

---

## 🚀 Future Enhancements

Planned features:
- [ ] State save/load functionality
- [ ] Undo/redo system
- [ ] Event broadcasting system
- [ ] Network synchronization support
- [ ] Performance metrics and profiling

---

## 📚 See Also

- [Core Types Documentation](../types/README.md)
- [Game Scene Documentation](../../../docs/SCENES.md)
- [Type System Overview](../../../docs/TYPE_SYSTEM.md)