# AI Module - NEXA

Módulo de Inteligencia Artificial para jugadores controlados por computadora en NEXA.

## 📋 Descripción

El módulo AI proporciona un controlador inteligente para jugadores no-humanos, implementando estrategias de juego adaptativas basadas en diferentes niveles de dificultad.

## 🏗️ Arquitectura

### BasicAI Class

Controlador principal de IA que implementa:

- **Sistema de decisión**: Evaluación periódica del estado del juego
- **Planificación de acciones**: Cola de acciones ordenadas por prioridad
- **Estrategias adaptativas**: Comportamiento basado en dificultad
- **Gestión de recursos**: Optimización del uso de energía

## 🎯 Niveles de Dificultad

### EASY (Fácil)
```typescript
{
  aggressiveness: 0.3,      // Poco agresiva
  defenseWeight: 0.6,       // Enfocada en defensa
  expansionWeight: 0.5,     // Expansión moderada
  energyManagement: 0.7     // Muy conservadora con energía
}
```

**Comportamiento**:
- Prioriza defensa sobre ataque
- Conservadora con los recursos
- 1 acción por ciclo de decisión
- Reacciona principalmente a amenazas directas

### MEDIUM (Medio)
```typescript
{
  aggressiveness: 0.6,      // Moderadamente agresiva
  defenseWeight: 0.5,       // Balanceada
  expansionWeight: 0.7,     // Alta prioridad en expansión
  energyManagement: 0.5     // Balanceada
}
```

**Comportamiento**:
- Balance entre ataque y defensa
- Prioriza expansión territorial
- 2 acciones por ciclo de decisión
- Planifica ataques viables

### HARD (Difícil)
```typescript
{
  aggressiveness: 0.9,      // Muy agresiva
  defenseWeight: 0.4,       // Menos defensiva
  expansionWeight: 0.9,     // Máxima prioridad en expansión
  energyManagement: 0.3     // Agresiva con recursos
}
```

**Comportamiento**:
- Altamente agresiva
- Rápida expansión territorial
- 3 acciones por ciclo de decisión
- Arriesga recursos para ventajas estratégicas

## 🧠 Sistema de Decisión

### Ciclo de Actualización

```
Update Loop (cada 1000ms)
    ↓
Evaluate Situation
    ├─ Under Attack?
    ├─ Can Expand?
    ├─ Can Attack?
    └─ Total Energy
    ↓
Plan Actions
    ├─ Defensive Actions (Priority: 9-10)
    ├─ Expansion Actions (Priority: 5-7)
    ├─ Attack Actions (Priority: 6-8)
    └─ Energy Management (Priority: 5-7)
    ↓
Sort by Priority
    ↓
Execute Top N Actions
```

### Tipos de Acciones

#### 1. Send Energy
Envía paquetes de energía a nodos objetivos.

**Criterios**:
- Expansión: Capturar nodos neutrales
- Ataque: Conquistar nodos enemigos
- Refuerzos: Defender nodos aliados

#### 2. Assign Energy
Asigna energía automática a aristas específicas.

**Criterios**:
- Nodo con >80% energía
- Arista hacia objetivo estratégico
- No es nodo de tipo ENERGY

#### 3. Unassign Energy
Reduce asignaciones automáticas de energía.

**Criterios**:
- Nodo bajo ataque
- Energía del nodo <30%
- Necesidad de recursos defensivos

## 📊 Sistema de Prioridades

### Evaluación de Nodos

```typescript
Priority Calculation:
- SUPER_ENERGY node: 10
- ENERGY node: 8
- ATTACK node: 6
- DEFENSE node: 5
- BASIC node: 3
+ Adjacent connections * 0.5
```

### Modificadores de Prioridad

- **Nodo enemigo**: `× aggressiveness × 2`
- **Nodo neutral**: `× expansionWeight × 1.5`
- **Bajo ataque**: `Priority 10 (máxima)`

## 🔧 Integración

### Inicialización

