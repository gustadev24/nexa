import type { EnergyPacket } from '../../core/entities/energy-packets';
import type { Node } from '../../core/entities/node/node';
import Phaser from 'phaser';

/**
 * EnergyPacketVisual - Componente visual para paquetes de energía
 * Gestiona animaciones de movimiento, trails y efectos de colisión
 */
export class EnergyPacketVisual {
  private packet: EnergyPacket;
  private scene: Phaser.Scene;
  
  // Graphics components
  private sprite: Phaser.GameObjects.Graphics;
  private trail: Phaser.GameObjects.Graphics[] = [];
  private particles?: Phaser.GameObjects.Particles.ParticleEmitter;
  
  // Visual properties
  private readonly maxTrailLength = 5;
  private trailPositions: { x: number; y: number }[] = [];
  private currentX: number = 0;
  private currentY: number = 0;

  constructor(scene: Phaser.Scene, packet: EnergyPacket) {
    this.scene = scene;
    this.packet = packet;
    
    // Posición inicial
    this.currentX = packet.origin.position.x;
    this.currentY = packet.origin.position.y;
    
    // Crear sprite principal
    this.sprite = scene.add.graphics();
    
    // Crear trail graphics
    for (let i = 0; i < this.maxTrailLength; i++) {
      this.trail.push(scene.add.graphics());
    }
    
    // Crear sistema de partículas (opcional)
    this.createParticleSystem();
    
    // Render inicial
    this.render();
  }

