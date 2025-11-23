import Phaser from 'phaser';
import { GameManager } from '@/core/managers/GameManager';
import { NodeFactory } from '@/core/entities/node/node-factory';
import { Player } from '@/core/entities/player';
import { Edge } from '@/core/entities/edge';
import { GameEventType } from '@/core/types/events.types';
import { NodeType, PlayerType } from '@/core/types/common';
import type { Node } from '@/core/entities/node/node';

/**
 * GameScene - Escena principal del juego integrada con GameManager
 * Responsable de la visualización y input del usuario
 */
export default class GameScene extends Phaser.Scene {
  private gameManager!: GameManager;
  private nodeGraphics: Map<string | number, Phaser.GameObjects.Graphics> = new Map();
  private edgeGraphics: Map<string | number, Phaser.GameObjects.Graphics> = new Map();
  private packetGraphics: Map<string | number, Phaser.GameObjects.Graphics> = new Map();
  private uiTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  
  private selectedNode: Node | null = null;
  private hoveredNode: Node | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Obtener instancia del GameManager (Singleton)
    this.gameManager = GameManager.getInstance();
    
    // Suscribirse a eventos del juego (Observer Pattern)
    this.subscribeToGameEvents();
    
    // Crear el grafo de prueba
    this.createTestGraph();
    
    // Inicializar UI
    this.createUI();
    
    // Iniciar el juego
    this.gameManager.startGame();
    
