import Phaser from 'phaser';
import type { Node } from '@/core/entities/node/node';
import { NodeType } from '@/core/types/common';

/**
 * NodeVisual - Componente visual para un nodo del grafo
 * Gestiona la representación gráfica y las interacciones de un nodo
 */
export class NodeVisual {
  private node: Node;
  private scene: Phaser.Scene;
  
  // Graphics components
  private container: Phaser.GameObjects.Container;
  private circle: Phaser.GameObjects.Graphics;
  private typeLabel: Phaser.GameObjects.Text;
  private energyLabel: Phaser.GameObjects.Text;
  private ownerIndicator: Phaser.GameObjects.Graphics;
  
  // Visual properties
  private readonly radius = 35;
  private readonly colors = {
    neutral: 0x888888,
    player1: 0x0088ff,
    player2: 0xff4444,
    player3: 0x00ff00,
    player4: 0xffaa00,
  };
  
  private readonly typeColors = {
    [NodeType.BASIC]: 0xcccccc,
    [NodeType.ATTACK]: 0xff3333,
    [NodeType.DEFENSE]: 0x3333ff,
    [NodeType.ENERGY]: 0xffcc00,
    [NodeType.SUPER_ENERGY]: 0xff00ff,
    [NodeType.NEUTRAL]: 0x888888,
  };

