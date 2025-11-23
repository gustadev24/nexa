import type { Edge } from '@/core/entities/edge';
import type { EnergyPacket } from '@/core/entities/energy-packets';
import Phaser from 'phaser';

/**
 * EdgeVisual - Componente visual para una arista del grafo
 * Gestiona la representación gráfica de conexiones y paquetes de energía
 */
export class EdgeVisual {
  private edge: Edge;
  private scene: Phaser.Scene;
  
  // Graphics components
  private line: Phaser.GameObjects.Graphics;
  private weightLabel: Phaser.GameObjects.Text;
  private packetGraphics: Map<string | number, Phaser.GameObjects.Graphics> = new Map();
  
  // Visual properties
  private readonly lineColor = 0x666666;
  private readonly lineWidth = 4;
  private readonly activeColor = 0x00ff00;
  private readonly selectedColor = 0xffff00;
  
  private isSelected = false;
  private isActive = false;

  constructor(scene: Phaser.Scene, edge: Edge) {
    this.scene = scene;
    this.edge = edge;
    
    // Crear línea
    this.line = scene.add.graphics();
    
    // Crear etiqueta de peso (opcional)
    const midX = (edge.nodeA.position.x + edge.nodeB.position.x) / 2;
    const midY = (edge.nodeA.position.y + edge.nodeB.position.y) / 2;
    
    this.weightLabel = scene.add.text(midX, midY, `${edge.weight}`, {
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setVisible(false); // Oculto por defecto
    
    // Setup interacción
    this.setupInteraction();
    
    // Render inicial
    this.render();
  }

  /**
   * Configura la interacción de la arista
   */
  private setupInteraction(): void {
    // Hacer la línea interactiva
    this.line.setInteractive(
      new Phaser.Geom.Rectangle(
        Math.min(this.edge.nodeA.position.x, this.edge.nodeB.position.x) - 10,
        Math.min(this.edge.nodeA.position.y, this.edge.nodeB.position.y) - 10,
        Math.abs(this.edge.nodeB.position.x - this.edge.nodeA.position.x) + 20,
        Math.abs(this.edge.nodeB.position.y - this.edge.nodeA.position.y) + 20
      ),
      Phaser.Geom.Rectangle.Contains
    );
    
    this.line.on('pointerover', () => {
      this.onHover(true);
    });
    
    this.line.on('pointerout', () => {
      this.onHover(false);
    });
  }

  /**
   * Renderiza la arista
   */
  render(): void {
    this.line.clear();
    
    // Determinar color
    let color = this.lineColor;
    let width = this.lineWidth;
    let alpha = 0.5;
    
    if (this.isSelected) {
      color = this.selectedColor;
      width = 6;
      alpha = 1;
    } else if (this.isActive) {
      color = this.activeColor;
      alpha = 0.8;
    }
    
    // Dibujar línea principal
    this.line.lineStyle(width, color, alpha);
    this.line.beginPath();
    this.line.moveTo(this.edge.nodeA.position.x, this.edge.nodeA.position.y);
    this.line.lineTo(this.edge.nodeB.position.x, this.edge.nodeB.position.y);
    this.line.strokePath();
    
    // Dibujar flecha direccional (opcional)
    if (this.isActive || this.isSelected) {
      this.drawArrow();
    }
  }

  /**
   * Dibuja una flecha en el medio de la arista
   */
  private drawArrow(): void {
    const midX = (this.edge.nodeA.position.x + this.edge.nodeB.position.x) / 2;
    const midY = (this.edge.nodeA.position.y + this.edge.nodeB.position.y) / 2;
    
    const dx = this.edge.nodeB.position.x - this.edge.nodeA.position.x;
    const dy = this.edge.nodeB.position.y - this.edge.nodeA.position.y;
    const angle = Math.atan2(dy, dx);
    
    const arrowSize = 10;
    
    // Punta de la flecha
    const arrowX1 = midX - arrowSize * Math.cos(angle - Math.PI / 6);
    const arrowY1 = midY - arrowSize * Math.sin(angle - Math.PI / 6);
    
    const arrowX2 = midX - arrowSize * Math.cos(angle + Math.PI / 6);
    const arrowY2 = midY - arrowSize * Math.sin(angle + Math.PI / 6);
    
    this.line.lineStyle(2, this.isSelected ? this.selectedColor : this.activeColor, 1);
    this.line.beginPath();
    this.line.moveTo(midX, midY);
    this.line.lineTo(arrowX1, arrowY1);
    this.line.moveTo(midX, midY);
    this.line.lineTo(arrowX2, arrowY2);
    this.line.strokePath();
  }

  /**
   * Efecto hover
   */
  private onHover(isHovered: boolean): void {
    if (isHovered) {
      this.weightLabel.setVisible(true);
      
      if (!this.isSelected) {
        this.line.clear();
        this.line.lineStyle(this.lineWidth + 2, 0xffffff, 0.6);
        this.line.beginPath();
        this.line.moveTo(this.edge.nodeA.position.x, this.edge.nodeA.position.y);
        this.line.lineTo(this.edge.nodeB.position.x, this.edge.nodeB.position.y);
        this.line.strokePath();
      }
    } else {
      if (!this.isSelected) {
        this.weightLabel.setVisible(false);
        this.render();
      }
    }
  }

  /**
   * Marca la arista como seleccionada
   */
  setSelected(selected: boolean): void {
    this.isSelected = selected;
    this.weightLabel.setVisible(selected);
    this.render();
  }

  /**
   * Marca la arista como activa (con paquetes en tránsito)
   */
  setActive(active: boolean): void {
    this.isActive = active;
    this.render();
  }

  /**
   * Renderiza los paquetes de energía en la arista
   */
  renderPackets(): void {
    // Limpiar paquetes anteriores
    for (const graphics of this.packetGraphics.values()) {
      graphics.destroy();
    }
    this.packetGraphics.clear();
    
    // Renderizar paquetes actuales
    for (const packet of this.edge.energyPackets) {
      this.renderPacket(packet);
    }
    
    // Marcar arista como activa si hay paquetes
    this.setActive(this.edge.energyPackets.length > 0);
  }

  /**
   * Renderiza un paquete individual
   */
  private renderPacket(packet: EnergyPacket): void {
    const graphics = this.scene.add.graphics();
    
    // Calcular posición interpolada
    const x = Phaser.Math.Linear(
      packet.origin.position.x,
      packet.target.position.x,
      packet.progress
    );
    const y = Phaser.Math.Linear(
      packet.origin.position.y,
      packet.target.position.y,
      packet.progress
    );
    
    // Color según el dueño
    const color = this.getPlayerColor(packet.owner.id.toString());
    
    // Tamaño según cantidad de energía
    const size = Math.max(4, Math.min(10, packet.amount / 10));
    
    // Dibujar paquete
    graphics.fillStyle(color, 1);
    graphics.fillCircle(x, y, size);
    
    // Borde
    graphics.lineStyle(1, 0xffffff, 0.8);
    graphics.strokeCircle(x, y, size);
    
    // Agregar glow
    graphics.fillStyle(color, 0.3);
    graphics.fillCircle(x, y, size + 3);
    
    // Animación de movimiento (opcional: trail effect)
    this.scene.tweens.add({
      targets: graphics,
      alpha: 0.7,
      duration: 200,
      yoyo: true,
      repeat: -1,
    });
    
    this.packetGraphics.set(packet.id, graphics);
  }

  /**
   * Obtiene el color del jugador
   */
  private getPlayerColor(playerId: string): number {
    const colors: Record<string, number> = {
      player1: 0x0088ff,
      player2: 0xff4444,
      player3: 0x00ff00,
      player4: 0xffaa00,
    };
    return colors[playerId] || 0xffffff;
  }

  /**
   * Animación de colisión
   */
  playCollisionAnimation(x: number, y: number): void {
    // Explosion particles
    const particles = this.scene.add.particles(x, y, 'particle', {
      speed: { min: 100, max: 200 },
      scale: { start: 1.5, end: 0 },
      lifespan: 300,
      quantity: 15,
      tint: 0xff9900,
      blendMode: 'ADD',
    });
    
    this.scene.time.delayedCall(300, () => {
      particles.destroy();
    });
    
    // Flash en la arista
    this.line.clear();
    this.line.lineStyle(this.lineWidth + 4, 0xff0000, 1);
    this.line.beginPath();
    this.line.moveTo(this.edge.nodeA.position.x, this.edge.nodeA.position.y);
    this.line.lineTo(this.edge.nodeB.position.x, this.edge.nodeB.position.y);
    this.line.strokePath();
    
    this.scene.time.delayedCall(100, () => {
      this.render();
    });
  }

  /**
   * Actualiza la visualización (llamar desde el game loop)
   */
  update(): void {
    this.renderPackets();
  }

  /**
   * Destruye la arista visual
   */
  destroy(): void {
    this.line.destroy();
    this.weightLabel.destroy();
    for (const graphics of this.packetGraphics.values()) {
      graphics.destroy();
    }
    this.packetGraphics.clear();
  }

  // Getters
  getEdge(): Edge {
    return this.edge;
  }

  getLine(): Phaser.GameObjects.Graphics {
    return this.line;
  }
}
