import { Scene } from 'phaser';

interface GameOverData {
  winner: string;
  winnerId: string;
  p1Nodes: number;
  p2Nodes: number;
  reason: string;
}

export class GameOverScene extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;

  constructor() {
    super('GameOverScene');
  }

  create(data: GameOverData) {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x001122);

    const { width, height } = this.scale;
    const { winner, winnerId, p1Nodes, p2Nodes, reason } = data;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);

    // Title
    const winnerColor = winnerId === 'player-1' ? '#00ffff' : '#ff00ff';
    const titleText = this.add.text(
      width / 2,
      height / 2 - 150,
      `🏆 ¡${winner} GANA! 🏆`,
      {
        fontFamily: 'Orbitron, monospace',
        fontSize: '48px',
        color: winnerColor,
        align: 'center',
        stroke: winnerColor,
        strokeThickness: 3,
      },
    );
    titleText.setOrigin(0.5);

    // Reason
    let reasonText = '';
    if (reason === 'elimination') {
      reasonText = 'VICTORIA POR ELIMINACIÓN';
    }
    else if (reason === 'dominance') {
      reasonText = 'VICTORIA POR DOMINANCIA';
    }
    else if (reason === 'timeout') {
      reasonText = 'VICTORIA POR LÍMITE DE TIEMPO';
    }
    else {
      reasonText = 'JUEGO TERMINADO';
    }

    const reasonDisplay = this.add.text(
      width / 2,
      height / 2 - 80,
      reasonText,
      {
        fontFamily: 'Orbitron, monospace',
        fontSize: '24px',
        color: '#ffffff',
        align: 'center',
      },
    );
    reasonDisplay.setOrigin(0.5);

    // Stats
    const statsText = this.add.text(
      width / 2,
      height / 2,
      `Puntuación Final:\n\nJugador 1: ${p1Nodes} nodos\nJugador 2: ${p2Nodes} nodos`,
      {
        fontFamily: 'Orbitron, monospace',
        fontSize: '20px',
        color: '#cccccc',
        align: 'center',
        lineSpacing: 10,
      },
    );
    statsText.setOrigin(0.5);

    // Instructions
    const instructionsText = this.add.text(
      width / 2,
      height / 2 + 120,
      'Haz clic o presiona ESPACIO para volver al menú',
      {
        fontFamily: 'Orbitron, monospace',
        fontSize: '16px',
        color: '#888888',
        align: 'center',
      },
    );
    instructionsText.setOrigin(0.5);

    // Animate in
    this.tweens.add({
      targets: [titleText, reasonDisplay, statsText, instructionsText],
      alpha: { from: 0, to: 1 },
      y: { from: '-=30', to: '+=0' },
      duration: 800,
      ease: 'Power2',
      delay: this.tweens.stagger(150, {}),
    });

    // Input handlers
    this.input.once('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });

    this.input.keyboard?.once('keydown-SPACE', () => {
      this.scene.start('MainMenuScene');
    });

    this.input.keyboard?.once('keydown-ESC', () => {
      this.scene.start('MainMenuScene');
    });
  }
}