  constructor(scene: Phaser.Scene, node: Node) {
    this.scene = scene;
    this.node = node;
    
    // Crear container para agrupar todos los elementos
    this.container = scene.add.container(node.position.x, node.position.y);
    
    // Crear componentes visuales
    this.circle = scene.add.graphics();
    this.ownerIndicator = scene.add.graphics();
    
    this.typeLabel = scene.add.text(0, -55, this.getTypeLabel(), {
      fontSize: '11px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5);
    
    this.energyLabel = scene.add.text(0, 0, '', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    
    // Agregar al container
    this.container.add([this.circle, this.ownerIndicator, this.typeLabel, this.energyLabel]);
    
    // Setup interacción
    this.setupInteraction();
    
    // Render inicial
    this.render();
  }

  /**
   * Configura la interacción del nodo
   */
  private setupInteraction(): void {
    const hitArea = new Phaser.Geom.Circle(0, 0, this.radius);
    this.container.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
    
    this.container.on('pointerover', () => {
      this.onHover(true);
    });
    
    this.container.on('pointerout', () => {
      this.onHover(false);
    });
  }

  /**
   * Renderiza el nodo completo
   */
  render(): void {
    this.renderCircle();
    this.renderOwnerIndicator();
    this.updateLabels();
  }

  /**
   * Renderiza el círculo principal del nodo
   */
  private renderCircle(): void {
    this.circle.clear();
    
    // Color según tipo de nodo
    const typeColor = this.typeColors[this.node.type];
    
    // Círculo principal
    this.circle.fillStyle(typeColor, 0.3);
    this.circle.fillCircle(0, 0, this.radius);
    
    // Borde
    this.circle.lineStyle(3, 0x000000, 1);
    this.circle.strokeCircle(0, 0, this.radius);
    
    // Borde interior según dueño
    if (this.node.owner) {
      const ownerColor = this.getOwnerColor();
      this.circle.lineStyle(2, ownerColor, 1);
      this.circle.strokeCircle(0, 0, this.radius - 4);
    }
  }

  /**
   * Renderiza el indicador de dueño (barra circular)
   */
  private renderOwnerIndicator(): void {
    this.ownerIndicator.clear();
    
    if (!this.node.owner) return;
    
    const ownerColor = this.getOwnerColor();
    const energyPercent = Math.min(1, this.node.energyPool / 100);
    
    // Arco de energía
    this.ownerIndicator.lineStyle(6, ownerColor, 0.8);
    this.ownerIndicator.beginPath();
    this.ownerIndicator.arc(
      0,
      0,
      this.radius + 8,
      Phaser.Math.DegToRad(-90),
      Phaser.Math.DegToRad(-90 + 360 * energyPercent),
      false
    );
    this.ownerIndicator.strokePath();
  }

  /**
   * Actualiza las etiquetas de texto
   */
  private updateLabels(): void {
    // Energía
    this.energyLabel.setText(`${Math.floor(this.node.energyPool)}`);
    
    // Color de energía según cantidad
    if (this.node.energyPool > 80) {
      this.energyLabel.setColor('#00ff00');
    } else if (this.node.energyPool > 40) {
      this.energyLabel.setColor('#ffff00');
    } else if (this.node.energyPool > 0) {
      this.energyLabel.setColor('#ff9900');
    } else {
      this.energyLabel.setColor('#ff0000');
    }
    
    // Actualizar etiqueta de tipo si es nodo inicial
    if (this.node.isInitialNode) {
      this.typeLabel.setText(`${this.getTypeLabel()} ★`);
      this.typeLabel.setBackgroundColor('#ff0000');
    }
  }

  /**
   * Efecto hover
   */
  private onHover(isHovered: boolean): void {
    if (isHovered) {
      this.circle.clear();
      this.renderCircle();
      
      // Highlight
      this.circle.lineStyle(4, 0xffff00, 1);
      this.circle.strokeCircle(0, 0, this.radius + 2);
      
      // Escala
      this.scene.tweens.add({
        targets: this.container,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        ease: 'Back.easeOut',
      });
    } else {
      this.circle.clear();
      this.renderCircle();
      
      // Restablecer escala
      this.scene.tweens.add({
        targets: this.container,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Back.easeIn',
      });
    }
  }

  /**
   * Efecto de selección
   */
  setSelected(isSelected: boolean): void {
    if (isSelected) {
      this.circle.lineStyle(5, 0xffff00, 1);
      this.circle.strokeCircle(0, 0, this.radius + 5);
      
      // Animación de pulso
      this.scene.tweens.add({
        targets: this.container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      // Detener animación
      this.scene.tweens.killTweensOf(this.container);
      this.container.setScale(1);
      this.render();
    }
  }

  /**
   * Efecto de captura (animación)
   */
  playCaptureAnimation(): void {
    // Flash
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.container.setAlpha(1);
        this.render();
      },
    });
    
    // Partículas
    const particles = this.scene.add.particles(0, 0, 'particle', {
      speed: { min: 50, max: 100 },
      scale: { start: 1, end: 0 },
      lifespan: 500,
      quantity: 20,
      blendMode: 'ADD',
    });
    
    this.container.add(particles);
    
    this.scene.time.delayedCall(500, () => {
      particles.destroy();
    });
  }

  /**
   * Obtiene el color del dueño
   */
  private getOwnerColor(): number {
    if (!this.node.owner) return this.colors.neutral;
    
    const playerId = this.node.owner.id.toString();
    if (playerId === 'player1') return this.colors.player1;
    if (playerId === 'player2') return this.colors.player2;
    if (playerId === 'player3') return this.colors.player3;
    if (playerId === 'player4') return this.colors.player4;
    
    return this.colors.neutral;
  }

  /**
   * Obtiene la etiqueta del tipo
   */
  private getTypeLabel(): string {
    const labels: Record<NodeType, string> = {
      [NodeType.BASIC]: 'BASIC',
      [NodeType.ATTACK]: 'ATTACK',
      [NodeType.DEFENSE]: 'DEFENSE',
      [NodeType.ENERGY]: 'ENERGY',
      [NodeType.SUPER_ENERGY]: 'SUPER',
      [NodeType.NEUTRAL]: 'NEUTRAL',
    };
    return labels[this.node.type] || 'UNKNOWN';
  }

  /**
   * Actualiza la visualización (llamar desde el game loop)
   */
  update(): void {
    this.renderOwnerIndicator();
    this.updateLabels();
  }

  /**
   * Destruye el nodo visual
   */
  destroy(): void {
    this.container.destroy();
  }

  // Getters
  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  getNode(): Node {
    return this.node;
  }
}