  /**
   * Crea el sistema de partículas del paquete
   */
  private createParticleSystem(): void {
    // Usar textura generada en Preloader o crear una simple
    const particleTexture = this.createParticleTexture();
    
    this.particles = this.scene.add.particles(
      this.currentX,
      this.currentY,
      particleTexture,
      {
        speed: { min: 20, max: 50 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 300,
        frequency: 30,
        quantity: 1,
        tint: this.getPlayerColor(),
        blendMode: 'ADD',
      }
    );
  }

  /**
   * Crea una textura simple para las partículas
   */
  private createParticleTexture(): string {
    const key = `particle_${this.packet.id}`;
    
    if (this.scene.textures.exists(key)) {
      return key;
    }
    
    const graphics = this.scene.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture(key, 8, 8);
    graphics.destroy();
    
    return key;
  }

  /**
   * Renderiza el paquete
   */
  render(): void {
    // Calcular posición interpolada
    const newX = Phaser.Math.Linear(
      this.packet.origin.position.x,
      this.packet.target.position.x,
      this.packet.progress
    );
    const newY = Phaser.Math.Linear(
      this.packet.origin.position.y,
      this.packet.target.position.y,
      this.packet.progress
    );
    
    // Actualizar trail
    this.updateTrail(newX, newY);
    
    // Actualizar posición
    this.currentX = newX;
    this.currentY = newY;
    
    // Renderizar sprite principal
    this.renderSprite();
    
    // Renderizar trail
    this.renderTrail();
    
    // Actualizar partículas
    if (this.particles) {
      this.particles.setPosition(this.currentX, this.currentY);
    }
  }

  /**
   * Renderiza el sprite del paquete
   */
  private renderSprite(): void {
    this.sprite.clear();
    
    const color = this.getPlayerColor();
    const size = this.getPacketSize();
    
    // Glow exterior
    this.sprite.fillStyle(color, 0.3);
    this.sprite.fillCircle(this.currentX, this.currentY, size + 4);
    
    // Core
    this.sprite.fillStyle(color, 1);
    this.sprite.fillCircle(this.currentX, this.currentY, size);
    
    // Highlight
    this.sprite.fillStyle(0xffffff, 0.6);
    this.sprite.fillCircle(
      this.currentX - size / 3,
      this.currentY - size / 3,
      size / 3
    );
    
    // Border
    this.sprite.lineStyle(1, 0xffffff, 0.8);
    this.sprite.strokeCircle(this.currentX, this.currentY, size);
  }

  /**
   * Actualiza las posiciones del trail
   */
  private updateTrail(x: number, y: number): void {
    // Agregar nueva posición
    this.trailPositions.unshift({ x, y });
    
    // Limitar tamaño del trail
    if (this.trailPositions.length > this.maxTrailLength) {
      this.trailPositions.pop();
    }
  }

  /**
   * Renderiza el trail del paquete
   */
  private renderTrail(): void {
    const color = this.getPlayerColor();
    const baseSize = this.getPacketSize();
    
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].clear();
      
      if (i < this.trailPositions.length) {
        const pos = this.trailPositions[i];
        const alpha = 1 - i / this.maxTrailLength;
        const size = baseSize * (1 - i / (this.maxTrailLength + 2));
        
        this.trail[i].fillStyle(color, alpha * 0.5);
        this.trail[i].fillCircle(pos.x, pos.y, size);
      }
    }
  }

  /**
   * Calcula el tamaño del paquete según la energía
   */
  private getPacketSize(): number {
    return Math.max(5, Math.min(12, this.packet.amount / 8));
  }

  /**
   * Obtiene el color del jugador
   */
  private getPlayerColor(): number {
    const colors: Record<string, number> = {
      player1: 0x0088ff,
      player2: 0xff4444,
      player3: 0x00ff00,
      player4: 0xffaa00,
    };
    return colors[this.packet.owner.id.toString()] || 0xffffff;
  }

  /**
   * Animación de llegada al nodo
   */
  playArrivalAnimation(target: Node): void {
    // Fade out del sprite principal
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scale: 1.5,
      duration: 200,
      ease: 'Power2',
    });
    
    // Fade out del trail
    for (const trailGraphic of this.trail) {
      this.scene.tweens.add({
        targets: trailGraphic,
        alpha: 0,
        duration: 200,
      });
    }
    
    // Burst de partículas
    if (this.particles) {
      this.particles.explode(15, target.position.x, target.position.y);
    }
    
    // Ondas expansivas
    this.createRippleEffect(target.position.x, target.position.y);
    
    // Destruir después de la animación
    this.scene.time.delayedCall(250, () => {
      this.destroy();
    });
  }

  /**
   * Animación de colisión entre paquetes
   */
  playCollisionAnimation(otherPacket: EnergyPacketVisual): void {
    const midX = (this.currentX + otherPacket.currentX) / 2;
    const midY = (this.currentY + otherPacket.currentY) / 2;
    
    // Flash en el punto de colisión
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xffffff, 1);
    flash.fillCircle(midX, midY, 15);
    
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => flash.destroy(),
    });
    
    // Explosion de partículas
    if (this.particles) {
      this.particles.explode(20, midX, midY);
    }
    
    // Shake effect en ambos paquetes
    this.scene.tweens.add({
      targets: [this.sprite, otherPacket.sprite],
      x: '+=5',
      duration: 50,
      yoyo: true,
      repeat: 3,
    });
    
    // Ondas expansivas
    this.createRippleEffect(midX, midY, 0xff9900);
  }

  /**
   * Crea efecto de ondas expansivas
   */
  private createRippleEffect(x: number, y: number, color: number = this.getPlayerColor()): void {
    const ripple1 = this.scene.add.graphics();
    const ripple2 = this.scene.add.graphics();
    
    ripple1.lineStyle(2, color, 1);
    ripple1.strokeCircle(x, y, 5);
    
    ripple2.lineStyle(2, color, 0.6);
    ripple2.strokeCircle(x, y, 5);
    
    // Animación ripple 1
    this.scene.tweens.add({
      targets: ripple1,
      alpha: 0,
      duration: 400,
      onUpdate: () => {
        ripple1.clear();
        ripple1.lineStyle(2, color, ripple1.alpha);
        const radius = 5 + (1 - ripple1.alpha) * 30;
        ripple1.strokeCircle(x, y, radius);
      },
      onComplete: () => ripple1.destroy(),
    });
    
    // Animación ripple 2 (con delay)
    this.scene.tweens.add({
      targets: ripple2,
      alpha: 0,
      duration: 400,
      delay: 100,
      onUpdate: () => {
        ripple2.clear();
        ripple2.lineStyle(2, color, ripple2.alpha * 0.6);
        const radius = 5 + (1 - ripple2.alpha) * 30;
        ripple2.strokeCircle(x, y, radius);
      },
      onComplete: () => ripple2.destroy(),
    });
  }

  /**
   * Animación de pulso (para destacar el paquete)
   */
  playPulseAnimation(): void {
    this.scene.tweens.add({
      targets: this.sprite,
      scale: 1.3,
      duration: 300,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Actualiza el paquete (llamar desde el game loop)
   */
  update(): void {
    this.render();
  }

  /**
   * Destruye el paquete visual
   */
  destroy(): void {
    this.sprite.destroy();
    for (const trailGraphic of this.trail) {
      trailGraphic.destroy();
    }
    if (this.particles) {
      this.particles.destroy();
    }
    this.trail = [];
    this.trailPositions = [];
  }

  // Getters
  getPacket(): EnergyPacket {
    return this.packet;
  }

  getPosition(): { x: number; y: number } {
    return { x: this.currentX, y: this.currentY };
  }

  getSprite(): Phaser.GameObjects.Graphics {
    return this.sprite;
  }
}
