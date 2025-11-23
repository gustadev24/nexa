import {
    NODE_TYPE_COLORS,
    PLACEHOLDER_SETTINGS,
    PLAYER_COLORS,
    PRELOAD_ASSETS
} from '@/presentation/config/assets.config';
import { Scene } from 'phaser';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  init() {
    //  We loaded this image in our Boot Scene, so we can display it here
    this.add.image(512, 384, 'background');

    //  A simple progress bar. This is the outline of the bar.
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on('progress', (progress: number) => {
      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + (460 * progress);
    });
  }

  preload() {
    //  Load the assets for the game
    this.load.setPath('assets');

    // Try to load real assets, but generate placeholders if they fail
    this.loadAssetsWithFallback();
  }

  /**
   * Intenta cargar assets reales, genera placeholders si fallan
   */
  private loadAssetsWithFallback(): void {
    // Load logo
    this.load.image('logo', 'logo.png');
    
    // Try loading configured assets
    for (const asset of PRELOAD_ASSETS) {
      if (asset.type === 'image') {
        this.load.image(asset.key, asset.path);
      } else if (asset.type === 'audio') {
        this.load.audio(asset.key, asset.path);
      }
    }
    
    // Handle load errors - generate placeholders
    this.load.on('loaderror', (file: { key: string }) => {
      console.warn(`Failed to load ${file.key}, will generate placeholder`);
    });
  }

  create() {
    // Generate all placeholder textures
    this.generatePlaceholderTextures();
    
    //  Move to the MainMenu
    this.scene.start('MainMenu');
  }

  /**
   * Genera texturas placeholder usando Phaser Graphics
   */
  private generatePlaceholderTextures(): void {
    console.log('Generating placeholder textures...');
    
    // Node sprites (5 types x 5 variants)
    this.generateNodeTextures();
    
    // Particle textures
    this.generateParticleTextures();
    
    // UI elements
    this.generateUITextures();
    
    // Edge visuals
    this.generateEdgeTextures();
    
    console.log('Placeholder generation complete!');
  }

  /**
   * Genera texturas de nodos para todos los tipos y variantes
   */
  private generateNodeTextures(): void {
    const size = PLACEHOLDER_SETTINGS.nodeSize;
    const radius = size / 2 - 4;
    
    // Node types
    const nodeTypes = ['basic', 'attack', 'defense', 'energy', 'super_energy'];
    const typeColors = [
      NODE_TYPE_COLORS.BASIC,
      NODE_TYPE_COLORS.ATTACK,
      NODE_TYPE_COLORS.DEFENSE,
      NODE_TYPE_COLORS.ENERGY,
      NODE_TYPE_COLORS.SUPER_ENERGY,
    ];
    
    // Generate for each type
    nodeTypes.forEach((type, index) => {
      const baseColor = typeColors[index];
      
      // Generate neutral variant
      if (!this.textures.exists(`node_${type}`)) {
        const graphics = this.make.graphics({ x: 0, y: 0 }, false);
        
        // Outer glow
        graphics.fillStyle(baseColor, 0.3);
        graphics.fillCircle(size / 2, size / 2, radius + 4);
        
        // Main circle
        graphics.fillStyle(baseColor, 1);
        graphics.fillCircle(size / 2, size / 2, radius);
        
        // Border
        graphics.lineStyle(2, 0xffffff, 0.8);
        graphics.strokeCircle(size / 2, size / 2, radius);
        
        // Highlight
        graphics.fillStyle(0xffffff, 0.3);
        graphics.fillCircle(size / 2 - radius / 3, size / 2 - radius / 3, radius / 3);
        
        graphics.generateTexture(`node_${type}`, size, size);
        graphics.destroy();
      }
      
      // Generate player variants
      Object.entries(PLAYER_COLORS).forEach(([playerKey, playerColor]) => {
        const key = `node_${type}_${playerKey}`;
        if (!this.textures.exists(key)) {
          const graphics = this.make.graphics({ x: 0, y: 0 }, false);
          
          // Outer glow with player color
          graphics.fillStyle(playerColor, 0.4);
          graphics.fillCircle(size / 2, size / 2, radius + 6);
          
          // Main circle (node type color)
          graphics.fillStyle(baseColor, 1);
          graphics.fillCircle(size / 2, size / 2, radius);
          
          // Border with player color
          graphics.lineStyle(3, playerColor, 1);
          graphics.strokeCircle(size / 2, size / 2, radius);
          
          // Highlight
          graphics.fillStyle(0xffffff, 0.4);
          graphics.fillCircle(size / 2 - radius / 3, size / 2 - radius / 3, radius / 3);
          
          graphics.generateTexture(key, size, size);
          graphics.destroy();
        }
      });
    });
  }

  /**
   * Genera texturas de partículas
   */
  private generateParticleTextures(): void {
    // Basic particle
    if (!this.textures.exists('particle')) {
      const size = PLACEHOLDER_SETTINGS.particleSize;
      const graphics = this.make.graphics({ x: 0, y: 0 }, false);
      
      graphics.fillStyle(0xffffff, 1);
      graphics.fillCircle(size / 2, size / 2, size / 2);
      
      graphics.generateTexture('particle', size, size);
      graphics.destroy();
    }
    
    // Spark particle
    if (!this.textures.exists('particle_spark')) {
      const size = 16;
      const graphics = this.make.graphics({ x: 0, y: 0 }, false);
      
      graphics.fillStyle(0xffff00, 1);
      // Star shape
      graphics.beginPath();
      graphics.moveTo(size / 2, 0);
      graphics.lineTo(size / 2 + 2, size / 2 - 2);
      graphics.lineTo(size, size / 2);
      graphics.lineTo(size / 2 + 2, size / 2 + 2);
      graphics.lineTo(size / 2, size);
      graphics.lineTo(size / 2 - 2, size / 2 + 2);
      graphics.lineTo(0, size / 2);
      graphics.lineTo(size / 2 - 2, size / 2 - 2);
      graphics.closePath();
      graphics.fillPath();
      
      graphics.generateTexture('particle_spark', size, size);
      graphics.destroy();
    }
    
    // Trail particle
    if (!this.textures.exists('particle_trail')) {
      const size = PLACEHOLDER_SETTINGS.particleSize;
      const graphics = this.make.graphics({ x: 0, y: 0 }, false);
      
      // Gradient effect (simplified)
      graphics.fillStyle(0xffffff, 0.8);
      graphics.fillCircle(size / 2, size / 2, size / 2);
      graphics.fillStyle(0xffffff, 0.3);
      graphics.fillCircle(size / 2, size / 2, size / 2 + 2);
      
      graphics.generateTexture('particle_trail', size, size);
      graphics.destroy();
    }
  }

  /**
   * Genera texturas de UI
   */
  private generateUITextures(): void {
    // Energy bar
    if (!this.textures.exists('ui_energy_bar')) {
      const width = 200;
      const height = 30;
      const graphics = this.make.graphics({ x: 0, y: 0 }, false);
      
      // Background
      graphics.fillStyle(0x000000, 0.7);
      graphics.fillRoundedRect(0, 0, width, height, 5);
      
      // Border
      graphics.lineStyle(2, 0xffffff, 0.8);
      graphics.strokeRoundedRect(0, 0, width, height, 5);
      
      graphics.generateTexture('ui_energy_bar', width, height);
      graphics.destroy();
    }
    
    // Info panel
    if (!this.textures.exists('ui_panel_info')) {
      const width = 400;
      const height = 300;
      const graphics = this.make.graphics({ x: 0, y: 0 }, false);
      
      // Background
      graphics.fillStyle(0x16213e, 0.9);
      graphics.fillRoundedRect(0, 0, width, height, 10);
      
      // Border
      graphics.lineStyle(2, 0x0088ff, 1);
      graphics.strokeRoundedRect(0, 0, width, height, 10);
      
      graphics.generateTexture('ui_panel_info', width, height);
      graphics.destroy();
    }
    
    // Buttons
    this.generateButtonTexture('ui_button_primary', 0x0088ff);
    this.generateButtonTexture('ui_button_secondary', 0x0f3460);
  }

  /**
   * Genera textura de botón
   */
  private generateButtonTexture(key: string, color: number): void {
    if (!this.textures.exists(key)) {
      const width = PLACEHOLDER_SETTINGS.buttonWidth;
      const height = PLACEHOLDER_SETTINGS.buttonHeight;
      const graphics = this.make.graphics({ x: 0, y: 0 }, false);
      
      // Background
      graphics.fillStyle(color, 1);
      graphics.fillRoundedRect(0, 0, width, height, 10);
      
      // Highlight
      graphics.fillStyle(0xffffff, 0.2);
      graphics.fillRoundedRect(5, 5, width - 10, height / 2 - 5, 8);
      
      // Border
      graphics.lineStyle(2, 0xffffff, 0.6);
      graphics.strokeRoundedRect(0, 0, width, height, 10);
      
      graphics.generateTexture(key, width, height);
      graphics.destroy();
    }
  }

  /**
   * Genera texturas para aristas
   */
  private generateEdgeTextures(): void {
    // Arrow
    if (!this.textures.exists('edge_arrow')) {
      const size = 16;
      const graphics = this.make.graphics({ x: 0, y: 0 }, false);
      
      graphics.fillStyle(0xffffff, 1);
      graphics.beginPath();
      graphics.moveTo(0, size / 2);
      graphics.lineTo(size, size / 2 - 6);
      graphics.lineTo(size, size / 2 + 6);
      graphics.closePath();
      graphics.fillPath();
      
      graphics.generateTexture('edge_arrow', size, size);
      graphics.destroy();
    }
    
    // Energy packet
    if (!this.textures.exists('packet_energy')) {
      const size = 16;
      const graphics = this.make.graphics({ x: 0, y: 0 }, false);
      
      // Glow
      graphics.fillStyle(0x00ffff, 0.3);
      graphics.fillCircle(size / 2, size / 2, size / 2 + 2);
      
      // Core
      graphics.fillStyle(0x00ffff, 1);
      graphics.fillCircle(size / 2, size / 2, size / 2);
      
      // Highlight
      graphics.fillStyle(0xffffff, 0.7);
      graphics.fillCircle(size / 2 - 2, size / 2 - 2, size / 4);
      
      graphics.generateTexture('packet_energy', size, size);
      graphics.destroy();
    }
  }
}
