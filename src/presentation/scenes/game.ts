import { Scene } from 'phaser';
import { GameFactory } from '@/presentation/game/GameFactory';
import type { GameController } from '@/presentation/game/GameController';
import { NodeType, PlayerType } from '@/core/types/common';
import type { Node } from '@/core/entities/node/node';
import type { Edge } from '@/core/entities/edge';
import { EnergyCommandService } from '@/application/services/energy-command-service';
import type { Player } from '@/core/entities/player';

export class Game extends Scene {
  private camera?: Phaser.Cameras.Scene2D.Camera;
  private gameController: GameController | null = null;
  private energyCommandService: EnergyCommandService | null = null;
  private currentPlayer: Player | null = null;

  // UI
  private statsText?: Phaser.GameObjects.Text;
  private timerText?: Phaser.GameObjects.Text;
  private energyText?: Phaser.GameObjects.Text;
  private selectionText?: Phaser.GameObjects.Text;

  // Visual
  private nodeGraphics = new Map<string, Phaser.GameObjects.Container>();
  private connectionGraphics = new Map<string, Phaser.GameObjects.Graphics>();
  private nodePositions = new Map<string, { x: number; y: number }>();

  // Selection
  private selectedNode: Node | null = null;

  constructor() {
    super('Game');
  }

  create() {
    const { width, height } = this.scale;

    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x001122);

    this.createBackground();
    this.createStars();
    this.createGrid();
    this.createHUD();
    this.initializeGame();
    this.setupInputHandlers();

    const centerX = width / 2;
    const centerY = height / 2;
    const startText = this.add.text(centerX, centerY, 'NEXA\n\nClick your nodes to select\nThen click edges to assign energy', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '24px',
      color: '#00ffff',
      align: 'center',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: startText,
      alpha: 1,
      duration: 1000,
      yoyo: true,
      hold: 2000,
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

    this.statsText = this.add.text(20, 20, 'Initializing...', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '18px',
      color: '#00ffff',
    });

