# NEXA - Refactorización para Alineación con Documento de Diseño

## Resumen de Cambios

Este documento detalla los cambios realizados para alinear el código actual con las especificaciones del documento de diseño del juego NEXA.

## Cambios Principales

### 1. Sistema de Energía Conservativa

**Antes:**
- Cada nodo tenía su propia energía independiente con tasa de generación
- La energía se generaba automáticamente en cada nodo
- Sistema basado en `maxEnergy` y `generationRate`

**Después:**
- Sistema de energía total conservativa por jugador
- La energía se distribuye entre nodos y aristas, no se consume
- `totalEnergy` en `IPlayer` que solo cambia al capturar nodos especiales
- Energía de defensa calculada como: `totalEnergy - energía asignada a aristas`

### 2. Tipos de Nodos

**Antes:**
```typescript
enum NodeType {
  STANDARD, GENERATOR, FORTRESS, AMPLIFIER, HARVESTER, RELAY
}
```

**Después:**
```typescript
enum NodeType {
  BASIC,        // Nodo básico estándar
  ENERGY,       // Aumenta energía total al capturar (+50)
  ATTACK,       // Duplica energía asignada a aristas salientes (x2)
  DEFENSE,      // Duplica energía de defensa (x2)
  SUPER_ENERGY, // Gran aumento de energía (+150) y velocidad de emisión
  NEUTRAL       // Sin dueño inicial
}
```

### 3. Sistema de Tiempo Real

**Antes:**
- Sistema basado en turnos
- `nextTurn()` para avanzar el juego
- Sin intervalos específicos

**Después:**
- Sistema en tiempo real con intervalos precisos:
  - Energía de ataque: enviada cada **20ms**
  - Actualización de defensa: cada **30ms**
  - Límite de tiempo: **3 minutos** (180000ms)
- Método `update(deltaTime)` en GameManager

### 4. Energía en Tránsito

**Antes:**
- Conexiones con `energyFlow` estático
- Sin concepto de energía viajando

**Después:**
```typescript
interface IEnergyPacket {
  id: ID;
  ownerId: ID;
  amount: number;
  sourceNodeId: ID;
  targetNodeId: ID;
  progress: number; // 0-1
  timestamp: number;
}

interface IConnection {
  // ...
  weight: number;           // Distancia/peso de la conexión
  energyPackets: IEnergyPacket[];  // Energía en tránsito
  assignedEnergy: number;   // Energía asignada por el dueño del nodo origen
}
```

### 5. Nodo Inicial Obligatorio

**Antes:**
- Sin concepto de nodo inicial
- Derrota solo por eliminación de todos los nodos

**Después:**
```typescript
interface IPlayer {
  // ...
  initialNodeId: ID;  // Nodo inicial del jugador
}

interface INode {
  // ...
  isInitialNode: boolean;  // true si es nodo inicial de un jugador
}
```

**Regla:** Perder el nodo inicial = derrota automática

### 6. Condiciones de Victoria

**Antes:**
- Sistema genérico con múltiples tipos de victoria
- `VictoryType.DOMINATION`, `ELIMINATION`, `SCORE`, etc.

**Después:**
```typescript
// Victoria por dominación: controlar 70% de nodos por 10 segundos
victoryConditions: {
  type: VictoryType.DOMINATION,
  nodeControlPercentage: 70,     // 70%
  controlDuration: 10000,         // 10 segundos
  timeLimit: 180000              // 3 minutos
}
```

**Condiciones:**
1. **Victoria por dominación**: Controlar 70% de nodos durante 10 segundos continuos
2. **Victoria por tiempo**: Mayor cantidad de nodos al finalizar los 3 minutos
3. **Derrota instantánea**: Perder el nodo inicial

### 7. Resolución de Conflictos

**Implementado:**

