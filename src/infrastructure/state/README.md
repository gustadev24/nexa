# GameStateManager

## Descripción

El `GameStateManager` es el gestor central del estado de la partida en NEXA. Mantiene toda la información del juego, gestiona los trackers de dominancia para las condiciones de victoria, y genera snapshots inmutables para la capa de presentación.

## Características Principales

### 1. Gestión de Estado Completo
- **Estado Mutable**: Mantiene `GameState` con jugadores, grafo, tiempo, ticks y trackers
- **Inicialización**: Crea estado inicial desde configuración
- **Actualización**: Métodos para modificar tiempo, estado y trackers

### 2. Trackers de Dominancia
- **Acumulación**: Trackea tiempo que cada jugador mantiene >= 70% de nodos
- **Reset Automático**: Resetea cuando jugador pierde dominancia
- **Condición de Victoria**: 10 segundos continuos de dominancia = victoria

### 3. Estadísticas de Jugadores
- **Nodos Controlados**: Cuenta de territorios bajo control
- **Energía Total**: Suma de energía almacenada + en tránsito
- **Porcentaje de Dominancia**: % de nodos del mapa controlados
- **Estado de Eliminación**: Detecta pérdida de nodo inicial

### 4. Snapshots Inmutables
- **Datos para UI**: Información serializable sin referencias mutables
- **Timestamps**: Marca temporal de cada snapshot
- **Tiempos Formateados**: mm:ss para display
- **Advertencias**: Notifica cuando jugador cerca de ganar

## API

### `createGameState(config: GameStateConfig): GameState`
Crea un nuevo estado de juego inicial.

```typescript
const gameState = gameStateManager.createGameState({
  players: [player1, player2],
  graph: mapGraph,
  initialTime: 0,      // opcional
  initialTick: 0,      // opcional
});
```

### `updateElapsedTime(state: GameState, deltaTime: number): void`
Actualiza el tiempo transcurrido y el contador de ticks.

```typescript
// En cada frame del game loop
gameStateManager.updateElapsedTime(gameState, deltaTime);
```

### `updateDominanceTracker(state: GameState, player: Player, deltaTime: number): void`
Acumula tiempo de dominancia cuando jugador controla >= 70% de nodos.

```typescript
if (player.controlledNodes.size / totalNodes >= 0.7) {
  gameStateManager.updateDominanceTracker(gameState, player, deltaTime);
}
```

### `resetDominanceTracker(state: GameState, player: Player): void`
Resetea el tracker cuando jugador pierde el 70% de control.

```typescript
if (player.controlledNodes.size / totalNodes < 0.7) {
  gameStateManager.resetDominanceTracker(gameState, player);
}
```

### `updateAllDominanceTrackers(state: GameState, deltaTime: number): void`
Actualiza automáticamente todos los trackers según dominancia actual.

```typescript
// En cada frame
gameStateManager.updateAllDominanceTrackers(gameState, deltaTime);
```

### `getPlayerStats(state: GameState, player: Player): PlayerStats`
Obtiene estadísticas detalladas de un jugador.

```typescript
const stats = gameStateManager.getPlayerStats(gameState, player);
console.log(`Nodos: ${stats.controlledNodes}`);
console.log(`Energía total: ${stats.totalEnergy}`);
console.log(`Dominancia: ${stats.dominancePercentage}%`);
console.log(`Eliminado: ${stats.isEliminated}`);
```

**PlayerStats incluye**:
- `playerId`: ID del jugador
- `username`: Nombre del jugador
- `controlledNodes`: Número de nodos controlados
- `totalEnergy`: Energía almacenada + en tránsito
- `storedEnergy`: Energía en nodos
- `transitEnergy`: Energía en paquetes viajando
- `dominancePercentage`: % de nodos (0-100)
- `dominanceTime`: ms acumulados de dominancia
- `isEliminated`: Si perdió nodo inicial
- `hasInitialNode`: Si controla su nodo inicial

### `getGameSnapshot(state: GameState): GameSnapshot`
Genera snapshot inmutable del estado actual para la UI.

```typescript
const snapshot = gameStateManager.getGameSnapshot(gameState);

// Información general
console.log(`Status: ${snapshot.status}`);
console.log(`Tiempo: ${snapshot.elapsedTimeFormatted}`);
console.log(`Restante: ${snapshot.remainingTimeFormatted}`);

// Estadísticas por jugador
snapshot.playerStats.forEach(stats => {
  console.log(`${stats.username}: ${stats.controlledNodes} nodos`);
});

// Victoria
if (snapshot.winnerId) {
  console.log(`Ganador: ${snapshot.winnerId}`);
  console.log(`Razón: ${snapshot.victoryReason}`);
}

// Advertencias
if (snapshot.dominanceWarning) {
  const { playerId, timeRemaining } = snapshot.dominanceWarning;
  console.log(`⚠️ ${playerId} ganará en ${timeRemaining}ms`);
}
```

