/**
 * Tests Unitarios para CaptureService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CaptureService } from '@/application/services/capture-service';
import type { Graph } from '@/application/services/capture-service';
import { Player } from '@/core/entities/player';
import { BasicNode } from '@/core/entities/node/basic';
import { EnergyNode } from '@/core/entities/node/energy';
import { AttackNode } from '@/core/entities/node/attack';
import { Edge } from '@/core/entities/edge';

describe('CaptureService', () => {
  let captureService: CaptureService;
  let player1: Player;
  let player2: Player;
  let graph: Graph;

  beforeEach(() => {
    captureService = new CaptureService();

    // Crear jugadores
    player1 = new Player({
      id: 'player-1',
      username: 'Alice',
      color: { r: 255, g: 0, b: 0 },
    });

    player2 = new Player({
      id: 'player-2',
      username: 'Bob',
      color: { r: 0, g: 0, b: 255 },
    });

    // Simular que están en partida
    player1.setInGame(true);
    player2.setInGame(true);

    // Crear grafo básico
    const node1 = new BasicNode('node-1');
    const node2 = new BasicNode('node-2');
    const node3 = new BasicNode('node-3');

    const edge1 = new Edge('edge-1', [node1, node2], 100);
    const edge2 = new Edge('edge-2', [node2, node3], 100);

    node1.addEdge(edge1);
    node2.addEdge(edge1);
    node2.addEdge(edge2);
    node3.addEdge(edge2);

    graph = {
      nodes: new Set([node1, node2, node3]),
      edges: new Set([edge1, edge2]),
    };
  });

  describe('captureNode', () => {
    it('debe capturar un nodo neutral exitosamente', () => {
      const neutralNode = new BasicNode('neutral');

      const result = captureService.captureNode(neutralNode, player1, null);

      expect(result.captured).toBe(true);
      expect(result.node).toBe(neutralNode);
      expect(result.attacker).toBe(player1);
      expect(result.previousOwner).toBeNull();
      expect(neutralNode.owner).toBe(player1);
      expect(player1.ownsNode(neutralNode)).toBe(true);
    });

    it('debe aplicar bonificación de energía al capturar', () => {
      const energyNode = new EnergyNode('energy-1');
      const initialEnergy = player1.totalEnergy;
      const expectedBonus = energyNode.energyAddition;

      player1.increaseEnergy(100); // Dar energía inicial
      const energyBefore = player1.totalEnergy;

      const result = captureService.captureNode(energyNode, player1, null);

      expect(result.energyBonus).toBe(expectedBonus);
      expect(player1.totalEnergy).toBe(energyBefore + expectedBonus);
    });

    it('debe manejar captura de nodo enemigo', () => {
      const contestedNode = new BasicNode('contested');
      contestedNode.setOwner(player2);
      player2.captureNode(contestedNode);

      const result = captureService.captureNode(
        contestedNode,
        player1,
        player2,
      );

      expect(result.captured).toBe(true);
      expect(result.previousOwner).toBe(player2);
      expect(contestedNode.owner).toBe(player1);
      expect(player2.ownsNode(contestedNode)).toBe(false);
      expect(player1.ownsNode(contestedNode)).toBe(true);
    });

    it('debe eliminar jugador si pierde su nodo inicial', () => {
      const initialNode = new BasicNode('initial');
      initialNode.setOwner(player2);
      player2.setInitialNode(initialNode);
      player2.captureNode(initialNode);

      const result = captureService.captureNode(
        initialNode,
        player1,
        player2,
      );

      expect(result.playerEliminated).toBe(true);
      expect(player2.isEliminated).toBe(true);
      expect(initialNode.owner).toBe(player1);
    });

    it('NO debe eliminar jugador si pierde un nodo normal', () => {
      const initialNode = new BasicNode('initial');
      const normalNode = new BasicNode('normal');

      initialNode.setOwner(player2);
      normalNode.setOwner(player2);

      player2.setInitialNode(initialNode);
      player2.captureNode(initialNode);
      player2.captureNode(normalNode);

      const result = captureService.captureNode(
        normalNode,
        player1,
        player2,
      );

      expect(result.playerEliminated).toBe(false);
      expect(player2.isEliminated).toBe(false);
      expect(player2.ownsNode(initialNode)).toBe(true);
    });

    it('debe lanzar error si el atacante no está en partida', () => {
      player1.setInGame(false);
      const node = new BasicNode('node');

      expect(() => {
        captureService.captureNode(node, player1, null);
      }).toThrow('no está en una partida activa');
    });

    it('debe lanzar error si el atacante ya controla el nodo', () => {
      const node = new BasicNode('node');
      node.setOwner(player1);
      player1.captureNode(node);

      expect(() => {
        captureService.captureNode(node, player1, null);
      }).toThrow('ya controla el nodo');
    });

    it('debe retornar nodesLost vacío en captura simple', () => {
      const node = new BasicNode('simple');

      const result = captureService.captureNode(node, player1, null);

      expect(result.nodesLost).toEqual([]);
    });
  });

  describe('neutralizeNode', () => {
    it('debe neutralizar un nodo correctamente', () => {
      const node = new BasicNode('owned');
      node.setOwner(player1);
      player1.captureNode(node);

      captureService.neutralizeNode(node, player1);

      expect(node.owner).toBeNull();
      expect(player1.ownsNode(node)).toBe(false);
    });

    it('debe limpiar asignaciones de energía al neutralizar', () => {
      const node = new BasicNode('node');
      const edge = new Edge('edge', [node, new BasicNode('other')], 100);

      node.setOwner(player1);
      player1.captureNode(node);
      node.addEdge(edge);
      node.assignEnergyToEdge(edge, 50);

      expect(node.getAssignedEnergy(edge)).toBe(50);

      captureService.neutralizeNode(node, player1);

      expect(node.getAssignedEnergy(edge)).toBe(0);
    });

    it('debe lanzar error si el jugador no controla el nodo', () => {
      const node = new BasicNode('not-owned');
      node.setOwner(player2);
      player2.captureNode(node);

      expect(() => {
        captureService.neutralizeNode(node, player1);
      }).toThrow('no controla el nodo');
    });
  });

  describe('handleArticulationCapture', () => {
    it('debe detectar nodos desconectados en grafo lineal', () => {
      // Crear grafo lineal: P1 - N1 - N2 - N3
      const n1 = new BasicNode('n1');
      const n2 = new BasicNode('n2');
      const n3 = new BasicNode('n3');

      const e1 = new Edge('e1', [n1, n2], 100);
      const e2 = new Edge('e2', [n2, n3], 100);

      n1.addEdge(e1);
      n2.addEdge(e1);
      n2.addEdge(e2);
      n3.addEdge(e2);

      // Player1 controla todos
      n1.setOwner(player1);
      n2.setOwner(player1);
      n3.setOwner(player1);

      player1.setInitialNode(n1);
      player1.captureNode(n1);
      player1.captureNode(n2);
      player1.captureNode(n3);

      // Simular que n2 fue capturado (nodo de articulación)
      n2.setOwner(player2);

      const localGraph: Graph = {
        nodes: new Set([n1, n2, n3]),
        edges: new Set([e1, e2]),
      };

      const disconnectedNodes = captureService.handleArticulationCapture(
        n2,
        player1,
        localGraph,
      );

      expect(disconnectedNodes.length).toBe(1);
      expect(disconnectedNodes[0]).toBe(n3);
      expect(n3.owner).toBeNull();
      expect(player1.ownsNode(n3)).toBe(false);
    });

    it('debe retornar vacío si no hay nodos desconectados', () => {
      // Grafo donde todos los nodos permanecen conectados
      const n1 = new BasicNode('n1');
      const n2 = new BasicNode('n2');

      const e1 = new Edge('e1', [n1, n2], 100);

      n1.addEdge(e1);
      n2.addEdge(e1);

      n1.setOwner(player1);
      n2.setOwner(player1);

      player1.setInitialNode(n1);
      player1.captureNode(n1);
      player1.captureNode(n2);

      // Capturar n2, pero n1 es el inicial y permanece
      n2.setOwner(player2);

      const localGraph: Graph = {
        nodes: new Set([n1, n2]),
        edges: new Set([e1]),
      };

      const disconnectedNodes = captureService.handleArticulationCapture(
        n2,
        player1,
        localGraph,
      );

      expect(disconnectedNodes.length).toBe(0);
    });

    it('debe retornar vacío si el jugador no tiene nodo inicial', () => {
      const node = new BasicNode('node');

      const disconnectedNodes = captureService.handleArticulationCapture(
        node,
        player1,
        graph,
      );

      expect(disconnectedNodes).toEqual([]);
    });

    it('debe retornar vacío si el nodo capturado era el inicial', () => {
      const initialNode = new BasicNode('initial');
      player1.setInitialNode(initialNode);
      player1.captureNode(initialNode);

      const disconnectedNodes = captureService.handleArticulationCapture(
        initialNode,
        player1,
        graph,
      );

      expect(disconnectedNodes).toEqual([]);
    });

    it('debe manejar grafo con múltiples ramas', () => {
      // Crear grafo en estrella: n1 (centro) - n2, n3, n4
      const n1 = new BasicNode('n1-center');
      const n2 = new BasicNode('n2');
      const n3 = new BasicNode('n3');
      const n4 = new BasicNode('n4');

      const e1 = new Edge('e1', [n1, n2], 100);
      const e2 = new Edge('e2', [n1, n3], 100);
      const e3 = new Edge('e3', [n1, n4], 100);

      n1.addEdge(e1);
      n1.addEdge(e2);
      n1.addEdge(e3);
      n2.addEdge(e1);
      n3.addEdge(e2);
      n4.addEdge(e3);

      // Player1 controla todos excepto n1
      n2.setOwner(player1);
      n3.setOwner(player1);
      n4.setOwner(player1);

      player1.setInitialNode(n2);
      player1.captureNode(n2);
      player1.captureNode(n3);
      player1.captureNode(n4);

      // Capturar n1 (aunque player1 no lo controla, simular escenario)
      // En realidad, si n1 es neutral y se captura, no afecta a player1
      // Mejor ejemplo: n2 era inicial y tiene conexiones

      const starGraph: Graph = {
        nodes: new Set([n1, n2, n3, n4]),
        edges: new Set([e1, e2, e3]),
      };

      // Player1 inicial en n2, controla también n3, n4
      // Si n1 (neutral) se captura, no hay desconexión
      // Modificar escenario: n1 pertenece a player1 y es articulación

      n1.setOwner(player1);
      player1.captureNode(n1);
      player1.setInitialNode(n1);

      // Ahora n1 es inicial y centro
      // Capturar n1 eliminaría al jugador, no cuenta como articulación

      // Mejor: initial es n1, luego tiene n2, n3, n4
      // Si se captura n1 (inicial), el jugador es eliminado
      // No hay articulación aquí

      const disconnectedNodes = captureService.handleArticulationCapture(
        n2,
        player1,
        starGraph,
      );

      // n2 no es articulación si n1 es el inicial
      expect(disconnectedNodes.length).toBe(0);
    });
  });

  describe('captureNodeWithArticulationCheck', () => {
    it('debe capturar y detectar articulación en un solo paso', () => {
      // Grafo lineal: P1 - N1 - N2 - N3
      const n1 = new BasicNode('n1');
      const n2 = new BasicNode('n2');
      const n3 = new BasicNode('n3');

      const e1 = new Edge('e1', [n1, n2], 100);
      const e2 = new Edge('e2', [n2, n3], 100);

      n1.addEdge(e1);
      n2.addEdge(e1);
      n2.addEdge(e2);
      n3.addEdge(e2);

      // Player2 controla todos
      n1.setOwner(player2);
      n2.setOwner(player2);
      n3.setOwner(player2);

      player2.setInitialNode(n1);
      player2.captureNode(n1);
      player2.captureNode(n2);
      player2.captureNode(n3);

      const localGraph: Graph = {
        nodes: new Set([n1, n2, n3]),
        edges: new Set([e1, e2]),
      };

      // Player1 captura n2 (articulación)
      const result = captureService.captureNodeWithArticulationCheck(
        n2,
        player1,
        player2,
        localGraph,
      );

      expect(result.captured).toBe(true);
      expect(result.nodesLost.length).toBe(1);
      expect(result.nodesLost[0]).toBe(n3);
      expect(n2.owner).toBe(player1);
      expect(n3.owner).toBeNull();
    });

    it('debe eliminar jugador si pierde todos los nodos por articulación', () => {
      // Player2 solo tiene 2 nodos: inicial y uno más
      const n1 = new BasicNode('n1-initial');
      const n2 = new BasicNode('n2');

      const e1 = new Edge('e1', [n1, n2], 100);

      n1.addEdge(e1);
      n2.addEdge(e1);

      n1.setOwner(player2);
      n2.setOwner(player2);

      player2.setInitialNode(n1);
      player2.captureNode(n1);
      player2.captureNode(n2);

      const localGraph: Graph = {
        nodes: new Set([n1, n2]),
        edges: new Set([e1]),
      };

      // Player1 captura n1 (inicial)
      const result = captureService.captureNodeWithArticulationCheck(
        n1,
        player1,
        player2,
        localGraph,
      );

      expect(result.playerEliminated).toBe(true);
      expect(player2.isEliminated).toBe(true);
    });

    it('NO debe eliminar si el jugador conserva su nodo inicial', () => {
      const n1 = new BasicNode('n1-initial');
      const n2 = new BasicNode('n2');
      const n3 = new BasicNode('n3');

      const e1 = new Edge('e1', [n1, n2], 100);
      const e2 = new Edge('e2', [n2, n3], 100);

      n1.addEdge(e1);
      n2.addEdge(e1);
      n2.addEdge(e2);
      n3.addEdge(e2);

      n1.setOwner(player2);
      n2.setOwner(player2);
      n3.setOwner(player2);

      player2.setInitialNode(n1);
      player2.captureNode(n1);
      player2.captureNode(n2);
      player2.captureNode(n3);

      const localGraph: Graph = {
        nodes: new Set([n1, n2, n3]),
        edges: new Set([e1, e2]),
      };

      // Capturar n2, desconecta n3, pero n1 permanece
      const result = captureService.captureNodeWithArticulationCheck(
        n2,
        player1,
        player2,
        localGraph,
      );

      expect(result.playerEliminated).toBe(false);
      expect(player2.isEliminated).toBe(false);
      expect(player2.controlledNodeCount).toBeGreaterThan(0);
    });
  });

  describe('isArticulationPoint', () => {
    it('debe identificar nodo inicial como articulación', () => {
      const n1 = new BasicNode('n1');
      const n2 = new BasicNode('n2');

      n1.setOwner(player1);
      n2.setOwner(player1);

      player1.setInitialNode(n1);
      player1.captureNode(n1);
      player1.captureNode(n2);

      const result = captureService.isArticulationPoint(n1, player1, graph);

      expect(result).toBe(true);
    });

    it('debe identificar nodo central en cadena como articulación', () => {
      const n1 = new BasicNode('n1');
      const n2 = new BasicNode('n2');
      const n3 = new BasicNode('n3');

      const e1 = new Edge('e1', [n1, n2], 100);
      const e2 = new Edge('e2', [n2, n3], 100);

      n1.addEdge(e1);
      n2.addEdge(e1);
      n2.addEdge(e2);
      n3.addEdge(e2);

      n1.setOwner(player1);
      n2.setOwner(player1);
      n3.setOwner(player1);

      player1.setInitialNode(n1);
      player1.captureNode(n1);
      player1.captureNode(n2);
      player1.captureNode(n3);

      const localGraph: Graph = {
        nodes: new Set([n1, n2, n3]),
        edges: new Set([e1, e2]),
      };

      const result = captureService.isArticulationPoint(n2, player1, localGraph);

      expect(result).toBe(true);
    });

    it('NO debe considerar nodo hoja como articulación', () => {
      const n1 = new BasicNode('n1');
      const n2 = new BasicNode('n2');

      const e1 = new Edge('e1', [n1, n2], 100);

      n1.addEdge(e1);
      n2.addEdge(e1);

      n1.setOwner(player1);
      n2.setOwner(player1);

      player1.setInitialNode(n1);
      player1.captureNode(n1);
      player1.captureNode(n2);

      const localGraph: Graph = {
        nodes: new Set([n1, n2]),
        edges: new Set([e1]),
      };

      const result = captureService.isArticulationPoint(n2, player1, localGraph);

      expect(result).toBe(false);
    });

    it('debe retornar false si el jugador no controla el nodo', () => {
      const node = new BasicNode('not-owned');

      const result = captureService.isArticulationPoint(node, player1, graph);

      expect(result).toBe(false);
    });

    it('debe retornar false si el jugador solo tiene 1 nodo', () => {
      const n1 = new BasicNode('only-node');

      n1.setOwner(player1);
      player1.setInitialNode(n1);
      player1.captureNode(n1);

      const result = captureService.isArticulationPoint(n1, player1, graph);

      expect(result).toBe(false);
    });
  });

  describe('getNodesAtRisk', () => {
    it('debe retornar todos los nodos si se pierde el inicial', () => {
      const n1 = new BasicNode('n1');
      const n2 = new BasicNode('n2');
      const n3 = new BasicNode('n3');

      n1.setOwner(player1);
      n2.setOwner(player1);
      n3.setOwner(player1);

      player1.setInitialNode(n1);
      player1.captureNode(n1);
      player1.captureNode(n2);
      player1.captureNode(n3);

      const nodesAtRisk = captureService.getNodesAtRisk(n1, player1, graph);

      expect(nodesAtRisk.length).toBe(3);
      expect(nodesAtRisk).toContain(n1);
      expect(nodesAtRisk).toContain(n2);
      expect(nodesAtRisk).toContain(n3);
    });

    it('debe retornar nodos desconectados si se pierde articulación', () => {
      const n1 = new BasicNode('n1');
      const n2 = new BasicNode('n2');
      const n3 = new BasicNode('n3');

      const e1 = new Edge('e1', [n1, n2], 100);
      const e2 = new Edge('e2', [n2, n3], 100);

      n1.addEdge(e1);
      n2.addEdge(e1);
      n2.addEdge(e2);
      n3.addEdge(e2);

      n1.setOwner(player1);
      n2.setOwner(player1);
      n3.setOwner(player1);

      player1.setInitialNode(n1);
      player1.captureNode(n1);
      player1.captureNode(n2);
      player1.captureNode(n3);

      const localGraph: Graph = {
        nodes: new Set([n1, n2, n3]),
        edges: new Set([e1, e2]),
      };

      const nodesAtRisk = captureService.getNodesAtRisk(n2, player1, localGraph);

      expect(nodesAtRisk.length).toBe(1);
      expect(nodesAtRisk[0]).toBe(n3);
    });

    it('debe retornar vacío si no hay nodos en riesgo', () => {
      const n1 = new BasicNode('n1');
      const n2 = new BasicNode('n2');

      const e1 = new Edge('e1', [n1, n2], 100);

      n1.addEdge(e1);
      n2.addEdge(e1);

      n1.setOwner(player1);
      n2.setOwner(player1);

      player1.setInitialNode(n1);
      player1.captureNode(n1);
      player1.captureNode(n2);

      const localGraph: Graph = {
        nodes: new Set([n1, n2]),
        edges: new Set([e1]),
      };

      const nodesAtRisk = captureService.getNodesAtRisk(n2, player1, localGraph);

      expect(nodesAtRisk.length).toBe(0);
    });

    it('debe retornar vacío si el jugador no controla el nodo', () => {
      const node = new BasicNode('not-owned');

      const nodesAtRisk = captureService.getNodesAtRisk(node, player1, graph);

      expect(nodesAtRisk).toEqual([]);
    });
  });
});