    // Setup input
    this.setupInput();
  }

  update(_time: number, delta: number): void {
    // Actualizar GameManager (procesa ciclos de defensa y ataque)
    this.gameManager.update(delta);
    
    // Actualizar visualización
    this.updateVisualization();
  }

  /**
   * Suscribe a todos los eventos del juego para actualizar la UI
   */
  private subscribeToGameEvents(): void {
    const events = this.gameManager.getEventEmitter();
    
    // Eventos de juego
    events.on(GameEventType.GAME_STARTED, () => {
      console.log('🎮 Game Started!');
    });
    
    events.on(GameEventType.GAME_OVER, (data: any) => {
      console.log('🏁 Game Over!', data);
      this.showGameOver(data.winner, data.reason);
    });
    
    events.on(GameEventType.GAME_PAUSED, () => {
      console.log('⏸️ Game Paused');
    });
    
    // Eventos de nodos
    events.on(GameEventType.NODE_CAPTURED, (data: any) => {
      console.log('🏰 Node Captured:', data);
      this.updateNodeVisual(data.nodeId);
    });
    
    events.on(GameEventType.NODE_NEUTRALIZED, (data: any) => {
      console.log('⚪ Node Neutralized:', data);
      this.updateNodeVisual(data.nodeId);
    });
    
    // Eventos de energía
    events.on(GameEventType.ENERGY_COLLISION, (data: any) => {
      console.log('💥 Energy Collision:', data);
    });
    
    // Eventos de dominancia
    events.on(GameEventType.DOMINANCE_STARTED, (data: any) => {
      console.log('👑 Dominance Started:', data);
    });
    
    events.on(GameEventType.DOMINANCE_LOST, (data: any) => {
      console.log('💔 Dominance Lost:', data);
    });
  }

  /**
   * Crea un grafo de prueba para el juego
   */
  private createTestGraph(): void {
    // Crear jugadores
    const player1 = new Player({
      id: 'player1',
      username: 'Player 1',
      color: { r: 0, g: 136, b: 255 },
      type: PlayerType.HUMAN,
    });
    
    const player2 = new Player({
      id: 'player2',
      username: 'Player 2 (AI)',
      color: { r: 255, g: 68, b: 68 },
      type: PlayerType.AI,
    });
    
    this.gameManager.addPlayer(player1);
    this.gameManager.addPlayer(player2);
    
    // Crear nodos en posiciones del grafo
    const node1 = NodeFactory.createNode({
      id: 'node1',
      type: NodeType.BASIC,
      position: { x: 200, y: 300 },
      initialEnergy: 50,
    });
    node1.setAsInitialNode();
    node1.setOwner(player1);
    player1.captureNode(node1);
    
    const node2 = NodeFactory.createNode({
      id: 'node2',
      type: NodeType.ATTACK,
      position: { x: 400, y: 200 },
      initialEnergy: 0,
    });
    
    const node3 = NodeFactory.createNode({
      id: 'node3',
      type: NodeType.DEFENSE,
      position: { x: 400, y: 400 },
      initialEnergy: 0,
    });
    
    const node4 = NodeFactory.createNode({
      id: 'node4',
      type: NodeType.ENERGY,
      position: { x: 600, y: 300 },
      initialEnergy: 50,
    });
    node4.setAsInitialNode();
    node4.setOwner(player2);
    player2.captureNode(node4);
    
    const node5 = NodeFactory.createNode({
      id: 'node5',
      type: NodeType.SUPER_ENERGY,
      position: { x: 400, y: 300 },
      initialEnergy: 0,
    });
    
    // Agregar nodos al GameManager
    [node1, node2, node3, node4, node5].forEach(node => {
      this.gameManager.addNode(node);
    });
    
    // Crear aristas
    const edge1 = new Edge({
      id: 'edge1',
      nodeA: node1,
      nodeB: node2,
      weight: 50, // 50 ticks de viaje
    });
    
    const edge2 = new Edge({
      id: 'edge2',
      nodeA: node1,
      nodeB: node3,
      weight: 50,
    });
    
    const edge3 = new Edge({
      id: 'edge3',
      nodeA: node2,
      nodeB: node5,
      weight: 30,
    });
    
    const edge4 = new Edge({
      id: 'edge4',
      nodeA: node3,
      nodeB: node5,
      weight: 30,
    });
    
    const edge5 = new Edge({
      id: 'edge5',
      nodeA: node5,
      nodeB: node4,
      weight: 50,
    });
    
    // Agregar aristas al GameManager
    [edge1, edge2, edge3, edge4, edge5].forEach(edge => {
      this.gameManager.addEdge(edge);
    });
    
    // Renderizar el grafo inicial
    this.renderGraph();
  }

  /**
   * Renderiza el grafo completo
   */
  private renderGraph(): void {
    // Renderizar aristas
    for (const edge of this.gameManager.getAllEdges()) {
      this.renderEdge(edge);
    }
    
    // Renderizar nodos
    for (const node of this.gameManager.getAllNodes()) {
      this.renderNode(node);
    }
  }

  /**
   * Renderiza un nodo
   */
  private renderNode(node: Node): void {
    const graphics = this.add.graphics();
    const radius = 30;
    const color = this.getNodeColor(node);
    
    // Dibujar círculo del nodo
    graphics.fillStyle(color, 1);
    graphics.fillCircle(node.position.x, node.position.y, radius);
    
    // Borde
    graphics.lineStyle(3, 0x000000, 1);
    graphics.strokeCircle(node.position.x, node.position.y, radius);
    
    // Texto del tipo de nodo
    const typeText = this.add.text(
      node.position.x,
      node.position.y - 50,
      this.getNodeTypeLabel(node.type),
      {
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 2 },
      }
    ).setOrigin(0.5);
    
    // Texto de energía
    const energyText = this.add.text(
      node.position.x,
      node.position.y,
      `${Math.floor(node.energyPool)}`,
      {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      }
    ).setOrigin(0.5);
    
    // Hacer el nodo interactivo
    const hitArea = new Phaser.Geom.Circle(node.position.x, node.position.y, radius);
    graphics.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
    
    graphics.on('pointerover', () => {
      this.hoveredNode = node;
      graphics.lineStyle(5, 0xffff00, 1);
      graphics.strokeCircle(node.position.x, node.position.y, radius);
    });
    
    graphics.on('pointerout', () => {
      this.hoveredNode = null;
      graphics.lineStyle(3, 0x000000, 1);
      graphics.strokeCircle(node.position.x, node.position.y, radius);
    });
    
    graphics.on('pointerdown', () => {
      this.onNodeClick(node);
    });
    
    this.nodeGraphics.set(node.id, graphics);
  }

  /**
   * Renderiza una arista
   */
  private renderEdge(edge: Edge): void {
    const graphics = this.add.graphics();
    
    graphics.lineStyle(4, 0x666666, 0.5);
    graphics.beginPath();
    graphics.moveTo(edge.nodeA.position.x, edge.nodeA.position.y);
    graphics.lineTo(edge.nodeB.position.x, edge.nodeB.position.y);
    graphics.strokePath();
    
    this.edgeGraphics.set(edge.id, graphics);
  }

  /**
   * Actualiza la visualización de un nodo
   */
  private updateNodeVisual(nodeId: string | number): void {
    const node = this.gameManager.getNode(nodeId);
    if (!node) return;
    
    const graphics = this.nodeGraphics.get(nodeId);
    if (!graphics) return;
    
    // Redibujar el nodo con el nuevo color
    graphics.clear();
    const radius = 30;
    const color = this.getNodeColor(node);
    
    graphics.fillStyle(color, 1);
    graphics.fillCircle(node.position.x, node.position.y, radius);
    graphics.lineStyle(3, 0x000000, 1);
    graphics.strokeCircle(node.position.x, node.position.y, radius);
  }

  /**
   * Actualiza la visualización completa
   */
  private updateVisualization(): void {
    // Actualizar textos de energía de cada nodo
    for (const node of this.gameManager.getAllNodes()) {
      // TODO: Actualizar textos de energía
    }
    
    // Renderizar paquetes de energía en las aristas
    this.renderEnergyPackets();
  }

  /**
   * Renderiza los paquetes de energía
   */
  private renderEnergyPackets(): void {
    // Limpiar paquetes anteriores
    for (const graphics of this.packetGraphics.values()) {
      graphics.destroy();
    }
    this.packetGraphics.clear();
    
    // Renderizar paquetes actuales
    for (const edge of this.gameManager.getAllEdges()) {
      for (const packet of edge.energyPackets) {
        const graphics = this.add.graphics();
        
        // Calcular posición interpolada
        const x = Phaser.Math.Linear(
          packet.origin.position.x,
          packet.target.position.x,
          packet.progress
        );
        const y = Phaser.Math.Linear(
          packet.origin.position.y,
          packet.target.position.y,
          packet.progress
        );
        
        // Color según el dueño
        const color = packet.owner.id === 'player1' ? 0x00ff00 : 0xff0000;
        
        graphics.fillStyle(color, 1);
        graphics.fillCircle(x, y, 5);
        
        this.packetGraphics.set(packet.id, graphics);
      }
    }
  }

  /**
   * Obtiene el color de un nodo según su dueño y tipo
   */
  private getNodeColor(node: Node): number {
    if (!node.owner) {
      return 0x888888; // Neutral: gris
    }
    
    // Color según jugador
    return node.owner.id === 'player1' ? 0x0088ff : 0xff4444;
  }

  /**
   * Obtiene la etiqueta del tipo de nodo
   */
  private getNodeTypeLabel(type: NodeType): string {
    const labels: Record<NodeType, string> = {
      [NodeType.BASIC]: 'BASIC',
      [NodeType.ATTACK]: 'ATTACK',
      [NodeType.DEFENSE]: 'DEFENSE',
      [NodeType.ENERGY]: 'ENERGY',
      [NodeType.SUPER_ENERGY]: 'SUPER',
      [NodeType.NEUTRAL]: 'NEUTRAL',
    };
    return labels[type] || 'UNKNOWN';
  }

  /**
   * Maneja el click en un nodo
   */
  private onNodeClick(node: Node): void {
    console.log('Node clicked:', node.id, node.type);
    this.selectedNode = node;
    
    // TODO: Implementar lógica de selección y asignación de energía
  }

  /**
   * Configura el input del usuario
   */
  private setupInput(): void {
    // Tecla P para pausar
    this.input.keyboard?.on('keydown-P', () => {
      this.gameManager.pauseGame();
    });
    
    // Tecla R para reanudar
    this.input.keyboard?.on('keydown-R', () => {
      this.gameManager.resumeGame();
    });
    
    // Tecla ESC para volver al menú
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MainMenu');
    });
  }

  /**
   * Crea la UI del juego
   */
  private createUI(): void {
    // Título
    this.add.text(10, 10, 'NEXA - RTS on Graphs', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    
    // Instrucciones
    this.add.text(10, 50, 'Controls: P=Pause | R=Resume | ESC=Menu', {
      fontSize: '14px',
      color: '#ffffff',
    });
    
    // Timer
    const timerText = this.add.text(10, 80, 'Time: 0:00', {
      fontSize: '16px',
      color: '#ffffff',
    });
    this.uiTexts.set('timer', timerText);
    
    // Player stats
    const player1Stats = this.add.text(10, 110, 'Player 1: 0 nodes', {
      fontSize: '14px',
      color: '#0088ff',
    });
    this.uiTexts.set('player1Stats', player1Stats);
    
    const player2Stats = this.add.text(10, 130, 'Player 2: 0 nodes', {
      fontSize: '14px',
      color: '#ff4444',
    });
    this.uiTexts.set('player2Stats', player2Stats);
  }

  /**
   * Muestra la pantalla de Game Over
   */
  private showGameOver(winner: string | null, reason: string): void {
    const bg = this.add.rectangle(400, 300, 400, 200, 0x000000, 0.8);
    
    this.add.text(400, 250, 'GAME OVER', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    this.add.text(400, 300, `Winner: ${winner || 'None'}`, {
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    this.add.text(400, 330, `Reason: ${reason}`, {
      fontSize: '16px',
      color: '#888888',
    }).setOrigin(0.5);
    
    this.add.text(400, 370, 'Press ESC to return to menu', {
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5);
  }

  shutdown(): void {
    // Limpiar suscripciones de eventos
    this.gameManager.getEventEmitter().clear();
  }
}