### `checkVictoryConditions(state: GameState, playerStats: PlayerStats[]): boolean`
Verifica si se cumplió alguna condición de victoria.

```typescript
const stats = state.players.map(p => gameStateManager.getPlayerStats(state, p));

if (gameStateManager.checkVictoryConditions(state, stats)) {
  gameStateManager.setGameStatus(state, 'finished');
  // Determinar ganador y razón
}
```

**Condiciones verificadas**:
1. **Tiempo Límite**: 3 minutos transcurridos
2. **Dominancia**: Jugador con >= 70% de nodos por 10 segundos
3. **Eliminación**: Solo queda 1 jugador activo

### `setGameStatus(state: GameState, newStatus: GameStatus): void`
Cambia el estado del juego.

```typescript
gameStateManager.setGameStatus(gameState, 'playing');  // Iniciar
gameStateManager.setGameStatus(gameState, 'finished'); // Terminar
```

**Estados válidos**: `'waiting'` | `'playing'` | `'finished'`

## Interfaces

### GameState
```typescript
interface GameState {
  players: Player[];
  graph: Graph;
  currentTick: number;
  elapsedTime: number;
  dominanceTrackers: Map<Player, number>;
  status: 'waiting' | 'playing' | 'finished';
}
```

### PlayerStats
```typescript
interface PlayerStats {
  playerId: string | number;
  username: string;
  controlledNodes: number;
  totalEnergy: number;
  storedEnergy: number;
  transitEnergy: number;
  dominancePercentage: number;
  dominanceTime: number;
  isEliminated: boolean;
  hasInitialNode: boolean;
}
```

### GameSnapshot
```typescript
interface GameSnapshot {
  timestamp: number;
  currentTick: number;
  elapsedTime: number;
  elapsedTimeFormatted: string;
  remainingTime: number;
  remainingTimeFormatted: string;
  status: GameStatus;
  totalNodes: number;
  totalPlayers: number;
  playerStats: PlayerStats[];
  winnerId?: string | number;
  victoryReason?: 'dominance' | 'time_limit' | 'elimination';
  dominanceWarning?: {
    playerId: string | number;
    timeRemaining: number;
  };
}
```

## Constantes del Juego

```typescript
GAME_DURATION_MS = 180000;      // 3 minutos
DOMINANCE_THRESHOLD = 0.7;      // 70% de nodos
DOMINANCE_DURATION_MS = 10000;  // 10 segundos
```

## Integración con NEXA

### Game Loop Principal

```typescript
class Game {
  private gameState: GameState;
  private gameStateManager: GameStateManager;

  init() {
    this.gameStateManager = new GameStateManager();
    this.gameState = this.gameStateManager.createGameState({
      players: this.players,
      graph: this.mapGraph,
    });
    this.gameStateManager.setGameStatus(this.gameState, 'playing');
  }

  update(deltaTime: number) {
    // Actualizar tiempo
    this.gameStateManager.updateElapsedTime(this.gameState, deltaTime);
    
    // Actualizar trackers de dominancia
    this.gameStateManager.updateAllDominanceTrackers(this.gameState, deltaTime);
    
    // Verificar condiciones de victoria
    const stats = this.gameState.players.map(p => 
      this.gameStateManager.getPlayerStats(this.gameState, p)
    );
    
    if (this.gameStateManager.checkVictoryConditions(this.gameState, stats)) {
      this.endGame();
    }
    
    // Actualizar UI con snapshot
    const snapshot = this.gameStateManager.getGameSnapshot(this.gameState);
    this.updateUI(snapshot);
  }
}
```

### Actualización de UI

```typescript
updateUI(snapshot: GameSnapshot) {
  // Mostrar tiempo
  this.timeText.setText(snapshot.elapsedTimeFormatted);
  
  // Mostrar estadísticas
  snapshot.playerStats.forEach((stats, index) => {
    this.playerTexts[index].setText(
      `${stats.username}: ${stats.controlledNodes} nodos (${stats.dominancePercentage.toFixed(1)}%)`
    );
  });
  
  // Advertencia de dominancia
  if (snapshot.dominanceWarning) {
    const seconds = Math.ceil(snapshot.dominanceWarning.timeRemaining / 1000);
    this.warningText.setText(`⚠️ Victoria en ${seconds}s`);
    this.warningText.setVisible(true);
  } else {
    this.warningText.setVisible(false);
  }
  
  // Pantalla de victoria
  if (snapshot.status === 'finished' && snapshot.winnerId) {
    this.showVictoryScreen(snapshot.winnerId, snapshot.victoryReason);
  }
}
```

### Detección de Eliminación

