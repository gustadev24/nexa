# GraphManager

## Descripción

El `GraphManager` es el gestor central de la estructura del grafo en NEXA. Es responsable de crear, analizar y mantener la integridad topológica del campo de batalla representado como un grafo ponderado no dirigido.

## Características Principales

### 1. Creación de Grafos
- **Factory Pattern**: Crea nodos de diferentes tipos (BASIC, ATTACK, DEFENSE, ENERGY, SUPER_ENERGY)
- **Configuración Declarativa**: Usa `GraphConfig` para definir estructura completa
- **Validación**: Verifica integridad de referencias entre nodos y aristas

### 2. Análisis de Conectividad
- **Algoritmo de Tarjan**: Detecta puntos de articulación (nodos críticos)
- **BFS (Breadth-First Search)**: Calcula componentes conectadas
- **Análisis Completo**: Determina si el grafo es conexo

### 3. Gestión de Fragmentación
- **Detección de Desconexión**: Identifica nodos de un jugador separados de su nodo inicial
- **Crítico para Gameplay**: Cuando el grafo se fragmenta, el jugador pierde control de nodos desconectados

## API

### `createGraph(config: GraphConfig): Graph`
Crea un grafo completo desde una configuración.

```typescript
const graph = graphManager.createGraph({
  nodeConfigs: [
    { id: 'n1', type: NodeType.BASIC, position: { x: 0, y: 0 }, initialEnergy: 100 },
    { id: 'n2', type: NodeType.ATTACK, position: { x: 200, y: 0 } },
    { id: 'n3', type: NodeType.DEFENSE, position: { x: 100, y: 200 } },
  ],
  edgeConfigs: [
    { id: 'e1', nodeAId: 'n1', nodeBId: 'n2', weight: 50 },
    { id: 'e2', nodeAId: 'n2', nodeBId: 'n3', weight: 30 },
  ],
});
```

### `getNeighbors(node: Node): Node[]`
Obtiene todos los nodos conectados directamente a un nodo.

```typescript
const neighbors = graphManager.getNeighbors(node);
// Retorna: [node2, node3, node4]
```

### `findArticulationPoints(graph: Graph): Node[]`
Encuentra puntos de articulación usando el algoritmo de Tarjan.

**Punto de Articulación**: Nodo cuya eliminación incrementa el número de componentes conectadas.

```typescript
const criticalNodes = graphManager.findArticulationPoints(graph);
// Si n2 es eliminado, el grafo se separa en componentes
```

### `getConnectedComponent(startNode: Node, graph: Graph): Set<Node>`
Calcula la componente conectada desde un nodo usando BFS.

```typescript
const component = graphManager.getConnectedComponent(initialNode, graph);
// Retorna todos los nodos alcanzables desde initialNode
```

### `getDisconnectedNodes(player: Player, graph: Graph): Node[]`
Identifica nodos controlados por un jugador que están desconectados de su nodo inicial.

```typescript
const disconnected = graphManager.getDisconnectedNodes(player, graph);
// Estos nodos deben pasar a neutral
```

### `analyzeConnectivity(graph: Graph): ConnectivityAnalysis`
Realiza un análisis completo de conectividad.

```typescript
const analysis = graphManager.analyzeConnectivity(graph);
console.log(analysis.isConnected);         // true/false
console.log(analysis.components.length);   // Número de componentes
console.log(analysis.articulationPoints);  // Nodos críticos
```

## Algoritmos Implementados

### Algoritmo de Tarjan
**Complejidad**: O(V + E) donde V = nodos, E = aristas

Detecta puntos de articulación mediante DFS con valores `disc` y `low`:
- `disc[u]`: Tiempo de descubrimiento del nodo u
- `low[u]`: Menor tiempo de descubrimiento alcanzable desde u

Un nodo `u` es punto de articulación si:
1. Es raíz del DFS y tiene más de un hijo
2. No es raíz y existe un hijo `v` donde `low[v] >= disc[u]`

### BFS (Breadth-First Search)
**Complejidad**: O(V + E)

Explora el grafo nivel por nivel para encontrar todos los nodos alcanzables desde un nodo inicial.

