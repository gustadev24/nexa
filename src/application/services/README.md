# GameService - Servicio de Gestión de Partidas

##  Descripción

`GameService` es el servicio principal que gestiona el ciclo de vida
completo de una partida en Nexa, desde la inicialización hasta la
finalización, incluyendo la asignación de nodos iniciales y la gestión
de jugadores.

##  Responsabilidades

-   Inicializar partidas con validaciones correctas
-   Asignar nodos iniciales (solo BasicNode) a cada jugador
-   Configurar energía inicial de jugadores
-   Finalizar partidas y limpiar estado completo
-   Remover jugadores de partidas activas
-   Determinar ganadores y resultados

##  Instalación

``` typescript
import { GameService } from '@/application/services/game-service';
```

#  Uso Básico

## 1. Crear una Instancia

``` typescript
const gameService = new GameService();
```

## 2. Inicializar una Partida

``` typescript
import { Player } from '@/core/entities/player';
import { BasicNode } from '@/core/entities/node/basic';
import { Edge } from '@/core/entities/edge';
import { Graph } from '@/core/entities/graph';

const player1 = new Player({
  id: 'player-1',
  username: 'Alice',
  color: { r: 255, g: 0, b: 0 },
});

const player2 = new Player({
  id: 'player-2',
  username: 'Bob',
  color: { r: 0, g: 0, b: 255 },
});

const node1 = new BasicNode('node-1');
const node2 = new BasicNode('node-2');
const node3 = new BasicNode('node-3');

const edge1 = new Edge('edge-1', [node1, node2], 100);
const edge2 = new Edge('edge-2', [node2, node3], 100);

const graph = new Graph(
  new Set([node1, node2, node3]),
  new Set([edge1, edge2])
);

const game = gameService.initializeGame([player1, player2], graph);
```

## 3. Durante la Partida

``` typescript
if (gameService.hasActiveGame()) {}
const currentGame = gameService.getCurrentGame();
gameService.removePlayerFromGame(player2);
```

## 4. Finalizar la Partida

``` typescript
const result = gameService.endGame();
```

#  API Detallada

## initializeGame(players, graph): Game

Inicializa una nueva partida.

## assignInitialNode(player, node): void

## endGame(): GameResult

## removePlayerFromGame(player): void

# ⚠️ Validaciones y Errores Comunes

## 1. Menos de 2 jugadores

## 2. Nodo no es BasicNode

#  Testing

``` bash
pnpm test
```

#  Integración con GameManager

``` typescript
class GameManager {
  private gameService: GameService;
  constructor() {
    this.gameService = new GameService();
  }
}
```
