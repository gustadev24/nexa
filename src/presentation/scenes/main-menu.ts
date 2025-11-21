import { Scene } from 'phaser';
import { GameManager } from '@/application/game-manager';

/**
 * MainMenu Scene - NEXA
 *
 * Displays the main menu with a futuristic, minimalist design.
 * Features a "Play" button that transitions to the game scene.
 */
export class MainMenu extends Scene {
  private playButton?: Phaser.GameObjects.Container;
  private title?: Phaser.GameObjects.Text;
  private subtitle?: Phaser.GameObjects.Text;
  private gameManager: GameManager;

  constructor() {
    super('MainMenu');
    this.gameManager = GameManager.getInstance();
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // Initialize GameManager if needed
    if (!this.gameManager.isInitialized()) {
      this.gameManager.initialize();
      console.log('[MainMenu] GameManager initialized');
    }

    // Create futuristic gradient background
    this.createBackground();

    // Add animated grid effect
    this.createGridEffect();

    // Game Title
    this.title = this.add
      .text(centerX, centerY - 150, 'NEXA', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '96px',
        color: '#00FFFF',
        stroke: '#0088AA',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Subtitle
    this.subtitle = this.add
      .text(centerX, centerY - 70, 'Nexus Expansion Algorithm', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: '#00AAAA',
        letterSpacing: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Create Play Button
    this.playButton = this.createPlayButton(centerX, centerY + 80);

    // Animate entrance
    this.animateEntrance();

    // Version info
    this.add
      .text(width - 20, height - 20, 'v1.0.0', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#006666',
      })
      .setOrigin(1, 1);
  }

  private createBackground() {
    const { width, height } = this.scale;

    // Dark background with gradient effect
    const bg = this.add.rectangle(0, 0, width, height, 0x001122);
    bg.setOrigin(0, 0);

    // Add some accent rectangles for visual interest
    const accent1 = this.add.rectangle(0, 0, width, 100, 0x002244, 0.3);
    accent1.setOrigin(0, 0);

    const accent2 = this.add.rectangle(0, height - 100, width, 100, 0x002244, 0.3);
    accent2.setOrigin(0, 0);

    // Animated pulse effect
    this.tweens.add({
      targets: [accent1, accent2],
      alpha: 0.5,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createGridEffect() {
    const { width, height } = this.scale;
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x00ffff, 0.1);

    // Vertical lines
    for (let x = 0; x < width; x += 50) {
      graphics.lineBetween(x, 0, x, height);
    }

    // Horizontal lines
    for (let y = 0; y < height; y += 50) {
      graphics.lineBetween(0, y, width, y);
    }

    // Subtle animation
    this.tweens.add({
      targets: graphics,
      alpha: 0.15,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createPlayButton(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Button background
    const buttonBg = this.add.rectangle(0, 0, 200, 60, 0x00ffff, 0);
    buttonBg.setStrokeStyle(2, 0x00ffff);

    // Button text
    const buttonText = this.add
      .text(0, 0, 'PLAY', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '32px',
        color: '#00FFFF',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    // Add glow effect
    const glow = this.add.rectangle(0, 0, 200, 60, 0x00ffff, 0.1);
    glow.setVisible(false);

    container.add([glow, buttonBg, buttonText]);

    // Make interactive
    buttonBg.setInteractive({ useHandCursor: true });

    // Hover effects
    buttonBg.on('pointerover', () => {
      glow.setVisible(true);
      buttonBg.setFillStyle(0x00ffff, 0.2);
      buttonText.setScale(1.1);

      this.tweens.add({
        targets: glow,
        alpha: 0.3,
        duration: 300,
        ease: 'Power2',
      });
    });

    buttonBg.on('pointerout', () => {
      buttonBg.setFillStyle(0x00ffff, 0);
      buttonText.setScale(1);
      glow.setVisible(false);
    });

    // Click handler
    buttonBg.on('pointerdown', () => {
      // Flash effect
      this.cameras.main.flash(300, 0, 255, 255);

      // Button press animation
      this.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          this.startGame();
        },
      });
    });

    // Idle pulse animation
    this.tweens.add({
      targets: buttonBg,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    container.setAlpha(0);
    return container;
  }

  private animateEntrance() {
    // Fade in title
    this.tweens.add({
      targets: this.title,
      alpha: 1,
      duration: 1000,
      ease: 'Power2',
    });

    // Fade in subtitle
    this.tweens.add({
      targets: this.subtitle,
      alpha: 1,
      duration: 1000,
      delay: 300,
      ease: 'Power2',
    });

    // Slide in play button
    this.tweens.add({
      targets: this.playButton,
      alpha: 1,
      y: '+=20',
      duration: 800,
      delay: 600,
      ease: 'Back.easeOut',
    });
  }

  private startGame() {
    console.log('[NEXA] Starting game...');

    // Reset game state before starting new game
    if (this.gameManager.isGameOver()) {
      this.gameManager.resetGame();
      console.log('[MainMenu] Game reset for new session');
    }

    // Fade out
    this.cameras.main.fadeOut(500, 0, 17, 34);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Game');
    });
  }
}
