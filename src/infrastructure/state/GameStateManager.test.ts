import { Edge } from '@/core/entities/edge';
import { EnergyPacket } from '@/core/entities/energy-packets';
import { BasicNode } from '@/core/entities/node/basic';
import { Player } from '@/core/entities/player';
import type { Graph } from '@/core/types/graph.types';
import { GameStateManager } from '@/infrastructure/state/GameStateManager';
import type { GameState, GameStateConfig } from '@/infrastructure/state/types';
import { beforeEach, describe, expect, it } from 'vitest';

describe('GameStateManager', () => {
  let gameStateManager: GameStateManager;
  let player1: Player;
  let player2: Player;
  let graph: Graph;
  let node1: BasicNode;
  let node2: BasicNode;
  let node3: BasicNode;

  beforeEach(() => {
    gameStateManager = new GameStateManager();

    // Crear jugadores
    player1 = new Player({
      id: 'p1',
      username: 'Player 1',
      color: { r: 255, g: 0, b: 0 },
    });

    player2 = new Player({
      id: 'p2',
      username: 'Player 2',
      color: { r: 0, g: 0, b: 255 },
    });

    // Crear nodos
    node1 = new BasicNode('n1');
    node2 = new BasicNode('n2');
    node3 = new BasicNode('n3');

    // Agregar energía inicial
    node1.addEnergy(100);
    node2.addEnergy(50);

    // Crear grafo
    const edge1 = new Edge('e1', [node1, node2], 50);
    node1.addEdge(edge1);
    node2.addEdge(edge1);

    graph = {
      nodes: new Set([node1, node2, node3]),
      edges: new Set([edge1]),
    };
  });

  describe('createGameState', () => {
    it('debe crear un estado de juego inicial correctamente', () => {
      const config: GameStateConfig = {
        players: [player1, player2],
        graph,
      };

      const state = gameStateManager.createGameState(config);

      expect(state.players).toEqual([player1, player2]);
      expect(state.graph).toBe(graph);
      expect(state.currentTick).toBe(0);
      expect(state.elapsedTime).toBe(0);
      expect(state.status).toBe('waiting');
      expect(state.dominanceTrackers.size).toBe(2);
      expect(state.dominanceTrackers.get(player1)).toBe(0);
      expect(state.dominanceTrackers.get(player2)).toBe(0);
    });

    it('debe respetar valores iniciales personalizados', () => {
      const config: GameStateConfig = {
        players: [player1, player2],
        graph,
        initialTime: 5000,
        initialTick: 100,
      };

      const state = gameStateManager.createGameState(config);

      expect(state.currentTick).toBe(100);
      expect(state.elapsedTime).toBe(5000);
    });
  });

  describe('updateElapsedTime', () => {
    it('debe actualizar el tiempo transcurrido y el tick', () => {
      const state = gameStateManager.createGameState({
        players: [player1, player2],
        graph,
      });

      gameStateManager.updateElapsedTime(state, 1000);

      expect(state.elapsedTime).toBe(1000);
      expect(state.currentTick).toBe(1);

      gameStateManager.updateElapsedTime(state, 500);

      expect(state.elapsedTime).toBe(1500);
      expect(state.currentTick).toBe(2);
    });
  });

  describe('Dominance Trackers', () => {
    let state: GameState;

    beforeEach(() => {
      state = gameStateManager.createGameState({
        players: [player1, player2],
        graph,
      });
    });

    it('debe actualizar el tracker de dominancia correctamente', () => {
      gameStateManager.updateDominanceTracker(state, player1, 1000);
      expect(state.dominanceTrackers.get(player1)).toBe(1000);

      gameStateManager.updateDominanceTracker(state, player1, 500);
      expect(state.dominanceTrackers.get(player1)).toBe(1500);
    });

    it('debe resetear el tracker de dominancia', () => {
      gameStateManager.updateDominanceTracker(state, player1, 5000);
      expect(state.dominanceTrackers.get(player1)).toBe(5000);

      gameStateManager.resetDominanceTracker(state, player1);
      expect(state.dominanceTrackers.get(player1)).toBe(0);
    });

    it('debe actualizar todos los trackers según dominancia actual', () => {
      // Player 1 tiene nodo inicial
      player1.setInGame(true);
      node1.setOwner(player1);
      player1.captureNode(node1);
      player1.setInitialNode(node1);

      // Player 2 tiene 2 nodos (66.6%, no alcanza el 70%)
      player2.setInGame(true);
      node2.setOwner(player2);
      player2.captureNode(node2);
      player2.setInitialNode(node2);
      node3.setOwner(player2);
      player2.captureNode(node3);

      // Actualizar trackers
      gameStateManager.updateAllDominanceTrackers(state, 1000);

      // Player 1 no debería acumular (33.3%)
      expect(state.dominanceTrackers.get(player1)).toBe(0);

      // Player 2 no debería acumular (66.6% < 70%)
      expect(state.dominanceTrackers.get(player2)).toBe(0);
    });
  });

  describe('getPlayerStats', () => {
    let state: GameState;

    beforeEach(() => {
      state = gameStateManager.createGameState({
        players: [player1, player2],
        graph,
      });

      player1.setInGame(true);
      player2.setInGame(true);
    });

    it('debe calcular estadísticas básicas de un jugador', () => {
      // Player 1 controla 2 nodos
      node1.setOwner(player1);
      player1.captureNode(node1);
      player1.setInitialNode(node1);
      node2.setOwner(player1);
      player1.captureNode(node2);

      const stats = gameStateManager.getPlayerStats(state, player1);

      expect(stats.playerId).toBe('p1');
      expect(stats.username).toBe('Player 1');
      expect(stats.controlledNodes).toBe(2);
      expect(stats.storedEnergy).toBe(150); // 100 + 50
      expect(stats.dominancePercentage).toBeCloseTo(66.67, 1); // 2/3 nodes
      expect(stats.isEliminated).toBe(false);
      expect(stats.hasInitialNode).toBe(true);
    });

    it('debe calcular energía en tránsito correctamente', () => {
      // Player 1 controla nodo1
      node1.setOwner(player1);
      player1.captureNode(node1);
      player1.setInitialNode(node1);

      // Crear paquete de energía en tránsito
      const edge = Array.from(graph.edges)[0];
      const packet = new EnergyPacket(player1, 30, node1, node2);
      edge.addEnergyPacket(packet);

      const stats = gameStateManager.getPlayerStats(state, player1);

      expect(stats.storedEnergy).toBe(100);
      expect(stats.transitEnergy).toBe(30);
      expect(stats.totalEnergy).toBe(130);
    });

    it('debe detectar jugador eliminado por pérdida de nodo inicial', () => {
      // Player 1 tenía nodo inicial pero lo perdió
      node1.setOwner(player1);
      player1.captureNode(node1);
      player1.setInitialNode(node1);

      // Player 2 captura el nodo inicial de player1
      node1.setOwner(player2);
      player1.loseNode(node1);
      player2.captureNode(node1);

      const stats = gameStateManager.getPlayerStats(state, player1);

      expect(stats.isEliminated).toBe(true);
      expect(stats.hasInitialNode).toBe(false);
    });

    it('debe calcular dominanceTime desde el tracker', () => {
      player1.setInitialNode(node1);
      node1.setOwner(player1);
      player1.captureNode(node1);

      // Acumular tiempo de dominancia
      gameStateManager.updateDominanceTracker(state, player1, 5000);

      const stats = gameStateManager.getPlayerStats(state, player1);

      expect(stats.dominanceTime).toBe(5000);
    });
  });

  describe('getGameSnapshot', () => {
    let state: GameState;

    beforeEach(() => {
      state = gameStateManager.createGameState({
        players: [player1, player2],
        graph,
      });

      player1.setInGame(true);
      player2.setInGame(true);

      // Player 1 controla 1 nodo
      node1.setOwner(player1);
      player1.captureNode(node1);
      player1.setInitialNode(node1);

      // Player 2 controla 1 nodo
      node2.setOwner(player2);
      player2.captureNode(node2);
      player2.setInitialNode(node2);
    });

    it('debe generar snapshot con información básica', () => {
      state.elapsedTime = 60000; // 1 minuto
      state.currentTick = 100;
      state.status = 'playing';

      const snapshot = gameStateManager.getGameSnapshot(state);

      expect(snapshot.currentTick).toBe(100);
      expect(snapshot.elapsedTime).toBe(60000);
      expect(snapshot.elapsedTimeFormatted).toBe('01:00');
      expect(snapshot.remainingTime).toBe(120000); // 2 minutos restantes
      expect(snapshot.remainingTimeFormatted).toBe('02:00');
      expect(snapshot.status).toBe('playing');
      expect(snapshot.totalNodes).toBe(3);
      expect(snapshot.totalPlayers).toBe(2);
      expect(snapshot.playerStats.length).toBe(2);
    });

    it('debe incluir estadísticas de todos los jugadores', () => {
      const snapshot = gameStateManager.getGameSnapshot(state);

      expect(snapshot.playerStats).toHaveLength(2);

      const p1Stats = snapshot.playerStats.find(s => s.playerId === 'p1');
      const p2Stats = snapshot.playerStats.find(s => s.playerId === 'p2');

      expect(p1Stats).toBeDefined();
      expect(p2Stats).toBeDefined();
      expect(p1Stats?.controlledNodes).toBe(1);
      expect(p2Stats?.controlledNodes).toBe(1);
    });

    it('debe incluir advertencia de dominancia cuando corresponda', () => {
      // Player 1 necesita controlar >= 70% de nodos (3 de 3 = 100%)
      // Ya tiene node1, necesita capturar node2 y node3

      // Player 2 pierde node2
      node2.setOwner(player1);
      player2.loseNode(node2);
      player1.captureNode(node2);

      // Player 1 captura node3
      node3.setOwner(player1);
      player1.captureNode(node3);

      // Acumular algo de tiempo de dominancia
      gameStateManager.updateDominanceTracker(state, player1, 5000);

      const snapshot = gameStateManager.getGameSnapshot(state);

      expect(snapshot.dominanceWarning).toBeDefined();
      expect(snapshot.dominanceWarning?.playerId).toBe('p1');
      expect(snapshot.dominanceWarning?.timeRemaining).toBe(5000); // 10000 - 5000
    });

    it('debe formatear correctamente el tiempo en mm:ss', () => {
      state.elapsedTime = 95000; // 1 minuto 35 segundos

      const snapshot = gameStateManager.getGameSnapshot(state);

      expect(snapshot.elapsedTimeFormatted).toBe('01:35');
      expect(snapshot.remainingTimeFormatted).toBe('01:25');
    });
  });

  describe('Victory Conditions', () => {
    let state: GameState;

    beforeEach(() => {
      state = gameStateManager.createGameState({
        players: [player1, player2],
        graph,
      });

      player1.setInGame(true);
      player2.setInGame(true);

      node1.setOwner(player1);
      player1.captureNode(node1);
      player1.setInitialNode(node1);

      node2.setOwner(player2);
      player2.captureNode(node2);
      player2.setInitialNode(node2);
    });

    it('debe detectar victoria por tiempo límite', () => {
      state.elapsedTime = 180000; // 3 minutos exactos

      const playerStats = [
        gameStateManager.getPlayerStats(state, player1),
        gameStateManager.getPlayerStats(state, player2),
      ];

      const shouldEnd = gameStateManager.checkVictoryConditions(state, playerStats);

      expect(shouldEnd).toBe(true);
    });

    it('debe detectar victoria por dominancia (70% durante 10 segundos)', () => {
      // Player 1 acumula 10 segundos de dominancia
      gameStateManager.updateDominanceTracker(state, player1, 10000);

      const playerStats = [
        gameStateManager.getPlayerStats(state, player1),
        gameStateManager.getPlayerStats(state, player2),
      ];

      const shouldEnd = gameStateManager.checkVictoryConditions(state, playerStats);

      expect(shouldEnd).toBe(true);
    });

    it('debe detectar victoria por eliminación', () => {
      // Player 2 pierde su nodo inicial
      node2.setOwner(player1);
      player2.loseNode(node2);
      player1.captureNode(node2);

      const playerStats = [
        gameStateManager.getPlayerStats(state, player1),
        gameStateManager.getPlayerStats(state, player2),
      ];

      const shouldEnd = gameStateManager.checkVictoryConditions(state, playerStats);

      expect(shouldEnd).toBe(true);
    });

    it('no debe terminar el juego si no se cumplen condiciones', () => {
      state.elapsedTime = 90000; // 1.5 minutos

      const playerStats = [
        gameStateManager.getPlayerStats(state, player1),
        gameStateManager.getPlayerStats(state, player2),
      ];

      const shouldEnd = gameStateManager.checkVictoryConditions(state, playerStats);

      expect(shouldEnd).toBe(false);
    });
  });

  describe('setGameStatus', () => {
    it('debe cambiar el estado del juego', () => {
      const state = gameStateManager.createGameState({
        players: [player1, player2],
        graph,
      });

      expect(state.status).toBe('waiting');

      gameStateManager.setGameStatus(state, 'playing');
      expect(state.status).toBe('playing');

      gameStateManager.setGameStatus(state, 'finished');
      expect(state.status).toBe('finished');
    });
  });

  describe('getStateDebugInfo', () => {
    it('debe generar información de debug legible', () => {
      const state = gameStateManager.createGameState({
        players: [player1, player2],
        graph,
      });

      player1.setInGame(true);
      node1.setOwner(player1);
      player1.captureNode(node1);
      player1.setInitialNode(node1);

      state.elapsedTime = 30000;
      state.currentTick = 50;
      state.status = 'playing';

      const debugInfo = gameStateManager.getStateDebugInfo(state);

      expect(debugInfo).toContain('playing');
      expect(debugInfo).toContain('Tick: 50');
      expect(debugInfo).toContain('Player 1');
      expect(debugInfo).toContain('Total Nodes: 3');
    });
  });
});
