import type { Edge } from '@/core/entities/edge';
import type { Node } from '@/core/entities/node/node';

/**
 * Evento de click en nodo
 */
export interface NodeClickEvent {
  node: Node;
  position: { x: number; y: number };
  button: number; // 0 = izquierdo, 2 = derecho
}

/**
 * Evento de click en arista
 */
export interface EdgeClickEvent {
  edge: Edge;
  position: { x: number; y: number };
  button: number;
}

/**
 * SimpleInputHandler - Manejador simplificado de entrada para NEXA
 *
 * Detecta clicks en nodos y aristas del grafo y emite eventos.
 * Versión simplificada sin sistema de coordenadas.
 */
export class SimpleInputHandler {
  private canvas: HTMLCanvasElement;
  private selectedNode: Node | null = null;

  private nodeClickCallbacks: ((event: NodeClickEvent) => void)[] = [];
  private edgeClickCallbacks: ((event: EdgeClickEvent) => void)[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupEventListeners();
  }

  /**
   * Configura los event listeners del canvas
   */
  private setupEventListeners(): void {
    this.canvas.addEventListener('click', e => this.handleClick(e, 0));
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.handleClick(e, 2);
    });
  }

  /**
   * Maneja clicks en el canvas
   * NOTA: Sin sistema de coordenadas, usamos selección directa
   */
  private handleClick(event: MouseEvent, button: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Por ahora, emitimos evento genérico de click
    // La lógica real de detección debería implementarse con un sistema de coordenadas
    console.log(`[SimpleInputHandler] Click at ${x},${y} - button ${button}`);
  }

  /**
   * Selecciona un nodo manualmente (para uso programático)
   */
  public selectNode(node: Node): void {
    this.selectedNode = node;
    this.emitNodeClick({
      node,
      position: { x: 0, y: 0 },
      button: 0,
    });
  }

  /**
   * Selecciona una arista manualmente (para uso programático)
   */
  public selectEdge(edge: Edge): void {
    this.emitEdgeClick({
      edge,
      position: { x: 0, y: 0 },
      button: 0,
    });
  }

  /**
   * Registra un callback para clicks en nodos
   */
  public onNodeClick(callback: (event: NodeClickEvent) => void): void {
    this.nodeClickCallbacks.push(callback);
  }

  /**
   * Registra un callback para clicks en aristas
   */
  public onEdgeClick(callback: (event: EdgeClickEvent) => void): void {
    this.edgeClickCallbacks.push(callback);
  }

  /**
   * Emite un evento de click en nodo
   */
  private emitNodeClick(event: NodeClickEvent): void {
    for (const callback of this.nodeClickCallbacks) {
      callback(event);
    }
  }

  /**
   * Emite un evento de click en arista
   */
  private emitEdgeClick(event: EdgeClickEvent): void {
    for (const callback of this.edgeClickCallbacks) {
      callback(event);
    }
  }

  /**
   * Obtiene el nodo actualmente seleccionado
   */
  public getSelectedNode(): Node | null {
    return this.selectedNode;
  }

  /**
   * Limpia el nodo seleccionado
   */
  public clearSelection(): void {
    this.selectedNode = null;
  }

  /**
   * Limpia recursos
   */
  public dispose(): void {
    this.nodeClickCallbacks = [];
    this.edgeClickCallbacks = [];
    this.selectedNode = null;
  }
}
