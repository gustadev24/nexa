import { GameFactory } from '@/infrastructure/game/game-factory';
import { Scene } from 'phaser';
import type { GameController } from '@/infrastructure/game/game-controller';
import { NodeType } from '@/core/types/node-type';
import type { Node } from '@/core/entities/node/node';
import type { Edge } from '@/core/entities/edge';
import type { Player } from '@/core/entities/player';
import type { VictoryResult } from '@/application/interfaces/victory/victory-result';
import type { Loggeable } from '@/application/interfaces/logging/loggeable';
import { VISUAL_CONSTANTS } from '@/application/constants/visual-constants';
import { GAME_CONSTANTS } from '@/application/constants/game-constants';

enum GamePhase {
  WAITING_PLAYER_SELECTION = 'WAITING_PLAYER_SELECTION',
  WAITING_AI_SELECTION = 'WAITING_AI_SELECTION',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export class GameScene extends Scene implements Loggeable {
  _logContext = 'GameScene';
  private readonly NODE_GRAPHICS_KEY = 'nodeGraphicsType';
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
  private edgeAssignmentTexts = new Map<string, {
    nodeA: Phaser.GameObjects.Text;
    nodeB: Phaser.GameObjects.Text;
  }>();

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

    this.showWelcomeDialog();
  }

  private showWelcomeDialog(): void {
    const { width, height } = this.scale;

    // Overlay oscuro (fondo semitransparente)
    const overlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.85,
    );
    overlay.setDepth(1000);
    overlay.setInteractive();
    overlay.setAlpha(0);

    // Panel del diálogo - más alto para dar espacio
    const panelWidth = Math.min(720, width - 40);
    const panelHeight = Math.min(620, height - 40);

    const dialogPanel = this.add.rectangle(
      width / 2,
      height / 2,
      panelWidth,
      panelHeight,
      0x001122,
      1,
    );
    dialogPanel.setStrokeStyle(3, 0x00ffff, 1);
    dialogPanel.setDepth(1001);
    dialogPanel.setAlpha(0);

    // Brillo del panel (efecto neón)
    const glow = this.add.rectangle(
      width / 2,
      height / 2,
      panelWidth + 6,
      panelHeight + 6,
      0x00ffff,
      0,
    );
    glow.setStrokeStyle(6, 0x00ffff, 0.3);
    glow.setDepth(1000);
    glow.setAlpha(0);

    // Título
    const title = this.add.text(
      width / 2,
      height / 2 - panelHeight / 2 + 45,
      '⚡ NEXA ⚡',
      {
        fontFamily: 'Orbitron, monospace',
        fontSize: '44px',
        color: '#00ffff',
        align: 'center',
        stroke: '#00ffff',
        strokeThickness: 2,
      },
    ).setOrigin(0.5);
    title.setDepth(1002);
    title.setAlpha(0);

    // Línea separadora
    const separator = this.add.rectangle(
      width / 2,
      height / 2 - panelHeight / 2 + 95,
      panelWidth - 80,
      2,
      0x00ffff,
      0.5,
    );
    separator.setDepth(1002);
    separator.setAlpha(0);

    // Contenido - texto más grande
    const content = this.add.text(
      width / 2,
      height / 2 - panelHeight / 2 + 95 + (panelHeight - 190) / 2,
      '🎮 CONTROLES:\n'
      + '• Click en nodo → Selecciona\n'
      + '• Click en vecino → +10 energía\n'
      + '• CTRL + Click → -10 energía\n'
      + '• Tecla C → Deselecciona\n\n'
      + '⚡ MECÁNICAS:\n'
      + '• Nodos generan paquetes cada 1s\n'
      + '• Al capturar: energía se transfiere\n'
      + '• Defensa = Pool - Asignado\n\n'
      + '🎯 OBJETIVO:\n'
      + '• 70% nodos por 10 segundos\n'
      + '• O mayor control en 3 minutos',
      {
        fontFamily: 'Orbitron, monospace',
        fontSize: '15px', // ✅ Aumentado de 13px a 15px
        color: '#ffffff',
        align: 'left',
        lineSpacing: 5, // ✅ Un poco más de espacio entre líneas
      },
    ).setOrigin(0.5);
    content.setDepth(1002);
    content.setAlpha(0);