## Patrones de Diseño Utilizados

### Factory Method
Creación de diferentes tipos de nodos según configuración:
```typescript
switch (config.type) {
  case NodeType.BASIC: return new BasicNode(config.id);
  case NodeType.ATTACK: return new AttackNode(config.id);
  // ...
}
```

### Manager/Service Pattern
Centraliza la lógica de gestión del grafo:
- Responsabilidad única: gestión de estructura
- Separación de concerns: no maneja lógica de juego

## Integración con el Juego

### Mecánica de Fragmentación
Según la especificación de NEXA:
> "Si el grafo se fragmenta (por pérdida de un nodo de articulación), el jugador pierde control inmediato de cualquier sub-grafo que no esté conectado a su Nodo Inicial. Esos nodos pasan a ser Neutrales."

```typescript
// Detectar fragmentación después de captura de nodo
const disconnectedNodes = graphManager.getDisconnectedNodes(player, graph);

// Neutralizar nodos desconectados
for (const node of disconnectedNodes) {
  node.setOwner(null);
  player.removeControlledNode(node);
}
```

### Validación de Victoria
```typescript
// Verificar si un nodo es crítico antes de atacar
const articulationPoints = graphManager.findArticulationPoints(graph);
if (articulationPoints.includes(targetNode)) {
  console.log('¡Atención! Este nodo es crítico para la conectividad');
}
```

## Tests

El GraphManager cuenta con 17 tests unitarios que cubren:
- Creación de grafos simples y complejos
- Diferentes tipos de nodos
- Detección de puntos de articulación
- Cálculo de componentes conectadas
- Identificación de nodos desconectados
- Análisis completo de conectividad

Ejecutar tests:
```bash
pnpm test GraphManager
```

## Ejemplo Completo

```typescript
import { GraphManager } from '@/infrastructure/graph/GraphManager';
import { NodeType } from '@/core/types/common';

const manager = new GraphManager();

// 1. Crear grafo inicial
const graph = manager.createGraph({
  nodeConfigs: [
    { id: 'n1', type: NodeType.BASIC, position: { x: 100, y: 100 }, initialEnergy: 100 },
    { id: 'n2', type: NodeType.ATTACK, position: { x: 300, y: 100 } },
    { id: 'n3', type: NodeType.DEFENSE, position: { x: 200, y: 300 } },
    { id: 'n4', type: NodeType.ENERGY, position: { x: 400, y: 300 } },
  ],
  edgeConfigs: [
    { id: 'e1', nodeAId: 'n1', nodeBId: 'n2', weight: 50 },
    { id: 'e2', nodeAId: 'n2', nodeBId: 'n3', weight: 50 },
    { id: 'e3', nodeAId: 'n2', nodeBId: 'n4', weight: 30 },
  ],
});

// 2. Analizar conectividad
const analysis = manager.analyzeConnectivity(graph);
console.log(`Grafo conexo: ${analysis.isConnected}`);
console.log(`Puntos críticos: ${analysis.articulationPoints.length}`);

// 3. Durante el juego: verificar fragmentación
const player = getCurrentPlayer();
const disconnected = manager.getDisconnectedNodes(player, graph);

if (disconnected.length > 0) {
  console.log(`⚠️ Jugador perdió ${disconnected.length} nodos por fragmentación`);
  neutralizeNodes(disconnected);
}
```

## Consideraciones de Rendimiento

- **createGraph**: O(V + E) - Se ejecuta una vez al inicio
- **findArticulationPoints**: O(V + E) - Ejecutar solo cuando cambia topología
- **getConnectedComponent**: O(V + E) - Ejecutar al detectar captura de nodo
- **getDisconnectedNodes**: O(V + E) - Ejecutar después de cada captura

**Optimización**: Cachear puntos de articulación y recalcular solo cuando cambia la estructura del grafo.

## Referencias

- [Algoritmo de Tarjan - Wikipedia](https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm)
- Especificación NEXA: `contexto/descripcion_logica.md`
- Patrones de Diseño GoF: Factory Method, Manager Pattern
