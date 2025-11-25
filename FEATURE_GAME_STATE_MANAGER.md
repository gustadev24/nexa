# Feature: GameStateManager - Sistema de Estado de Partida

## Resumen

Implementación completa del **GameStateManager**, el gestor central del estado de la partida en NEXA. Este componente es responsable de mantener toda la información del juego en curso, gestionar las condiciones de victoria, trackear la dominancia de los jugadores, y generar snapshots inmutables para la capa de presentación.

## Tareas Completadas

### ✅ S2.8 - Capa de Infraestructura - GameStateManager

#### 1. ✅ Interfaces y Tipos (`src/infrastructure/state/types.ts`)
- **GameStatus**: Enum de estados (`'waiting'`, `'playing'`, `'finished'`)
- **GameState**: Interface principal con jugadores, grafo, tiempo, ticks, trackers y estado
- **PlayerStats**: Estadísticas detalladas de jugador (nodos, energía, dominancia, eliminación)
- **GameSnapshot**: Snapshot inmutable para UI con timestamps y datos formateados
- **GameStateConfig**: Configuración de inicialización

#### 2. ✅ Clase GameStateManager (`src/infrastructure/state/GameStateManager.ts`)

**Métodos Públicos Implementados:**
- `createGameState(config)`: Inicializa estado de partida
- `updateElapsedTime(state, deltaTime)`: Actualiza tiempo transcurrido y ticks
- `updateDominanceTracker(player, deltaTime)`: Acumula tiempo de dominancia
- `resetDominanceTracker(player)`: Resetea tracker cuando pierde dominancia
- `updateAllDominanceTrackers(deltaTime)`: Actualiza automáticamente todos los trackers
- `getPlayerStats(player)`: Calcula estadísticas completas del jugador
- `getGameSnapshot()`: Genera snapshot inmutable del estado actual
- `checkVictoryConditions(playerStats)`: Verifica las 3 condiciones de victoria
- `setGameStatus(status)`: Cambia el estado del juego

**Métodos Privados (Helpers):**
- `determineWinner()`: Identifica ganador según condición cumplida
- `checkDominanceWarning()`: Detecta jugador cerca de ganar por dominancia
- `formatTime(ms)`: Convierte milisegundos a formato "mm:ss"

**Constantes del Juego:**
```typescript
GAME_DURATION_MS = 180000;      // 3 minutos
DOMINANCE_THRESHOLD = 0.7;      // 70% de nodos
DOMINANCE_DURATION_MS = 10000;  // 10 segundos
```

#### 3. ✅ Tests Unitarios (`src/infrastructure/state/GameStateManager.test.ts`)

**20 tests implementados** organizados en 8 suites:

1. **createGameState** (2 tests)
   - Inicializa estado correctamente
   - Valida valores por defecto

2. **updateElapsedTime** (1 test)
   - Actualiza tiempo y ticks

3. **Dominance Trackers** (3 tests)
   - updateDominanceTracker acumula tiempo
   - resetDominanceTracker reinicia contador
   - updateAllDominanceTrackers procesa automáticamente

4. **getPlayerStats** (4 tests)
   - Calcula estadísticas básicas
   - Calcula energía en tránsito (packets)
   - Detecta eliminación (pérdida de nodo inicial)
   - Trackea tiempo de dominancia

5. **getGameSnapshot** (4 tests)
   - Genera información básica
   - Incluye estadísticas de todos los jugadores
   - Detecta advertencia de dominancia (>= 70% por 5+ segundos)
   - Formatea tiempos correctamente (mm:ss)

6. **Victory Conditions** (4 tests)
   - Victoria por tiempo límite (3 minutos)
   - Victoria por dominancia (70% durante 10 segundos)
   - Victoria por eliminación (pérdida de nodo inicial)
   - No hay victoria cuando condiciones no se cumplen

7. **setGameStatus** (1 test)
   - Cambia estado del juego

8. **getStateDebugInfo** (1 test)
   - Genera información de debug

**Resultado:** ✅ **20/20 tests passing**

#### 4. ✅ Documentación (`src/infrastructure/state/README.md`)
- Descripción completa del componente
- API detallada con ejemplos de uso
- Explicación de las 3 condiciones de victoria
- Integración con game loop de NEXA
- Ejemplos de renderizado de UI
- Patrones de diseño aplicados
- Consideraciones de rendimiento