    // Botón de cerrar
    const buttonText = this.add.text(
      width / 2,
      height / 2 + panelHeight / 2 - 45,
      '[ CLICK PARA COMENZAR ]',
      {
        fontFamily: 'Orbitron, monospace',
        fontSize: '16px', // ✅ Aumentado de 15px a 16px
        color: '#00ff88',
        align: 'center',
        backgroundColor: '#00ffff22',
        padding: { x: 20, y: 10 },
      },
    ).setOrigin(0.5);
    buttonText.setDepth(1002);
    buttonText.setAlpha(0);

    // Efecto de pulso en el botón
    this.tweens.add({
      targets: buttonText,
      alpha: { from: 0.6, to: 1 },
      scale: { from: 0.98, to: 1.02 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Agrupar todos los elementos del diálogo
    const dialogElements = [
      overlay,
      glow,
      dialogPanel,
      title,
      separator,
      content,
      buttonText,
    ];

    // Animación de entrada
    this.tweens.add({
      targets: dialogElements,
      alpha: 1,
      duration: 500,
      ease: 'Power2',
    });

    // Animación especial para el título
    this.tweens.add({
      targets: title,
      scale: { from: 0.8, to: 1 },
      duration: 600,
      ease: 'Back.easeOut',
    });

    // Función para cerrar el diálogo
    const closeDialog = () => {
      // Animación de salida
      this.tweens.add({
        targets: dialogElements,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          // Destruir todos los elementos
          dialogElements.forEach(element => element.destroy());
        },
      });

      // Animación especial para el panel (zoom out)
      this.tweens.add({
        targets: [dialogPanel, glow],
        scale: 0.8,
        duration: 300,
        ease: 'Back.easeIn',
      });
    };

    // Click en overlay o botón para cerrar
    overlay.on('pointerdown', closeDialog);
    buttonText.setInteractive();
    buttonText.on('pointerdown', closeDialog);

    // Efecto hover en el botón
    buttonText.on('pointerover', () => {
      buttonText.setColor('#00ffff');
      buttonText.setScale(1.05);
    });

    buttonText.on('pointerout', () => {
      buttonText.setColor('#00ff88');
      buttonText.setScale(1);
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
      this.renderConnection(edge);
    });

    // Render nodes
    this.gameController.getGraph().nodes.forEach((node) => {
      this.createNodeGraphics(node);
    });
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
    this.phaseText?.setText('Iniciando juego...');

    // Start the game
    setTimeout(() => this.initializeGame(), 1000);
  }

  private highlightSelectedNode(node: Node, color: number): void {
    const container = this.nodeGraphics.get(String(node.id));
    if (!container) return;

    const radius = VISUAL_CONSTANTS.NODE_RADIUS;
    const border = this.add.circle(0, 0, radius + 4, color, 0).setStrokeStyle(4, color, 1);

    container.add([border]);
  }

  private initializeGame(): void {
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

      this.gameController.logger.info(this, 'Jueog iniciado con', graph.nodes.size, 'nodos');

      this.gamePhase = GamePhase.PLAYING;
      this.phaseText?.setText('JUEGO EN PROGRESO');
      this.selectionText?.setText('Selecciona tus nodos y asigna energía a las aristas');

      // Render initial state
      graph.nodes.forEach((node: Node) => this.createNodeGraphics(node));
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
      this.handleNodeClick(clickedNode, pointer.event.ctrlKey);
      return;
    }

    // Si no clickeó un nodo, intentar arista (mantener compatibilidad)
    const clickedEdge = this.findClickedEdge(pointer.x, pointer.y);
    if (clickedEdge) {
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

  private handleNodeClick(node: Node, isRemoveAction = false): void {
    if (!this.currentPlayer) return;

    const isOwnNode = node.owner?.id === this.currentPlayer.id;

    // CASO 1: No hay nodo seleccionado
    if (!this.selectedNode) {
      // Solo puedes seleccionar tus propios nodos
      if (isOwnNode) {
        this.selectedNode = node;
        const defense = node.defenseEnergy();
        this.selectionText?.setText(
          `Generador seleccionado: ${node.name} | Pool: ${Math.floor(node.energyPool)} | Defensa: ${Math.floor(defense)}`,
        );
      }
      else {
        this.selectionText?.setText('⚠️ Debes seleccionar tu propio generador primero');
      }
      return;
    }

    // CASO 2: Hay nodo seleccionado
    // Si clickean el mismo nodo, deseleccionar
    if (node.equals(this.selectedNode)) {
      this.selectedNode = null;
      this.selectionText?.setText('Generador deseleccionado');
      return;
    }

    // Si clickean otro de sus nodos, cambiar selección
    if (isOwnNode) {
      this.selectedNode = node;
      const defense = node.defenseEnergy();
      this.selectionText?.setText(
        `Generador seleccionado: ${node.name} | Pool: ${Math.floor(node.energyPool)} | Defensa: ${Math.floor(defense)}`,
      );
      return;
    }

    // CASO 3: Click en nodo vecino (enemigo o neutral)
    // Buscar arista que conecta selectedNode con el nodo clickeado
    const edge = Array.from(this.selectedNode.edges).find(e => e.hasNode(node));

    if (!edge) {
      this.selectionText?.setText(`⚠️ ${this.selectedNode.name} no está conectado a ${node.name}`);
      return;
    }

    // Asignar o quitar energía a la arista
    this.handleEnergyAssignment(edge, isRemoveAction);
  }

  private handleEnergyAssignment(edge: Edge, isRemoveAction: boolean): void {
    if (!this.currentPlayer || !this.selectedNode) return;

    const amount = GAME_CONSTANTS.ASSIGNMENT_AMOUNT;
    const targetNode = edge.flipSide(this.selectedNode);
    const isAllyTarget = targetNode.owner?.id === this.currentPlayer.id;

    // TRANSFERENCIA ENTRE ALIADOS
    if (isAllyTarget && !isRemoveAction) {
      const result = this.gameController.getEnergyCommander().transferEnergyBetweenAllies(
        this.currentPlayer,
        this.selectedNode,
        targetNode,
        edge,
        amount,
      );

      if (result.success) {
        this.selectionText?.setText(
          `✅ Transferencia: ${this.selectedNode.name} → ${targetNode.name} (+${amount} energía)`,
        );
      }
      else {
        this.selectionText?.setText(`❌ Error: ${result.error}`);
      }
      return;
    }

    // ASIGNACIÓN DE ATAQUE O REMOCIÓN
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
      const action = isRemoveAction ? '⬇️' : '⬆️';
      const targetName = targetNode.name || 'nodo';

      this.selectionText?.setText(
        `${action} ${this.selectedNode.name} → ${targetName}: ${isRemoveAction ? '-' : '+'}${amount} | Flujo: ${assignment}/s | Defensa: ${Math.floor(defense)}`,
      );
    }
    else {
      this.selectionText?.setText(`❌ Error: ${result.error}`);
    }
  }

  // Modificar handleEdgeClick para seguir funcionando sin nodo seleccionado
  private handleEdgeClick(edge: Edge, isRemoveAction: boolean): void {
    if (!this.currentPlayer) return;

    const amount = 10;
    const [nodeA, nodeB] = edge.endpoints;

    // CASO 1: Sin nodo seleccionado - quitar energía asignada de cualquier extremo
    if (!this.selectedNode) {
      const nodeAOwned = nodeA.owner?.id === this.currentPlayer.id;
      const nodeBOwned = nodeB.owner?.id === this.currentPlayer.id;
      const assignmentA = nodeAOwned ? nodeA.getAssignedEnergy(edge) : 0;
      const assignmentB = nodeBOwned ? nodeB.getAssignedEnergy(edge) : 0;

      if (assignmentA > 0) {
        const result = this.gameController.getEnergyCommander().removeEnergyFromEdge(
          this.currentPlayer,
          nodeA,
          edge,
          amount,
        );

        if (result.success) {
          const remaining = nodeA.getAssignedEnergy(edge);
          this.selectionText?.setText(
            `⬇️ Energía devuelta desde ${nodeA.name}: -${amount} | Restante: ${remaining}/s`,
          );
        }
        else {
          this.selectionText?.setText(`❌ Error: ${result.error}`);
        }
        return;
      }

      if (assignmentB > 0) {
        const result = this.gameController.getEnergyCommander().removeEnergyFromEdge(
          this.currentPlayer,
          nodeB,
          edge,
          amount,
        );

        if (result.success) {
          const remaining = nodeB.getAssignedEnergy(edge);
          this.selectionText?.setText(
            `⬇️ Energía devuelta desde ${nodeB.name}: -${amount} | Restante: ${remaining}/s`,
          );
        }
        else {
          this.selectionText?.setText(`❌ Error: ${result.error}`);
        }
        return;
      }

      this.selectionText?.setText('⚠️ Esta arista no tiene energía asignada');
      return;
    }

    // CASO 2: Con nodo seleccionado - usar el nuevo sistema
    this.handleEnergyAssignment(edge, isRemoveAction);
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

      // Solo actualizar datos dinámicos, no recrear gráficos
      graph.nodes.forEach(node => this.updateNodeData(node));

      // Los paquetes de energía sí necesitan re-renderizarse porque se mueven
      graph.edges.forEach((edge) => {
        const [nodeA, nodeB] = edge.endpoints;
        const posA = this.gameController.getNodePositions().get(nodeA);
        const posB = this.gameController.getNodePositions().get(nodeB);

        if (posA && posB) {
          // Actualizar asignaciones de energía (los números)
          this.renderEdgeAssignments(edge, nodeA, nodeB, posA, posB);

          // Actualizar paquetes de energía en movimiento
          this.renderEnergyPackets(edge);
        }
      });
    }
    catch (error) {
      this.gameController.logger.error(this, 'Visual update error:', error);
    }
  }

