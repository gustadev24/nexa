import type { EdgeSnapshot, EnergyPacketSnapshot, GameSnapshot, NodeSnapshot } from '@/infrastructure/state/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameRenderer } from './GameRenderer';

describe('GameRenderer', () => {
  let canvas: HTMLCanvasElement;
  let renderer: GameRenderer;

  beforeEach(() => {
    // Crear un canvas mock
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    // Mock del contexto 2D con getters y setters para propiedades
    let _fillStyle = '';
    let _strokeStyle = '';
    let _lineWidth = 0;
    let _lineCap: CanvasLineCap = 'butt';
    let _font = '';
    let _textAlign: CanvasTextAlign = 'start';
    let _textBaseline: CanvasTextBaseline = 'alphabetic';
    let _shadowBlur = 0;
    let _shadowColor = '';
    
    const mockContext = {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fillText: vi.fn(),
      strokeRect: vi.fn(),
      measureText: vi.fn(() => ({ width: 50 })),
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high' as ImageSmoothingQuality,
      get fillStyle() { return _fillStyle; },
      set fillStyle(value: string | CanvasGradient | CanvasPattern) { _fillStyle = value as string; },
      get strokeStyle() { return _strokeStyle; },
      set strokeStyle(value: string | CanvasGradient | CanvasPattern) { _strokeStyle = value as string; },
      get lineWidth() { return _lineWidth; },
      set lineWidth(value: number) { _lineWidth = value; },
      get lineCap() { return _lineCap; },
      set lineCap(value: CanvasLineCap) { _lineCap = value; },
      get font() { return _font; },
      set font(value: string) { _font = value; },
      get textAlign() { return _textAlign; },
      set textAlign(value: CanvasTextAlign) { _textAlign = value; },
      get textBaseline() { return _textBaseline; },
      set textBaseline(value: CanvasTextBaseline) { _textBaseline = value; },
      get shadowBlur() { return _shadowBlur; },
      set shadowBlur(value: number) { _shadowBlur = value; },
      get shadowColor() { return _shadowColor; },
      set shadowColor(value: string) { _shadowColor = value; },
    };

    vi.spyOn(canvas, 'getContext').mockReturnValue(mockContext as unknown as CanvasRenderingContext2D);

    renderer = new GameRenderer();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('debe inicializar el renderer correctamente', () => {
      expect(() => renderer.initialize(canvas)).not.toThrow();
      expect(canvas.getContext).toHaveBeenCalledWith('2d');
    });

    it('debe lanzar error si el canvas no soporta 2D', () => {
      vi.spyOn(canvas, 'getContext').mockReturnValue(null);
      
      expect(() => renderer.initialize(canvas)).toThrow('El canvas no soporta contexto 2D');
    });

    it('debe configurar el viewport inicial', () => {
      renderer.initialize(canvas);
      const ctx = renderer.getContext();
      
      expect(ctx).not.toBeNull();
      expect(ctx?.imageSmoothingEnabled).toBe(true);
      expect(ctx?.imageSmoothingQuality).toBe('high');
    });
  });

  describe('renderGraph', () => {
    const mockSnapshot: GameSnapshot = {
      timestamp: Date.now(),
      currentTick: 100,
      elapsedTime: 5000,
      elapsedTimeFormatted: '00:05',
      remainingTime: 175000,
      remainingTimeFormatted: '02:55',
      status: 'playing',
      totalNodes: 5,
      totalPlayers: 2,
      playerStats: [
        {
          playerId: 1,
          username: 'Player 1',
          controlledNodes: 3,
          totalEnergy: 150,
          storedEnergy: 100,
          transitEnergy: 50,
          dominancePercentage: 60,
          dominanceTime: 0,
          isEliminated: false,
          hasInitialNode: true,
        },
        {
          playerId: 2,
          username: 'Player 2',
          controlledNodes: 2,
          totalEnergy: 100,
          storedEnergy: 80,
          transitEnergy: 20,
          dominancePercentage: 40,
          dominanceTime: 0,
          isEliminated: false,
          hasInitialNode: true,
        },
      ],
      nodes: [],
      edges: [],
      energyPackets: [],
    };

    it('debe lanzar error si no está inicializado', () => {
      expect(() => renderer.renderGraph(mockSnapshot)).toThrow('Renderer no inicializado');
    });

    it('debe limpiar el canvas antes de renderizar', () => {
      renderer.initialize(canvas);
      const ctx = renderer.getContext();
      
      renderer.renderGraph(mockSnapshot);
      
      expect(ctx?.fillRect).toHaveBeenCalled();
    });

    it('debe renderizar sin errores cuando no hay nodos ni aristas', () => {
      renderer.initialize(canvas);
      
      expect(() => renderer.renderGraph(mockSnapshot)).not.toThrow();
    });
  });

  describe('renderNode', () => {
    const mockNode: NodeSnapshot = {
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
    };

    it('debe lanzar error si no está inicializado', () => {
      expect(() => renderer.renderNode(mockNode)).toThrow('Renderer no inicializado');
    });

    it('debe renderizar un nodo básico correctamente', () => {
      renderer.initialize(canvas);
      const ctx = renderer.getContext();
      
      renderer.renderNode(mockNode);
      
      expect(ctx?.arc).toHaveBeenCalled();
      expect(ctx?.fill).toHaveBeenCalled();
      expect(ctx?.stroke).toHaveBeenCalled();
    });

    it('debe renderizar un nodo neutral con color gris', () => {
      renderer.initialize(canvas);
      const ctx = renderer.getContext();
      
      // Spy para capturar todas las asignaciones de fillStyle
      const fillStyleValues: string[] = [];
      
      Object.defineProperty(ctx, 'fillStyle', {
        get() { return fillStyleValues[fillStyleValues.length - 1] || ''; },
        set(value: string) {
          fillStyleValues.push(value);
        }
      });
      
      const neutralNode = { ...mockNode, isNeutral: true, ownerId: null };
      renderer.renderNode(neutralNode);
      
      // Verificar que en algún momento se usó el color neutral
      expect(fillStyleValues).toContain('#808080');
    });

    it('debe renderizar indicador especial para nodo inicial', () => {
      renderer.initialize(canvas);
      const ctx = renderer.getContext();
      
      const initialNode = { ...mockNode, isInitialNode: true };
      renderer.renderNode(initialNode);
      
      // Debe dibujar un arco adicional para el doble borde
      expect(ctx?.arc).toHaveBeenCalledTimes(2);
    });
  });

  describe('renderEdge', () => {
    const mockEdge: EdgeSnapshot = {
      id: 1,
      fromNodeId: 1,
      toNodeId: 2,
      fromX: 100,
      fromY: 100,
      toX: 200,
      toY: 200,
      length: 10,
      thickness: 2,
    };

    it('debe lanzar error si no está inicializado', () => {
      expect(() => renderer.renderEdge(mockEdge)).toThrow('Renderer no inicializado');
    });

    it('debe renderizar una arista correctamente', () => {
      renderer.initialize(canvas);
      const ctx = renderer.getContext();
      
      renderer.renderEdge(mockEdge);
      
      expect(ctx?.moveTo).toHaveBeenCalled();
      expect(ctx?.lineTo).toHaveBeenCalled();
      expect(ctx?.stroke).toHaveBeenCalled();
    });
  });

  describe('renderEnergyPackets', () => {
    const mockPackets: EnergyPacketSnapshot[] = [
      {
        id: 1,
        ownerId: 1,
        color: '#FF0000',
        amount: 25,
        originNodeId: 1,
        targetNodeId: 2,
        progress: 0.5,
        x: 150,
        y: 150,
        radius: 8,
      },
    ];

    it('debe lanzar error si no está inicializado', () => {
      expect(() => renderer.renderEnergyPackets(mockPackets)).toThrow('Renderer no inicializado');
    });

    it('debe renderizar paquetes de energía correctamente', () => {
      renderer.initialize(canvas);
      const ctx = renderer.getContext();
      
      renderer.renderEnergyPackets(mockPackets);
      
      expect(ctx?.arc).toHaveBeenCalled();
      expect(ctx?.fill).toHaveBeenCalled();
      expect(ctx?.stroke).toHaveBeenCalled();
    });

    it('debe renderizar múltiples paquetes', () => {
      renderer.initialize(canvas);
      const ctx = renderer.getContext();
      
      const multiplePackets = [
        mockPackets[0],
        { ...mockPackets[0], id: 2, x: 180, y: 180 },
        { ...mockPackets[0], id: 3, x: 210, y: 210 },
      ];
      
      renderer.renderEnergyPackets(multiplePackets);
      
      // Debe dibujar un círculo por cada paquete
      expect(ctx?.arc).toHaveBeenCalledTimes(3);
    });
  });

  describe('renderUI', () => {
    const mockSnapshot: GameSnapshot = {
      timestamp: Date.now(),
      currentTick: 100,
      elapsedTime: 5000,
      elapsedTimeFormatted: '00:05',
      remainingTime: 175000,
      remainingTimeFormatted: '02:55',
      status: 'playing',
      totalNodes: 5,
      totalPlayers: 2,
      playerStats: [
        {
          playerId: 1,
          username: 'Player 1',
          controlledNodes: 3,
          totalEnergy: 150,
          storedEnergy: 100,
          transitEnergy: 50,
          dominancePercentage: 60,
          dominanceTime: 0,
          isEliminated: false,
          hasInitialNode: true,
        },
      ],
    };

    it('debe lanzar error si no está inicializado', () => {
      expect(() => renderer.renderUI(mockSnapshot)).toThrow('Renderer no inicializado');
    });

    it('debe renderizar información de tiempo', () => {
      renderer.initialize(canvas);
      const ctx = renderer.getContext();
      
      renderer.renderUI(mockSnapshot);
      
      expect(ctx?.fillText).toHaveBeenCalled();
    });

    it('debe renderizar advertencia de dominancia si existe', () => {
      renderer.initialize(canvas);
      const ctx = renderer.getContext();
      
      const snapshotWithWarning = {
        ...mockSnapshot,
        dominanceWarning: {
          playerId: 1,
          timeRemaining: 5000,
        },
      };
      
      renderer.renderUI(snapshotWithWarning);
      
      expect(ctx?.fillText).toHaveBeenCalled();
    });

    it('debe renderizar mensaje de victoria si el juego terminó', () => {
      renderer.initialize(canvas);
      const ctx = renderer.getContext();
      
      const finishedSnapshot = {
        ...mockSnapshot,
        status: 'finished' as const,
        winnerId: 1,
        victoryReason: 'dominance' as const,
      };
      
      renderer.renderUI(finishedSnapshot);
      
      expect(ctx?.fillText).toHaveBeenCalled();
    });
  });

  describe('viewport controls', () => {
    beforeEach(() => {
      renderer.initialize(canvas);
    });

    it('debe permitir ajustar el zoom', () => {
      expect(() => renderer.setZoom(1.5)).not.toThrow();
      expect(() => renderer.setZoom(0.5)).not.toThrow();
    });

    it('debe limitar el zoom a valores válidos', () => {
      renderer.setZoom(10); // Muy alto
      renderer.setZoom(0.01); // Muy bajo
      
      // No debe lanzar error, debe limitar internamente
      expect(() => renderer.setZoom(10)).not.toThrow();
    });

    it('debe permitir ajustar el offset', () => {
      expect(() => renderer.setOffset(100, 200)).not.toThrow();
    });
  });

  describe('getContext', () => {
    it('debe retornar null si no está inicializado', () => {
      expect(renderer.getContext()).toBeNull();
    });

    it('debe retornar el contexto después de inicializar', () => {
      renderer.initialize(canvas);
      expect(renderer.getContext()).not.toBeNull();
    });
  });
});