#### En Aristas (Colisiones)
```typescript
// Si dos energías enemigas se encuentran en una arista:
if (p1.amount === p2.amount) {
  // Ambas se destruyen
} else {
  // La más fuerte sobrevive con: amount = |p1.amount - p2.amount|
}
```

#### En Nodos (Ataques)
```typescript
// Orden de resolución:
// 1. Actualizar defensa primero (30ms interval)
// 2. Procesar llegada de ataques (20ms interval)

// Comparación:
if (attackEnergy > defenseEnergy) {
  // Nodo capturado
} else if (attackEnergy === defenseEnergy) {
  // Nodo neutralizado (owner = null)
} else {
  // Ataque fallido, defensa reducida
}
```

#### Multiplicadores
- **Nodo ATTACK**: Duplica energía asignada a aristas salientes
- **Nodo DEFENSE**: Duplica energía de defensa al recibir ataques

### 8. GameManager Refactorizado

**Nuevos Métodos:**
- `update(deltaTime)` - Loop principal en tiempo real
- `updateDefense()` - Actualiza defensa cada 30ms
- `processAttackEnergy()` - Envía paquetes de energía cada 20ms
- `updateEnergyPackets(deltaTime)` - Mueve paquetes por conexiones
- `handlePacketArrival()` - Maneja llegada de energía
- `resolveAttack()` - Resuelve ataque vs defensa
- `captureNode()` - Captura nodo y aplica bonos
- `neutralizeNode()` - Neutraliza nodo (owner = null)
- `resolvePacketCollisions()` - Colisiones entre energías enemigas
- `checkVictoryConditions()` - Verifica victoria por dominación
- `checkTimeLimit()` - Verifica límite de 3 minutos
- `assignEnergyToConnection()` - Asigna energía a arista para ataques

**Métodos Eliminados:**
- `nextTurn()` - Ya no hay turnos, el juego es en tiempo real

### 9. AIController Actualizado

**Antes:**
- Lógica simple de conquista directa
- Cambiaba `node.owner` directamente

**Después:**
- Estrategia basada en prioridades:
  1. Nodos de energía (alto valor)
  2. Nodos neutrales (fácil captura)
  3. Nodos enemigos débiles
  4. Nodos iniciales (eliminación de oponente)
- Asigna energía a conexiones usando `assignEnergyToConnection()`
- Calcula energía necesaria basándose en defensa del objetivo
- Gestiona balance entre ataque y defensa

### 10. Game Scene Visualización

**Nuevas Características:**
- Renderizado de nodos con colores por jugador
- Visualización de nodos iniciales (más grandes, borde grueso)
- Indicadores de tipo de nodo (E=Energy, A=Attack, D=Defense, S=Super)
- Mostrar energía de defensa en cada nodo
- Energía asignada en conexiones
- **Paquetes de energía en tránsito** visualizados como círculos moviéndose
- Temporizador de 3 minutos con cuenta regresiva
- Mostrar distribución de energía del jugador (Ataque vs Defensa)

## Estructura de Archivos Modificados

```
nexa/src/
├── core/
│   ├── types/
│   │   ├── common.types.ts      ✓ NodeType, GAME_CONSTANTS actualizados
│   │   ├── node.types.ts        ✓ INode refactorizado, NODE_TYPE_CONFIGS
│   │   ├── player.types.ts      ✓ IPlayer con initialNodeId y totalEnergy
│   │   ├── connection.types.ts  ✓ IConnection con IEnergyPacket
│   │   ├── game.types.ts        ✓ IGameConfig, VictoryConditions actualizados
│   │   └── index.ts             ✓ Exports actualizados
│   └── managers/
│       ├── GameManager.ts       ✓ Sistema tiempo real implementado
│       └── AIController.ts      ✓ IA con asignación de energía a aristas
└── scenes/
    ├── Game.ts                  ✓ Visualización tiempo real
    └── MainMenu.ts              ✓ Sin cambios necesarios
```

## Configuración del Juego

