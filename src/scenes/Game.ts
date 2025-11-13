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

  constructor() {
    super("Game");
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    this.camera = this.cameras.main;

    // Create game background
    this.createBackground();

    // Create grid overlay
    this.createGrid();

    // Add HUD elements
    this.createHUD();

    // Temporary info text
    this.infoText = this.add
      .text(centerX, centerY, "NEXA - Game Scene\n\nClick to return to menu", {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#00FFFF",
        align: "center",
        stroke: "#001122",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Fade in animation
    this.tweens.add({
      targets: this.infoText,
      alpha: 1,
      duration: 1000,
      ease: "Power2",
    });

    // Temporary: Click to return to menu
    this.input.once("pointerdown", () => {
      this.returnToMenu();
    });

    // Camera fade in
    this.cameras.main.fadeIn(500, 0, 17, 34);

    console.log("[NEXA] Game Scene: Ready");
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

    // Placeholder stats
    this.add
      .text(width - 20, 20, "Energy: 100 | Nodes: 0", {
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
      .text(width / 2, height - 25, "Game will be implemented here", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#006666",
      })
      .setOrigin(0.5)
      .setDepth(101);
  }

  private returnToMenu() {
    console.log("[NEXA] Returning to menu...");

    // Fade out
    this.cameras.main.fadeOut(500, 0, 17, 34);

    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("MainMenu");
    });
  }

  update(_time: number, _delta: number) {
    // Game loop will be implemented here
  }
}