## Funcionalidades Implementadas

### 🎮 Gestión de Estado Completo
- Mantiene estado mutable del juego (GameState)
- Inicialización desde configuración
- Transiciones de estado: waiting → playing → finished

### ⏱️ Sistema de Tiempo
- Tracking de tiempo transcurrido en milisegundos
- Contador de ticks del juego
- Formateo para display (mm:ss)
- Tiempo restante calculado (3:00 - elapsed)

### 🏆 Trackers de Dominancia
- Acumulación automática cuando jugador >= 70% de nodos
- Reset automático al perder dominancia
- Advertencias cuando cerca de victoria (5+ segundos)
- Condición de victoria: 10 segundos continuos

### 📊 Estadísticas de Jugadores
- Nodos controlados (count)
- Energía total (almacenada + en tránsito)
- Porcentaje de dominancia (0-100%)
- Tiempo de dominancia acumulado
- Estado de eliminación
- Verificación de nodo inicial

### 📸 Snapshots Inmutables
- Datos serializables sin referencias mutables
- Seguros para pasar a UI
- Incluyen timestamp
- Tiempos formateados para display
- Información de victoria
- Advertencias de dominancia

### 🎯 Condiciones de Victoria

#### 1️⃣ Victoria por Tiempo Límite
- **Duración:** 3 minutos (180,000 ms)
- **Ganador:** Jugador con más nodos controlados
- **Empate:** Si ambos tienen igual cantidad de nodos

#### 2️⃣ Victoria por Dominancia
- **Condición:** >= 70% de nodos durante 10 segundos continuos
- **Tracker:** Se resetea si cae bajo 70%
- **Advertencia:** Se muestra a partir de 5 segundos

#### 3️⃣ Victoria por Eliminación
- **Condición:** Captura del nodo inicial del oponente
- **Efecto:** Jugador eliminado pierde todos sus nodos
- **Ganador:** Último jugador activo

## Integración con NEXA

### Mecánicas Vinculadas

**Conservación de Energía:**
```typescript
getPlayerStats() {
  // Energía almacenada en nodos
  const storedEnergy = Array.from(player.controlledNodes)
    .reduce((sum, node) => sum + node.energy, 0);
  
  // Energía en tránsito (paquetes viajando)
  const transitEnergy = graph.edges
    .filter(edge => edge.hasPackets())
    .reduce((sum, edge) => {
      const packets = edge.packets.filter(p => p.owner === player);
      return sum + packets.reduce((s, p) => s + p.amount, 0);
    }, 0);
  
  // Total conservado
  const totalEnergy = storedEnergy + transitEnergy;
}
```

**Fragmentación del Grafo:**
- Cuando jugador pierde nodo inicial → eliminación
- GameStateManager detecta `isEliminated = true`
- Game debe neutralizar nodos restantes del jugador

**Ciclos de Defensa/Ataque:**
- updateElapsedTime se llama cada frame
- deltaTime corresponde a ciclos de 30ms (defensa) o 20ms (ataque)
- Trackers se actualizan con deltaTime real

### Game Loop Integration

```typescript
class GameScene extends Phaser.Scene {
  private gameStateManager: GameStateManager;
  private gameState: GameState;

  create() {
    // Inicializar
    this.gameStateManager = new GameStateManager();
    this.gameState = this.gameStateManager.createGameState({
      players: this.players,
      graph: this.mapGraph,
    });
    this.gameStateManager.setGameStatus(this.gameState, 'playing');
  }

  update(time: number, delta: number) {
    if (this.gameState.status !== 'playing') return;

    // Actualizar tiempo
    this.gameStateManager.updateElapsedTime(this.gameState, delta);
    
    // Actualizar trackers
    this.gameStateManager.updateAllDominanceTrackers(this.gameState, delta);
    
    // Verificar victoria
    const stats = this.gameState.players.map(p => 
      this.gameStateManager.getPlayerStats(this.gameState, p)
    );
    
    if (this.gameStateManager.checkVictoryConditions(this.gameState, stats)) {
      this.handleGameOver();
    }
    
    // Actualizar UI
    this.updateUI(this.gameStateManager.getGameSnapshot(this.gameState));
  }
}
```

## Estadísticas de Implementación

### Archivos Creados
- ✅ `src/infrastructure/state/types.ts` (151 líneas)
- ✅ `src/infrastructure/state/GameStateManager.ts` (368 líneas)
- ✅ `src/infrastructure/state/GameStateManager.test.ts` (448 líneas)
- ✅ `src/infrastructure/state/README.md` (documentación completa)

