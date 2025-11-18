import { AIController, GameManager } from "@/core/managers";
import type { IPlayer } from "@/core/types";
import { GAME_CONSTANTS, PLAYER_COLORS, PlayerType } from "@/core/types";
import { Scene } from "phaser";

/**
 * Game Scene - NEXA
 *
 * Main gameplay scene where the strategic network expansion happens.
 * Features a minimalist futuristic design with programmatic graphics.
 */
export class Game extends Scene {
  private camera?: Phaser.Cameras.Scene2D.Camera;
  private infoText?: Phaser.GameObjects.Text;
  private gameManager: GameManager;
  private aiController: AIController;
  private statsText?: Phaser.GameObjects.Text;

  constructor() {
    super("Game");
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

    // Inicializar AI Controller
    this.aiController.initialize();

    // Start the game
    if (!this.gameManager.isPlaying()) {
      const started = this.gameManager.startGame();
      if (started) {
        console.log("[NEXA] Game started successfully");
      }
    }

    // Create game background
    this.createBackground();

    // Create grid overlay
    this.createGrid();

    // Add HUD elements
    this.createHUD();

    // Temporary info text
    this.infoText = this.add
      .text(
        centerX,
        centerY,
        "NEXA - Game Scene\n\nGame Manager Integrated!\n\nPress R to Reset | ESC to Menu",
        {
          fontFamily: "Arial",
          fontSize: "24px",
          color: "#00FFFF",
          align: "center",
          stroke: "#001122",
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
      ease: "Power2",
    });

    // Setup input handlers
    this.setupInputHandlers();

    // Camera fade in
    this.cameras.main.fadeIn(500, 0, 17, 34);

    console.log("[NEXA] Game Scene: Ready");
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
        ease: "Sine.easeInOut",
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
      ease: "Sine.easeInOut",
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
      .text(20, 20, "NEXA", {
        fontFamily: "Arial Black",
        fontSize: "24px",
        color: "#00FFFF",
      })
      .setDepth(101);

    // Dynamic stats text
    this.statsText = this.add
      .text(width - 20, 20, this.getStatsText(), {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#00AAAA",
      })
      .setOrigin(1, 0)
      .setDepth(101);

    // Bottom bar
    const bottomBar = this.add.rectangle(0, height - 50, width, 50, 0x001a33, 0.8);
    bottomBar.setOrigin(0, 0);
    bottomBar.setDepth(100);

    // Instructions
    this.add
      .text(width / 2, height - 25, "GameManager Active | Press R to Reset", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#006666",
      })
      .setOrigin(0.5)
      .setDepth(101);
  }

  /**
   * Initialize the game with test data
   */
  private initializeGame(): void {
    console.log("[Game Scene] Initializing game...");

    // Initialize GameManager
    this.gameManager.initialize();

    // Create test players
    const player1: IPlayer = {
      id: "player-1",
      name: "Player 1",
      color: PLAYER_COLORS.BLUE,
      score: 0,
      type: PlayerType.HUMAN,
      isActive: true,
      isEliminated: false,
      totalEnergy: GAME_CONSTANTS.DEFAULT_ENERGY,
      controlledNodes: [],
    };

    const player2: IPlayer = {
      id: "player-2",
      name: "AI Opponent",
      color: PLAYER_COLORS.RED,
      score: 0,
      type: PlayerType.AI,
      isActive: true,
      isEliminated: false,
      totalEnergy: GAME_CONSTANTS.DEFAULT_ENERGY,
      controlledNodes: [],
    };

    this.gameManager.addPlayer(player1);
    this.gameManager.addPlayer(player2);

    console.log("[Game Scene] Game initialized with 2 players");
  }

  /**
   * Setup keyboard and mouse input handlers
   */
  private setupInputHandlers(): void {
    // ESC - Return to menu
    this.input.keyboard?.on("keydown-ESC", () => {
      this.returnToMenu();
    });

    // R - Reset game
    this.input.keyboard?.on("keydown-R", () => {
      this.resetGame();
    });

    // Space - Next turn (for testing)
    this.input.keyboard?.on("keydown-SPACE", () => {
      if (this.gameManager.isPlaying()) {
        this.gameManager.nextTurn();
        this.updateHUD();
        console.log(`[Game Scene] Turn: ${this.gameManager.getCurrentTurn()}`);
      }
    });

    // P - Pause/Resume
    this.input.keyboard?.on("keydown-P", () => {
      if (this.gameManager.isPlaying()) {
        this.gameManager.pauseGame();
      } else if (this.gameManager.isPaused()) {
        this.gameManager.resumeGame();
      }
      this.updateHUD();
    });
  }

  /**
   * Reset the game
   */
  private resetGame(): void {
    console.log("[Game Scene] Resetting game...");

    this.gameManager.resetGame(true);
    this.initializeGame();
    this.gameManager.startGame();

    this.updateHUD();

    // Show reset feedback
    const { width, height } = this.scale;
    const resetText = this.add
      .text(width / 2, height / 2 - 100, "Game Reset!", {
        fontFamily: "Arial Black",
        fontSize: "48px",
        color: "#00FFFF",
        stroke: "#001122",
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
    return `Players: ${stats.players} | Nodes: ${stats.nodes} | Turn: ${stats.turn}`;
  }

  /**
   * Update HUD with current game state
   */
  private updateHUD(): void {
    if (this.statsText) {
      this.statsText.setText(this.getStatsText());
    }
  }

  /**
   * Log current game state to console
   */
  private logGameState(): void {
    const stats = this.gameManager.getStats();
    console.log("[Game Scene] Current State:", {
      phase: stats.phase,
      players: stats.players,
      nodes: stats.nodes,
      connections: stats.connections,
      turn: stats.turn,
    });
  }

  private returnToMenu() {
    console.log("[NEXA] Returning to menu...");

    // Fade out
    this.cameras.main.fadeOut(500, 0, 17, 34);

    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("MainMenu");
    });
  }

  update(_time: number, delta: number) {
    // Update game manager timestamp
    if (this.gameManager.isPlaying()) {
      this.gameManager.updateTimestamp();

      // AI decision making
      this.aiController.update(delta);
    }

    // Game loop logic will be implemented here:
    // - Node energy generation
    // - Connection updates
    // - Victory condition checks
  }
}