  /**
   * Crea los gráficos iniciales del nodo (llamar solo UNA VEZ)
   */
  private createNodeGraphics(node: Node): void {
    const pos = this.gameController.getNodePositions().get(node);
    if (!pos) return;

    // Si ya existe, no recrear
    if (this.nodeGraphics.has(String(node.id))) {
      return;
    }

    const container = this.add.container(pos.x, pos.y);
    this.nodeGraphics.set(String(node.id), container);

    let color = 0x888888;
    const label = node.name;

    if (node.isNeutral()) {
      color = 0x888888;
    }
    else if (node.owner?.id === this.humanPlayer?.id) {
      color = 0x00ffff;
    }
    else if (node.owner?.id === this.aiPlayer?.id) {
      color = 0xff00ff;
    }

    const colorString = `#${color.toString(16).padStart(6, '0')}`;
    const radius = VISUAL_CONSTANTS.NODE_RADIUS;

    const circle = this.add.circle(0, 0, radius, color, 0.9);
    circle.setData(this.NODE_GRAPHICS_KEY, 'circle'); // Tag para identificar después

    const isInitialNode = (this.humanPlayer?.initialNode?.equals(node))
      || (this.aiPlayer?.initialNode?.equals(node));

    let border;
    let outerBorder = null;

    if (isInitialNode) {
      border = this.add.circle(0, 0, radius + 3, color, 0).setStrokeStyle(4, color, 1);
      border.setData(this.NODE_GRAPHICS_KEY, 'border');

      outerBorder = this.add.circle(0, 0, radius + 6, color, 0).setStrokeStyle(2, color, 0.6);
      outerBorder.setData(this.NODE_GRAPHICS_KEY, 'outerBorder');

      // Efecto de pulso (solo se crea una vez)
      this.tweens.add({
        targets: outerBorder,
        scaleX: 1.1,
        scaleY: 1.1,
        alpha: 0.3,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    else {
      border = this.add.circle(0, 0, radius + 2, color, 0).setStrokeStyle(2, color, 1);
      border.setData(this.NODE_GRAPHICS_KEY, 'border');
    }

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '20px',
      color: '#fff',
    }).setOrigin(0.5);
    text.setData(this.NODE_GRAPHICS_KEY, 'label');

    let energyDisplayText = Math.floor(node.energyPool).toString();
    if (!node.isNeutral()) {
      const defense = Math.floor(node.defenseEnergy());
      const pool = Math.floor(node.energyPool);
      energyDisplayText = `${defense}/${pool}`;
    }

    const energyText = this.add.text(0, radius + 15, energyDisplayText, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '12px',
      backgroundColor: '#000000aa',
      color: colorString,
    }).setOrigin(0.5);
    energyText.setData(this.NODE_GRAPHICS_KEY, 'energyText');

    const symbol = this.getNodeSymbol(node.nodeType, color);
    if (symbol) {
      symbol.setData(this.NODE_GRAPHICS_KEY, 'symbol');
      container.add(symbol);
    }

    // Orden de adición es importante para identificar después
    if (outerBorder) {
      container.add([outerBorder, circle, border, text, energyText]);
    }
    else {
      container.add([circle, border, text, energyText]);
    }

    container.setDepth(10);
  }