### Intervalos de Tiempo
```typescript
ATTACK_INTERVAL: 20,              // ms
DEFENSE_UPDATE_INTERVAL: 30,      // ms
TIME_LIMIT: 180000,               // 3 minutos
```

### Condiciones de Victoria
```typescript
DOMINATION_PERCENTAGE: 70,        // 70% de nodos
DOMINATION_DURATION: 10000,       // 10 segundos
```

### Bonos de Energía
```typescript
ENERGY_NODE_BONUS: 50,            // Nodo ENERGY
SUPER_ENERGY_NODE_BONUS: 150,    // Nodo SUPER_ENERGY
```

## Flujo de Juego

1. **Inicialización:**
   - Cada jugador comienza con 100 de energía total
   - Cada jugador tiene un nodo inicial asignado
   - Nodos pueden ser: BASIC, ENERGY, ATTACK, DEFENSE, SUPER_ENERGY, NEUTRAL

2. **Loop en Tiempo Real (cada frame):**
   ```
   update(deltaTime) {
     - Actualizar timers (attack, defense)
     - Si attackTimer >= 20ms: enviar paquetes de energía
     - Si defenseTimer >= 30ms: actualizar defensa de nodos
     - Actualizar posición de paquetes de energía
     - Resolver colisiones en aristas
     - Manejar llegadas de paquetes (ataques)
     - Verificar condiciones de victoria
     - Verificar límite de tiempo
   }
   ```

3. **Asignación de Energía:**
   - El jugador/IA asigna energía a conexiones
   - Energía asignada NO se resta del total, solo se distribuye
   - Defensa = totalEnergy - suma(energía asignada a todas las aristas)

4. **Ataque:**
   - Energía enviada cada 20ms por conexiones con energía asignada
   - Paquetes viajan a velocidad constante basada en peso de conexión
   - Al llegar: comparar con defensa del nodo destino
   - Aplicar multiplicadores según tipo de nodo

5. **Victoria:**
   - Controlar 70%+ de nodos por 10 segundos → Victoria
   - Llegar a 3 minutos → Gana quien tenga más nodos
   - Perder nodo inicial → Derrota inmediata

## Compatibilidad

- El código mantiene compatibilidad con la estructura de Phaser 3
- Los tipos TypeScript son completamente type-safe
- El sistema de singletons (GameManager, AIController) se mantiene
- La arquitectura de escenas de Phaser se respeta

## Testing

Para probar el sistema refactorizado:

1. **Iniciar juego:**
   ```bash
   npm run dev
   ```

2. **Verificar:**
   - Timer de 3 minutos cuenta regresiva
   - Nodos iniciales son más grandes
   - Paquetes de energía se mueven por conexiones
   - Capturar nodo ENERGY aumenta energía total del jugador
   - IA asigna energía a conexiones para atacar
   - Perder nodo inicial elimina al jugador

3. **Controles:**
   - `R` - Reiniciar juego
   - `P` - Pausar/Reanudar
   - `ESC` - Volver al menú

## Notas Importantes

- **Sin nuevas features:** Solo refactorización para alinearse con el documento
- **Energía conservativa:** El concepto más importante del cambio
- **Tiempo real:** El juego ya no es por turnos
- **Visualización:** Los paquetes de energía ahora son visibles moviéndose

## Próximos Pasos (Fuera del Alcance del Refactor)

Estos elementos están mencionados en el documento pero no se implementaron en este refactor:

- [ ] Nodos de articulación (división de subgrafos)
- [ ] Advertencias de energías aliadas cruzadas
- [ ] Sistema de velocidad de emisión variable para SUPER_ENERGY
- [ ] UI completa para asignación manual de energía por el jugador
- [ ] Generación procedural de mapas con grafos
- [ ] Sistema de replay/grabación de partidas
- [ ] Multiplayer

---

**Refactorización completada:** El código ahora está alineado con las especificaciones del documento NEXA.