import { describe, it, expect, beforeEach } from 'vitest';
import { GraphManager } from './GraphManager';
import { Player } from '../../core/entities/player';
import { NodeType } from '../../core/types/common';
import type { GraphConfig, Graph } from '../../core/types/graph.types';

describe('GraphManager', () => {
  let graphManager: GraphManager;

  beforeEach(() => {
    graphManager = new GraphManager();
  });

  describe('createGraph', () => {
    it('debe crear un grafo simple con 3 nodos y 2 aristas', () => {
      const config: GraphConfig = {
        nodeConfigs: [
          { id: 'n1', type: NodeType.BASIC, position: { x: 0, y: 0 } },
          { id: 'n2', type: NodeType.BASIC, position: { x: 100, y: 0 } },
          { id: 'n3', type: NodeType.BASIC, position: { x: 50, y: 100 } },
        ],
        edgeConfigs: [
          { id: 'e1', nodeAId: 'n1', nodeBId: 'n2', weight: 50 },
          { id: 'e2', nodeAId: 'n2', nodeBId: 'n3', weight: 50 },
        ],
      };

      const graph = graphManager.createGraph(config);

      expect(graph.nodes.size).toBe(3);
      expect(graph.edges.size).toBe(2);
    });

    it('debe crear nodos de diferentes tipos', () => {
      const config: GraphConfig = {
        nodeConfigs: [
          { id: 'basic', type: NodeType.BASIC, position: { x: 0, y: 0 } },
          { id: 'attack', type: NodeType.ATTACK, position: { x: 100, y: 0 } },
          { id: 'defense', type: NodeType.DEFENSE, position: { x: 200, y: 0 } },
          { id: 'energy', type: NodeType.ENERGY, position: { x: 300, y: 0 } },
          { id: 'super', type: NodeType.SUPER_ENERGY, position: { x: 400, y: 0 } },
        ],
        edgeConfigs: [],
      };

      const graph = graphManager.createGraph(config);

      expect(graph.nodes.size).toBe(5);
      
      // Verificar que cada nodo existe
      const nodeIds = Array.from(graph.nodes).map(n => n.id);
      expect(nodeIds).toContain('basic');
      expect(nodeIds).toContain('attack');
      expect(nodeIds).toContain('defense');
      expect(nodeIds).toContain('energy');
      expect(nodeIds).toContain('super');
    });

    it('debe establecer energía inicial en los nodos', () => {
      const config: GraphConfig = {
        nodeConfigs: [
          { id: 'n1', type: NodeType.BASIC, position: { x: 0, y: 0 }, initialEnergy: 100 },
          { id: 'n2', type: NodeType.ENERGY, position: { x: 100, y: 0 }, initialEnergy: 50 },
        ],
        edgeConfigs: [],
      };

      const graph = graphManager.createGraph(config);
      const nodes = Array.from(graph.nodes);

      // Verificar que al menos uno tiene energía
      const hasEnergyNode = nodes.some(node => node.energyPool > 0);
      expect(hasEnergyNode).toBe(true);
    });

    it('debe lanzar error si una arista referencia un nodo inexistente', () => {
      const config: GraphConfig = {
        nodeConfigs: [
          { id: 'n1', type: NodeType.BASIC, position: { x: 0, y: 0 } },
        ],
        edgeConfigs: [
          { id: 'e1', nodeAId: 'n1', nodeBId: 'nonexistent', weight: 50 },
        ],
      };

      expect(() => graphManager.createGraph(config)).toThrow(/not found/);
    });

    it('debe conectar nodos bidireccionalm mediante aristas', () => {
      const config: GraphConfig = {
        nodeConfigs: [
          { id: 'n1', type: NodeType.BASIC, position: { x: 0, y: 0 } },
          { id: 'n2', type: NodeType.BASIC, position: { x: 100, y: 0 } },
        ],
        edgeConfigs: [
          { id: 'e1', nodeAId: 'n1', nodeBId: 'n2', weight: 50 },
        ],
      };

      const graph = graphManager.createGraph(config);
      const nodes = Array.from(graph.nodes);
      const node1 = nodes.find(n => n.id === 'n1')!;
      const node2 = nodes.find(n => n.id === 'n2')!;

      // Ambos nodos deben tener la arista
      expect(node1.edges.size).toBe(1);
      expect(node2.edges.size).toBe(1);
    });
  });

  describe('getNeighbors', () => {
    let graph: Graph;

    beforeEach(() => {
      const config: GraphConfig = {
        nodeConfigs: [
          { id: 'n1', type: NodeType.BASIC, position: { x: 0, y: 0 } },
          { id: 'n2', type: NodeType.BASIC, position: { x: 100, y: 0 } },
          { id: 'n3', type: NodeType.BASIC, position: { x: 50, y: 100 } },
        ],
        edgeConfigs: [
          { id: 'e1', nodeAId: 'n1', nodeBId: 'n2', weight: 50 },
          { id: 'e2', nodeAId: 'n1', nodeBId: 'n3', weight: 50 },
        ],
      };
      graph = graphManager.createGraph(config);
    });

    it('debe retornar los vecinos de un nodo', () => {
      const nodes = Array.from(graph.nodes);
      const node1 = nodes.find(n => n.id === 'n1')!;

      const neighbors = graphManager.getNeighbors(node1);

      expect(neighbors.length).toBe(2);
      const neighborIds = neighbors.map(n => n.id);
      expect(neighborIds).toContain('n2');
      expect(neighborIds).toContain('n3');
    });

    it('debe retornar array vacío para nodo sin vecinos', () => {
      const isolatedConfig: GraphConfig = {
        nodeConfigs: [
          { id: 'isolated', type: NodeType.BASIC, position: { x: 0, y: 0 } },
        ],
        edgeConfigs: [],
      };
      const isolatedGraph = graphManager.createGraph(isolatedConfig);
      const isolatedNode = Array.from(isolatedGraph.nodes)[0];

      const neighbors = graphManager.getNeighbors(isolatedNode);

      expect(neighbors.length).toBe(0);
    });
  });

  describe('getConnectedComponent', () => {
    it('debe retornar todos los nodos en un grafo conexo', () => {
      const config: GraphConfig = {
        nodeConfigs: [
          { id: 'n1', type: NodeType.BASIC, position: { x: 0, y: 0 } },
          { id: 'n2', type: NodeType.BASIC, position: { x: 100, y: 0 } },
          { id: 'n3', type: NodeType.BASIC, position: { x: 50, y: 100 } },
        ],
        edgeConfigs: [
          { id: 'e1', nodeAId: 'n1', nodeBId: 'n2', weight: 50 },
          { id: 'e2', nodeAId: 'n2', nodeBId: 'n3', weight: 50 },
        ],
      };
      const graph = graphManager.createGraph(config);
      const startNode = Array.from(graph.nodes)[0];

      const component = graphManager.getConnectedComponent(startNode, graph);

      expect(component.size).toBe(3);
    });

    it('debe retornar solo la componente conectada en un grafo desconexo', () => {
      const config: GraphConfig = {
        nodeConfigs: [
          { id: 'n1', type: NodeType.BASIC, position: { x: 0, y: 0 } },
          { id: 'n2', type: NodeType.BASIC, position: { x: 100, y: 0 } },
          { id: 'n3', type: NodeType.BASIC, position: { x: 300, y: 0 } }, // Aislado
          { id: 'n4', type: NodeType.BASIC, position: { x: 400, y: 0 } }, // Aislado
        ],
        edgeConfigs: [
          { id: 'e1', nodeAId: 'n1', nodeBId: 'n2', weight: 50 },
          { id: 'e2', nodeAId: 'n3', nodeBId: 'n4', weight: 50 },
        ],
      };
      const graph = graphManager.createGraph(config);
      const nodes = Array.from(graph.nodes);
      const startNode = nodes.find(n => n.id === 'n1')!;

      const component = graphManager.getConnectedComponent(startNode, graph);

      expect(component.size).toBe(2);
      const componentIds = Array.from(component).map(n => n.id);
      expect(componentIds).toContain('n1');
      expect(componentIds).toContain('n2');
      expect(componentIds).not.toContain('n3');
      expect(componentIds).not.toContain('n4');
    });
  });

  describe('findArticulationPoints', () => {
    it('debe detectar punto de articulación en grafo lineal', () => {
      // n1 -- n2 -- n3
      // n2 es punto de articulación
      const config: GraphConfig = {
        nodeConfigs: [
          { id: 'n1', type: NodeType.BASIC, position: { x: 0, y: 0 } },
          { id: 'n2', type: NodeType.BASIC, position: { x: 100, y: 0 } },
          { id: 'n3', type: NodeType.BASIC, position: { x: 200, y: 0 } },
        ],
        edgeConfigs: [
          { id: 'e1', nodeAId: 'n1', nodeBId: 'n2', weight: 50 },
          { id: 'e2', nodeAId: 'n2', nodeBId: 'n3', weight: 50 },
        ],
      };
      const graph = graphManager.createGraph(config);

      const articulationPoints = graphManager.findArticulationPoints(graph);

      expect(articulationPoints.length).toBe(1);
      expect(articulationPoints[0].id).toBe('n2');
    });

    it('debe detectar múltiples puntos de articulación', () => {
      // n1 -- n2 -- n3 -- n4
      // n2 y n3 son puntos de articulación
      const config: GraphConfig = {
        nodeConfigs: [
          { id: 'n1', type: NodeType.BASIC, position: { x: 0, y: 0 } },
          { id: 'n2', type: NodeType.BASIC, position: { x: 100, y: 0 } },
          { id: 'n3', type: NodeType.BASIC, position: { x: 200, y: 0 } },
          { id: 'n4', type: NodeType.BASIC, position: { x: 300, y: 0 } },
        ],
        edgeConfigs: [
          { id: 'e1', nodeAId: 'n1', nodeBId: 'n2', weight: 50 },
          { id: 'e2', nodeAId: 'n2', nodeBId: 'n3', weight: 50 },
          { id: 'e3', nodeAId: 'n3', nodeBId: 'n4', weight: 50 },
        ],
      };
      const graph = graphManager.createGraph(config);

      const articulationPoints = graphManager.findArticulationPoints(graph);

      expect(articulationPoints.length).toBe(2);
      const apIds = articulationPoints.map(ap => ap.id);
      expect(apIds).toContain('n2');
      expect(apIds).toContain('n3');
    });

    it('no debe detectar puntos de articulación en un ciclo', () => {
      // n1 -- n2
      //  |     |
      // n4 -- n3
      const config: GraphConfig = {
        nodeConfigs: [
          { id: 'n1', type: NodeType.BASIC, position: { x: 0, y: 0 } },
          { id: 'n2', type: NodeType.BASIC, position: { x: 100, y: 0 } },
          { id: 'n3', type: NodeType.BASIC, position: { x: 100, y: 100 } },
          { id: 'n4', type: NodeType.BASIC, position: { x: 0, y: 100 } },
        ],
        edgeConfigs: [
          { id: 'e1', nodeAId: 'n1', nodeBId: 'n2', weight: 50 },
          { id: 'e2', nodeAId: 'n2', nodeBId: 'n3', weight: 50 },
          { id: 'e3', nodeAId: 'n3', nodeBId: 'n4', weight: 50 },
          { id: 'e4', nodeAId: 'n4', nodeBId: 'n1', weight: 50 },
        ],
      };
      const graph = graphManager.createGraph(config);

      const articulationPoints = graphManager.findArticulationPoints(graph);

      expect(articulationPoints.length).toBe(0);
    });
  });

  describe('getDisconnectedNodes', () => {
    it('debe retornar nodos desconectados cuando el grafo se fragmenta', () => {
      // Crear grafo: n1 -- n2 -- n3    n4 -- n5
      const config: GraphConfig = {
        nodeConfigs: [
          { id: 'n1', type: NodeType.BASIC, position: { x: 0, y: 0 }, initialEnergy: 100 },
          { id: 'n2', type: NodeType.BASIC, position: { x: 100, y: 0 } },
          { id: 'n3', type: NodeType.BASIC, position: { x: 200, y: 0 } },
          { id: 'n4', type: NodeType.BASIC, position: { x: 400, y: 0 } },
          { id: 'n5', type: NodeType.BASIC, position: { x: 500, y: 0 } },
        ],
        edgeConfigs: [
          { id: 'e1', nodeAId: 'n1', nodeBId: 'n2', weight: 50 },
          { id: 'e2', nodeAId: 'n2', nodeBId: 'n3', weight: 50 },
          { id: 'e3', nodeAId: 'n4', nodeBId: 'n5', weight: 50 },
        ],
      };
      const graph = graphManager.createGraph(config);
      const nodes = Array.from(graph.nodes);

      // Crear jugador y asignarle nodos
      const player = new Player({
        id: 'p1',
        username: 'Player 1',
        color: { r: 255, g: 0, b: 0 },
      });
      
      // Establecer que el jugador está en el juego
      player.setInGame(true);

      // Asignar n1 como inicial, y n3, n4, n5 como controlados
      const n1 = nodes.find(n => n.id === 'n1')!;
      const n3 = nodes.find(n => n.id === 'n3')!;
      const n4 = nodes.find(n => n.id === 'n4')!;
      const n5 = nodes.find(n => n.id === 'n5')!;

      player.setInitialNode(n1);
      player.captureNode(n3);
      player.captureNode(n4);
      player.captureNode(n5);

      // n4 y n5 están desconectados de n1
      const disconnected = graphManager.getDisconnectedNodes(player, graph);

      expect(disconnected.length).toBe(2);
      const disconnectedIds = disconnected.map(n => n.id);
      expect(disconnectedIds).toContain('n4');
      expect(disconnectedIds).toContain('n5');
    });

    it('debe retornar array vacío si todos los nodos están conectados', () => {
      const config: GraphConfig = {
        nodeConfigs: [
          { id: 'n1', type: NodeType.BASIC, position: { x: 0, y: 0 }, initialEnergy: 100 },
          { id: 'n2', type: NodeType.BASIC, position: { x: 100, y: 0 } },
          { id: 'n3', type: NodeType.BASIC, position: { x: 200, y: 0 } },
        ],
        edgeConfigs: [
          { id: 'e1', nodeAId: 'n1', nodeBId: 'n2', weight: 50 },
          { id: 'e2', nodeAId: 'n2', nodeBId: 'n3', weight: 50 },
        ],
      };
      const graph = graphManager.createGraph(config);
      const nodes = Array.from(graph.nodes);

      const player = new Player({
        id: 'p1',
        username: 'Player 1',
        color: { r: 255, g: 0, b: 0 },
      });
      
      // Establecer que el jugador está en el juego
      player.setInGame(true);

      const n1 = nodes.find(n => n.id === 'n1')!;
      const n2 = nodes.find(n => n.id === 'n2')!;
      const n3 = nodes.find(n => n.id === 'n3')!;

      player.setInitialNode(n1);
      player.captureNode(n2);
      player.captureNode(n3);

      const disconnected = graphManager.getDisconnectedNodes(player, graph);

      expect(disconnected.length).toBe(0);
    });
  });

  describe('analyzeConnectivity', () => {
    it('debe identificar grafo conexo correctamente', () => {
      const config: GraphConfig = {
        nodeConfigs: [
          { id: 'n1', type: NodeType.BASIC, position: { x: 0, y: 0 } },
          { id: 'n2', type: NodeType.BASIC, position: { x: 100, y: 0 } },
          { id: 'n3', type: NodeType.BASIC, position: { x: 200, y: 0 } },
        ],
        edgeConfigs: [
          { id: 'e1', nodeAId: 'n1', nodeBId: 'n2', weight: 50 },
          { id: 'e2', nodeAId: 'n2', nodeBId: 'n3', weight: 50 },
        ],
      };
      const graph = graphManager.createGraph(config);

      const analysis = graphManager.analyzeConnectivity(graph);

      expect(analysis.isConnected).toBe(true);
      expect(analysis.components.length).toBe(1);
      expect(analysis.components[0].size).toBe(3);
    });

    it('debe identificar grafo desconexo con múltiples componentes', () => {
      const config: GraphConfig = {
        nodeConfigs: [
          { id: 'n1', type: NodeType.BASIC, position: { x: 0, y: 0 } },
          { id: 'n2', type: NodeType.BASIC, position: { x: 100, y: 0 } },
          { id: 'n3', type: NodeType.BASIC, position: { x: 300, y: 0 } },
          { id: 'n4', type: NodeType.BASIC, position: { x: 400, y: 0 } },
        ],
        edgeConfigs: [
          { id: 'e1', nodeAId: 'n1', nodeBId: 'n2', weight: 50 },
          { id: 'e2', nodeAId: 'n3', nodeBId: 'n4', weight: 50 },
        ],
      };
      const graph = graphManager.createGraph(config);

      const analysis = graphManager.analyzeConnectivity(graph);

      expect(analysis.isConnected).toBe(false);
      expect(analysis.components.length).toBe(2);
      expect(analysis.components[0].size).toBe(2);
      expect(analysis.components[1].size).toBe(2);
    });

    it('debe detectar puntos de articulación en el análisis', () => {
      const config: GraphConfig = {
        nodeConfigs: [
          { id: 'n1', type: NodeType.BASIC, position: { x: 0, y: 0 } },
          { id: 'n2', type: NodeType.BASIC, position: { x: 100, y: 0 } },
          { id: 'n3', type: NodeType.BASIC, position: { x: 200, y: 0 } },
        ],
        edgeConfigs: [
          { id: 'e1', nodeAId: 'n1', nodeBId: 'n2', weight: 50 },
          { id: 'e2', nodeAId: 'n2', nodeBId: 'n3', weight: 50 },
        ],
      };
      const graph = graphManager.createGraph(config);

      const analysis = graphManager.analyzeConnectivity(graph);

      expect(analysis.articulationPoints.length).toBe(1);
      expect(analysis.articulationPoints[0].id).toBe('n2');
    });
  });
});
