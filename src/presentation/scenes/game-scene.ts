import { GameFactory } from '@/infrastructure/game/game-factory';
import { Scene } from 'phaser';
import type { GameController } from '@/infrastructure/game/game-controller';
import { NodeType } from '@/core/types/node-type';
import type { Node } from '@/core/entities/node/node';
import type { Edge } from '@/core/entities/edge';
import type { Player } from '@/core/entities/player';
import type { VictoryResult } from '@/application/interfaces/victory/victory-result';
import type { Loggeable } from '@/application/interfaces/logging/loggeable';

enum GamePhase {
  WAITING_PLAYER_SELECTION = 'WAITING_PLAYER_SELECTION',
  WAITING_AI_SELECTION = 'WAITING_AI_SELECTION',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export class GameScene extends Scene implements Loggeable {
  _logContext = 'GameScene';
  private camera?: Phaser.Cameras.Scene2D.Camera;
  private gameController: GameController;
  private currentPlayer: Player | null = null;
  private humanPlayer: Player | null = null;
  private aiPlayer: Player | null = null;

  // Game state
  private gamePhase: GamePhase = GamePhase.WAITING_PLAYER_SELECTION;
  private playerSelectedNode: Node | null = null;
  private aiSelectedNode: Node | null = null;
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
  private packetGraphics = new Map<string, Phaser.GameObjects.Graphics>();
  private edgeAssignmentTexts = new Map<string, Phaser.GameObjects.Text>();

  // Selection
  private selectedNode: Node | null = null;

  constructor() {
    super('GameScene');
  }

  init() {
    // Reset all state variables to initial values
    this.gamePhase = GamePhase.WAITING_PLAYER_SELECTION;
    this.playerSelectedNode = null;
    this.aiSelectedNode = null;
    this.victoryHandled = false;
    this.redistributionMode = false;
    this.redistributionSourceNode = null;
    this.selectedNode = null;
    this.currentPlayer = null;
    this.humanPlayer = null;
    this.aiPlayer = null;
    const playersConfig = [
      {
        username: 'Jugador 1',
        color: '#00ffff',
      },
      {
        username: 'Jugador IA',
        color: '#ff00ff',
      },
    ];
    this.gameController = GameFactory.createGame(playersConfig, this.scale);
    this.gameController.logger.info(this, 'Scene init - resetting state...');

    // Clear visual maps
    this.nodeGraphics.clear();
    this.connectionGraphics.clear();
    this.packetGraphics.clear();
    this.edgeAssignmentTexts.clear();
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
    // Generate 8-12 nodes
    const nodeCount = Phaser.Math.Between(8, 12);
    this.gameController.generateGraph(nodeCount);

    this.renderInitialGraph();
  }

  private renderInitialGraph(): void {
    // Render edges
    this.gameController.getGraph().edges.forEach((edge) => {
      const [nodeA, nodeB] = edge.endpoints;
      const posA = this.gameController.getNodePositions().get(nodeA);
      const posB = this.gameController.getNodePositions().get(nodeB);
      if (!posA || !posB) return;

      const edgeId = String(edge.id);
      const graphics = this.add.graphics();
      graphics.lineStyle(2, 0x004466, 0.6);
      graphics.lineBetween(posA.x, posA.y, posB.x, posB.y);
      this.connectionGraphics.set(edgeId, graphics);
    });

    // Render nodes
    this.gameController.getGraph().nodes.forEach((node) => {
      this.renderInitialNode(node);
    });
  }

  private renderInitialNode(node: Node): void {
    const pos = this.gameController.getNodePositions().get(node);
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
    const clickedNode = this.findClickedNode(pointer.x, pointer.y);
    if (!clickedNode) return;

    // Player selects their initial node
    this.playerSelectedNode = clickedNode;
    this.highlightSelectedNode(clickedNode, 0x00ffff);
    this.selectionText?.setText(`Tu seleccionaste ${clickedNode.name} como tu base!`);
    this.phaseText?.setText('Esperando a la IA...');

    // AI selects automatically
    setTimeout(() => this.aiSelectNode(), 500);
  }

  private aiSelectNode(): void {
    if (!this.playerSelectedNode) {
      this.gameController.logger.error(this, 'Selección de nodo de IA fallida: el jugador no ha seleccionado un nodo');
      return;
    }
    const playerNode = this.playerSelectedNode;
    // AI picks random node different from player
    const availableNodes = Array.from(this.gameController.getGraph().nodes).filter(
      n => !n.equals(playerNode),
    );

    if (availableNodes.length === 0) return;

    this.aiSelectedNode = Phaser.Utils.Array.GetRandom(availableNodes);
    this.highlightSelectedNode(this.aiSelectedNode, 0xff00ff);

    this.gamePhase = GamePhase.WAITING_AI_SELECTION;
    this.phaseText?.setText('STARTING GAME...');

    // Start the game
    setTimeout(() => this.intializeGame(), 1000);
  }

  private highlightSelectedNode(node: Node, color: number): void {
    const container = this.nodeGraphics.get(String(node.id));
    if (!container) return;

    const radius = 30;
    const border = this.add.circle(0, 0, radius + 4, color, 0).setStrokeStyle(4, color, 1);

    container.add([border]);
  }

  private intializeGame(): void {
    this.gameController.logger.info(this, 'Inicializando juego con selecciones...');

    if (!this.playerSelectedNode || !this.aiSelectedNode) {
      this.gameController.logger.error(this, 'No se han seleccionado nodos iniciales para ambos jugadores');
      return;
    }

    const playerNode = this.playerSelectedNode;
    const aiNode = this.aiSelectedNode;

    try {
      this.gameController.startGame();

      // Obtener referencias a través del GameController
      const players = this.gameController.getPlayers();
      const graph = this.gameController.getGraph();

      // Guardar referencias a los jugadores
      this.humanPlayer = players[0];
      this.aiPlayer = players[1];
      this.currentPlayer = this.humanPlayer;

      // Asignar nodos iniciales
      const assignments = new Map<Player, Node>();

      assignments.set(players[0], playerNode);
      assignments.set(players[1], aiNode);
      this.gameController.assignInitialNodes(assignments);

      // Setup victory callback before starting
      this.gameController.setOnVictory((victoryResult) => {
        this.handleVictoryFromController(victoryResult);
      });

      this.gameController.logger.info(this, 'Game started with', graph.nodes.size, 'nodes');

      this.gamePhase = GamePhase.PLAYING;
      this.phaseText?.setText('JUEGO EN PROGRESO');
      this.selectionText?.setText('Selecciona tus nodos y asigna energía a las aristas');

      // Render initial state
      graph.nodes.forEach((node: Node) => this.renderNode(node));
      graph.edges.forEach((edge: Edge) => this.renderConnection(edge));
    }
    catch (error) {
      this.gameController.logger.error(this, 'Failed to initialize:', error);
      this.selectionText?.setText(`Error: ${error}`);
    }
  }

  private handleGameplayInput(pointer: Phaser.Input.Pointer): void {
    const clickedNode = this.findClickedNode(pointer.x, pointer.y);
    if (clickedNode) {
      // Explicitly cast/type to avoid 'unknown' error
      const graph = this.gameController.getGraph();
      const nodes: Node[] = Array.from(graph.nodes);
      const node = nodes.find(n => n.equals(clickedNode));
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
    const clickedEdge = this.findClickedEdge(pointer.x, pointer.y);
    if (clickedEdge) {
      // CTRL + Clic = quitar energía (equivalente a clic derecho)
      const isRemoveAction = pointer.event.ctrlKey;
      this.handleEdgeClick(clickedEdge, isRemoveAction);
    }
  }

  private findClickedNode(x: number, y: number): Node | null {
    let clickedNode: Node | null = null;
    let minDist = 35;

    this.gameController.getNodePositions().forEach((pos, node) => {
      const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        clickedNode = node;
      }
    });

    return clickedNode;
  }

  private findClickedEdge(x: number, y: number): Edge | null {
    let clickedEdge: Edge | null = null;
    let minDist = 15;

    this.gameController.getGraph().edges.forEach((edge: Edge) => {
      const [nodeA, nodeB] = edge.endpoints;
      const posA = this.gameController.getNodePositions().get(nodeA);
      const posB = this.gameController.getNodePositions().get(nodeB);
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
    if (!this.currentPlayer) return;

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
      const result = this.gameController.getEnergyCommander().transferEnergyBetweenAllies(
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
    if (!this.currentPlayer) return;

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
        const result = this.gameController.getEnergyCommander().removeEnergyFromEdge(
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
        const result = this.gameController.getEnergyCommander().removeEnergyFromEdge(
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
      const result = this.gameController.getEnergyCommander().transferEnergyBetweenAllies(
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
        ? this.gameController.getEnergyCommander().removeEnergyFromEdge(
            this.currentPlayer,
            this.selectedNode,
            edge,
            amount,
          )
        : this.gameController.getEnergyCommander().assignEnergyToEdge(
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

  private handleVictoryFromController(victoryResult: VictoryResult): void {
    if (this.victoryHandled) return;
    this.victoryHandled = true;

    // Loggear solo información relevante sin objetos complejos
    const logWinnerName = victoryResult.winner?.username || 'Empate';
    const logReason = victoryResult.reason;
    this.gameController.logger.info(this, `Victory detected by controller: Ganador=${logWinnerName}, Razón=${logReason}`);

    // CRITICAL: Capture stats IMMEDIATELY before anything else changes state
    let p1Nodes = 0;
    let p2Nodes = 0;
    const graph = this.gameController.getGraph();
    this.gameController.logger.info(this, 'Total nodes in graph:', graph.nodes.size);
    const allNodes = Array.from(graph.nodes);
    allNodes.forEach((n) => {
      this.gameController.logger.info(this, `Node ${n.id}: owner=${n.owner?.id || 'neutral'}`);
    });

    p1Nodes = allNodes.filter(n => n.owner?.id === this.humanPlayer?.id).length;
    p2Nodes = allNodes.filter(n => n.owner?.id === this.aiPlayer?.id).length;
    this.gameController.logger.info(this, 'Final stats captured - P1:', p1Nodes, 'nodes, P2:', p2Nodes, 'nodes');

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
      this.gameController.logger.info(this, 'Transitioning to GameOverScene with stats - P1:', p1Nodes, 'P2:', p2Nodes);

      // Finalize and cleanup game state now that we're transitioning
      if (this.gameController) {
        this.gameController.logger.info(this, 'Calling finalizeGame to cleanup...');
        this.gameController.finalizeGame();
      }

      // Determinar el color del ganador
      let winnerColor = '#ffffff';
      if (victoryResult.winner) {
        winnerColor = victoryResult.winner.id === this.humanPlayer?.id ? '#00ffff' : '#ff00ff';
      }

      this.scene.start('GameOverScene', {
        winner: winnerName,
        winnerId: winnerId,
        winnerColor: winnerColor,
        p1Nodes,
        p2Nodes,
        reason: victoryResult.reason,
      });
    });
  }

  private updateAI(): void {
    // Only run AI during playing phase, not after game over
    if (this.gamePhase !== GamePhase.PLAYING) {
      return;
    }

    if (this.aiPlayer && !this.aiPlayer.isEliminated) {
      try {
        this.gameController.getAIController().executeAITurn(this.aiPlayer, Date.now());
      }
      catch (error) {
        this.gameController.logger.error(this, 'AI error:', error);
      }
    }
  }

  private updateHUD(): void {
    const snapshot = this.gameController.getGameSnapshot();
    if (!snapshot) return;

    // Only update timer if game is playing
    if (this.gamePhase === GamePhase.PLAYING) {
      const timeRemaining = Math.max(0, 180 - snapshot.elapsedTime / 1000);
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = Math.floor(timeRemaining % 60);
      this.timerText?.setText(`TIEMPO: ${minutes}:${seconds.toString().padStart(2, '0')}`);
    }

    // Usar playerStats del snapshot en lugar de acceder al gameState directamente
    const p1Stats = snapshot.playerStats.find(p => p.playerId === this.humanPlayer?.id);
    const p2Stats = snapshot.playerStats.find(p => p.playerId === this.aiPlayer?.id);

    if (p1Stats && p2Stats) {
      const p1Percent = Math.floor(p1Stats.dominancePercentage);
      const p2Percent = Math.floor(p2Stats.dominancePercentage);
      const p1Nodes = p1Stats.controlledNodes;
      const p2Nodes = p2Stats.controlledNodes;

      let statsText = `P1: ${p1Percent}% (${p1Nodes}) | P2: ${p2Percent}% (${p2Nodes})`;

      // Mostrar contador de dominancia si algún jugador supera el 70%
      if (p1Percent >= 70 && this.humanPlayer) {
        const dominanceTime = this.gameController.getDominanceTime(this.humanPlayer.id);
        const remainingTime = Math.max(0, 10 - dominanceTime / 1000);
        statsText += `\n⚠️  P1 DOMINANDO: ${remainingTime.toFixed(1)}s`;
      }

      if (p2Percent >= 70 && this.aiPlayer) {
        const dominanceTime = this.gameController.getDominanceTime(this.aiPlayer.id);
        const remainingTime = Math.max(0, 10 - dominanceTime / 1000);
        statsText += `\n⚠️  P2 DOMINANDO: ${remainingTime.toFixed(1)}s`;
      }

      this.statsText?.setText(statsText);

      // Mostrar energía del jugador actual
      if (this.currentPlayer) {
        const currentPlayerStats = snapshot.playerStats.find(
          p => p.playerId === this.currentPlayer?.id,
        );
        if (currentPlayerStats) {
          this.energyText?.setText(`ENERGÍA TOTAL: ${Math.floor(currentPlayerStats.totalEnergy)}`);
        }
      }
    }
  }

  private updateVisuals(): void {
    try {
      const graph = this.gameController.getGraph();
      // Always render all nodes, even after game over
      graph.nodes.forEach(node => this.renderNode(node));
      graph.edges.forEach((edge) => {
        this.renderConnection(edge);
        this.renderEnergyPackets(edge);
      });
    }
    catch (error) {
      this.gameController.logger.error(this, 'Visual update error:', error);
    }
  }

  private renderNode(node: Node): void {
    const pos = this.gameController.getNodePositions().get(node);
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
    else if (node.owner?.id === this.humanPlayer?.id) {
      color = 0x00ffff;
    }
    else if (node.owner?.id === this.aiPlayer?.id) {
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
    const posA = this.gameController.getNodePositions().get(nodeA);
    const posB = this.gameController.getNodePositions().get(nodeB);
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
      const color = nodeA.owner?.id === this.humanPlayer?.id ? '#00ffff' : '#ff00ff';
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
      const color = nodeB.owner?.id === this.humanPlayer?.id ? '#00ffff' : '#ff00ff';
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
    const posA = this.gameController.getNodePositions().get(nodeA);
    const posB = this.gameController.getNodePositions().get(nodeB);
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
      const originPos = this.gameController.getNodePositions().get(packet.origin);
      const targetPos = this.gameController.getNodePositions().get(packet.target);
      if (!originPos || !targetPos) return;

      const x = originPos.x + (targetPos.x - originPos.x) * progress;
      const y = originPos.y + (targetPos.y - originPos.y) * progress;

      // Color based on owner
      let color = 0xffffff;
      if (packet.owner.id === this.humanPlayer?.id) {
        color = 0x00ffff;
      }
      else if (packet.owner.id === this.aiPlayer?.id) {
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
    this.gameController.logger.info(this, 'Resetting game...');

    // Stop current game properly
    if (this.gameController) {
      try {
        this.gameController.stopGame();
        // Finalize game to cleanup resources
        this.gameController.finalizeGame();
      }
      catch (error) {
        this.gameController.logger.warn(this, 'Error stopping game:', error);
      }
    }

    // Clear state
    this.gamePhase = GamePhase.WAITING_PLAYER_SELECTION;
    this.playerSelectedNode = null;
    this.aiSelectedNode = null;
    this.selectedNode = null;
    this.currentPlayer = null;
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
    this.gameController.logger.info(this, 'Scene shutting down, cleaning up...');

    // Stop and finalize game if still active
    if (this.gameController) {
      try {
        this.gameController.stopGame();
        this.gameController.finalizeGame();
      }
      catch (error) {
        this.gameController.logger.warn(this, 'Error during shutdown cleanup:', error);
      }
    }

    // Clear all state
    // GameController será recreado en el próximo init()
    this.currentPlayer = null;
    this.selectedNode = null;
    this.victoryHandled = false;

    // Clear visual maps
    this.nodeGraphics.clear();
    this.connectionGraphics.clear();
    this.packetGraphics.clear();
    this.edgeAssignmentTexts.clear();
  }
}
