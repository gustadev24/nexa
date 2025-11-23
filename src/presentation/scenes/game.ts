import { PLAYER_COLORS } from '../../core/constants/player';
import { AIController } from '../../application/ai-controller';
import { GameManager } from '../../application/game-manager';
import { ConnectionState, NodeType, PlayerType } from '../../core/types/common';
import type { IConnection } from '../../core/types/connection';
import type { INode } from '../../core/types/node';
import type { IPlayer } from '../../core/types/player';
import { Scene } from 'phaser';

/**
 * Game Scene - NEXA
 *
 * Main gameplay scene where the strategic network expansion happens.
 * Refactored to align with NEXA document specifications:
 * - Real-time gameplay with intervals (20ms attack, 30ms defense)
 * - Conservative energy system (distributed, not consumed)
 * - Energy in transit visualization
 * - Victory by controlling 70% nodes for 10 seconds
 * - 3-minute time limit
 */
export class Game extends Scene {
  private camera?: Phaser.Cameras.Scene2D.Camera;
  private infoText?: Phaser.GameObjects.Text;
  private gameManager: GameManager;
  private aiController: AIController;
  private statsText?: Phaser.GameObjects.Text;
  private timerText?: Phaser.GameObjects.Text;
  private energyText?: Phaser.GameObjects.Text;

  // Visual representations
  private nodeGraphics = new Map<string, Phaser.GameObjects.Container>();
  private connectionGraphics = new Map<string, Phaser.GameObjects.Graphics>();
  private energyPacketGraphics = new Map<string, Phaser.GameObjects.Arc>();

  constructor() {
    super('Game');
    this.gameManager = GameManager.getInstance();
    this.aiController = AIController.getInstance();
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    this.camera = this.cameras.main;

    // Set this scene as active in GameManager
    this.gameManager.setActiveScene(this);

    // Initialize game if not already done
    if (!this.gameManager.isInitialized()) {
      this.initializeGame();
    }

    // Initialize AI Controller
    this.aiController.initialize();

    // Start the game
    if (!this.gameManager.isPlaying()) {
      const started = this.gameManager.startGame();
      if (started) {
        console.log('[NEXA] Game started successfully (Real-Time System)');
      }
    }

    // Create game background
    this.createBackground();

    // Create grid overlay
    this.createGrid();

    // Add HUD elements
    this.createHUD();

    // Render game state
    this.renderGameState();

    // Temporary info text
    this.infoText = this.add
      .text(
        centerX,
        centerY,
        'NEXA - Real-Time Strategy\n\nControl 70% of nodes for 10 seconds to win!\n\nPress R to Reset | ESC to Menu',
        {
          fontFamily: 'Arial',
          fontSize: '20px',
          color: '#00FFFF',
          align: 'center',
          stroke: '#001122',
          strokeThickness: 4,
        },
      )
      .setOrigin(0.5)
      .setAlpha(0);

    // Fade in animation
    this.tweens.add({
      targets: this.infoText,
      alpha: 1,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        // Fade out after 3 seconds
        this.time.delayedCall(3000, () => {
          this.tweens.add({
            targets: this.infoText,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
          });
        });
      },
    });

    // Setup input handlers
    this.setupInputHandlers();

    // Camera fade in
    this.cameras.main.fadeIn(500, 0, 17, 34);