    const centerX = width / 2;
    this.timerText = this.add.text(centerX, 20, 'TIME: 3:00', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '24px',
      color: '#ffaa00',
    }).setOrigin(0.5, 0);

    this.energyText = this.add.text(width - 20, 20, 'ENERGY: 0', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '18px',
      color: '#00ff88',
    }).setOrigin(1, 0);

    const bottomBar = this.add.graphics();
    bottomBar.fillStyle(0x001122, 0.8);
    bottomBar.fillRect(0, height - 80, width, 80);

    this.add.text(centerX, height - 50, 'Left-click: Select node | Left-click edge: +10 energy | Right-click edge: -10 energy', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5);

    this.selectionText = this.add.text(centerX, height - 30, '', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '14px',
      color: '#ffaa00',
    }).setOrigin(0.5);
  }

  private initializeGame(): void {
    const { width, height } = this.scale;

    this.nodePositions.set('node-1', { x: width * 0.25, y: height * 0.3 });
    this.nodePositions.set('node-2', { x: width * 0.75, y: height * 0.3 });
    this.nodePositions.set('node-3', { x: width * 0.4, y: height * 0.6 });
    this.nodePositions.set('node-4', { x: width * 0.6, y: height * 0.6 });

    const factory = GameFactory.getInstance();

    const graphConfig = {
      nodes: [
        { id: 'node-1', type: NodeType.BASIC, ownerId: 'player-1', defenseEnergy: 100, isInitialNode: true },
        { id: 'node-2', type: NodeType.BASIC, ownerId: 'player-2', defenseEnergy: 100, isInitialNode: true },
        { id: 'node-3', type: NodeType.BASIC, ownerId: null, defenseEnergy: 50, isInitialNode: false },
        { id: 'node-4', type: NodeType.BASIC, ownerId: null, defenseEnergy: 50, isInitialNode: false },
      ],
      edges: [
        { sourceId: 'node-1', targetId: 'node-3', weight: 1 },
        { sourceId: 'node-2', targetId: 'node-3', weight: 1 },
        { sourceId: 'node-1', targetId: 'node-2', weight: 1 },
        { sourceId: 'node-3', targetId: 'node-4', weight: 1 },
        { sourceId: 'node-2', targetId: 'node-4', weight: 1 },
      ],
    };

    const playersConfig = [
      { id: 'player-1', username: 'Player 1', color: '#00ffff', type: PlayerType.HUMAN, initialNodeId: 'node-1' },
      { id: 'player-2', username: 'Player 2', color: '#ff00ff', type: PlayerType.AI, initialNodeId: 'node-2' },
    ];

    try {
      const result = factory.createGame(graphConfig, playersConfig);
      this.gameController = result.gameController;
      this.currentPlayer = result.players[0];
      this.energyCommandService = new EnergyCommandService();

      this.gameController.startGame(result.gameState);
      console.log('[Game] Initialized:', result.graph.nodes.size, 'nodes');

      result.graph.nodes.forEach(node => this.renderNode(node));
      result.graph.edges.forEach(edge => this.renderConnection(edge));
    }
    catch (error) {
      console.error('[Game] Failed:', error);
    }
  }

  private setupInputHandlers(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const x = pointer.x;
      const y = pointer.y;
      const gameState = this.gameController?.getGameState();
      if (!gameState) return;

      let clickedNode: Node | null = null;
      let minDist = 35;

      gameState.graph.nodes.forEach((node) => {
        const pos = this.nodePositions.get(String(node.id));
        if (!pos) return;
        const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        if (dist < minDist) {
          minDist = dist;
          clickedNode = node;
        }
      });

      if (clickedNode) {
        this.handleNodeClick(clickedNode);
        return;
      }

      if (this.selectedNode) {
        let clickedEdge: Edge | null = null;
        let minDist = 15;

        gameState.graph.edges.forEach((edge) => {
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

        if (clickedEdge) {
          this.handleEdgeClick(clickedEdge, pointer.rightButtonDown());
        }
      }
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.gameController?.isGameActive()) {
        this.gameController.pauseGame();
      }
      else {
        this.gameController?.resumeGame();
      }
    });

    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MainMenu'));
    this.input.keyboard?.on('keydown-C', () => {
      this.selectedNode = null;
      this.selectionText?.setText('');
    });
  }

  private distanceToSegment(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
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
      this.selectionText?.setText(`Selected: Node ${node.id} | Energy: ${Math.floor(node.energyPool)}`);
    }
    else {
      this.selectedNode = null;
      this.selectionText?.setText('Cannot select enemy/neutral node');
    }
  }

  private handleEdgeClick(edge: Edge, isRightClick: boolean): void {
    if (!this.selectedNode || !this.currentPlayer || !this.energyCommandService) return;

    const amount = 10;
    const result = isRightClick
      ? this.energyCommandService.removeEnergyFromEdge(this.currentPlayer, this.selectedNode, edge, amount)
      : this.energyCommandService.assignEnergyToEdge(this.currentPlayer, this.selectedNode, edge, amount);

    if (result.success) {
      this.selectionText?.setText(`${isRightClick ? '-' : '+'}${amount} energy | ${Math.floor(this.selectedNode.energyPool)} left`);
    }
    else {
      this.selectionText?.setText(`Error: ${result.error}`);
    }
  }

  update(): void {
    this.updateHUD();
    this.updateVisuals();
  }

  private updateHUD(): void {
    if (!this.gameController) return;
    const snapshot = this.gameController.getSnapshot();
    if (!snapshot) return;

    const timeRemaining = Math.max(0, 180 - snapshot.elapsedTime / 1000);
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = Math.floor(timeRemaining % 60);
    this.timerText?.setText(`TIME: ${minutes}:${seconds.toString().padStart(2, '0')}`);

    const gameState = this.gameController.getGameState();
    if (gameState) {
      const p1Nodes = Array.from(gameState.graph.nodes).filter(n => n.owner?.id === 'player-1').length;
      const p2Nodes = Array.from(gameState.graph.nodes).filter(n => n.owner?.id === 'player-2').length;
      this.statsText?.setText(`P1: ${p1Nodes} nodes | P2: ${p2Nodes} nodes`);

      if (this.currentPlayer) {
        const totalEnergy = Array.from(gameState.graph.nodes)
          .filter(n => n.owner?.id === this.currentPlayer?.id)
          .reduce((sum, n) => sum + n.energyPool, 0);
        this.energyText?.setText(`ENERGY: ${Math.floor(totalEnergy)}`);
      }
    }
  }

  private updateVisuals(): void {
    const gameState = this.gameController?.getGameState();
    if (!gameState) return;

    gameState.graph.nodes.forEach(node => this.renderNode(node));
    gameState.graph.edges.forEach(edge => this.renderConnection(edge));
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
    if (node.owner?.id === 'player-1') color = 0x00ffff;
    if (node.owner?.id === 'player-2') color = 0xff00ff;

    const radius = 30;
    const circle = this.add.circle(0, 0, radius, color, 0.8);
    const border = this.add.circle(0, 0, radius + 2, color, 0).setStrokeStyle(2, color, 1);
    const text = this.add.text(0, 0, 'N', { fontFamily: 'Orbitron, monospace', fontSize: '20px', color: '#fff' }).setOrigin(0.5);
    const energyText = this.add.text(0, radius + 15, Math.floor(node.energyPool).toString(), {
      fontFamily: 'Orbitron, monospace',
      fontSize: '14px',
      color: '#00ff88',
    }).setOrigin(0.5);

    container.add([circle, border, text, energyText]);
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
  }
}
