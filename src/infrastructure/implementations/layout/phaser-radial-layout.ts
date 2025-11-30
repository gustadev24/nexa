import type { Position } from '@/application/interfaces/types/position';
import type { LayoutStrategy } from '@/application/strategies/layout/layout-strategy';

export class PhaserRadialLayoutStrategy implements LayoutStrategy {
  constructor(
    private centerX: number,
    private centerY: number,
    private baseRadius: number,
  ) {}

  generatePositions(count: number): Position[] {
    const positions: Position[] = [];

    for (let i = 0; i < count; i++) {
      // 1. Calcular Ángulo (Distribución uniforme)
      const angle = (i / count) * Math.PI * 2;

      // 2. Calcular Variación (El toque orgánico)
      // Usamos Phaser.Math si lo tienes disponible, o Math.random() * 0.4 + 0.8
      const radiusVariation = Phaser.Math.FloatBetween(0.8, 1.2);

      // 3. Convertir Polar a Cartesiano
      const x = this.centerX + Math.cos(angle) * this.baseRadius * radiusVariation;
      const y = this.centerY + Math.sin(angle) * this.baseRadius * radiusVariation;

      positions.push({ x, y });
    }

    return positions;
  }

  calculateDistance(posA: Position, posB: Position): number {
    const pixelDistance = Phaser.Math.Distance.Between(posA.x, posA.y, posB.x, posB.y);

    // Normalizar distancia: dividir píxeles por 50 para obtener valores razonables
    // Distancias típicas: 100-500px → 2-10 unidades normalizadas
    // Esto mantiene proporciones relativas pero hace que los paquetes viajen más rápido
    const normalizedDistance = Math.max(1, pixelDistance / 50);

    return normalizedDistance;
  }
}
