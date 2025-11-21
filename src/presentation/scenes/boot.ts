import { Scene } from 'phaser';

/**
 * Boot Scene - NEXA
 *
 * Initializes the game and loads minimal assets required for the menu.
 * This scene should load very quickly as it has no preloader.
 */
export class Boot extends Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Load minimal assets for menu if needed
    // For now, we use programmatic graphics only
    console.log('[NEXA] Boot Scene: Initializing...');
  }

  create() {
    console.log('[NEXA] Boot Scene: Complete');

    // Immediately transition to MainMenu
    this.scene.start('MainMenu');
  }
}