    console.log('[NEXA] Game Scene: Ready');
    this.logGameState();
  }

  private createBackground() {
    const { width, height } = this.scale;

    // Dark space-like background
    this.camera?.setBackgroundColor(0x001122);

    // Add gradient effect with overlapping rectangles
    const gradient1 = this.add.rectangle(0, 0, width, height / 3, 0x002244, 0.3);
    gradient1.setOrigin(0, 0);

    const gradient2 = this.add.rectangle(0, height / 3, width, height / 3, 0x001a33, 0.2);
    gradient2.setOrigin(0, 0);

    const gradient3 = this.add.rectangle(0, (height * 2) / 3, width, height / 3, 0x002244, 0.3);
    gradient3.setOrigin(0, 0);

    // Animated stars effect
    this.createStars();
  }

  private createStars() {
    const { width, height } = this.scale;

    // Create random "stars" (small circles)
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.3, 0.8);

      const star = this.add.circle(x, y, size, 0x00ffff, alpha);

      // Twinkle animation
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

  private createGrid() {
    const { width, height } = this.scale;
    const graphics = this.add.graphics();

    graphics.lineStyle(1, 0x00ffff, 0.15);

    // Vertical lines
    const gridSpacing = 80;
    for (let x = 0; x < width; x += gridSpacing) {
      graphics.lineBetween(x, 0, x, height);
    }

    // Horizontal lines
    for (let y = 0; y < height; y += gridSpacing) {
      graphics.lineBetween(0, y, width, y);
    }

    // Add some accent lines
    graphics.lineStyle(2, 0x00ffff, 0.3);
    graphics.lineBetween(0, height / 2, width, height / 2);
    graphics.lineBetween(width / 2, 0, width / 2, height);

    // Subtle grid pulse
    this.tweens.add({
      targets: graphics,
      alpha: 0.3,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createHUD() {
    const { width, height } = this.scale;

    // Top bar
    const topBar = this.add.rectangle(0, 0, width, 60, 0x001a33, 0.8);
    topBar.setOrigin(0, 0);
    topBar.setDepth(100);

    // Game title in HUD
    this.add
      .text(20, 20, 'NEXA', {
        fontFamily: 'Arial Black',
        fontSize: '24px',
        color: '#00FFFF',
      })
      .setDepth(101);

    // Dynamic stats text
    this.statsText = this.add
      .text(width - 20, 20, this.getStatsText(), {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#00AAAA',
      })
      .setOrigin(1, 0)
      .setDepth(101);

    // Timer text (3 minute countdown)
    const { width: screenWidth } = this.scale;
    const centerX = screenWidth / 2;
    this.timerText = this.add
      .text(centerX, 20, 'Time: 3:00', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#00FFFF',
      })
      .setOrigin(0.5, 0)
      .setDepth(101);

    // Energy text
    this.energyText = this.add
      .text(20, 70, 'Energy: 100 / 100', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#00FFAA',
      })
      .setOrigin(0, 0)
      .setDepth(101);

    // Bottom bar
    const bottomBar = this.add.rectangle(0, height - 50, width, 50, 0x001a33, 0.8);
    bottomBar.setOrigin(0, 0);
    bottomBar.setDepth(100);

    // Instructions
    this.add
      .text(width / 2, height - 25, 'NEXA Real-Time System | Press R to Reset', {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#006666',
      })
      .setOrigin(0.5)
      .setDepth(101);
  }

  /**
   * Initialize the game with test data
   * Aligned with NEXA document specifications
   */
  private initializeGame(): void {
    console.log('[Game Scene] Initializing game (NEXA System)...');

    // Initialize GameManager
    this.gameManager.initialize();

    // Create test nodes first
    const node1: INode = {
      id: 'node-1',
      owner: 'player-1',
      defenseEnergy: 50,
      connections: ['node-2', 'node-3'],
      position: { x: 200, y: 384 },
      type: NodeType.BASIC,
      lastUpdateTime: Date.now(),
      isUnderAttack: false,
      isInitialNode: true, // Player 1's initial node
    };

    const node2: INode = {
      id: 'node-2',
      owner: 'player-2',
      defenseEnergy: 50,
      connections: ['node-1', 'node-3'],
      position: { x: 824, y: 384 },
      type: NodeType.BASIC,
      lastUpdateTime: Date.now(),
      isUnderAttack: false,
      isInitialNode: true, // Player 2's initial node (AI)
    };

    const node3: INode = {
      id: 'node-3',
      owner: null, // Neutral node
      defenseEnergy: 20,
      connections: ['node-1', 'node-2'],
      position: { x: 512, y: 384 },
      type: NodeType.ENERGY, // Energy node - gives bonus when captured
      lastUpdateTime: Date.now(),
      isUnderAttack: false,
      isInitialNode: false,
    };

    this.gameManager.addNode(node1);
    this.gameManager.addNode(node2);
    this.gameManager.addNode(node3);

    // Create connections
    const conn1: IConnection = {
      id: 'conn-1-2',
      sourceNodeId: 'node-1',
      targetNodeId: 'node-2',
      state: ConnectionState.ACTIVE,
      weight: 100,
      energyPackets: [],
      assignedEnergy: 0,
      isBidirectional: true,
    };

    const conn2: IConnection = {
      id: 'conn-1-3',
      sourceNodeId: 'node-1',
      targetNodeId: 'node-3',
      state: ConnectionState.ACTIVE,
      weight: 80,
      energyPackets: [],
      assignedEnergy: 0,
      isBidirectional: true,
    };

    const conn3: IConnection = {
      id: 'conn-2-3',
      sourceNodeId: 'node-2',
      targetNodeId: 'node-3',
      state: ConnectionState.ACTIVE,
      weight: 80,
      energyPackets: [],
      assignedEnergy: 0,
      isBidirectional: true,
    };

    this.gameManager.addConnection(conn1);
    this.gameManager.addConnection(conn2);
    this.gameManager.addConnection(conn3);

    // Create test players with initial nodes
    const player1: IPlayer = {
      id: 'player-1',
      name: 'Player 1',
      color: PLAYER_COLORS.BLUE,
      score: 0,
      type: PlayerType.HUMAN,
      isActive: true,
      isEliminated: false,
      totalEnergy: 100, // Conservative energy pool
      initialNodeId: 'node-1', // Starting node
      controlledNodes: ['node-1'],
    };

    const player2: IPlayer = {
      id: 'player-2',
      name: 'AI Opponent',
      color: PLAYER_COLORS.RED,
      score: 0,
      type: PlayerType.AI,
      isActive: true,
      isEliminated: false,
      totalEnergy: 100, // Conservative energy pool
      initialNodeId: 'node-2', // Starting node
      controlledNodes: ['node-2'],
    };

    this.gameManager.addPlayer(player1);
    this.gameManager.addPlayer(player2);

    console.log('[Game Scene] Game initialized with 2 players (NEXA System)');
    console.log('[Game Scene] - 3 nodes (2 owned, 1 neutral energy node)');
    console.log('[Game Scene] - 3 connections');
  }

  /**
   * Setup keyboard and mouse input handlers
   */
  private setupInputHandlers(): void {
    // ESC - Return to menu
    this.input.keyboard?.on('keydown-ESC', () => {
      this.returnToMenu();
    });

    // R - Reset game
    this.input.keyboard?.on('keydown-R', () => {
      this.resetGame();
    });

    // P - Pause/Resume
    this.input.keyboard?.on('keydown-P', () => {
      if (this.gameManager.isPlaying()) {
        this.gameManager.pauseGame();
        console.log('[Game Scene] Game PAUSED');
      }
      else if (this.gameManager.isPaused()) {
        this.gameManager.resumeGame();
        console.log('[Game Scene] Game RESUMED');
      }
      this.updateHUD();
    });
  }

  /**
   * Reset the game
   */
  private resetGame(): void {
    console.log('[Game Scene] Resetting game (NEXA System)...');

    // Clear graphics
    this.nodeGraphics.forEach(g => g.destroy());
    this.connectionGraphics.forEach(g => g.destroy());
    this.energyPacketGraphics.forEach(g => g.destroy());
    this.nodeGraphics.clear();
    this.connectionGraphics.clear();
    this.energyPacketGraphics.clear();

    this.gameManager.resetGame();
    this.initializeGame();
    this.gameManager.startGame();

    this.renderGameState();
    this.updateHUD();

    // Show reset feedback
    const { width, height } = this.scale;
    const resetText = this.add
      .text(width / 2, height / 2 - 100, 'Game Reset!', {
        fontFamily: 'Arial Black',
        fontSize: '48px',
        color: '#00FFFF',
        stroke: '#001122',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: resetText,
      alpha: 1,
      duration: 300,
      yoyo: true,
      hold: 1000,
      onComplete: () => {
        resetText.destroy();
      },
    });
  }

  /**
   * Get formatted stats text
   */
  private getStatsText(): string {
    const stats = this.gameManager.getStats();
    return `Players: ${stats.players} | Nodes: ${stats.nodes}`;
  }

  /**
   * Update HUD with current game state
   */
  private updateHUD(): void {
    if (this.statsText) {
      this.statsText.setText(this.getStatsText());
    }

    // Update timer (3 minute countdown)
    const stats = this.gameManager.getStats();
    const timeRemaining = stats.timeRemaining;
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    if (this.timerText) {
      this.timerText.setText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`);

      // Change color when time is running out
      if (timeRemaining < 30000) {
        this.timerText.setColor('#FF3232');
      }
      else if (timeRemaining < 60000) {
        this.timerText.setColor('#FFAA00');
      }
      else {
        this.timerText.setColor('#00FFFF');
      }
    }

    // Update energy text (show player's energy distribution)
    const gameState = this.gameManager.getGameState();
    if (gameState && this.energyText) {
      const player = Array.from(gameState.players.values())[0]; // Player 1
      if (player) {
        let assignedEnergy = 0;
        gameState.connections.forEach((conn) => {
          const sourceNode = gameState.nodes.get(conn.sourceNodeId);
          if (sourceNode && sourceNode.owner === player.id) {
            assignedEnergy += conn.assignedEnergy;
          }
        });
        const defenseEnergy = player.totalEnergy - assignedEnergy;
        this.energyText.setText(
          `Energy: ${player.totalEnergy} (Attack: ${assignedEnergy.toFixed(0)} | Defense: ${defenseEnergy.toFixed(0)})`,
        );
      }
    }
  }

  /**
   * Log current game state to console
   */
  private logGameState(): void {
    const stats = this.gameManager.getStats();
    console.log('[Game Scene] Current State:', {
      phase: stats.phase,
      players: stats.players,
      nodes: stats.nodes,
      connections: stats.connections,
      turn: stats.turn,
    });
  }

  /**
   * Render the game state visually
   * Draw nodes, connections, and energy packets
   */
  private renderGameState(): void {
    const gameState = this.gameManager.getGameState();
    if (!gameState) return;

    // Render connections first (so they're behind nodes)
    gameState.connections.forEach((connection) => {
      this.renderConnection(connection);
    });

    // Render nodes
    gameState.nodes.forEach((node) => {
      this.renderNode(node);
    });
  }

  /**
   * Render a node
   */
  private renderNode(node: INode): void {
    const nodeIdStr = String(node.id);
    let container = this.nodeGraphics.get(nodeIdStr);

    if (!container) {
      container = this.add.container(node.position.x, node.position.y);
      this.nodeGraphics.set(nodeIdStr, container);
    }

    // Clear container
    container.removeAll(true);

    // Determine color based on owner
    let color = 0x888888; // Neutral gray
    if (node.owner) {
      const player = this.gameManager.getPlayer(node.owner);
      if (player) {
        color = Phaser.Display.Color.GetColor(player.color.r, player.color.g, player.color.b);
      }
    }

    // Draw node circle
    const radius = node.isInitialNode ? 30 : 25;
    const circle = this.add.circle(0, 0, radius, color, 0.8);
    container.add(circle);

    // Draw node border (thicker for initial nodes)
    const borderWidth = node.isInitialNode ? 4 : 2;
    const border = this.add.circle(0, 0, radius, color, 0).setStrokeStyle(borderWidth, color);
    container.add(border);

    // Draw node type indicator
    let typeText = '';
    if (node.type === NodeType.ENERGY) typeText = 'E';
    else if (node.type === NodeType.ATTACK) typeText = 'A';
    else if (node.type === NodeType.DEFENSE) typeText = 'D';
    else if (node.type === NodeType.SUPER_ENERGY) typeText = 'S';

    if (typeText) {
      const text = this.add
        .text(0, 0, typeText, {
          fontFamily: 'Arial Black',
          fontSize: '16px',
          color: '#FFFFFF',
        })
        .setOrigin(0.5);
      container.add(text);
    }

    // Show defense energy below node
    if (node.defenseEnergy > 0) {
      const defenseText = this.add
        .text(0, radius + 10, `${node.defenseEnergy.toFixed(0)}`, {
          fontFamily: 'Arial',
          fontSize: '12px',
          color: '#00FFAA',
        })
        .setOrigin(0.5, 0);
      container.add(defenseText);
    }
  }

  /**
   * Render a connection
   */
  private renderConnection(connection: IConnection): void {
    const connectionIdStr = String(connection.id);
    let graphics = this.connectionGraphics.get(connectionIdStr);

    if (!graphics) {
      graphics = this.add.graphics();
      this.connectionGraphics.set(connectionIdStr, graphics);
    }

    graphics.clear();

    const gameState = this.gameManager.getGameState();
    if (!gameState) return;

    const sourceNode = gameState.nodes.get(connection.sourceNodeId);
    const targetNode = gameState.nodes.get(connection.targetNodeId);

    if (!sourceNode || !targetNode) return;

    // Draw line between nodes
    graphics.lineStyle(2, 0x00ffff, 0.3);
    graphics.lineBetween(
      sourceNode.position.x,
      sourceNode.position.y,
      targetNode.position.x,
      targetNode.position.y,
    );

    // Show assigned energy on connection
    if (connection.assignedEnergy > 0) {
      const midX = (sourceNode.position.x + targetNode.position.x) / 2;
      const midY = (sourceNode.position.y + targetNode.position.y) / 2;

      // This text will be recreated each frame, which is not ideal but works for now
      const energyText = this.add
        .text(midX, midY, `${connection.assignedEnergy.toFixed(0)}`, {
          fontFamily: 'Arial',
          fontSize: '10px',
          color: '#FFAA00',
          backgroundColor: '#001122',
        })
        .setOrigin(0.5);

      // Store temporarily (will be cleared on next render)
      this.time.delayedCall(100, () => energyText.destroy());
    }
  }

  private returnToMenu() {
    console.log('[NEXA] Returning to menu...');

    // Fade out
    this.cameras.main.fadeOut(500, 0, 17, 34);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MainMenu');
    });
  }

  update(_time: number, delta: number) {
    // Real-time game loop aligned with NEXA document
    if (this.gameManager.isPlaying()) {
      // Update GameManager (handles attack/defense intervals, energy packets, victory conditions)
      this.gameManager.update(delta);

      // AI decision making
      this.aiController.update(delta);

      // Update visual representation
      this.updateVisuals();

      // Update HUD periodically (every 100ms to avoid too many updates)
      if (_time % 100 < delta) {
        this.updateHUD();
      }
    }
  }

  /**
   * Update visual representation of game state
   */
  private updateVisuals(): void {
    const gameState = this.gameManager.getGameState();
    if (!gameState) return;

    // Update nodes
    gameState.nodes.forEach((node) => {
      this.renderNode(node);
    });

    // Update connections (to show energy packets)
    gameState.connections.forEach((connection) => {
      this.renderConnection(connection);
      this.renderEnergyPackets(connection);
    });
  }

  /**
   * Render energy packets traveling through connections
   */
  private renderEnergyPackets(connection: IConnection): void {
    const gameState = this.gameManager.getGameState();
    if (!gameState) return;

    const sourceNode = gameState.nodes.get(connection.sourceNodeId);
    const targetNode = gameState.nodes.get(connection.targetNodeId);

    if (!sourceNode || !targetNode) return;

    // Clear old packets for this connection
    const connectionIdStr = String(connection.id);
    const oldPackets = Array.from(this.energyPacketGraphics.entries()).filter(([id]) =>
      id.startsWith(`packet-${connectionIdStr}-`),
    );
    oldPackets.forEach(([id, graphic]) => {
      graphic.destroy();
      this.energyPacketGraphics.delete(id);
    });

    // Render current packets
    connection.energyPackets.forEach((packet) => {
      const graphicId = `packet-${connectionIdStr}-${String(packet.id)}`;

      // Calculate position based on progress
      const x
        = sourceNode.position.x + (targetNode.position.x - sourceNode.position.x) * packet.progress;
      const y
        = sourceNode.position.y + (targetNode.position.y - sourceNode.position.y) * packet.progress;

      // Get owner color
      const owner = gameState.players.get(packet.ownerId);
      let color = 0xffffff;
      if (owner) {
        color = Phaser.Display.Color.GetColor(owner.color.r, owner.color.g, owner.color.b);
      }

      // Create or update packet graphic
      let circle = this.energyPacketGraphics.get(graphicId);
      if (!circle) {
        circle = this.add.circle(x, y, 4, color, 1);
        this.energyPacketGraphics.set(graphicId, circle);
      }
      else {
        circle.setPosition(x, y);
        circle.setFillStyle(color, 1);
      }
    });
  }
}
