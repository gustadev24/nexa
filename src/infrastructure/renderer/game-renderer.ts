import type { EdgeSnapshot } from '@/application/interfaces/edge/edge-snapshot';
import type { EnergyPacketSnapshot } from '@/application/interfaces/energy-packet/energy-packet-snapshot';
import type { GameSnapshot } from '@/application/interfaces/game/game-snapshot';
import type { NodeSnapshot } from '@/application/interfaces/node/node-snapshot';

/**
 * GameRenderer - Renderizador del grafo del juego NEXA
 *
 * Responsable de dibujar el estado completo del juego en un canvas HTML5 usando Canvas 2D API.
 * Renderiza nodos, aristas, paquetes de energía en tránsito y la UI del juego.
 *
 * Arquitectura:
 * - Utiliza Canvas 2D API para renderizado eficiente
 * - Recibe snapshots inmutables del estado del juego
 * - Mantiene configuración de viewport y escala
 * - Rendering pipeline: Aristas → Nodos → Paquetes de Energía → UI
 *
 * @example
 * ```typescript
 * const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
 * const renderer = new GameRenderer();
 * renderer.initialize(canvas);
 *
 * // En cada frame del game loop
 * const snapshot = gameStateManager.getSnapshot();
 * renderer.renderGraph(snapshot);
 * renderer.renderUI(snapshot);
 * ```
 */
