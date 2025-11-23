import Phaser from 'phaser';
import { EnergyPacketVisual } from './EnergyPacketVisual';
import type { EnergyPacket } from '@/core/entities/energy-packets';
import type { Node } from '@/core/entities/node/node';

/**
 * AnimationManager - Gestiona todas las animaciones del juego
 * Coordina efectos visuales y sincroniza con el estado del juego
 */
export class AnimationManager {
  private scene: Phaser.Scene;
  private packetVisuals: Map<string | number, EnergyPacketVisual> = new Map();
  
  // Animation queues
  private arrivalAnimations: Array<{ packet: EnergyPacketVisual; target: Node }> = [];
  private collisionAnimations: Array<{ packet1: EnergyPacketVisual; packet2: EnergyPacketVisual }> = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Crea y gestiona una visualización de paquete de energía
   */
  createPacketVisual(packet: EnergyPacket): EnergyPacketVisual {
    const visual = new EnergyPacketVisual(this.scene, packet);
    this.packetVisuals.set(packet.id, visual);
    return visual;
  }

  /**
   * Obtiene una visualización de paquete existente
   */
  getPacketVisual(packetId: string | number): EnergyPacketVisual | undefined {
    return this.packetVisuals.get(packetId);
  }

  /**
   * Elimina una visualización de paquete
   */
  removePacketVisual(packetId: string | number): void {
    const visual = this.packetVisuals.get(packetId);
    if (visual) {
      visual.destroy();
      this.packetVisuals.delete(packetId);
    }
  }

  /**
   * Programa una animación de llegada
   */
  queueArrivalAnimation(packet: EnergyPacketVisual, target: Node): void {
    this.arrivalAnimations.push({ packet, target });
  }

  /**
   * Programa una animación de colisión
   */
  queueCollisionAnimation(packet1: EnergyPacketVisual, packet2: EnergyPacketVisual): void {
    this.collisionAnimations.push({ packet1, packet2 });
  }

  /**
   * Animación de captura de nodo
   */
  playCaptureAnimation(node: Node, newOwner: string): void {
    const x = node.position.x;
    const y = node.position.y;
    
    // Onda expansiva de captura
    const captureRing = this.scene.add.graphics();
    const color = this.getPlayerColor(newOwner);
    
    this.scene.tweens.add({
      targets: captureRing,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onUpdate: () => {
        captureRing.clear();
        captureRing.lineStyle(4, color, captureRing.alpha);
        const radius = 40 + (1 - captureRing.alpha) * 60;
        captureRing.strokeCircle(x, y, radius);
      },
      onComplete: () => captureRing.destroy(),
    });
    
    // Burst de partículas
    this.createParticleBurst(x, y, color, 30);
    
    // Flash de pantalla
    this.playScreenFlash(color, 0.2);
  }

  /**
   * Animación de destrucción de nodo
   */
  playNodeDestroyAnimation(node: Node): void {
    const x = node.position.x;
    const y = node.position.y;
    
    // Explosión central
    this.createParticleBurst(x, y, 0xff0000, 50);
    
    // Múltiples ondas expansivas
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 100, () => {
        const ring = this.scene.add.graphics();
        
        this.scene.tweens.add({
          targets: ring,
          alpha: 0,
          duration: 600,
          onUpdate: () => {
            ring.clear();
            ring.lineStyle(3, 0xff0000, ring.alpha);
            const radius = 20 + (1 - ring.alpha) * 80;
            ring.strokeCircle(x, y, radius);
          },
          onComplete: () => ring.destroy(),
        });
      });
    }
    
    // Screen shake
    this.playScreenShake(300, 10);
  }

  /**
   * Animación de victoria
   */
  playVictoryAnimation(winner: string): void {
    const color = this.getPlayerColor(winner);
    
    // Confetti effect
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;
    
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 100, () => {
        this.createParticleBurst(
          centerX + Phaser.Math.Between(-200, 200),
          centerY + Phaser.Math.Between(-200, 200),
          color,
          40
        );
      });
    }
    
    // Flash de pantalla
    this.playScreenFlash(color, 0.4);
    
    // Screen shake
    this.playScreenShake(500, 8);
  }

  /**
   * Animación de derrota
   */
  playDefeatAnimation(): void {
    // Desaturación gradual
    this.scene.cameras.main.fadeOut(2000, 0, 0, 0);
    
    // Slow motion effect (opcional, requiere ajustar time scale)
    this.scene.tweens.add({
      targets: this.scene.time,
      timeScale: 0.3,
      duration: 1000,
      ease: 'Power2',
    });
  }

  /**
   * Crea un burst de partículas
   */
  private createParticleBurst(x: number, y: number, color: number, quantity: number): void {
    const particleTexture = this.createSimpleParticle();
    
    const particles = this.scene.add.particles(x, y, particleTexture, {
      speed: { min: 100, max: 300 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      quantity,
      tint: color,
      blendMode: 'ADD',
      gravityY: 200,
    });
    
    this.scene.time.delayedCall(700, () => {
      particles.destroy();
    });
  }

  /**
   * Crea una textura simple para partículas
   */
  private createSimpleParticle(): string {
    const key = 'particle_simple';
    
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
   * Flash de pantalla
   */
  private playScreenFlash(color: number, intensity: number): void {
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      color,
      intensity
    );
    flash.setScrollFactor(0);
    flash.setDepth(1000);
    
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    });
  }

  /**
   * Screen shake effect
   */
  private playScreenShake(duration: number, intensity: number): void {
    this.scene.cameras.main.shake(duration, intensity / 1000);
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
   * Procesa todas las animaciones pendientes
   */
  private processQueuedAnimations(): void {
    // Procesar llegadas
    while (this.arrivalAnimations.length > 0) {
      const anim = this.arrivalAnimations.shift();
      if (anim) {
        anim.packet.playArrivalAnimation(anim.target);
        this.packetVisuals.delete(anim.packet.getPacket().id);
      }
    }
    
    // Procesar colisiones
    while (this.collisionAnimations.length > 0) {
      const anim = this.collisionAnimations.shift();
      if (anim) {
        anim.packet1.playCollisionAnimation(anim.packet2);
      }
    }
  }

  /**
   * Actualiza todas las visualizaciones de paquetes
   */
  update(): void {
    // Actualizar todos los paquetes
    for (const visual of this.packetVisuals.values()) {
      visual.update();
    }
    
    // Procesar animaciones en cola
    this.processQueuedAnimations();
  }

  /**
   * Limpia todas las visualizaciones
   */
  clear(): void {
    for (const visual of this.packetVisuals.values()) {
      visual.destroy();
    }
    this.packetVisuals.clear();
    this.arrivalAnimations = [];
    this.collisionAnimations = [];
  }

  /**
   * Destruye el gestor
   */
  destroy(): void {
    this.clear();
  }
}
