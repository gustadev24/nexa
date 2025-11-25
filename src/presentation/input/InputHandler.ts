import type { Edge } from '@/core/entities/edge';
import type { Node } from '@/core/entities/node/node';
import type { Player } from '@/core/entities/player';
import type { EdgeSnapshot, GameSnapshot, NodeSnapshot } from '@/infrastructure/state/types';
import type { GameRenderer } from '@/presentation/renderer/GameRenderer';
import type {
  EdgeClickEvent,
  EnergyCommand,
  HitTestResult,
  InputHandlerConfig,
  NodeClickEvent,
  SelectionState,
} from '@/presentation/input/types';

/**
 * InputHandler - Manejador de entrada del juego NEXA
 *
 * Traduce clicks y acciones del usuario en comandos del juego.
 * Maneja detección de clicks en nodos y aristas, selección de elementos,
 * y generación de comandos de energía.
 *
 * Arquitectura:
 * - Event-driven: Escucha eventos de mouse/touch en el canvas
 * - Hit detection: Detecta qué elemento fue clickeado
 * - Command generation: Crea comandos para el EnergyCommandService
 * - State management: Mantiene estado de selección del usuario
 *
 * @example
 * ```typescript
 * const inputHandler = new InputHandler();
 * inputHandler.initialize(canvas, renderer);
 *
 * // Escuchar eventos
 * inputHandler.on('nodeClick', (event) => {
 *   console.log('Nodo clickeado:', event.node);
 * });
 *
 * // Asignar energía
 * const command = inputHandler.handleEnergyAssignment(node, edge, 50);
 * energyCommandService.assignEnergyToEdge(command.player, command.sourceNode, command.target, command.amount);
 * ```
 */
export class InputHandler {
  private canvas: HTMLCanvasElement | null = null;
  private renderer: GameRenderer | null = null;
  private currentSnapshot: GameSnapshot | null = null;
  private currentPlayer: Player | null = null;

  // Estado de selección
  private selectionState: SelectionState = {
    selectedNode: null,
    selectedEdge: null,
    selectionTime: 0,
  };

  // Configuración
  private config: Required<InputHandlerConfig> = {
    allowRightClick: true,
    nodeTolerance: 5,
    edgeTolerance: 10,
    enableTouch: true,
    defaultEnergyAmount: 10,
    minEnergyAmount: 1,
    maxEnergyAmount: 100,
  };

  // Event listeners
  private eventListeners = new Map<string, ((event: unknown) => void)[]>();

  // Bound event handlers (para poder removerlos después)
  private boundHandlers: {
    onClick?: (e: MouseEvent) => void;
    onContextMenu?: (e: MouseEvent) => void;
    onTouchStart?: (e: TouchEvent) => void;
  } = {};

  constructor(config?: Partial<InputHandlerConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Inicializa el manejador de entrada
   * Registra event listeners para mouse y touch
   *
   * @param canvas - Canvas HTML donde se renderiza el juego
   * @param renderer - GameRenderer para obtener transformaciones de coordenadas
   */
  public initialize(canvas: HTMLCanvasElement, renderer: GameRenderer): void {
    this.canvas = canvas;
    this.renderer = renderer;

    // Configurar event listeners
    this.setupEventListeners();
  }

  /**
   * Establece el jugador actual (quien está interactuando)
   */
  public setCurrentPlayer(player: Player): void {
    this.currentPlayer = player;
  }

  /**
   * Actualiza el snapshot actual del juego
   * Necesario para hit detection
   */
  public updateSnapshot(snapshot: GameSnapshot): void {
    this.currentSnapshot = snapshot;
  }

  /**
   * Configura los event listeners en el canvas
   */
  private setupEventListeners(): void {
    if (!this.canvas) return;

    // Click izquierdo
    this.boundHandlers.onClick = (e: MouseEvent) => this.handleCanvasClick(e);
    this.canvas.addEventListener('click', this.boundHandlers.onClick);

    // Click derecho (menú contextual)
    if (this.config.allowRightClick) {
      this.boundHandlers.onContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        this.handleCanvasClick(e, true);
      };
      this.canvas.addEventListener('contextmenu', this.boundHandlers.onContextMenu);
    }

    // Touch
    if (this.config.enableTouch) {
      this.boundHandlers.onTouchStart = (e: TouchEvent) => this.handleTouchStart(e);
      this.canvas.addEventListener('touchstart', this.boundHandlers.onTouchStart);
    }
  }