```typescript
onNodeCaptured(node: Node, newOwner: Player, previousOwner: Player | null) {
  if (previousOwner && node === previousOwner.initialNode) {
    // Jugador perdió su nodo inicial = eliminación
    const stats = this.gameStateManager.getPlayerStats(this.gameState, previousOwner);
    
    if (stats.isEliminated) {
      console.log(`${previousOwner.username} ha sido eliminado!`);
      
      // Neutralizar todos sus nodos restantes
      for (const controlledNode of previousOwner.controlledNodes) {
        controlledNode.setOwner(null);
      }
    }
  }
}
```

## Patrones de Diseño

### Manager Pattern
Centraliza la gestión del estado del juego:
- Responsabilidad única: mantener y consultar estado
- Encapsula lógica de condiciones de victoria
- Proporciona API clara para manipulación de estado

### Immutable Snapshot Pattern
Los snapshots son objetos de solo lectura:
- No contienen referencias a entidades mutables
- Seguros para pasar a la capa de presentación
- Pueden ser serializados para replay/debug

## Tests

El GameStateManager cuenta con **20 tests unitarios** que cubren:
- ✅ Creación de estado inicial
- ✅ Actualización de tiempo y ticks
- ✅ Trackers de dominancia (update/reset/updateAll)
- ✅ Cálculo de estadísticas de jugadores
- ✅ Generación de snapshots
- ✅ Condiciones de victoria (las 3)
- ✅ Detección de eliminación
- ✅ Formateo de tiempos
- ✅ Advertencias de dominancia

Ejecutar tests:
```bash
pnpm test GameStateManager
```

## Ejemplo Completo

```typescript
import { GameStateManager } from '@/infrastructure/state/GameStateManager';
import type { Player } from '@/core/entities/player';
import type { Graph } from '@/core/types/graph.types';

// 1. Inicializar
const manager = new GameStateManager();
const gameState = manager.createGameState({
  players: [player1, player2],
  graph: mapGraph,
});

manager.setGameStatus(gameState, 'playing');

// 2. Game Loop
function gameLoop(deltaTime: number) {
  // Actualizar tiempo
  manager.updateElapsedTime(gameState, deltaTime);
  
  // Actualizar trackers automáticamente
  manager.updateAllDominanceTrackers(gameState, deltaTime);
  
  // Obtener snapshot para UI
  const snapshot = manager.getGameSnapshot(gameState);
  renderUI(snapshot);
  
  // Verificar victoria
  const stats = gameState.players.map(p => 
    manager.getPlayerStats(gameState, p)
  );
  
  if (manager.checkVictoryConditions(gameState, stats)) {
    manager.setGameStatus(gameState, 'finished');
    handleGameOver(snapshot);
  }
}

// 3. Renderizar UI
function renderUI(snapshot: GameSnapshot) {
  console.log(`⏱️  ${snapshot.elapsedTimeFormatted} / 03:00`);
  
  snapshot.playerStats.forEach(stats => {
    const icon = stats.isEliminated ? '💀' : '👤';
    console.log(
      `${icon} ${stats.username}: ${stats.controlledNodes} nodos ` +
      `(${stats.dominancePercentage.toFixed(1)}%) - ` +
      `Energía: ${stats.totalEnergy}`
    );
  });
  
  if (snapshot.dominanceWarning) {
    const secs = (snapshot.dominanceWarning.timeRemaining / 1000).toFixed(1);
    console.log(`⚠️  ¡Victoria en ${secs}s!`);
  }
}

// 4. Game Over
function handleGameOver(snapshot: GameSnapshot) {
  console.log('\n🎮 GAME OVER 🎮');
  
  if (snapshot.winnerId) {
    const winner = snapshot.playerStats.find(s => s.playerId === snapshot.winnerId);
    console.log(`🏆 Ganador: ${winner?.username}`);
    
    switch (snapshot.victoryReason) {
      case 'dominance':
        console.log('Victoria por Dominancia (70% durante 10s)');
        break;
      case 'time_limit':
        console.log('Victoria por Tiempo Límite');
        break;
      case 'elimination':
        console.log('Victoria por Eliminación');
        break;
    }
  } else {
    console.log('🤝 Empate');
  }
}
```

## Consideraciones de Rendimiento

- **createGameState**: O(n) donde n = número de jugadores
- **updateElapsedTime**: O(1)
- **updateDominanceTracker**: O(1)
- **getPlayerStats**: O(E) donde E = número de aristas (para calcular energía en tránsito)
- **getGameSnapshot**: O(n + E) donde n = jugadores, E = aristas
- **checkVictoryConditions**: O(n)

**Optimización**: Cachear `totalEnergy` en Player para evitar recalcular en cada frame.

## Referencias

- Especificación NEXA: `contexto/descripcion_logica.md`
- Patrones de Diseño: Manager Pattern, Snapshot Pattern
- Tests: `src/infrastructure/state/GameStateManager.test.ts`