**Total:** 967 líneas de código + documentación

### Coverage de Tests
- **20 tests unitarios** (100% passing)
- **8 test suites** organizadas por funcionalidad
- **Cobertura:** Todos los métodos públicos y casos edge

### Commits Realizados
1. `3eb8968` - feat: implementar GameStateManager completo
2. `254b554` - test: agregar tests completos del GameStateManager

## Patrones de Diseño Aplicados

### 🏗️ Manager Pattern
El GameStateManager centraliza toda la lógica de estado:
- Responsabilidad única: gestionar estado del juego
- API clara y cohesiva
- Encapsula lógica de condiciones de victoria
- Facilita testing y mantenibilidad

### 📸 Immutable Snapshot Pattern
Los snapshots garantizan inmutabilidad:
- No contienen referencias a objetos mutables
- Seguros para pasar entre capas
- Serializables para replay/debug
- Evitan efectos secundarios en UI

### 🔔 Observer Pattern (indirecto)
GameSnapshot permite patrón observer:
- UI puede suscribirse a cambios de estado
- Datos inmutables evitan side effects
- Desacoplamiento entre lógica y presentación

## Problemas Resueltos Durante Implementación

### ⚠️ Issue 1: Propiedad incorrecta en EnergyPacket
**Problema:** Usaba `packet.energy` en lugar de `packet.amount`
**Solución:** Corregir a `packet.amount` en cálculo de energía en tránsito
**Estado:** ✅ Resuelto

### ⚠️ Issue 2: Test de dominanceWarning fallaba
**Problema:** Player1 solo controlaba 66.67% (2/3 nodos), necesitaba >= 70%
**Diagnóstico:**
```javascript
Player1 stats: {
  controlledNodes: 2,
  dominancePercentage: 66.66666666666666,  // < 70%
  dominanceTime: 5000
}
Dominance warning: undefined  // Esperaba warning
```
**Solución:** Hacer que Player1 capture 3/3 nodos (100%)
**Estado:** ✅ Resuelto

### ⚠️ Issue 3: Parámetros no utilizados
**Problema:** `state` no usado en `checkDominanceWarning()`
**Solución:** Eliminar parámetro innecesario
**Estado:** ✅ Resuelto

## Testing

### Ejecutar Tests
```bash
# Todos los tests del GameStateManager
pnpm test GameStateManager

# Modo watch
pnpm test GameStateManager --watch

# Con coverage
pnpm test GameStateManager --coverage
```

### Resultado Final
```
✓ src/infrastructure/state/GameStateManager.test.ts (20 tests) 11ms
  ✓ GameStateManager (20)
    ✓ createGameState (2)
    ✓ updateElapsedTime (1)
    ✓ Dominance Trackers (3)
    ✓ getPlayerStats (4)
    ✓ getGameSnapshot (4)
    ✓ Victory Conditions (4)
    ✓ setGameStatus (1)
    ✓ getStateDebugInfo (1)

Test Files  1 passed (1)
Tests  20 passed (20)
Duration  262ms
```

## Próximos Pasos

### 🔄 Integración Pendiente
1. **GameService** (Application Layer)
   - Usar GameStateManager en capa de aplicación
   - Orquestar interacción con otras entidades
   
2. **GameScene** (Presentation Layer)
   - Integrar snapshots en Phaser scene
   - Renderizar UI con datos de snapshot
   - Mostrar advertencias de dominancia

3. **Victory Screen**
   - Crear escena de victoria
   - Mostrar estadísticas finales
   - Replay/rematch options

### 🎨 Mejoras Futuras
- Cache de `totalEnergy` para optimizar rendimiento
- Serialización de GameState para save/load
- Sistema de replay usando historial de snapshots
- Analytics de partida (heatmaps, gráficas)

## Conclusión

El **GameStateManager** está **completamente implementado y testeado**. Proporciona una API robusta para gestionar el estado de la partida, verificar condiciones de victoria, y generar snapshots inmutables para la UI.

**Estado:** ✅ **COMPLETO** - Ready for integration

---

**Autor:** GitHub Copilot  
**Fecha:** 2024  
**Branch:** rickDeb  
**Proyecto:** NEXA - Real-time Strategy Game on Graphs