  /**
   * Maneja clicks en el canvas
   */
  private handleCanvasClick(event: MouseEvent, isRightClick = false): void {
    if (!this.canvas || !this.currentSnapshot) return;

    const rect = this.canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    // Convertir a coordenadas del mundo
    const [worldX, worldY] = this.canvasToWorld(canvasX, canvasY);

    // Hit detection
    const hitResult = this.performHitTest(worldX, worldY);

    if (hitResult.node) {
      const nodeEvent = this.handleNodeClick(hitResult.node, canvasX, canvasY, worldX, worldY, isRightClick);
      if (nodeEvent) {
        this.emit('nodeClick', nodeEvent);
      }
    }
    else if (hitResult.edge) {
      const edgeEvent = this.handleEdgeClick(hitResult.edge, canvasX, canvasY, worldX, worldY);
      if (edgeEvent) {
        this.emit('edgeClick', edgeEvent);
      }
    }
    else {
      // Click en espacio vacío - limpiar selección
      this.clearSelection();
      this.emit('clearSelection', {});
    }
  }

  /**
   * Maneja touch events
   */
  private handleTouchStart(event: TouchEvent): void {
    if (!this.canvas || event.touches.length === 0) return;

    const touch = event.touches[0];

    // Simular click
    const mouseEvent = new MouseEvent('click', {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });

    this.handleCanvasClick(mouseEvent);
  }

  /**
   * Maneja click en un nodo
   */
  public handleNodeClick(
    node: Node,
    canvasX: number,
    canvasY: number,
    worldX: number,
    worldY: number,
    isRightClick = false,
  ): NodeClickEvent | null {
    const nodeEvent: NodeClickEvent = {
      node,
      canvasX,
      canvasY,
      worldX,
      worldY,
      timestamp: Date.now(),
      isRightClick,
    };

    // Actualizar selección
    this.selectionState.selectedNode = node;
    this.selectionState.selectedEdge = null;
    this.selectionState.selectionTime = nodeEvent.timestamp;

    return nodeEvent;
  }

  /**
   * Maneja click en una arista
   */
  public handleEdgeClick(
    edge: Edge,
    canvasX: number,
    canvasY: number,
    worldX: number,
    worldY: number,
  ): EdgeClickEvent | null {
    // Determinar nodo origen (el seleccionado) y destino
    const [node1, node2] = edge.endpoints;

    let sourceNode: Node;
    let targetNode: Node;

    if (this.selectionState.selectedNode && edge.hasNode(this.selectionState.selectedNode)) {
      sourceNode = this.selectionState.selectedNode;
      targetNode = edge.flipSide(sourceNode);
    }
    else {
      // Si no hay nodo seleccionado, usar el más cercano al click
      sourceNode = node1;
      targetNode = node2;
    }

    const edgeEvent: EdgeClickEvent = {
      edge,
      sourceNode,
      targetNode,
      canvasX,
      canvasY,
      worldX,
      worldY,
      timestamp: Date.now(),
    };

    // Actualizar selección
    this.selectionState.selectedEdge = edge;
    this.selectionState.selectionTime = edgeEvent.timestamp;

    return edgeEvent;
  }

  /**
   * Crea un comando de asignación de energía
   */
  public handleEnergyAssignment(
    node: Node,
    edge: Edge,
    amount: number,
  ): EnergyCommand {
    if (!this.currentPlayer) {
      throw new Error('No hay jugador actual establecido. Usar setCurrentPlayer()');
    }

    // Validar cantidad
    const clampedAmount = Math.max(
      this.config.minEnergyAmount,
      Math.min(this.config.maxEnergyAmount, amount),
    );

    return {
      type: 'assign',
      player: this.currentPlayer,
      sourceNode: node,
      target: edge,
      amount: clampedAmount,
      timestamp: Date.now(),
    };
  }

