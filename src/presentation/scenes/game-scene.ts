import { Scene } from 'phaser';
import type { GameController } from '@/presentation/game/game-controller';
import { NodeType } from '@/core/types/id';
import type { Node } from '@/core/entities/node/node';
import type { Edge } from '@/core/entities/edge';
import type { Graph } from '@/core/entities/graph';
import { EnergyCommandService } from '@/application/services/energy-command-service';
import { AIControllerService } from '@/application/services/ai-controller.service';
import type { Player } from '@/core/entities/player';
import { GameFactory, type GraphConfig, type NodeConfig } from '@/presentation/game/game-factory';

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

  // Selection
  private selectedNode: Node | null = null;

  // Graph config
  private graphConfig: GraphConfig | null = null;

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
    this.generateRandomGraph();
    this.setupInputHandlers();

    const centerX = width / 2;
    const centerY = height / 2;
    const startText = this.add.text(
      centerX,
      centerY,
      'NEXA - Energy Generator Strategy\n\n'
      + 'How it works:\n'
      + '1. ASSIGN energy to edges (+10/-10 per click)\n'
      + '2. Node GENERATES packets every 1 second\n'
      + '3. Pool NEVER decreases - infinite generator!\n'
      + '4. Defense = Pool - Assigned (unused energy)\n'
      + '5. Capture node → Assigned energy transfers to it!\n'
      + '6. Packets TRAVEL ~3-4s and attack on arrival\n\n'
      + 'Nodes are INFINITE GENERATORS!\n\n'
      + 'Click any neutral node to start',
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

    this.statsText = this.add.text(20, 20, 'Waiting for players...', {
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
    bottomBar.fillRect(0, height - 100, width, 100);

    this.phaseText = this.add.text(
      centerX,
      height - 75,
      'SELECT YOUR BASE NODE',
      {
        fontFamily: 'Orbitron, monospace',
        fontSize: '16px',
        color: '#ffaa00',
      },
    ).setOrigin(0.5);

    this.add.text(
      centerX,
      height - 50,
      'GENERATORS (infinite) | Capture → Assigned energy transfers | Defense = Pool - Assigned',
      {
        fontFamily: 'Orbitron, monospace',
        fontSize: '11px',
        color: '#888888',
      },
    ).setOrigin(0.5);

    this.selectionText = this.add.text(centerX, height - 25, '', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '14px',
      color: '#ffaa00',
    }).setOrigin(0.5);

    // Reset button
    this.resetButton = this.add.text(width - 20, height - 25, 'RESET (R)', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '14px',
      color: '#ff6666',
    }).setOrigin(1, 0.5).setInteractive();

    this.resetButton.on('pointerdown', () => this.resetGame());
    this.resetButton.on('pointerover', () => this.resetButton?.setColor('#ff0000'));
    this.resetButton.on('pointerout', () => this.resetButton?.setColor('#ff6666'));
  }

  private generateRandomGraph(): void {
    const { width, height } = this.scale;

    // Generate 8-12 nodes
    const nodeCount = Phaser.Math.Between(8, 12);
    const nodes = [];
    const edges = [];

    // Create positions (circular distribution with variation)
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;

    // Distribute node types:
    // 50% BASIC, 20% ENERGY, 15% ATTACK, 10% DEFENSE, 5% FAST_REGEN
    const nodeTypes: NodeType[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const rand = Math.random();
      if (rand < 0.5) {
        nodeTypes.push(NodeType.BASIC);
      }
      else if (rand < 0.7) {
        nodeTypes.push(NodeType.ENERGY);
      }
      else if (rand < 0.85) {
        nodeTypes.push(NodeType.ATTACK);
      }
      else if (rand < 0.95) {
        nodeTypes.push(NodeType.DEFENSE);
      }
      else {
        nodeTypes.push(NodeType.FAST_REGEN);
      }
    }

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radiusVariation = Phaser.Math.FloatBetween(0.8, 1.2);
      const x = centerX + Math.cos(angle) * radius * radiusVariation;
      const y = centerY + Math.sin(angle) * radius * radiusVariation;

      const nodeId = `node-${i + 1}`;
      this.nodePositions.set(nodeId, { x, y });

      const nodeType = nodeTypes[i];
      const defenseEnergy = nodeType === NodeType.ENERGY ? 30 : 50;

      nodes.push({
        id: nodeId,
        type: nodeType,
        ownerId: null,
        defenseEnergy,
        isInitialNode: false,
      });
    }

    // Create edges - ring + random connections
    for (let i = 0; i < nodeCount; i++) {
      const sourceId = `node-${i + 1}`;

      // Connect to next (ring)
      const nextId = `node-${((i + 1) % nodeCount) + 1}`;
      edges.push({ sourceId, targetId: nextId, weight: 1 });

      // Add random connections
      if (Phaser.Math.Between(0, 100) < 60) {
        const skipCount = Phaser.Math.Between(2, Math.floor(nodeCount / 3));
        const targetIdx = (i + skipCount) % nodeCount;
        const targetId = `node-${targetIdx + 1}`;

        const edgeExists = edges.some(
          e => (e.sourceId === sourceId && e.targetId === targetId)
            || (e.sourceId === targetId && e.targetId === sourceId),
        );

        if (!edgeExists && targetId !== sourceId) {
          edges.push({ sourceId, targetId, weight: 1 });
        }
      }
    }

    this.graphConfig = { nodes, edges };
    this.renderInitialGraph();
  }

  private renderInitialGraph(): void {
    if (!this.graphConfig) return;

    // Render edges
    this.graphConfig.edges.forEach((edgeConfig) => {
      const posA = this.nodePositions.get(edgeConfig.sourceId);
      const posB = this.nodePositions.get(edgeConfig.targetId);
      if (!posA || !posB) return;

      const edgeId = `${edgeConfig.sourceId}-${edgeConfig.targetId}`;
      const graphics = this.add.graphics();
      graphics.lineStyle(2, 0x004466, 0.6);
      graphics.lineBetween(posA.x, posA.y, posB.x, posB.y);
      this.connectionGraphics.set(edgeId, graphics);
    });

    // Render nodes
    this.graphConfig.nodes.forEach((nodeConfig) => {
      this.renderInitialNode(nodeConfig);
    });
  }

  private renderInitialNode(nodeConfig: NodeConfig): void {
    const pos = this.nodePositions.get(nodeConfig.id);
    if (!pos) return;

    const container = this.add.container(pos.x, pos.y);
    this.nodeGraphics.set(nodeConfig.id, container);

    let color = 0x888888;
    let label = 'N';

    switch (nodeConfig.type) {
      case NodeType.ENERGY:
        color = 0xffaa00;
        label = 'E';
        break;
      case NodeType.ATTACK:
        color = 0xff4444;
        label = 'A';
        break;
      case NodeType.DEFENSE:
        color = 0x4444ff;
        label = 'D';
        break;
      case NodeType.FAST_REGEN:
        color = 0x44ff44;
        label = 'F';
        break;
      default:
        color = 0x888888;
        label = 'N';
    }

    const radius = 30;
    const circle = this.add.circle(0, 0, radius, color, 0.6);
    const border = this.add.circle(0, 0, radius + 2, color, 0).setStrokeStyle(2, color, 1);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '20px',
      color: '#fff',
    }).setOrigin(0.5);
    const energyText = this.add.text(0, radius + 15, nodeConfig.defenseEnergy?.toString() || '50', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '14px',
      color: '#00ff88',
    }).setOrigin(0.5);

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

    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MainMenu'));
    this.input.keyboard?.on('keydown-R', () => this.resetGame());
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
    if (!this.graphConfig) return;

    // AI picks random node different from player
    const availableNodes = this.graphConfig.nodes.filter(
      n => n.id !== this.playerSelectedNodeId,
    );

    if (availableNodes.length === 0) return;

    const aiNode = Phaser.Utils.Array.GetRandom(availableNodes);
    this.aiSelectedNodeId = aiNode.id;
    this.highlightSelectedNode(aiNode.id, 0xff00ff);

    this.gamePhase = GamePhase.WAITING_AI_SELECTION;
    this.phaseText?.setText('STARTING GAME...');

    // Start the game
    setTimeout(() => this.initializeGameWithSelections(), 1000);
  }

  private highlightSelectedNode(nodeId: string, color: number): void {
    const container = this.nodeGraphics.get(nodeId);
    if (!container) return;

    container.removeAll(true);
    const radius = 30;

    const circle = this.add.circle(0, 0, radius, color, 0.9);
    const border = this.add.circle(0, 0, radius + 2, color, 0).setStrokeStyle(3, color, 1);
    const text = this.add.text(0, 0, 'B', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '20px',
      color: '#fff',
    }).setOrigin(0.5);
    const energyText = this.add.text(0, radius + 15, '100', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '14px',
      color: '#00ff88',
    }).setOrigin(0.5);

    container.add([circle, border, text, energyText]);
  }

  private initializeGameWithSelections(): void {
    if (!this.graphConfig || !this.playerSelectedNodeId || !this.aiSelectedNodeId) return;

    // Update graph config with selected nodes
    const updatedNodes = this.graphConfig.nodes.map((node) => {
      if (node.id === this.playerSelectedNodeId) {
        return { ...node, ownerId: 'player-1', defenseEnergy: 100, isInitialNode: true };
      }
      if (node.id === this.aiSelectedNodeId) {
        return { ...node, ownerId: 'player-2', defenseEnergy: 100, isInitialNode: true };
      }
      return node;
    });

    const updatedGraphConfig = {
      nodes: updatedNodes,
      edges: this.graphConfig.edges,
    };

    const playersConfig = [
      {
        id: 'player-1',
        username: 'Player 1',
        color: '#00ffff',
        initialNodeId: this.playerSelectedNodeId,
      },
      {
        id: 'player-2',
        username: 'AI Player',
        color: '#ff00ff',
        initialNodeId: this.aiSelectedNodeId,
      },
    ];

    try {
      const factory = GameFactory.getInstance();
      const result = factory.createGame(updatedGraphConfig, playersConfig);

      this.gameController = result.gameController;
      this.currentPlayer = result.players[0];
      this.allPlayers = result.players;
      this.gameGraph = result.graph;
      this.energyCommandService = new EnergyCommandService();
      this.aiControllerService = new AIControllerService();

      this.gameController.startGame(result.gameState);
      console.log('[Game] Game started with', result.graph.nodes.size, 'nodes');

      this.gamePhase = GamePhase.PLAYING;
      this.phaseText?.setText('GAME IN PROGRESS');
      this.selectionText?.setText('Select your nodes and assign energy to edges');

      // Render initial state
      result.graph.nodes.forEach(node => this.renderNode(node));
      result.graph.edges.forEach(edge => this.renderConnection(edge));
    }
    catch (error) {
      console.error('[Game] Failed to initialize:', error);
      this.selectionText?.setText(`Error: ${error}`);
    }
  }

  private handleGameplayInput(pointer: Phaser.Input.Pointer): void {
    const gameState: Infrag = this.gameController?.getGameState();
    if (!gameState) return;

    const clickedNodeId = this.findClickedNode(pointer.x, pointer.y);
    if (clickedNodeId) {
      const node = Array.from(gameState.graph.nodes).find(n => String(n.id) === clickedNodeId);
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

    if (this.selectedNode) {
      const clickedEdge = this.findClickedEdge(pointer.x, pointer.y, gameState);
      if (clickedEdge) {
        this.handleEdgeClick(clickedEdge, pointer.rightButtonDown());
      }
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
        `Generator: ${node.id} | Capacity: ${Math.floor(node.energyPool)} | Defense: ${Math.floor(defense)}`,
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
        `GENERATOR: ${node.id} (${Math.floor(node.energyPool)} capacity) - SHIFT+Click destination for continuous flow`,
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

      // Use assignment system instead of instant transfer to prevent energy duplication
      const result = this.energyCommandService.assignEnergyToEdge(
        this.currentPlayer,
        this.redistributionSourceNode,
        edge,
        20, // Assign 20 energy to flow through edge
      );

      if (result.success) {
        this.selectionText?.setText(
          `Generator flow: ${this.redistributionSourceNode.id} → ${node.id} (20/sec continuous) - infinite until stopped!`,
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

  private handleEdgeClick(edge: Edge, isRightClick: boolean): void {
    if (!this.selectedNode || !this.currentPlayer || !this.energyCommandService) return;

    const amount = 10;
    const result = isRightClick
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
        `${isRightClick ? '-' : '+'}${amount} → Flow: ${assignment}/s | Capacity: ${Math.floor(this.selectedNode.energyPool)} | Defense: ${Math.floor(defense)}`,
      );
    }
    else {
      this.selectionText?.setText(`Error: ${result.error}`);
    }
  }

  update(): void {
    if (this.gamePhase === GamePhase.PLAYING) {
      // Run game logic
      this.checkVictory();
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

  private checkVictory(): void {
    if (!this.gameController || this.victoryHandled) return;

    const eliminatedPlayers = this.allPlayers.filter(p => p.isEliminated);
    if (eliminatedPlayers.length > 0) {
      const winner = this.allPlayers.find(p => !p.isEliminated);
      if (winner) {
        this.victoryHandled = true; // Prevent multiple calls
        this.handleVictory(winner);
      }
    }
  }

  private handleVictory(winner: Player): void {
    console.log(`[Game] Victory! Winner: ${winner.username}`);

    // Change phase FIRST to stop all game logic
    this.gamePhase = GamePhase.GAME_OVER;

    // Update phase text immediately
    this.phaseText?.setText('GAME OVER - ' + winner.username + ' WINS!');

    // Stop game controller to freeze state
    if (this.gameController && this.gameController.isGameActive()) {
      this.gameController.stopGame();
    }

    // Show victory overlay AFTER a small delay to ensure final render
    this.time.delayedCall(100, () => {
      const { width, height } = this.scale;
      const victoryBg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);

      const victoryText = this.add.text(
        width / 2,
        height / 2,
        `🏆 ${winner.username} WINS! 🏆\n\nVICTORY BY ELIMINATION\n\n${winner.username === 'Player 1' ? 'You' : 'AI'} captured the enemy base!\n\nPress R to restart\nPress ESC for menu`,
        {
          fontFamily: 'Orbitron, monospace',
          fontSize: '28px',
          color: winner.id === 'player-1' ? '#00ffff' : '#ff00ff',
          align: 'center',
          backgroundColor: '#000000',
          padding: { x: 40, y: 40 },
          stroke: winner.id === 'player-1' ? '#00ffff' : '#ff00ff',
          strokeThickness: 2,
        },
      ).setOrigin(0.5).setDepth(1000);

      this.tweens.add({
        targets: [victoryBg, victoryText],
        alpha: { from: 0, to: 1 },
        scale: { from: 0.8, to: 1 },
        duration: 600,
        ease: 'Back.easeOut',
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
        this.aiControllerService.executeAITurn(aiPlayer, this.gameGraph, Date.now());
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
      this.timerText?.setText(`TIME: ${minutes}:${seconds.toString().padStart(2, '0')}`);
    }

    const gameState = this.gameController.getGameState();
    if (gameState) {
      const p1Nodes = Array.from(gameState.graph.nodes).filter(
        n => n.owner?.id === 'player-1',
      ).length;
      const p2Nodes = Array.from(gameState.graph.nodes).filter(
        n => n.owner?.id === 'player-2',
      ).length;
      this.statsText?.setText(`P1: ${p1Nodes} nodes | P2: ${p2Nodes} nodes`);

      if (this.currentPlayer) {
        const totalCapacity = Array.from(gameState.graph.nodes)
          .filter(n => n.owner?.id === this.currentPlayer?.id)
          .reduce((sum, n) => sum + n.energyPool, 0);

        const totalDefense = Array.from(gameState.graph.nodes)
          .filter(n => n.owner?.id === this.currentPlayer?.id)
          .reduce((sum, n) => sum + n.defenseEnergy(), 0);

        this.energyText?.setText(`GEN: ${Math.floor(totalCapacity)} | DEF: ${Math.floor(totalDefense)}`);
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
    let label = 'N';

    // Determine node type and color
    const nodeType = (node as any).constructor.name;
    if (node.isNeutral()) {
      switch (nodeType) {
        case 'EnergyNode':
          color = 0xffaa00;
          label = 'E';
          break;
        case 'AttackNode':
          color = 0xff4444;
          label = 'A';
          break;
        case 'DefenseNode':
          color = 0x4444ff;
          label = 'D';
          break;
        case 'FastRegenNode':
          color = 0x44ff44;
          label = 'F';
          break;
        default:
          color = 0x888888;
          label = 'N';
      }
    }
    else if (node.owner?.id === 'player-1') {
      color = 0x00ffff;
      label = node === this.currentPlayer?.initialNode ? 'B' : 'P1';
    }
    else if (node.owner?.id === 'player-2') {
      color = 0xff00ff;
      label = node === this.allPlayers[1]?.initialNode ? 'B' : 'P2';
    }

    const radius = 30;
    const circle = this.add.circle(0, 0, radius, color, 0.8);
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

      // Calculate position along the edge
      const x = posA.x + (posB.x - posA.x) * progress;
      const y = posA.y + (posB.y - posA.y) * progress;

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
    this.nodePositions.clear();

    // Reset UI
    this.phaseText?.setText('SELECT YOUR BASE NODE');
    this.selectionText?.setText('');
    this.statsText?.setText('Waiting for players...');
    this.timerText?.setText('TIME: 3:00');
    this.energyText?.setText('ENERGY: 0');

    // Generate new graph
    this.generateRandomGraph();
  }
}
