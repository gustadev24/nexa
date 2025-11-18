/**
 * AIController - NEXA
 *
 * Controlador general para la IA enemiga.
 * Toma decisiones simples durante el juego.
 */

import type { ID, IGameState, INode, IPlayer } from "@/core/types";
import { GamePhase, PlayerType } from "@/core/types";
import { GameManager } from "./GameManager";

/**
 * AIController Singleton
 * Controla las decisiones de los jugadores AI
 */
export class AIController {
  private static instance: AIController | null = null;
  private gameManager: GameManager;
  private lastDecisionTime: number = 0;
  
  // Ticket 3: Variables de comportamiento
  private aiDelay: number = 2000; // Intervalo de acción en ms (configurable)
  private aiAggression: number = 70; // Porcentaje de chance de actuar (0-100)

  private constructor() {
    this.gameManager = GameManager.getInstance();
    console.log("[AIController] Controlador AI creado");
    console.log(`[AIController] Configuración inicial - Delay: ${this.aiDelay}ms, Aggression: ${this.aiAggression}%`);
  }

  /**
   * Obtener instancia singleton
   */
  public static getInstance(): AIController {
    if (!AIController.instance) {
      AIController.instance = new AIController();
    }
    return AIController.instance;
  }

  /**
   * Inicializar el controlador
   */
  public initialize(): void {
    this.lastDecisionTime = 0;
    console.log("[AIController] Inicializado");
  }

  /**
   * Actualización principal - ejecutada cada frame
   * @param deltaTime - Tiempo transcurrido desde el último frame (ms)
   */
  public update(deltaTime: number): void {
    const gameState = this.gameManager.getGameState();

    // Solo procesar si el juego está activo
    if (!gameState || gameState.phase !== GamePhase.PLAYING) {
      return;
    }

    // Actualizar temporizador
    this.lastDecisionTime += deltaTime;

    // Tomar decisiones cada cierto intervalo (aiDelay)
    if (this.lastDecisionTime >= this.aiDelay) {
      this.lastDecisionTime = 0;
      this.makeDecisions(gameState);
    }
  }

  /**
   * Tomar decisiones para todos los jugadores AI
   */
  private makeDecisions(gameState: IGameState): void {
    const aiPlayers = this.getAIPlayers(gameState);

    for (const player of aiPlayers) {
      this.decideForPlayer(player, gameState);
    }
  }

  /**
   * Tomar decisión para un jugador AI específico
   */
  private decideForPlayer(player: IPlayer, gameState: IGameState): void {
    const controlledNodes = this.getControlledNodes(player.id, gameState);

    if (controlledNodes.length === 0) {
      return;
    }

    // Lógica de expansión: buscar nodos libres adyacentes
    this.tryExpand(player, controlledNodes, gameState);
  }

  /**
   * Intentar expandirse a un nodo libre adyacente
   * Ticket 2: Lógica de expansión básica
   * Ticket 3: Variables de comportamiento (aiAggression)
   */
  private tryExpand(player: IPlayer, controlledNodes: INode[], gameState: IGameState): void {
    // Buscar nodos conectados al dominio de la IA
    const freeAdjacentNodes = this.findFreeAdjacentNodes(controlledNodes, gameState);

    if (freeAdjacentNodes.length === 0) {
      console.log(`[AIController] ${player.name} no tiene nodos libres adyacentes`);
      return;
    }

    // Ticket 3: Aplicar aiAggression - porcentaje de chance de actuar
    const random = Math.random() * 100;
    console.log(`[AIController] ${player.name} - Roll: ${random.toFixed(1)}% vs Aggression: ${this.aiAggression}%`);
    
    if (random > this.aiAggression) {
      console.log(`[AIController] ${player.name} decide NO actuar esta ronda (chance fallido)`);
      return;
    }

    console.log(`[AIController] ${player.name} decide ACTUAR (${freeAdjacentNodes.length} nodos disponibles)`);

    // Seleccionar uno libre aleatorio
    const randomIndex = Math.floor(Math.random() * freeAdjacentNodes.length);
    const targetNode = freeAdjacentNodes[randomIndex];

    // Conquistarlo cambiando su propiedad owner
    this.conquerNode(targetNode, player, gameState);
  }

  /**
   * Buscar nodos conectados al dominio de la IA que estén libres (sin owner)
   */
  private findFreeAdjacentNodes(controlledNodes: INode[], gameState: IGameState): INode[] {
    const freeNodes: INode[] = [];
    const checkedNodeIds = new Set<ID>();

    for (const controlledNode of controlledNodes) {
      // Buscar nodos conectados a este nodo
      for (const connectedNodeId of controlledNode.connections) {
        // Evitar revisar el mismo nodo múltiples veces
        if (checkedNodeIds.has(connectedNodeId)) {
          continue;
        }
        checkedNodeIds.add(connectedNodeId);

        const node = gameState.nodes.get(connectedNodeId);
        
        // Verificar que el nodo existe y está libre (owner === null)
        if (node && node.owner === null) {
          freeNodes.push(node);
        }
      }
    }

    return freeNodes;
  }

  /**
   * Conquistar un nodo cambiando su owner
   */
  private conquerNode(node: INode, player: IPlayer, gameState: IGameState): void {
    console.log(`[AIController] ${player.name} conquista nodo ${node.id}`);
    
    // Cambiar el dueño del nodo
    node.owner = player.id;
    
    // Actualizar en el estado del juego
    gameState.nodes.set(node.id, node);
    
    // Actualizar la lista de nodos controlados del jugador
    if (!player.controlledNodes.includes(node.id)) {
      player.controlledNodes.push(node.id);
    }
    
    console.log(`[AIController] ${player.name} ahora controla ${player.controlledNodes.length} nodo(s)`);
  }

  /**
   * Obtener todos los jugadores AI activos
   */
  private getAIPlayers(gameState: IGameState): IPlayer[] {
    return Array.from(gameState.players.values()).filter(
      (player) => player.type === PlayerType.AI && !player.isEliminated && player.isActive,
    );
  }

  /**
   * Obtener nodos controlados por un jugador
   * Esta es la "referencia a nodos controlados" del ticket
   */
  private getControlledNodes(playerId: ID, gameState: IGameState): INode[] {
    return Array.from(gameState.nodes.values()).filter((node) => node.owner === playerId);
  }

  /**
   * Reiniciar el controlador
   */
  public reset(): void {
    this.lastDecisionTime = 0;
    console.log("[AIController] Reiniciado");
  }

  /**
   * Ticket 3: Configurar intervalo de acción (aiDelay)
   * @param delay - Intervalo en milisegundos entre decisiones
   */
  public setAiDelay(delay: number): void {
    this.aiDelay = Math.max(100, delay); // Mínimo 100ms
    console.log(`[AIController] aiDelay configurado a ${this.aiDelay}ms`);
  }

  /**
   * Ticket 3: Configurar agresividad (aiAggression)
   * @param aggression - Porcentaje de chance de actuar (0-100)
   */
  public setAiAggression(aggression: number): void {
    this.aiAggression = Math.max(0, Math.min(100, aggression)); // Clamp 0-100
    console.log(`[AIController] aiAggression configurado a ${this.aiAggression}%`);
  }

  /**
   * Obtener configuración actual
   */
  public getConfig(): { aiDelay: number; aiAggression: number } {
    return {
      aiDelay: this.aiDelay,
      aiAggression: this.aiAggression,
    };
  }

  /**
   * Destruir instancia (solo para testing)
   */
  public static destroy(): void {
    AIController.instance = null;
  }
}