  /**
   * Realiza hit detection para encontrar el elemento clickeado
   */
  private performHitTest(worldX: number, worldY: number): HitTestResult {
    if (!this.currentSnapshot) {
      return { hit: false, distance: Infinity };
    }

    let closestNode: Node | undefined;
    let closestEdge: Edge | undefined;
    let minDistance = Infinity;

    // Buscar nodos
    if (this.currentSnapshot.nodes) {
      for (const nodeSnapshot of this.currentSnapshot.nodes) {
        const distance = this.distanceToNode(worldX, worldY, nodeSnapshot);
        if (distance < nodeSnapshot.radius + this.config.nodeTolerance && distance < minDistance) {
          minDistance = distance;
          // TODO: Necesitamos una forma de obtener el Node real desde el snapshot
          // Por ahora, esto requiere que el snapshot tenga una referencia o ID
        }
      }
    }

    // Si no se encontró nodo, buscar aristas
    if (!closestNode && this.currentSnapshot.edges) {
      for (const edgeSnapshot of this.currentSnapshot.edges) {
        const distance = this.distanceToEdge(worldX, worldY, edgeSnapshot);
        if (distance < this.config.edgeTolerance && distance < minDistance) {
          minDistance = distance;
          // TODO: Similar al caso de nodos
        }
      }
    }

    return {
      hit: closestNode !== undefined || closestEdge !== undefined,
      node: closestNode,
      edge: closestEdge,
      distance: minDistance,
    };
  }

  /**
   * Calcula la distancia de un punto a un nodo
   */
  private distanceToNode(x: number, y: number, node: NodeSnapshot): number {
    const dx = x - node.x;
    const dy = y - node.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calcula la distancia de un punto a una arista
   */
  private distanceToEdge(x: number, y: number, edge: EdgeSnapshot): number {
    // Distancia de punto a segmento de línea
    const { fromX, fromY, toX, toY } = edge;

    const dx = toX - fromX;
    const dy = toY - fromY;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      // Arista degenerada (punto)
      return this.distanceToNode(x, y, { x: fromX, y: fromY } as NodeSnapshot);
    }

    // Proyección del punto en la línea
    let t = ((x - fromX) * dx + (y - fromY) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));

    const projX = fromX + t * dx;
    const projY = fromY + t * dy;

    const distX = x - projX;
    const distY = y - projY;

    return Math.sqrt(distX * distX + distY * distY);
  }

  /**
   * Convierte coordenadas del canvas a coordenadas del mundo
   */
  private canvasToWorld(canvasX: number, canvasY: number): [number, number] {
    // TODO: Esta transformación debería obtenerse del renderer
    // Por ahora, asumimos una transformación simple
    if (!this.renderer || !this.canvas) {
      return [canvasX, canvasY];
    }

    // Obtener transformación inversa del renderer
    // Esta es una simplificación - el renderer debería proveer este método
    const worldX = canvasX; // Placeholder
    const worldY = canvasY; // Placeholder

    return [worldX, worldY];
  }

  /**
   * Obtiene el nodo seleccionado actualmente
   */
  public getSelectedNode(): Node | null {
    return this.selectionState.selectedNode;
  }

  /**
   * Obtiene la arista seleccionada actualmente
   */
  public getSelectedEdge(): Edge | null {
    return this.selectionState.selectedEdge;
  }

  /**
   * Limpia la selección actual
   */
  public clearSelection(): void {
    this.selectionState.selectedNode = null;
    this.selectionState.selectedEdge = null;
    this.selectionState.selectionTime = Date.now();
  }

  /**
   * Registra un event listener
   */
  public on(eventName: string, callback: (event: unknown) => void): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)?.push(callback);
  }

  /**
   * Remueve un event listener
   */
  public off(eventName: string, callback: (event: unknown) => void): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emite un evento
   */
  private emit(eventName: string, event: unknown): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }

  /**
   * Limpia todos los event listeners
   */
  public dispose(): void {
    // Limpiar selección primero
    this.clearSelection();

    // Remover event listeners del canvas si existe
    if (this.canvas) {
      if (this.boundHandlers.onClick) {
        this.canvas.removeEventListener('click', this.boundHandlers.onClick);
      }
      if (this.boundHandlers.onContextMenu) {
        this.canvas.removeEventListener('contextmenu', this.boundHandlers.onContextMenu);
      }
      if (this.boundHandlers.onTouchStart) {
        this.canvas.removeEventListener('touchstart', this.boundHandlers.onTouchStart);
      }
    }

    // Limpiar referencias
    this.canvas = null;
    this.renderer = null;
    this.currentSnapshot = null;
    this.currentPlayer = null;
    this.eventListeners.clear();
  }
}
