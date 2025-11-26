import { MainMenu } from '@/presentation/scenes/main-menu-scene';
import { Scene } from 'phaser';

/**
 * Boot Scene - NEXA
 *
 * Initializes the game and loads minimal assets required for the menu.
 * This scene should load very quickly as it has no preloader.
 */
export class BootScene extends Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.scene.start(new MainMenu());
  }
}
