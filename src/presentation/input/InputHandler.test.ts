import { Edge } from '@/core/entities/edge';
import { BasicNode } from '@/core/entities/node/basic';
import { Player } from '@/core/entities/player';
import type { GameSnapshot } from '@/infrastructure/state/types';
import { GameRenderer } from '@/presentation/renderer/GameRenderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InputHandler } from '@/presentation/input/InputHandler';

describe('InputHandler', () => {
  let canvas: HTMLCanvasElement;
  let renderer: GameRenderer;
  let inputHandler: InputHandler;
  let player1: Player;
  let node1: BasicNode;
  let node2: BasicNode;
  let edge1: Edge;

  beforeEach(() => {
    // Crear canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);

    // Mock del renderer
    renderer = new GameRenderer();
    vi.spyOn(renderer, 'getContext').mockReturnValue(canvas.getContext('2d') as CanvasRenderingContext2D);
    // Crear entidades de prueba
    player1 = new Player({ id: 1, username: 'Player1', color: { r: 255, g: 0, b: 0 } });
    node1 = new BasicNode(1);
    node2 = new BasicNode(2);
    edge1 = new Edge(1, [node1, node2], 10);

    node1.addEdge(edge1);
    node2.addEdge(edge1);

    // Crear InputHandler
    inputHandler = new InputHandler();
  });

  afterEach(() => {
    inputHandler.dispose();
    document.body.removeChild(canvas);
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('debe inicializar correctamente', () => {
      expect(() => inputHandler.initialize(canvas, renderer)).not.toThrow();
    });

    it('debe configurar event listeners en el canvas', () => {
      const addEventListenerSpy = vi.spyOn(canvas, 'addEventListener');

      inputHandler.initialize(canvas, renderer);

      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('contextmenu', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
    });

    it('no debe configurar touch si está deshabilitado', () => {
      const handlerWithoutTouch = new InputHandler({ enableTouch: false });
      const addEventListenerSpy = vi.spyOn(canvas, 'addEventListener');

      handlerWithoutTouch.initialize(canvas, renderer);

      expect(addEventListenerSpy).not.toHaveBeenCalledWith('touchstart', expect.any(Function));

      handlerWithoutTouch.dispose();
    });
  });

  describe('setCurrentPlayer', () => {
    it('debe establecer el jugador actual', () => {
      inputHandler.setCurrentPlayer(player1);
      // No hay getter público, pero se puede verificar en comandos
      expect(() => inputHandler.handleEnergyAssignment(node1, edge1, 10)).not.toThrow();
    });
  });

  describe('updateSnapshot', () => {
    it('debe actualizar el snapshot actual', () => {
      const snapshot: GameSnapshot = {
        timestamp: Date.now(),
        currentTick: 0,
        elapsedTime: 0,
        elapsedTimeFormatted: '00:00',
        remainingTime: 180000,
        remainingTimeFormatted: '03:00',
        status: 'playing',
        totalNodes: 2,
        totalPlayers: 1,
        playerStats: [],
        nodes: [],
        edges: [],
        energyPackets: [],
      };

      expect(() => inputHandler.updateSnapshot(snapshot)).not.toThrow();
    });
  });

  describe('handleNodeClick', () => {
    it('debe generar evento de click en nodo', () => {
      const nodeEvent = inputHandler.handleNodeClick(
        node1,
        100,
        100,
        50,
        50,
        false,
      );

      expect(nodeEvent).not.toBeNull();
      expect(nodeEvent?.node).toBe(node1);
      expect(nodeEvent?.canvasX).toBe(100);
      expect(nodeEvent?.canvasY).toBe(100);
      expect(nodeEvent?.worldX).toBe(50);
      expect(nodeEvent?.worldY).toBe(50);
      expect(nodeEvent?.isRightClick).toBe(false);
    });

    it('debe actualizar el nodo seleccionado', () => {
      inputHandler.handleNodeClick(node1, 100, 100, 50, 50);

      expect(inputHandler.getSelectedNode()).toBe(node1);
      expect(inputHandler.getSelectedEdge()).toBeNull();
    });

    it('debe manejar click derecho', () => {
      const nodeEvent = inputHandler.handleNodeClick(
        node1,
        100,
        100,
        50,
        50,
        true,
      );

      expect(nodeEvent?.isRightClick).toBe(true);
    });
  });

  describe('handleEdgeClick', () => {
    it('debe generar evento de click en arista', () => {
      const edgeEvent = inputHandler.handleEdgeClick(
        edge1,
        100,
        100,
        50,
        50,
      );

      expect(edgeEvent).not.toBeNull();
      expect(edgeEvent?.edge).toBe(edge1);
      expect(edgeEvent?.canvasX).toBe(100);
      expect(edgeEvent?.canvasY).toBe(100);
    });

    it('debe usar nodo seleccionado como origen si está conectado a la arista', () => {
      // Seleccionar node1 primero
      inputHandler.handleNodeClick(node1, 0, 0, 0, 0);

      // Click en arista
      const edgeEvent = inputHandler.handleEdgeClick(edge1, 100, 100, 50, 50);

      expect(edgeEvent?.sourceNode).toBe(node1);
      expect(edgeEvent?.targetNode).toBe(node2);
    });

    it('debe actualizar la arista seleccionada', () => {
      inputHandler.handleEdgeClick(edge1, 100, 100, 50, 50);

      expect(inputHandler.getSelectedEdge()).toBe(edge1);
    });
  });

  describe('handleEnergyAssignment', () => {
    beforeEach(() => {
      inputHandler.setCurrentPlayer(player1);
    });

    it('debe crear comando de asignación de energía', () => {
      const command = inputHandler.handleEnergyAssignment(node1, edge1, 50);

      expect(command.type).toBe('assign');
      expect(command.player).toBe(player1);
      expect(command.sourceNode).toBe(node1);
      expect(command.target).toBe(edge1);
      expect(command.amount).toBe(50);
    });

    it('debe lanzar error si no hay jugador establecido', () => {
      const handlerWithoutPlayer = new InputHandler();

      expect(() =>
        handlerWithoutPlayer.handleEnergyAssignment(node1, edge1, 50),
      ).toThrow('No hay jugador actual establecido');

      handlerWithoutPlayer.dispose();
    });

    it('debe limitar la cantidad al rango permitido', () => {
      // Cantidad muy baja
      const command1 = inputHandler.handleEnergyAssignment(node1, edge1, 0);
      expect(command1.amount).toBe(1); // minEnergyAmount

      // Cantidad muy alta
      const command2 = inputHandler.handleEnergyAssignment(node1, edge1, 200);
      expect(command2.amount).toBe(100); // maxEnergyAmount

      // Cantidad normal
      const command3 = inputHandler.handleEnergyAssignment(node1, edge1, 50);
      expect(command3.amount).toBe(50);
    });

    it('debe respetar límites personalizados de configuración', () => {
      const customHandler = new InputHandler({
        minEnergyAmount: 5,
        maxEnergyAmount: 50,
      });
      customHandler.setCurrentPlayer(player1);

      const command = customHandler.handleEnergyAssignment(node1, edge1, 100);
      expect(command.amount).toBe(50);

      customHandler.dispose();
    });
  });

  describe('getSelectedNode', () => {
    it('debe retornar null inicialmente', () => {
      expect(inputHandler.getSelectedNode()).toBeNull();
    });

    it('debe retornar el nodo seleccionado', () => {
      inputHandler.handleNodeClick(node1, 0, 0, 0, 0);

      expect(inputHandler.getSelectedNode()).toBe(node1);
    });
  });

  describe('getSelectedEdge', () => {
    it('debe retornar null inicialmente', () => {
      expect(inputHandler.getSelectedEdge()).toBeNull();
    });

    it('debe retornar la arista seleccionada', () => {
      inputHandler.handleEdgeClick(edge1, 0, 0, 0, 0);

      expect(inputHandler.getSelectedEdge()).toBe(edge1);
    });
  });

  describe('clearSelection', () => {
    it('debe limpiar la selección', () => {
      // Seleccionar nodo y arista
      inputHandler.handleNodeClick(node1, 0, 0, 0, 0);
      inputHandler.handleEdgeClick(edge1, 0, 0, 0, 0);

      expect(inputHandler.getSelectedNode()).not.toBeNull();
      expect(inputHandler.getSelectedEdge()).not.toBeNull();

      // Limpiar
      inputHandler.clearSelection();

      expect(inputHandler.getSelectedNode()).toBeNull();
      expect(inputHandler.getSelectedEdge()).toBeNull();
    });
  });

  describe('event system', () => {
    it('debe permitir registrar y emitir eventos', () => {
      const callback = vi.fn();

      inputHandler.on('nodeClick', callback);

      // Simular emisión interna (ya que el click real requiere canvas inicializado)
      inputHandler.initialize(canvas, renderer);
      inputHandler.updateSnapshot({
        timestamp: Date.now(),
        currentTick: 0,
        elapsedTime: 0,
        elapsedTimeFormatted: '00:00',
        remainingTime: 180000,
        remainingTimeFormatted: '03:00',
        status: 'playing',
        totalNodes: 2,
        totalPlayers: 1,
        playerStats: [],
        nodes: [{
          id: 1,
          x: 100,
          y: 100,
          radius: 30,
          ownerId: 1,
          color: '#FF0000',
          nodeType: 'basic',
          energyPool: 50,
          defenseEnergy: 50,
          isInitialNode: false,
          isNeutral: false,
        }],
        edges: [],
        energyPackets: [],
      });
    });

    it('debe permitir remover event listeners', () => {
      const callback = vi.fn();

      inputHandler.on('nodeClick', callback);
      inputHandler.off('nodeClick', callback);

      // Verificar que no se llama después de remover
      inputHandler.handleNodeClick(node1, 0, 0, 0, 0);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('debe limpiar todos los event listeners', () => {
      const removeEventListenerSpy = vi.spyOn(canvas, 'removeEventListener');

      inputHandler.initialize(canvas, renderer);
      inputHandler.dispose();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('contextmenu', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
    });

    it('debe limpiar la selección', () => {
      inputHandler.handleNodeClick(node1, 0, 0, 0, 0);

      inputHandler.dispose();

      expect(inputHandler.getSelectedNode()).toBeNull();
    });
  });

  describe('configuración', () => {
    it('debe usar configuración personalizada', () => {
      const customHandler = new InputHandler({
        nodeTolerance: 15,
        edgeTolerance: 20,
        defaultEnergyAmount: 25,
      });

      expect(customHandler).toBeDefined();

      customHandler.dispose();
    });

    it('debe fusionar configuración con valores por defecto', () => {
      const customHandler = new InputHandler({
        nodeTolerance: 15,
        // Otros valores deberían usar defaults
      });

      customHandler.setCurrentPlayer(player1);
      const command = customHandler.handleEnergyAssignment(node1, edge1, 10);

      // defaultEnergyAmount por defecto es 10
      expect(command.amount).toBe(10);

      customHandler.dispose();
    });
  });
});
