import { GameFactory } from '@/presentation/game/game-factory';
import { Scene } from 'phaser';
import type { GameController } from '@/presentation/game/game-controller';
import { NodeType } from '@/core/types/node-type';
import type { Node } from '@/core/entities/node/node';
import type { Edge } from '@/core/entities/edge';
import type { Graph } from '@/core/entities/graph';
import { EnergyCommandService } from '@/application/services/energy-command-service';
import { AIControllerService } from '@/application/services/ai-controller.service';
import { GraphService } from '@/application/services/graph/graph-service';
import { UuidGenerator } from '@/application/services/helpers/uuid-generator';
import { LoggerFactory } from '@/application/logging/logger-factory';
import type { Player } from '@/core/entities/player';

enum GamePhase {
  WAITING_PLAYER_SELECTION = 'WAITING_PLAYER_SELECTION',
  WAITING_AI_SELECTION = 'WAITING_AI_SELECTION',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export class GameScene extends Scene {
  private camera?: Phaser.Cameras.Scene2D.Camera;
  private gameController: GameController | null = null;
  private energyCommandService: EnergyCommandService | null = null;
  private aiControllerService: AIControllerService | null = null;
  private currentPlayer: Player | null = null;
  private allPlayers: Player[] = [];
  private gameGraph: Graph | null = null;

  // Game state
  private gamePhase: GamePhase = GamePhase.WAITING_PLAYER_SELECTION;
  private playerSelectedNodeId: string | null = null;
  private aiSelectedNodeId: string | null = null;
  private victoryHandled = false;
  private redistributionMode = false;
  private redistributionSourceNode: Node | null = null;

  // UI
  private statsText?: Phaser.GameObjects.Text;
  private timerText?: Phaser.GameObjects.Text;
  private energyText?: Phaser.GameObjects.Text;
  private selectionText?: Phaser.GameObjects.Text;
  private phaseText?: Phaser.GameObjects.Text;
  private resetButton?: Phaser.GameObjects.Text;

  // Visual
  private nodeGraphics = new Map<string, Phaser.GameObjects.Container>();
  private connectionGraphics = new Map<string, Phaser.GameObjects.Graphics>();
  private nodePositions = new Map<string, { x: number; y: number }>();
  private packetGraphics = new Map<string, Phaser.GameObjects.Graphics>();
  private edgeAssignmentTexts = new Map<string, Phaser.GameObjects.Text>();

  // Selection
  private selectedNode: Node | null = null;

  constructor() {
    super('GameScene');
  }

  init() {
    console.log('[Game] Scene init - resetting state...');

    // Reset all state variables to initial values
    this.gamePhase = GamePhase.WAITING_PLAYER_SELECTION;
    this.playerSelectedNodeId = null;
    this.aiSelectedNodeId = null;
    this.victoryHandled = false;
    this.redistributionMode = false;
    this.redistributionSourceNode = null;
    this.selectedNode = null;
    this.currentPlayer = null;
    this.allPlayers = [];
    this.gameGraph = null;
    this.gameController = null;
    this.energyCommandService = null;
    this.aiControllerService = null;

    // Clear visual maps
    this.nodeGraphics.clear();
    this.connectionGraphics.clear();
    this.packetGraphics.clear();
    this.edgeAssignmentTexts.clear();
    this.nodePositions.clear();
  }

  create() {
    const { width, height } = this.scale;

    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x001122);

    // Desactivar menú contextual del navegador
    this.input.mouse?.disableContextMenu();

    this.createBackground();
    this.createStars();
    this.createGrid();
    this.createHUD();
    this.generateRandomGraph();
    this.setupInputHandlers();

    const centerX = width / 2;
    const centerY = height / 2;
    const startText = this.add.text(
      centerX,
      centerY,
      'NEXA - Estrategia de Generadores de Energía\n\n'
      + 'Cómo funciona:\n'
      + '1. Selecciona nodo y CLIC en arista: +10 energía\n'
      + '2. CTRL+CLIC en arista: -10 energía\n'
      + '3. CLIC en arista SIN nodo: quita energía asignada\n'
      + '4. Los nodos GENERAN paquetes cada 1 segundo\n'
      + '5. ¡Capturar nodo → Energía asignada se transfiere!\n'
      + '6. Defensa = Pool - Asignado (se regenera cada 1.5s)\n\n'
      + '¡Los nodos son GENERADORES INFINITOS!\n\n'
      + 'Haz clic en cualquier nodo neutral para empezar',
      {
        fontFamily: 'Orbitron, monospace',
        fontSize: '14px',
        color: '#00ffff',
        align: 'center',
        backgroundColor: '#000000cc',
        padding: { x: 20, y: 20 },
      },
    ).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: startText,
      alpha: 1,
      duration: 1000,
      yoyo: true,
      hold: 5000,
      onComplete: () => startText.destroy(),
    });
  }

  private createBackground(): void {
    const { width, height } = this.scale;
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x000511, 0x000511, 0x001122, 0x001122, 1, 1, 1, 1);
    graphics.fillRect(0, 0, width, height);
  }

  private createStars(): void {
    const { width, height } = this.scale;
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.FloatBetween(0.5, 2);
      const alpha = Phaser.Math.FloatBetween(0.3, 0.9);
      const star = this.add.circle(x, y, size, 0xffffff, alpha);
      this.tweens.add({
        targets: star,
        alpha: alpha * 0.3,
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private createGrid(): void {
    const { width, height } = this.scale;
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x004466, 0.3);
    const gridSpacing = 50;
    for (let x = 0; x < width; x += gridSpacing) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += gridSpacing) {
      graphics.lineBetween(0, y, width, y);
    }
    this.tweens.add({
      targets: graphics,
      alpha: 0.15,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createHUD(): void {
    const { width, height } = this.scale;

    const topBar = this.add.graphics();
    topBar.fillStyle(0x001122, 0.8);
    topBar.fillRect(0, 0, width, 80);

    this.statsText = this.add.text(20, 15, 'Esperando jugadores...', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '16px',
      color: '#00ffff',
      lineSpacing: 5,
    });

    const centerX = width / 2;
    this.timerText = this.add.text(centerX, 20, 'TIEMPO: 3:00', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '24px',
      color: '#ffaa00',
    }).setOrigin(0.5, 0);

    this.energyText = this.add.text(width - 20, 20, 'ENERGÍA: 0', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '18px',
      color: '#00ff88',
    }).setOrigin(1, 0);

    const bottomBar = this.add.graphics();
    bottomBar.fillStyle(0x001122, 0.8);
    bottomBar.fillRect(0, height - 100, width, 100);

    this.phaseText = this.add.text(
      centerX,
      height - 75,
      'SELECCIONA TU NODO BASE',
      {
        fontFamily: 'Orbitron, monospace',
        fontSize: '16px',
        color: '#ffaa00',
      },
    ).setOrigin(0.5);

    // this.add.text(
    //   centerX,
    //   height - 50,
    //   'GENERADORES (infinitos) | Capturar → Energía asignada se transfiere | Defensa = Pool - Asignado',
    //   {
    //     fontFamily: 'Orbitron, monospace',
    //     fontSize: '11px',
    //     color: '#888888',
    //   },
    // ).setOrigin(0.5);

    this.selectionText = this.add.text(centerX, height - 50, '', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5);

    // Reset button
    // Menu button
    const menuButton = this.add.text(width - 140, height - 25, 'MENÚ (ESC)', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '14px',
      color: '#ffaa00',
    }).setOrigin(1, 0.5).setInteractive();

    menuButton.on('pointerdown', () => this.scene.start('MainMenuScene'));
    menuButton.on('pointerover', () => menuButton.setColor('#ff8800'));
    menuButton.on('pointerout', () => menuButton.setColor('#ffaa00'));

    this.resetButton = this.add.text(width - 20, height - 25, 'REINICIAR (R)', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '14px',
      color: '#ff6666',
    }).setOrigin(1, 0.5).setInteractive();

    this.resetButton.on('pointerdown', () => this.resetGame());
    this.resetButton.on('pointerover', () => this.resetButton?.setColor('#ff0000'));
    this.resetButton.on('pointerout', () => this.resetButton?.setColor('#ff6666'));
  }

  private generateRandomGraph(): void {
    const idGenerator = new UuidGenerator();
    const logger = LoggerFactory.create();
    const graphService = new GraphService(idGenerator, logger);

    // Generate 8-12 nodes
    const nodeCount = Phaser.Math.Between(8, 12);
    this.gameGraph = graphService.generateRandomGraph(nodeCount);

    // Map positions for rendering
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;

    const nodes = Array.from(this.gameGraph.nodes);
    nodes.forEach((node, i) => {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radiusVariation = Phaser.Math.FloatBetween(0.8, 1.2);
      const x = centerX + Math.cos(angle) * radius * radiusVariation;
      const y = centerY + Math.sin(angle) * radius * radiusVariation;

      this.nodePositions.set(String(node.id), { x, y });
    });

    // Sincronizar lengths de aristas con distancias visuales reales
    this.synchronizeEdgeLengths();

    this.renderInitialGraph();
  }

  /**
   * Sincroniza el length lógico de cada arista con la distancia visual real
   * entre los nodos en el canvas. Esto asegura que los paquetes de energía
   * viajen a velocidad visual constante.
   *
   * Aplica una escala para que las distancias lógicas sean más pequeñas
   * y los paquetes viajen más rápido (visualmente ~2-3 segundos).
   */
  private synchronizeEdgeLengths(): void {
    if (!this.gameGraph) return;

    // Factor de escala: reduce las distancias en píxeles a valores lógicos más pequeños
    // Un factor de 0.3 hace que distancias de ~300px se conviertan en ~90 lógicos
    // Con velocidad de 0.0003, esto resulta en ~2-3 segundos de viaje
    const DISTANCE_SCALE = 0.01;

    this.gameGraph.edges.forEach((edge) => {
      const [nodeA, nodeB] = edge.endpoints;
      const posA = this.nodePositions.get(String(nodeA.id));
      const posB = this.nodePositions.get(String(nodeB.id));

      if (posA && posB) {
        // Calcular distancia euclidiana real
        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;
        const visualDistance = Math.sqrt(dx * dx + dy * dy);

        // Aplicar escala para reducir la distancia lógica
        const scaledDistance = visualDistance * DISTANCE_SCALE;

        // Actualizar el length de la arista con la distancia escalada
        edge.length = scaledDistance;
      }
    });

    console.log('[Game] Edge lengths synchronized with visual distances (scaled)');
  }

  private renderInitialGraph(): void {
    if (!this.gameGraph) return;

    // Render edges
    this.gameGraph.edges.forEach((edge) => {
      const [nodeA, nodeB] = edge.endpoints;
      const posA = this.nodePositions.get(String(nodeA.id));
      const posB = this.nodePositions.get(String(nodeB.id));
      if (!posA || !posB) return;

      const edgeId = String(edge.id);
      const graphics = this.add.graphics();
      graphics.lineStyle(2, 0x004466, 0.6);
      graphics.lineBetween(posA.x, posA.y, posB.x, posB.y);
      this.connectionGraphics.set(edgeId, graphics);
    });

    // Render nodes
    this.gameGraph.nodes.forEach((node) => {
      this.renderInitialNode(node);
    });
  }

  private renderInitialNode(node: Node): void {
    const pos = this.nodePositions.get(String(node.id));
    if (!pos) return;

    const container = this.add.container(pos.x, pos.y);
    this.nodeGraphics.set(String(node.id), container);

    const color = 0x888888; // Gris para neutrales
    const label = node.name; // Usar nombre del nodo

    const radius = 30;
    const circle = this.add.circle(0, 0, radius, color, 0.6);
    const border = this.add.circle(0, 0, radius + 2, color, 0).setStrokeStyle(2, color, 1);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '20px',
      color: '#fff',
    }).setOrigin(0.5);
    const energyText = this.add.text(0, radius + 15, Math.floor(node.energyPool).toString(), {
      fontFamily: 'Orbitron, monospace',
      fontSize: '14px',
      color: '#00ff88',
    }).setOrigin(0.5);

    // Agregar símbolo especial para nodos especiales
    const symbol = this.getNodeSymbol(node.nodeType, color);
    if (symbol) {
      container.add(symbol);
    }

    container.add([circle, border, text, energyText]);
  }

  private setupInputHandlers(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.gamePhase === GamePhase.WAITING_PLAYER_SELECTION) {
        this.handlePlayerNodeSelection(pointer);
      }
      else if (this.gamePhase === GamePhase.PLAYING) {
        this.handleGameplayInput(pointer);
      }
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.gamePhase !== GamePhase.GAME_OVER) {
        this.scene.start('MainMenuScene');
      }
    });
    this.input.keyboard?.on('keydown-R', () => {
      if (this.gamePhase !== GamePhase.GAME_OVER) {
        this.resetGame();
      }
    });
    this.input.keyboard?.on('keydown-C', () => {
      if (this.gamePhase === GamePhase.PLAYING) {
        this.selectedNode = null;
        this.redistributionMode = false;
        this.redistributionSourceNode = null;
        this.selectionText?.setText('');
      }
    });
  }

  private handlePlayerNodeSelection(pointer: Phaser.Input.Pointer): void {
    const clickedNodeId = this.findClickedNode(pointer.x, pointer.y);
    if (!clickedNodeId) return;

    // Player selects their initial node
    this.playerSelectedNodeId = clickedNodeId;
    this.highlightSelectedNode(clickedNodeId, 0x00ffff);
    this.selectionText?.setText(`You selected ${clickedNodeId} as your base!`);
    this.phaseText?.setText('WAITING FOR AI...');

    // AI selects automatically
    setTimeout(() => this.aiSelectNode(), 500);
  }

  private aiSelectNode(): void {
    if (!this.gameGraph) return;

    // AI picks random node different from player
    const availableNodes = Array.from(this.gameGraph.nodes).filter(
      n => String(n.id) !== this.playerSelectedNodeId,
    );

    if (availableNodes.length === 0) return;

    const aiNode = Phaser.Utils.Array.GetRandom(availableNodes);
    this.aiSelectedNodeId = String(aiNode.id);
    this.highlightSelectedNode(this.aiSelectedNodeId, 0xff00ff);

    this.gamePhase = GamePhase.WAITING_AI_SELECTION;
    this.phaseText?.setText('STARTING GAME...');

    // Start the game
    setTimeout(() => this.initializeGameWithSelections(), 1000);
  }

  private highlightSelectedNode(nodeId: string, color: number): void {
    const container = this.nodeGraphics.get(nodeId);
    if (!container) return;

    const radius = 30;
    const border = this.add.circle(0, 0, radius + 4, color, 0).setStrokeStyle(4, color, 1);

    container.add([border]);
  }

  private initializeGameWithSelections(): void {
    if (!this.gameGraph || !this.playerSelectedNodeId || !this.aiSelectedNodeId) return;

    console.log('[Game] Inicializando juego con selecciones...');

    // No need to manually update graph nodes here, GameFactory.assignInitialNodes will do it
    // based on playerConfigs.

    const playersConfig = [
      {
        id: 'player-1',
        username: 'Jugador 1',
        color: '#00ffff',
        initialNodeId: this.playerSelectedNodeId,
      },
      {
        id: 'player-2',
        username: 'Jugador IA',
        color: '#ff00ff',
        initialNodeId: this.aiSelectedNodeId,
      },
    ];

    try {
      const factory = GameFactory.getInstance();
      const result = factory.createGame(playersConfig, this.gameGraph);

      this.gameController = result.gameController;
      this.currentPlayer = result.players[0];
      this.allPlayers = result.players;
      this.gameGraph = result.graph;
      this.energyCommandService = new EnergyCommandService();
      this.aiControllerService = new AIControllerService();

      // Sincronizar edge lengths con distancias visuales antes de empezar
      this.synchronizeEdgeLengths();

      if (this.gameController) {
        // Setup victory callback before starting
        this.gameController.setOnVictory((victoryResult) => {
          this.handleVictoryFromController(victoryResult);
        });
        this.gameController.startGame(result.gameState);
      }
      console.log('[Game] Game started with', result.graph.nodes.size, 'nodes');

      this.gamePhase = GamePhase.PLAYING;
      this.phaseText?.setText('JUEGO EN PROGRESO');
      this.selectionText?.setText('Selecciona tus nodos y asigna energía a las aristas');

      // Render initial state
      result.graph.nodes.forEach((node: Node) => this.renderNode(node));
      result.graph.edges.forEach((edge: Edge) => this.renderConnection(edge));
    }
    catch (error) {
      console.error('[Game] Failed to initialize:', error);
      this.selectionText?.setText(`Error: ${error}`);
    }
  }

  private handleGameplayInput(pointer: Phaser.Input.Pointer): void {
    const gameState = this.gameController?.getGameState();
    if (!gameState) return;

    const clickedNodeId = this.findClickedNode(pointer.x, pointer.y);
    if (clickedNodeId) {
      // Explicitly cast/type to avoid 'unknown' error
      const nodes: Node[] = Array.from(gameState.graph.nodes);
      const node = nodes.find(n => String(n.id) === clickedNodeId);
      if (node) {
        // SHIFT + Click = redistribution mode
        if (pointer.event.shiftKey && node.owner?.id === this.currentPlayer?.id) {
          this.handleRedistributionClick(node);
        }
        else {
          this.handleNodeClick(node);
        }
        return;
      }
    }

    // Buscar clic en arista (con o sin nodo seleccionado)
    const clickedEdge = this.findClickedEdge(pointer.x, pointer.y, gameState);
    if (clickedEdge) {
      // CTRL + Clic = quitar energía (equivalente a clic derecho)
      const isRemoveAction = pointer.event.ctrlKey;
      this.handleEdgeClick(clickedEdge, isRemoveAction);
    }
  }

  private findClickedNode(x: number, y: number): string | null {
    let clickedNodeId: string | null = null;
    let minDist = 35;

    this.nodePositions.forEach((pos, nodeId) => {
      const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        clickedNodeId = nodeId;
      }
    });

    return clickedNodeId;
  }

  private findClickedEdge(x: number, y: number, gameState: any): Edge | null {
    let clickedEdge: Edge | null = null;
    let minDist = 15;

    gameState.graph.edges.forEach((edge: Edge) => {
      const [nodeA, nodeB] = edge.endpoints;
      const posA = this.nodePositions.get(String(nodeA.id));
      const posB = this.nodePositions.get(String(nodeB.id));
      if (!posA || !posB) return;

      const dist = this.distanceToSegment({ x, y }, posA, posB);
      if (dist < minDist) {
        minDist = dist;
        clickedEdge = edge;
      }
    });

    return clickedEdge;
  }

  private distanceToSegment(
    p: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number },
  ): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = dx * dx + dy * dy;
    if (len === 0) return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len));
    const projX = a.x + t * dx;
    const projY = a.y + t * dy;
    return Math.sqrt((p.x - projX) ** 2 + (p.y - projY) ** 2);
  }

  private handleNodeClick(node: Node): void {
    if (!this.currentPlayer) return;
    if (node.owner?.id === this.currentPlayer.id) {
      this.selectedNode = node;
      this.redistributionMode = false;
      this.redistributionSourceNode = null;
      const defense = node.defenseEnergy();
      this.selectionText?.setText(
        `Generador: ${node.name} | Capacidad: ${Math.floor(node.energyPool)} | Defensa: ${Math.floor(defense)}`,
      );
    }
    else {
      this.selectedNode = null;
      this.selectionText?.setText('Cannot select enemy/neutral node');
    }
  }

  private handleRedistributionClick(node: Node): void {
    if (!this.currentPlayer || !this.energyCommandService) return;

    if (!this.redistributionMode) {
      // First click: select source node
      this.redistributionMode = true;
      this.redistributionSourceNode = node;
      this.selectedNode = null;
      this.selectionText?.setText(
        `GENERADOR: ${node.name} (${Math.floor(node.energyPool)} capacidad) - SHIFT+Clic en destino para flujo continuo`,
      );
    }
    else {
      // Second click: assign energy to edge leading to target
      if (!this.redistributionSourceNode) return;

      // Find edge connecting the two nodes
      const edge = Array.from(this.redistributionSourceNode.edges).find(e => e.hasNode(node));

      if (!edge) {
        this.selectionText?.setText('Nodes are not connected!');
        this.redistributionMode = false;
        this.redistributionSourceNode = null;
        return;
      }

      // Usar transferencia especial entre aliados (un solo paquete de 10)
      const result = this.energyCommandService.transferEnergyBetweenAllies(
        this.currentPlayer,
        this.redistributionSourceNode,
        node,
        edge,
        10, // Un paquete único de 10 energía
      );

      if (result.success) {
        this.selectionText?.setText(
          `Energy transfer: ${this.redistributionSourceNode.id} → ${node.id} (10 energy sent)`,
        );
      }
      else {
        this.selectionText?.setText(`Error: ${result.error}`);
      }

      // Reset redistribution mode
      this.redistributionMode = false;
      this.redistributionSourceNode = null;
    }
  }

  private handleEdgeClick(edge: Edge, isRemoveAction: boolean): void {
    if (!this.currentPlayer || !this.energyCommandService) return;

    const amount = 10;
    const [nodeA, nodeB] = edge.endpoints;

    // CASO 1: Sin nodo seleccionado - quitar energía asignada de cualquier extremo
    if (!this.selectedNode) {
      // Buscar cuál extremo tiene energía asignada del jugador actual
      const nodeAOwned = nodeA.owner?.id === this.currentPlayer.id;
      const nodeBOwned = nodeB.owner?.id === this.currentPlayer.id;
      const assignmentA = nodeAOwned ? nodeA.getAssignedEnergy(edge) : 0;
      const assignmentB = nodeBOwned ? nodeB.getAssignedEnergy(edge) : 0;

      if (assignmentA > 0) {
        // Quitar energía del nodo A
        const result = this.energyCommandService.removeEnergyFromEdge(
          this.currentPlayer,
          nodeA,
          edge,
          amount,
        );

        if (result.success) {
          const remaining = nodeA.getAssignedEnergy(edge);
          this.selectionText?.setText(
            `Energía devuelta: -${amount} desde ${nodeA.name} | Asignado restante: ${remaining}`,
          );
        }
        else {
          this.selectionText?.setText(`Error: ${result.error}`);
        }
        return;
      }

      if (assignmentB > 0) {
        // Quitar energía del nodo B
        const result = this.energyCommandService.removeEnergyFromEdge(
          this.currentPlayer,
          nodeB,
          edge,
          amount,
        );

        if (result.success) {
          const remaining = nodeB.getAssignedEnergy(edge);
          this.selectionText?.setText(
            `Energía devuelta: -${amount} desde ${nodeB.name} | Asignado restante: ${remaining}`,
          );
        }
        else {
          this.selectionText?.setText(`Error: ${result.error}`);
        }
        return;
      }

      // Si no hay energía asignada, informar al jugador
      this.selectionText?.setText('Esta arista no tiene energía asignada');
      return;
    }

    // CASO 2: Con nodo seleccionado - comportamiento original
    // Detectar si el otro extremo de la arista es un nodo aliado
    const targetNode = edge.flipSide(this.selectedNode);
    const isAllyTransfer = !isRemoveAction
      && targetNode.owner?.id === this.currentPlayer.id;

    if (isAllyTransfer) {
      // Usar transferencia especial entre aliados (un solo paquete)
      const result = this.energyCommandService.transferEnergyBetweenAllies(
        this.currentPlayer,
        this.selectedNode,
        targetNode,
        edge,
        amount,
      );

      if (result.success) {
        this.selectionText?.setText(
          `Transferencia: ${this.selectedNode.name} → ${targetNode.name} (${amount} energía enviada)`,
        );
      }
      else {
        this.selectionText?.setText(`Error: ${result.error}`);
      }
    }
    else {
      // Asignación normal de ataque o remoción
      const result = isRemoveAction
        ? this.energyCommandService.removeEnergyFromEdge(
            this.currentPlayer,
            this.selectedNode,
            edge,
            amount,
          )
        : this.energyCommandService.assignEnergyToEdge(
            this.currentPlayer,
            this.selectedNode,
            edge,
            amount,
          );

      if (result.success) {
        const assignment = this.selectedNode.getAssignedEnergy(edge);
        const defense = this.selectedNode.defenseEnergy();
        this.selectionText?.setText(
          `${isRemoveAction ? '-' : '+'}${amount} → Flujo: ${assignment}/s | Pool: ${Math.floor(this.selectedNode.energyPool)} | Defensa: ${Math.floor(defense)}`,
        );
      }
      else {
        this.selectionText?.setText(`Error: ${result.error}`);
      }
    }
  }

  update(_time: number, delta: number): void {
    if (this.gamePhase === GamePhase.PLAYING) {
      // Update game controller logic
      if (this.gameController) {
        this.gameController.update(delta);
      }

      // Run game logic (victory now handled by controller callback)
      this.updateAI();
      this.updateHUD();
      this.updateVisuals();
    }
    else if (this.gamePhase === GamePhase.GAME_OVER) {
      // Keep rendering final state frozen
      this.updateVisuals();
      // Keep HUD showing final stats
      this.updateHUD();
    }
  }

  private handleVictoryFromController(victoryResult: any): void {
    if (this.victoryHandled) return;
    this.victoryHandled = true;

    console.log('[Game] Victory detected by controller:', victoryResult);

    // CRITICAL: Capture stats IMMEDIATELY before anything else changes state
    const gameState = this.gameController?.getGameState();
    let p1Nodes = 0;
    let p2Nodes = 0;
    if (gameState) {
      console.log('[Game] Total nodes in graph:', gameState.graph.nodes.size);
      const allNodes = Array.from(gameState.graph.nodes);
      allNodes.forEach((n) => {
        console.log(`[Game] Node ${n.id}: owner=${n.owner?.id || 'neutral'}`);
      });

      p1Nodes = allNodes.filter(n => n.owner?.id === 'player-1').length;
      p2Nodes = allNodes.filter(n => n.owner?.id === 'player-2').length;
      console.log('[Game] Final stats captured - P1:', p1Nodes, 'nodes, P2:', p2Nodes, 'nodes');
    }
    else {
      console.error('[Game] ERROR: gameState is null when trying to capture stats!');
    }

    // Determine winner name
    const winnerName = victoryResult.winner
      ? victoryResult.winner.username
      : 'EMPATE';
    const winnerId = victoryResult.winner ? victoryResult.winner.id : 'none';

    // Change phase to stop all game logic
    this.gamePhase = GamePhase.GAME_OVER;

    // Update phase text immediately
    this.phaseText?.setText(`FIN DEL JUEGO - ${winnerName}`);

    // Transition to GameOverScene after delay with captured stats
    this.time.delayedCall(2000, () => {
      console.log('[Game] Transitioning to GameOverScene with stats - P1:', p1Nodes, 'P2:', p2Nodes);

      // Finalize and cleanup game state now that we're transitioning
      if (this.gameController) {
        console.log('[Game] Calling finalizeGame to cleanup...');
        this.gameController.finalizeGame();
      }

      this.scene.start('GameOverScene', {
        winner: winnerName,
        winnerId: winnerId,
        p1Nodes,
        p2Nodes,
        reason: victoryResult.reason,
      });
    });
  }

  private updateAI(): void {
    if (!this.aiControllerService || !this.gameGraph) {
      return;
    }

    // Only run AI during playing phase, not after game over
    if (this.gamePhase !== GamePhase.PLAYING) {
      return;
    }

    const aiPlayer = this.allPlayers.find(p => p.id === 'player-2');
    if (aiPlayer && !aiPlayer.isEliminated) {
      try {
        this.aiControllerService.executeAITurn(aiPlayer, Date.now());
      }
      catch (error) {
        console.error('[Game] AI error:', error);
      }
    }
  }

  private updateHUD(): void {
    if (!this.gameController) return;
    const snapshot = this.gameController.getSnapshot();
    if (!snapshot) return;

    // Only update timer if game is playing
    if (this.gamePhase === GamePhase.PLAYING) {
      const timeRemaining = Math.max(0, 180 - snapshot.elapsedTime / 1000);
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = Math.floor(timeRemaining % 60);
      this.timerText?.setText(`TIEMPO: ${minutes}:${seconds.toString().padStart(2, '0')}`);
    }

    const gameState = this.gameController.getGameState();
    if (gameState) {
      const totalNodes = gameState.graph.nodes.size;
      const p1Nodes = Array.from(gameState.graph.nodes).filter(
        n => n.owner?.id === 'player-1',
      ).length;
      const p2Nodes = Array.from(gameState.graph.nodes).filter(
        n => n.owner?.id === 'player-2',
      ).length;

      const p1Percent = totalNodes > 0 ? Math.floor((p1Nodes / totalNodes) * 100) : 0;
      const p2Percent = totalNodes > 0 ? Math.floor((p2Nodes / totalNodes) * 100) : 0;

      let statsText = `P1: ${p1Percent}% (${p1Nodes}) | P2: ${p2Percent}% (${p2Nodes})`;

      // Mostrar contador de dominancia si algún jugador supera el 70%
      if (this.gameController && (p1Percent >= 70 || p2Percent >= 70)) {
        const victoryService = this.gameController.getVictoryService();

        if (p1Percent >= 70) {
          const dominanceTime = victoryService.getDominanceTime('player-1');
          const remainingTime = Math.max(0, 10 - dominanceTime / 1000);
          statsText += `\n⚠️  P1 DOMINANDO: ${remainingTime.toFixed(1)}s`;
        }

        if (p2Percent >= 70) {
          const dominanceTime = victoryService.getDominanceTime('player-2');
          const remainingTime = Math.max(0, 10 - dominanceTime / 1000);
          statsText += `\n⚠️  P2 DOMINANDO: ${remainingTime.toFixed(1)}s`;
        }
      }

      this.statsText?.setText(statsText);

      if (this.currentPlayer) {
        const totalEnergy = Array.from(gameState.graph.nodes)
          .filter(n => n.owner?.id === this.currentPlayer?.id)
          .reduce((sum, n) => sum + n.energyPool, 0);

        this.energyText?.setText(`ENERGÍA TOTAL: ${Math.floor(totalEnergy)}`);
      }
    }
  }

  private updateVisuals(): void {
    const gameState = this.gameController?.getGameState();
    if (!gameState) return;

    try {
      // Always render all nodes, even after game over
      gameState.graph.nodes.forEach(node => this.renderNode(node));
      gameState.graph.edges.forEach((edge) => {
        this.renderConnection(edge);
        this.renderEnergyPackets(edge);
      });
    }
    catch (error) {
      console.error('[Game] Visual update error:', error);
    }
  }

  private renderNode(node: Node): void {
    const pos = this.nodePositions.get(String(node.id));
    if (!pos) return;

    let container = this.nodeGraphics.get(String(node.id));
    if (!container) {
      container = this.add.container(pos.x, pos.y);
      this.nodeGraphics.set(String(node.id), container);
    }

    container.removeAll(true);

    let color = 0x888888;
    const label = node.name; // Siempre usar el nombre del nodo

    if (node.isNeutral()) {
      color = 0x888888; // Gris para todos los neutrales
    }
    else if (node.owner?.id === 'player-1') {
      color = 0x00ffff;
    }
    else if (node.owner?.id === 'player-2') {
      color = 0xff00ff;
    }

    const radius = 30;
    const circle = this.add.circle(0, 0, radius, color, 0.8);
    const border = this.add.circle(0, 0, radius + 2, color, 0).setStrokeStyle(2, color, 1);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '20px',
      color: '#fff',
    }).setOrigin(0.5);

    // Mostrar energía en formato "defensa/pool" para nodos con dueño, solo pool para neutrales
    let energyDisplayText = Math.floor(node.energyPool).toString();
    if (!node.isNeutral()) {
      const defense = Math.floor(node.defenseEnergy());
      const pool = Math.floor(node.energyPool);
      energyDisplayText = `${defense}/${pool}`;
    }

    const energyText = this.add.text(0, radius + 15, energyDisplayText, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '12px',
      color: '#00ff88',
    }).setOrigin(0.5);

    // Agregar símbolo especial para nodos especiales
    const symbol = this.getNodeSymbol(node.nodeType, color);
    if (symbol) {
      container.add(symbol);
    }

    container.add([circle, border, text, energyText]);
  }

  private getNodeSymbol(nodeType: NodeType, nodeColor: number): Phaser.GameObjects.Text | null {
    let symbolText = '';

    switch (nodeType) {
      case NodeType.ENERGY:
        symbolText = '⚡'; // Rayo para energía
        break;
      case NodeType.ATTACK:
        symbolText = '⚔'; // Espada para ataque
        break;
      case NodeType.DEFENSE:
        symbolText = '🛡'; // Escudo para defensa
        break;
      case NodeType.BASIC:
      default:
        return null; // Sin símbolo para básicos
    }

    const symbolColor = `#${nodeColor.toString(16).padStart(6, '0')}`;

    return this.add.text(18, -18, symbolText, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: symbolColor,
    }).setOrigin(0.5);
  }

  private renderConnection(edge: Edge): void {
    const [nodeA, nodeB] = edge.endpoints;
    const posA = this.nodePositions.get(String(nodeA.id));
    const posB = this.nodePositions.get(String(nodeB.id));
    if (!posA || !posB) return;

    const edgeId = `${nodeA.id}-${nodeB.id}`;
    let graphics = this.connectionGraphics.get(edgeId);
    if (!graphics) {
      graphics = this.add.graphics();
      this.connectionGraphics.set(edgeId, graphics);
    }

    graphics.clear();
    graphics.lineStyle(2, 0x004466, 0.6);
    graphics.lineBetween(posA.x, posA.y, posB.x, posB.y);

    // Renderizar asignaciones de energía para ambos nodos
    this.renderEdgeAssignments(edge, nodeA, nodeB, posA, posB);
  }

  private renderEdgeAssignments(
    edge: Edge,
    nodeA: Node,
    nodeB: Node,
    posA: { x: number; y: number },
    posB: { x: number; y: number },
  ): void {
    // Calcular vector y perpendicular para posicionar los textos
    const dx = posB.x - posA.x;
    const dy = posB.y - posA.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const perpX = -dy / len;
    const perpY = dx / len;

    const offset = 15; // Distancia desde la línea

    // Asignación de nodeA hacia nodeB
    const assignmentA = nodeA.getAssignedEnergy(edge);
    if (assignmentA > 0 && !nodeA.isNeutral()) {
      const keyA = `${edge.id}-${nodeA.id}`;
      let textA = this.edgeAssignmentTexts.get(keyA);

      if (!textA) {
        textA = this.add.text(0, 0, '', {
          fontFamily: 'Orbitron, monospace',
          fontSize: '11px',
          color: '#ffffff',
          backgroundColor: '#000000aa',
          padding: { x: 3, y: 2 },
        }).setOrigin(0.5);
        this.edgeAssignmentTexts.set(keyA, textA);
      }

      // Posicionar cerca del nodeA (1/4 del camino hacia nodeB)
      const posX = posA.x + dx * 0.25 + perpX * offset;
      const posY = posA.y + dy * 0.25 + perpY * offset;

      // Color según el dueño del nodo
      const color = nodeA.owner?.id === 'player-1' ? '#00ffff' : '#ff00ff';
      textA.setColor(color);
      textA.setPosition(posX, posY);
      textA.setText(Math.floor(assignmentA).toString());
      textA.setVisible(true);
    }
    else {
      const keyA = `${edge.id}-${nodeA.id}`;
      const textA = this.edgeAssignmentTexts.get(keyA);
      if (textA) textA.setVisible(false);
    }

    // Asignación de nodeB hacia nodeA
    const assignmentB = nodeB.getAssignedEnergy(edge);
    if (assignmentB > 0 && !nodeB.isNeutral()) {
      const keyB = `${edge.id}-${nodeB.id}`;
      let textB = this.edgeAssignmentTexts.get(keyB);

      if (!textB) {
        textB = this.add.text(0, 0, '', {
          fontFamily: 'Orbitron, monospace',
          fontSize: '11px',
          color: '#ffffff',
          backgroundColor: '#000000aa',
          padding: { x: 3, y: 2 },
        }).setOrigin(0.5);
        this.edgeAssignmentTexts.set(keyB, textB);
      }

      // Posicionar cerca del nodeB (3/4 del camino desde nodeA)
      const posX = posA.x + dx * 0.75 - perpX * offset;
      const posY = posA.y + dy * 0.75 - perpY * offset;

      // Color según el dueño del nodo
      const color = nodeB.owner?.id === 'player-1' ? '#00ffff' : '#ff00ff';
      textB.setColor(color);
      textB.setPosition(posX, posY);
      textB.setText(Math.floor(assignmentB).toString());
      textB.setVisible(true);
    }
    else {
      const keyB = `${edge.id}-${nodeB.id}`;
      const textB = this.edgeAssignmentTexts.get(keyB);
      if (textB) textB.setVisible(false);
    }
  }

  private renderEnergyPackets(edge: Edge): void {
    const [nodeA, nodeB] = edge.endpoints;
    const posA = this.nodePositions.get(String(nodeA.id));
    const posB = this.nodePositions.get(String(nodeB.id));
    if (!posA || !posB) return;

    const edgeId = `${nodeA.id}-${nodeB.id}`;
    let graphics = this.packetGraphics.get(edgeId);
    if (!graphics) {
      graphics = this.add.graphics();
      this.packetGraphics.set(edgeId, graphics);
    }

    graphics.clear();

    // Draw each energy packet
    edge.energyPackets.forEach((packet) => {
      const progress = packet.progress;

      // Calculate position based on packet's origin and target
      const originPos = this.nodePositions.get(String(packet.origin.id));
      const targetPos = this.nodePositions.get(String(packet.target.id));
      if (!originPos || !targetPos) return;

      const x = originPos.x + (targetPos.x - originPos.x) * progress;
      const y = originPos.y + (targetPos.y - originPos.y) * progress;

      // Color based on owner
      let color = 0xffffff;
      if (packet.owner.id === 'player-1') {
        color = 0x00ffff;
      }
      else if (packet.owner.id === 'player-2') {
        color = 0xff00ff;
      }

      // Draw packet as a small circle
      graphics.fillStyle(color, 1);
      graphics.fillCircle(x, y, 4);

      // Add glow effect
      graphics.lineStyle(2, color, 0.5);
      graphics.strokeCircle(x, y, 6);
    });
  }

  private resetGame(): void {
    console.log('[Game] Resetting game...');

    // Stop current game properly
    if (this.gameController) {
      try {
        this.gameController.stopGame();
        // Finalize game to cleanup resources
        this.gameController.finalizeGame();
      }
      catch (error) {
        console.warn('[Game] Error stopping game:', error);
      }
      this.gameController = null;
    }

    // Clear state
    this.gamePhase = GamePhase.WAITING_PLAYER_SELECTION;
    this.playerSelectedNodeId = null;
    this.aiSelectedNodeId = null;
    this.selectedNode = null;
    this.currentPlayer = null;
    this.allPlayers = [];
    this.gameGraph = null;
    this.energyCommandService = null;
    this.aiControllerService = null;
    this.victoryHandled = false;
    this.redistributionMode = false;
    this.redistributionSourceNode = null;

    // Clear visuals
    this.nodeGraphics.forEach(container => container.destroy());
    this.nodeGraphics.clear();
    this.connectionGraphics.forEach(graphics => graphics.destroy());
    this.connectionGraphics.clear();
    this.packetGraphics.forEach(graphics => graphics.destroy());
    this.packetGraphics.clear();
    this.edgeAssignmentTexts.forEach(text => text.destroy());
    this.edgeAssignmentTexts.clear();
    this.nodePositions.clear();

    // Reset UI
    this.phaseText?.setText('SELECCIONA TU NODO BASE');
    this.selectionText?.setText('');
    this.statsText?.setText('Esperando jugadores...');
    this.timerText?.setText('TIEMPO: 3:00');
    this.energyText?.setText('ENERGÍA: 0');

    // Generate new graph
    this.generateRandomGraph();
  }

  shutdown(): void {
    console.log('[Game] Scene shutting down, cleaning up...');

    // Stop and finalize game if still active
    if (this.gameController) {
      try {
        this.gameController.stopGame();
        this.gameController.finalizeGame();
      }
      catch (error) {
        console.warn('[Game] Error during shutdown cleanup:', error);
      }
    }

    // Clear all state
    this.gameController = null;
    this.energyCommandService = null;
    this.aiControllerService = null;
    this.currentPlayer = null;
    this.allPlayers = [];
    this.gameGraph = null;
    this.selectedNode = null;
    this.victoryHandled = false;

    // Clear visual maps
    this.nodeGraphics.clear();
    this.connectionGraphics.clear();
    this.packetGraphics.clear();
    this.edgeAssignmentTexts.clear();
    this.nodePositions.clear();
  }
}