  /**
   * Actualiza solo los datos dinámicos del nodo (llamar cada frame)
   */
  private updateNodeData(node: Node): void {
    const container = this.nodeGraphics.get(String(node.id));
    if (!container) {
      // Si no existe el gráfico, crearlo
      this.createNodeGraphics(node);
      return;
    }

    // Determinar color actual basado en el dueño
    let color = 0x888888;
    if (node.owner?.id === this.humanPlayer?.id) {
      color = 0x00ffff;
    }
    else if (node.owner?.id === this.aiPlayer?.id) {
      color = 0xff00ff;
    }

    const colorString = `#${color.toString(16).padStart(6, '0')}`;

    // Buscar y actualizar los objetos gráficos
    const children = container.list;

    for (const child of children) {
      const graphicsType = child.getData(this.NODE_GRAPHICS_KEY);

      if (graphicsType === 'circle') {
        // Actualizar color del círculo principal
        const circle = child as Phaser.GameObjects.Arc;
        circle.fillColor = color;
      }
      else if (graphicsType === 'border' || graphicsType === 'outerBorder') {
        // Actualizar color del borde
        const border = child as Phaser.GameObjects.Arc;
        border.setStrokeStyle(border.lineWidth, color, border.strokeAlpha);
      }
      else if (graphicsType === 'energyText') {
        // Actualizar texto y color de energía
        const energyText = child as Phaser.GameObjects.Text;

        let energyDisplayText = Math.floor(node.energyPool).toString();
        if (!node.isNeutral()) {
          const defense = Math.floor(node.defenseEnergy());
          const pool = Math.floor(node.energyPool);
          energyDisplayText = `${defense}/${pool}`;
        }

        energyText.setText(energyDisplayText);
        energyText.setColor(colorString);
      }
      else if (graphicsType === 'symbol') {
        // Actualizar color del símbolo
        const symbol = child as Phaser.GameObjects.Text;
        symbol.setColor(colorString);
      }
    }
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

    const edgeId = String(edge.id);
    let graphics = this.connectionGraphics.get(edgeId);

    // Solo crear si no existe
    if (!graphics) {
      graphics = this.add.graphics();
      this.connectionGraphics.set(edgeId, graphics);

      // Capa 2: Brillo medio
      graphics.lineStyle(5, 0x00dd99, 0.1);
      graphics.lineBetween(posA.x, posA.y, posB.x, posB.y);

      // Capa 3: Línea principal brillante
      graphics.lineStyle(3, 0x00ffaa, 0.5);
      graphics.lineBetween(posA.x, posA.y, posB.x, posB.y);

      // Capa 4: Centro brillante (highlight)
      graphics.lineStyle(1, 0x00ffff, 1);
      graphics.lineBetween(posA.x, posA.y, posB.x, posB.y);

      graphics.setDepth(1);
    }

    // Renderizar asignaciones de energía (estos sí cambian)
    this.renderEdgeAssignments(edge, nodeA, nodeB, posA, posB);
  }

