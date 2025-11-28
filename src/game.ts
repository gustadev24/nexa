import { BootScene } from '@/presentation/scenes/boot-scene';
import { GameOverScene } from '@/presentation/scenes/game-over-scene';
import { GameScene } from '@/presentation/scenes/game-scene';
import { MainMenuScene } from '@/presentation/scenes/main-menu-scene';
import { AUTO, Game as PhaserGame } from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: 1024,
  height: 768,
  parent: 'game-container',
  backgroundColor: '#001122',
  scene: [BootScene, MainMenuScene, GameScene, GameOverScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const StartGame = (parent: string) => {
  return new PhaserGame({ ...config, parent });
};

export default StartGame;
