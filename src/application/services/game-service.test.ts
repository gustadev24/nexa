import { describe, it, expect, beforeEach } from 'vitest';
import { GameService } from '@/application/services/game-service';
import { Player } from '@/core/entities/player';
import { BasicNode } from '@/core/entities/node/basic';
import { EnergyNode } from '@/core/entities/node/energy';
import { Edge } from '@/core/entities/edge';
import { Graph } from '@/core/entities/graph';

describe('GameService', () => {
  let gameService: GameService;
  let player1: Player;
  let player2: Player;
  let graph: Graph;

  beforeEach(() => {
    gameService = new GameService();
    player1 = new Player({ id: 'p1', username: 'Player 1', color: { r: 255, g: 0, b: 0 } });
    player2 = new Player({ id: 'p2', username: 'Player 2', color: { r: 0, g: 0, b: 255 } });

    const n1 = new BasicNode('n1');
    const n2 = new BasicNode('n2');
    const n3 = new BasicNode('n3'); // extra neutral
    const edge = new Edge('e1', [n1, n2], 100);

    // Configurar grafo
    n1.addEdge(edge);
    n2.addEdge(edge);

    graph = new Graph(new Set([n1, n2, n3]), new Set([edge]));
  });

  it('debe inicializar una partida correctamente', () => {
    const game = gameService.initializeGame([player1, player2], graph);

    expect(game.isActive).toBe(true);
    expect(player1.initialNode).toBeDefined();
    expect(player2.initialNode).toBeDefined();
    expect(player1.isInGame).toBe(true);
    expect(player1.totalEnergy).toBe(100);
  });

  it('debe lanzar error si no hay suficientes jugadores', () => {
    expect(() => gameService.initializeGame([player1], graph)).toThrow(/2 jugadores/);
  });

  it('debe lanzar error si el nodo inicial no es neutral o BasicNode', () => {
    const energyNode = new EnergyNode('e_node');
    const badGraph = new Graph(new Set([energyNode, new BasicNode('n2')]), new Set());

    expect(() => gameService.initializeGame([player1, player2], badGraph))
      .toThrow(/no hay suficientes nodos básicos/i);
  });

  it('assignInitialNode debe validar tipos', () => {
    const energyNode = new EnergyNode('e1');
    expect(() => gameService.assignInitialNode(player1, energyNode)).toThrow(/BasicNode/);
  });

  it('endGame debe determinar el ganador por nodos', () => {
    gameService.initializeGame([player1, player2], graph);

    // Simular que p1 captura un nodo extra
    const extraNode = new BasicNode('extra');
    player1.captureNode(extraNode);

    const result = gameService.endGame();
    expect(result.winner).toBe(player1);
    expect(result.reason).toBe('victory');
  });

  it('endGame debe limpiar el estado', () => {
    gameService.initializeGame([player1, player2], graph);
    gameService.endGame();

    expect(gameService.getCurrentGame()).toBeNull();
    expect(player1.isInGame).toBe(false);
    // Verificar que los nodos quedaron libres
    graph.nodes.forEach(n => expect(n.owner).toBeNull());
  });
});