  private renderEdgeAssignments(
    edge: Edge,
    nodeA: Node,
    nodeB: Node,
    posA: { x: number; y: number },
    posB: { x: number; y: number },
  ): void {
    const edgeId = String(edge.id);
    const dx = posB.x - posA.x;
    const dy = posB.y - posA.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const perpX = -dy / len;
    const perpY = dx / len;
    const offset = 15;

    // Obtener o crear el par de textos para esta arista
    let textPair = this.edgeAssignmentTexts.get(edgeId);
    if (!textPair) {
      textPair = {
        nodeA: this.add.text(0, 0, '', {
          fontFamily: 'Orbitron, monospace',
          fontSize: '11px',
          color: '#ffffff',
          backgroundColor: '#000000aa',
          padding: { x: 3, y: 2 },
        }).setOrigin(0.5),
        nodeB: this.add.text(0, 0, '', {
          fontFamily: 'Orbitron, monospace',
          fontSize: '11px',
          color: '#ffffff',
          backgroundColor: '#000000aa',
          padding: { x: 3, y: 2 },
        }).setOrigin(0.5),
      };
      this.edgeAssignmentTexts.set(edgeId, textPair);
    }

    // Asignación de nodeA hacia nodeB
    const assignmentA = nodeA.getAssignedEnergy(edge);
    if (assignmentA > 0 && !nodeA.isNeutral()) {
      const posX = posA.x + dx * 0.25 + perpX * offset;
      const posY = posA.y + dy * 0.25 + perpY * offset;
      const color = nodeA.owner?.id === this.humanPlayer?.id ? '#00ffff' : '#ff00ff';

      textPair.nodeA.setColor(color);
      textPair.nodeA.setPosition(posX, posY);
      textPair.nodeA.setText(Math.floor(assignmentA).toString());
      textPair.nodeA.setVisible(true);
    }
    else {
      textPair.nodeA.setVisible(false);
    }

    // Asignación de nodeB hacia nodeA
    const assignmentB = nodeB.getAssignedEnergy(edge);
    if (assignmentB > 0 && !nodeB.isNeutral()) {
      const posX = posA.x + dx * 0.75 - perpX * offset;
      const posY = posA.y + dy * 0.75 - perpY * offset;
      const color = nodeB.owner?.id === this.humanPlayer?.id ? '#00ffff' : '#ff00ff';

      textPair.nodeB.setColor(color);
      textPair.nodeB.setPosition(posX, posY);
      textPair.nodeB.setText(Math.floor(assignmentB).toString());
      textPair.nodeB.setVisible(true);
    }
    else {
      textPair.nodeB.setVisible(false);
    }
  }

  private renderEnergyPackets(edge: Edge): void {
    const [nodeA, nodeB] = edge.endpoints;
    const posA = this.gameController.getNodePositions().get(nodeA);
    const posB = this.gameController.getNodePositions().get(nodeB);
    if (!posA || !posB) return;

    const edgeId = String(edge.id);
    let graphics = this.packetGraphics.get(edgeId);
    if (!graphics) {
      graphics = this.add.graphics();
      this.packetGraphics.set(edgeId, graphics);
    }

    graphics.clear();

    graphics.setDepth(5);

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

    // Clear visuals
    this.nodeGraphics.forEach(container => container.destroy());
    this.nodeGraphics.clear();
    this.connectionGraphics.forEach(graphics => graphics.destroy());
    this.connectionGraphics.clear();
    this.packetGraphics.forEach(graphics => graphics.destroy());
    this.packetGraphics.clear();
    this.edgeAssignmentTexts.forEach((pair) => {
      pair.nodeA.destroy();
      pair.nodeB.destroy();
    });
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