```typescript
import { BasicAI, AIDifficulty } from '@/application/ai/BasicAI';
import { GameManager } from '@/core/managers/GameManager';

// Crear instancia de IA para un jugador
const ai = new BasicAI(
  GameManager.getInstance(),
  player,
  AIDifficulty.MEDIUM
);
```

### Actualización en Game Loop

```typescript
class GameScene extends Phaser.Scene {
  private aiController: BasicAI;

  update(time: number, delta: number): void {
    // Actualizar IA
    this.aiController.update(delta);
    
    // Actualizar GameManager
    this.gameManager.update(delta);
  }
}
```

### Cambiar Dificultad

```typescript
// Durante el juego
ai.setDifficulty(AIDifficulty.HARD);

// Pausar/Reanudar IA
ai.setEnabled(false); // Pausa
ai.setEnabled(true);  // Reanuda
```

## 🎮 Estrategias de Juego

### Defensa

**Detección de amenazas**:
- Monitorea paquetes enemigos entrantes
- Calcula energía total amenazante
- Solicita refuerzos si es necesario

**Acciones defensivas**:
1. Reducir asignaciones ofensivas
2. Solicitar refuerzos de nodos aliados
3. Priorizar conservación de energía

### Expansión

**Identificación de objetivos**:
- Nodos neutrales adyacentes
- Prioridad según tipo de nodo
- Posición estratégica (conexiones)

**Criterios de expansión**:
- Nodo source con ≥50 energía
- Energía suficiente para captura
- Alta prioridad en dificultad HARD

### Ataque

**Evaluación de viabilidad**:
```typescript
Required Energy = Target Energy + 30
Attack viable if:
  Source Energy ≥ Required Energy × 1.3
```

**Selección de objetivos**:
- Nodos enemigos debilitados
- Alta prioridad estratégica
- Disponibilidad de recursos

### Gestión de Energía

**Estrategias por nivel**:
- **<30% energía**: Reducir asignaciones (80%)
- **>80% energía**: Aumentar asignaciones (30%)
- **Nodos ENERGY**: Nunca reducir asignaciones

## 🔍 Métodos Helper (Pendientes)

Los siguientes métodos requieren integración con GameManager:

```typescript
// TODO: Implementar en GameManager
- getNodesByOwner(player: Player): Node[]
- getIncomingPackets(node: Node): EnergyPacket[]
- getAdjacentNodes(node: Node): Node[]
- findEdge(nodeA: Node, nodeB: Node): Edge | null
- getEdgesFromNode(node: Node): Edge[]
```

## 📈 Mejoras Futuras

### Corto Plazo
- [ ] Integrar con API de GameManager
- [ ] Implementar sistema de logging para debugging
- [ ] Agregar métricas de performance (APM)

### Mediano Plazo
- [ ] Machine Learning para aprendizaje adaptativo
- [ ] Patrones de juego basados en oponente
- [ ] Estrategias especializadas por tipo de mapa

### Largo Plazo
- [ ] Neural Network para toma de decisiones
- [ ] Sistema de memoria de partidas anteriores
- [ ] Análisis predictivo de movimientos enemigos

## 🧪 Testing

### Casos de Prueba

1. **Respuesta a amenazas**
   - IA bajo ataque múltiple
   - Solicitud correcta de refuerzos
   - Priorización de defensa

2. **Expansión territorial**
   - Captura de nodos neutrales
   - Priorización correcta de objetivos
   - Gestión de recursos durante expansión

3. **Comportamiento por dificultad**
   - EASY: Conservadora, defensiva
   - MEDIUM: Balanceada, oportunista
   - HARD: Agresiva, dominante

4. **Gestión de energía**
   - Redistribución eficiente
   - No desperdiciar recursos
   - Asignaciones óptimas

## 📚 Referencias

- **Strategy Pattern**: Diferentes estrategias por dificultad
- **Command Pattern**: Acciones planeadas y ejecutadas
- **Priority Queue**: Sistema de planificación de acciones

---

**Autor**: Sistema de IA de NEXA  
**Versión**: 1.0  
**Fecha**: 2025
