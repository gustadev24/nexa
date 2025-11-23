import { Boot } from '@/presentation/scenes/boot';
import { GameOver } from '@/presentation/scenes/game-over';
import GameScene from '@/presentation/scenes/game-scene-integrated';
import { MainMenu } from '@/presentation/scenes/main-menu';
import { Preloader } from '@/presentation/scenes/preloader';
import { AUTO, Game } from 'phaser';

//  NEXA Game Configuration
//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: 1024,
  height: 768,
  parent: 'game-container',
  backgroundColor: '#001122',
  scene: [Boot, Preloader, MainMenu, GameScene, GameOver],
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
  return new Game({ ...config, parent });
};

export default StartGame;