export class GameRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  // Configuración de viewport
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;

  // Constantes de renderizado
  private readonly NODE_BORDER_WIDTH = 3;
  private readonly EDGE_THICKNESS_BASE = 2;
  private readonly PACKET_RADIUS_MIN = 4;
  private readonly PACKET_RADIUS_MAX = 12;
  private readonly NEUTRAL_COLOR = '#808080';

  // Colores por tipo de nodo (indicadores visuales)
  private readonly NODE_TYPE_COLORS: Record<string, string> = {
    'basic': '#FFFFFF',
    'attack': '#FF4444',
    'defense': '#4444FF',
    'energy': '#44FF44',
    'super-energy': '#FFD700',
    'principal': '#FFD700',
  };

  /**
   * Inicializa el renderer con un canvas HTML
   * Configura el contexto 2D y el viewport inicial
   *
   * @param canvas - Elemento canvas HTML donde se renderizará el juego
   * @throws Error si el canvas no soporta contexto 2D
   */
  public initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('El canvas no soporta contexto 2D');
    }

    this.ctx = context;

    // Configurar viewport inicial (centrado)
    this.scale = 1;
    this.offsetX = canvas.width / 2;
    this.offsetY = canvas.height / 2;

    // Configuración de calidad de renderizado
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  /**
   * Renderiza el grafo completo (aristas, nodos y paquetes de energía)
   *
   * Orden de renderizado:
   * 1. Limpiar canvas
   * 2. Aristas (fondo)
   * 3. Nodos (medio)
   * 4. Paquetes de energía (frente)
   *
   * @param snapshot - Estado inmutable del juego
   */
  public renderGraph(snapshot: GameSnapshot): void {
    if (!this.ctx || !this.canvas) {
      throw new Error('Renderer no inicializado. Llamar initialize() primero.');
    }

    // 1. Limpiar canvas con fondo oscuro
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 2. Renderizar aristas (se verán detrás de los nodos)
    if (snapshot.edges && snapshot.edges.length > 0) {
      for (const edge of snapshot.edges) {
        this.renderEdge(edge);
      }
    }

    // 3. Renderizar nodos
    if (snapshot.nodes && snapshot.nodes.length > 0) {
      for (const node of snapshot.nodes) {
        this.renderNode(node);
      }
    }

    // 4. Renderizar paquetes de energía (encima de todo)
    if (snapshot.energyPackets && snapshot.energyPackets.length > 0) {
      this.renderEnergyPackets(snapshot.energyPackets);
    }
  }

  /**
   * Renderiza un nodo individual
   *
   * Elementos visuales:
   * - Círculo con color del propietario (gris si neutral)
   * - Borde con color del tipo de nodo
   * - Barra de energía/defensa
   * - Indicador si es nodo inicial
   *
   * @param node - Snapshot del nodo a renderizar
   */
  public renderNode(node: NodeSnapshot): void {
    if (!this.ctx) {
      throw new Error('Renderer no inicializado.');
    }

    const [canvasX, canvasY] = this.worldToCanvas(node.x, node.y);
    
    // Ajustar tamaño si es nodo principal
    const isPrincipal = node.isInitialNode;
    const radius = (node.radius * this.scale) * (isPrincipal ? 1.25 : 1.0);

    // Efecto de brillo (Glow) para el nodo principal
    if (isPrincipal) {
      this.ctx.save();
      this.ctx.shadowBlur = 25;
      this.ctx.shadowColor = node.isNeutral ? '#FFD700' : node.color;
    }

    // 1. Dibujar círculo principal con color del propietario
    this.ctx.beginPath();
    this.ctx.arc(canvasX, canvasY, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = node.isNeutral ? this.NEUTRAL_COLOR : node.color;
    this.ctx.fill();

    if (isPrincipal) {
      this.ctx.restore();
    }

    // 2. Dibujar borde con color del tipo de nodo
    this.ctx.strokeStyle = isPrincipal ? '#FFD700' : (this.NODE_TYPE_COLORS[node.nodeType] || '#FFFFFF');
    this.ctx.lineWidth = isPrincipal ? 4 : this.NODE_BORDER_WIDTH;
    this.ctx.stroke();

    // 3. Si es nodo inicial, agregar indicador especial (doble borde)
    if (isPrincipal) {
      this.ctx.beginPath();
      this.ctx.arc(canvasX, canvasY, radius + 6, 0, Math.PI * 2);
      this.ctx.strokeStyle = '#FFD700';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    // 4. Dibujar icono del tipo de nodo en el centro
    this.renderNodeTypeIcon(node, canvasX, canvasY, radius);

    // 5. Dibujar barra de energía/defensa
    this.renderEnergyBar(node, canvasX, canvasY, radius);

    // 6. Mostrar cantidad de energía como texto
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = `bold ${Math.max(10, radius / 2)}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(
      Math.floor(node.energyPool).toString(),
      canvasX,
      canvasY + radius * 0.4,
    );
  }

  /**
   * Renderiza una arista individual
   *
   * Elementos visuales:
   * - Línea entre dos nodos
   * - Grosor proporcional al peso de la arista
   *
   * @param edge - Snapshot de la arista a renderizar
   */
  public renderEdge(edge: EdgeSnapshot): void {
    if (!this.ctx) {
      throw new Error('Renderer no inicializado.');
    }

    const [fromX, fromY] = this.worldToCanvas(edge.fromX, edge.fromY);
    const [toX, toY] = this.worldToCanvas(edge.toX, edge.toY);

    // Calcular grosor de la línea basado en el peso de la arista
    const thickness = Math.max(
      this.EDGE_THICKNESS_BASE,
      edge.thickness * this.scale,
    );

    // Dibujar la línea
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    this.ctx.strokeStyle = '#555555'; // Color gris para aristas
    this.ctx.lineWidth = thickness;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();

    // Dibujar indicador de peso (opcional, para aristas largas)
    if (edge.length > 5) {
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;

      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      // Fondo para el texto
      const text = edge.length.toFixed(0);
      const textWidth = this.ctx.measureText(text).width;
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      this.ctx.fillRect(
        midX - textWidth / 2 - 2,
        midY - 6,
        textWidth + 4,
        12,
      );

      // Texto
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText(text, midX, midY);
    }
  }

  /**
   * Renderiza los paquetes de energía en tránsito
   *
   * Elementos visuales:
   * - Círculos coloreados según propietario
   * - Tamaño proporcional a la cantidad de energía
   * - Posición según el progreso del viaje
   *
   * @param packets - Array de paquetes de energía a renderizar
   */
  public renderEnergyPackets(packets: EnergyPacketSnapshot[]): void {
    if (!this.ctx) {
      throw new Error('Renderer no inicializado.');
    }

    for (const packet of packets) {
      const [canvasX, canvasY] = this.worldToCanvas(packet.x, packet.y);

      // Calcular radio del paquete basado en la cantidad de energía
      const radius = Math.max(
        this.PACKET_RADIUS_MIN,
        Math.min(
          this.PACKET_RADIUS_MAX,
          (packet.amount / 20) * this.PACKET_RADIUS_MAX,
        ),
      ) * this.scale;

      // Dibujar el paquete como un círculo
      this.ctx.beginPath();
      this.ctx.arc(canvasX, canvasY, radius, 0, Math.PI * 2);

      // Color del propietario
      this.ctx.fillStyle = packet.color;
      this.ctx.fill();

      // Borde blanco para mejor visibilidad
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Efecto de "glow" para hacer los paquetes más visibles
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = packet.color;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // Mostrar cantidad si es significativa
      if (packet.amount >= 10) {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(Math.floor(packet.amount).toString(), canvasX, canvasY);
      }
    }
  }

  /**
   * Renderiza la UI del juego
   *
   * Elementos visuales:
   * - Energía total de cada jugador
   * - Tiempo restante
   * - Porcentaje de dominancia
   * - Indicadores de victoria próxima
   *
   * @param snapshot - Estado inmutable del juego
   */
  public renderUI(snapshot: GameSnapshot): void {
    if (!this.ctx || !this.canvas) {
      throw new Error('Renderer no inicializado.');
    }

    const padding = 20;
    const lineHeight = 30;

    // 1. Renderizar información del tiempo (esquina superior derecha)
    this.renderTimeInfo(snapshot, padding, lineHeight);

    // 2. Renderizar información de jugadores (lado izquierdo)
    this.renderPlayersInfo(snapshot, padding, lineHeight);

    // 3. Renderizar advertencias de dominancia (centro superior)
    if (snapshot.dominanceWarning) {
      this.renderDominanceWarning(snapshot.dominanceWarning);
    }

    // 4. Renderizar mensaje de victoria/derrota (centro)
    // Nota: La victoria ahora se maneja en VictoryService y GameController,
    // no en el snapshot. El renderizado de victoria debe manejarse en GameScene.
    if (snapshot.status === 'finished') {
      // El mensaje de victoria ahora lo maneja GameScene directamente
      // ya que tiene acceso a VictoryResult a través del callback
    }
  }

  /**
   * Renderiza la información del tiempo
   */
  private renderTimeInfo(snapshot: GameSnapshot, padding: number, lineHeight: number): void {
    if (!this.ctx || !this.canvas) return;

    const x = this.canvas.width - padding;
    let y = padding;

    // Fondo semitransparente
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(x - 200, y - 10, 190, lineHeight * 2 + 10);

    // Tiempo transcurrido
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Tiempo: ${snapshot.elapsedTimeFormatted}`, x - padding, y);

    y += lineHeight;

    // Tiempo restante
    const timeColor = snapshot.remainingTime < 30000 ? '#FF4444' : '#44FF44';
    this.ctx.fillStyle = timeColor;
    this.ctx.fillText(`Restante: ${snapshot.remainingTimeFormatted}`, x - padding, y);
  }

  /**
   * Renderiza la información de los jugadores
   */
  private renderPlayersInfo(snapshot: GameSnapshot, padding: number, lineHeight: number): void {
    if (!this.ctx) return;

    let y = padding;

    for (const player of snapshot.playerStats) {
      // Fondo semitransparente por jugador
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(padding - 10, y - 20, 250, lineHeight * 3 + 10);

      // Nombre del jugador con su color
      this.ctx.fillStyle = player.isEliminated ? '#888888' : '#FFFFFF';
      this.ctx.font = 'bold 18px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(
        player.username + (player.isEliminated ? ' (ELIMINADO)' : ''),
        padding,
        y,
      );

      y += lineHeight;

      // Barra de color del jugador
      this.ctx.fillStyle = '#FFFFFF'; // Color del jugador (se necesitaría agregarlo a PlayerStats)
      this.ctx.fillRect(padding, y - 15, 10, 10);

      // Información de energía
      this.ctx.font = '14px Arial';
      this.ctx.fillText(
        `Energía: ${Math.floor(player.totalEnergy)} (${Math.floor(player.storedEnergy)} + ${Math.floor(player.transitEnergy)} en tránsito)`,
        padding + 20,
        y,
      );

      y += lineHeight;

      // Información de dominancia
      const dominanceColor = player.dominancePercentage >= 70 ? '#FFD700' : '#FFFFFF';
      this.ctx.fillStyle = dominanceColor;
      this.ctx.fillText(
        `Nodos: ${player.controlledNodes} (${player.dominancePercentage.toFixed(1)}%)`,
        padding,
        y,
      );

      // Tiempo de dominancia si aplica
      if (player.dominancePercentage >= 70 && player.dominanceTime > 0) {
        const dominanceSeconds = Math.floor(player.dominanceTime / 1000);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillText(
          `Dominancia: ${dominanceSeconds}s / 10s`,
          padding + 150,
          y,
        );
      }

      y += lineHeight + 20; // Espacio entre jugadores
    }
  }

  /**
   * Renderiza advertencia de dominancia próxima
   */
  private renderDominanceWarning(warning: { playerId: string | number; timeRemaining: number }): void {
    if (!this.ctx || !this.canvas) return;

    const centerX = this.canvas.width / 2;
    const y = 100;

    const seconds = Math.ceil(warning.timeRemaining / 1000);
    const message = `¡ALERTA! Victoria por dominancia en ${seconds}s`;

    // Fondo pulsante
    const alpha = 0.5 + 0.3 * Math.sin(Date.now() / 200);
    this.ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
    const textWidth = this.ctx.measureText(message).width;
    this.ctx.fillRect(centerX - textWidth / 2 - 20, y - 30, textWidth + 40, 50);

    // Texto
    this.ctx.fillStyle = '#000000';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(message, centerX, y);
  }

  /**
   * Convierte coordenadas del mundo del juego a coordenadas del canvas
   *
   * @param x - Coordenada X del mundo
   * @param y - Coordenada Y del mundo
   * @returns Coordenadas transformadas [canvasX, canvasY]
   */
  private worldToCanvas(x: number, y: number): [number, number] {
    const canvasX = x * this.scale + this.offsetX;
    const canvasY = y * this.scale + this.offsetY;
    return [canvasX, canvasY];
  }

  /**
   * Ajusta el zoom del viewport
   *
   * @param zoomLevel - Nivel de zoom (1 = normal, >1 = acercado, <1 = alejado)
   */
  public setZoom(zoomLevel: number): void {
    this.scale = Math.max(0.1, Math.min(5, zoomLevel));
  }

  /**
   * Ajusta el offset del viewport
   *
   * @param x - Offset horizontal
   * @param y - Offset vertical
   */
  public setOffset(x: number, y: number): void {
    this.offsetX = x;
    this.offsetY = y;
  }

  /**
   * Obtiene el contexto de renderizado (para extensiones)
   */
  public getContext(): CanvasRenderingContext2D | null {
    return this.ctx;
  }

  /**
   * Renderiza el icono del tipo de nodo
   *
   * @param node - Nodo a renderizar
   * @param x - Posición X en canvas
   * @param y - Posición Y en canvas
   * @param radius - Radio del nodo
   */
  private renderNodeTypeIcon(
    node: NodeSnapshot,
    x: number,
    y: number,
    radius: number,
  ): void {
    if (!this.ctx) return;

    // Si es nodo inicial (HQ), renderizar corona
    if (node.isInitialNode) {
      const iconSize = radius * 0.6;
      this.ctx.fillStyle = '#FFD700'; // Dorado
      this.ctx.beginPath();
      
      const w = iconSize * 1.2;
      const h = iconSize * 0.8;
      const topY = y - h/2;
      const botY = y + h/2;

      this.ctx.moveTo(x - w, botY); 
      this.ctx.lineTo(x + w, botY); 
      this.ctx.lineTo(x + w, topY); 
      this.ctx.lineTo(x + w/2, y);  
      this.ctx.lineTo(x, topY - h*0.3); 
      this.ctx.lineTo(x - w/2, y);  
      this.ctx.lineTo(x - w, topY); 
      this.ctx.closePath();
      
      this.ctx.fill();
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      return;
    }

    const iconSize = radius * 0.4;
    // Note: node.nodeType in snapshot is already an existing NodeType string ('basic', 'attack', 'defense', 'energy')
    this.ctx.fillStyle = this.NODE_TYPE_COLORS[node.nodeType];

    switch (node.nodeType) {
      case 'attack':
        // Triángulo apuntando hacia arriba (símbolo de ataque)
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - iconSize);
        this.ctx.lineTo(x - iconSize, y + iconSize);
        this.ctx.lineTo(x + iconSize, y + iconSize);
        this.ctx.closePath();
        this.ctx.fill();
        break;

      case 'defense':
        // Escudo (rectángulo con punta)
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - iconSize);
        this.ctx.lineTo(x - iconSize, y);
        this.ctx.lineTo(x - iconSize, y + iconSize * 0.5);
        this.ctx.lineTo(x, y + iconSize);
        this.ctx.lineTo(x + iconSize, y + iconSize * 0.5);
        this.ctx.lineTo(x + iconSize, y);
        this.ctx.closePath();
        this.ctx.fill();
        break;

      case 'energy':
        // Rayo (símbolo de energía)
        this.ctx.beginPath();
        this.ctx.moveTo(x + iconSize * 0.3, y - iconSize);
        this.ctx.lineTo(x - iconSize * 0.5, y);
        this.ctx.lineTo(x, y);
        this.ctx.lineTo(x - iconSize * 0.3, y + iconSize);
        this.ctx.lineTo(x + iconSize * 0.5, y);
        this.ctx.lineTo(x, y);
        this.ctx.closePath();
        this.ctx.fill();
        break;

      case 'basic':
      default:
        // Sin icono para nodo básico
        break;
    }
  }

  /**
   * Renderiza la barra de energía del nodo
   *
   * @param node - Nodo a renderizar
   * @param x - Posición X en canvas
   * @param y - Posición Y en canvas
   * @param radius - Radio del nodo
   */
  private renderEnergyBar(
    node: NodeSnapshot,
    x: number,
    y: number,
    radius: number,
  ): void {
    if (!this.ctx) return;

    const barWidth = radius * 1.5;
    const barHeight = 6;
    const barX = x - barWidth / 2;
    const barY = y + radius + 10;

    // Fondo de la barra (gris oscuro)
    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    // Barra de energía (color del jugador)
    const maxEnergy = 100; // TODO: Obtener de configuración
    const energyPercent = Math.min(1, node.energyPool / maxEnergy);
    this.ctx.fillStyle = node.isNeutral ? this.NEUTRAL_COLOR : node.color;
    this.ctx.fillRect(barX, barY, barWidth * energyPercent, barHeight);

    // Borde de la barra
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);
  }
}