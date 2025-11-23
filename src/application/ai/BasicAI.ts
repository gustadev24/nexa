import type { Edge } from '@/core/entities/edge';
import type { Node } from '@/core/entities/node/node';
import type { Player } from '@/core/entities/player';
import type { GameManager } from '@/core/managers/GameManager';

/**
 * Dificultad de la IA
 */
export enum AIDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

/**
 * Estrategia de juego de la IA
 */
interface AIStrategy {
  aggressiveness: number; // 0-1: Cuán agresiva es la IA
  defenseWeight: number; // 0-1: Importancia de la defensa
  expansionWeight: number; // 0-1: Importancia de expandirse
  energyManagement: number; // 0-1: Conservador vs agresivo con energía
}

/**
 * Acción planeada por la IA
 */
interface PlannedAction {
  type: 'send_energy' | 'assign_energy' | 'unassign_energy';
  sourceNode: Node;
  targetNode?: Node;
  edge?: Edge;
  amount: number;
  priority: number;
}

/**
 * BasicAI - Controlador de IA para jugadores computadora
 * Implementa lógica de toma de decisiones y estrategia básica
 */
export class BasicAI {
  private gameManager: GameManager;
  private player: Player;
  private difficulty: AIDifficulty;
  private strategy: AIStrategy;
  
  // Decision making
  private decisionInterval: number = 1000; // ms entre decisiones
  private lastDecisionTime: number = 0;
  private plannedActions: PlannedAction[] = [];

  constructor(
    gameManager: GameManager,
    player: Player,
    difficulty: AIDifficulty = AIDifficulty.MEDIUM
  ) {
    this.gameManager = gameManager;
    this.player = player;
    this.difficulty = difficulty;
    this.strategy = this.getStrategyForDifficulty(difficulty);
  }

  /**
   * Obtiene la estrategia según la dificultad
   */
  private getStrategyForDifficulty(difficulty: AIDifficulty): AIStrategy {
    switch (difficulty) {
      case AIDifficulty.EASY:
        return {
          aggressiveness: 0.3,
          defenseWeight: 0.6,
          expansionWeight: 0.5,
          energyManagement: 0.7, // Muy conservador
        };
      case AIDifficulty.MEDIUM:
        return {
          aggressiveness: 0.6,
          defenseWeight: 0.5,
          expansionWeight: 0.7,
          energyManagement: 0.5, // Balanceado
        };
      case AIDifficulty.HARD:
        return {
          aggressiveness: 0.9,
          defenseWeight: 0.4,
          expansionWeight: 0.9,
          energyManagement: 0.3, // Agresivo con energía
        };
      default:
        return this.getStrategyForDifficulty(AIDifficulty.MEDIUM);
    }
  }

  /**
   * Actualiza la IA (llamar desde el game loop)
   */
  update(deltaTime: number): void {
    this.lastDecisionTime += deltaTime;
    
    if (this.lastDecisionTime >= this.decisionInterval) {
      this.makeDecision();
      this.lastDecisionTime = 0;
    }
    
    // Ejecutar acciones planeadas
    this.executeActions();
  }

  /**
   * Toma de decisiones principal
   */
  private makeDecision(): void {
    // Limpiar acciones anteriores
    this.plannedActions = [];
    
    // Obtener nodos propios
    const ownedNodes = this.getOwnedNodes();
    
    if (ownedNodes.length === 0) {
      return; // No hay nodos, no se puede hacer nada
    }
    
    // Evaluar situación
    const situation = this.evaluateSituation(ownedNodes);
    
    // Planear acciones según la situación
    if (situation.underAttack) {
      this.planDefensiveActions(ownedNodes);
    }
    
    if (situation.canExpand) {
      this.planExpansionActions(ownedNodes);
    }
    
    if (situation.canAttack) {
      this.planAttackActions(ownedNodes);
    }
    
    // Gestionar energía de los nodos
    this.planEnergyManagement(ownedNodes);
    
    // Ordenar acciones por prioridad
    this.plannedActions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Evalúa la situación actual del juego
   */
  private evaluateSituation(ownedNodes: Node[]): {
    underAttack: boolean;
    canExpand: boolean;
    canAttack: boolean;
    totalEnergy: number;
  } {
    let underAttack = false;
    let canExpand = false;
    let canAttack = false;
    let totalEnergy = 0;
    
    for (const node of ownedNodes) {
      totalEnergy += node.energyPool;
      
      // Verificar si el nodo está bajo ataque
      const incomingPackets = this.getIncomingEnemyPackets(node);
      if (incomingPackets.length > 0) {
        underAttack = true;
      }
      
      // Verificar nodos neutrales adyacentes (expansión)
      const adjacentNeutral = this.getAdjacentNeutralNodes(node);
      if (adjacentNeutral.length > 0) {
        canExpand = true;
      }
      
      // Verificar nodos enemigos adyacentes (ataque)
      const adjacentEnemy = this.getAdjacentEnemyNodes(node);
      if (adjacentEnemy.length > 0) {
        canAttack = true;
      }
    }
    
    return { underAttack, canExpand, canAttack, totalEnergy };
  }

  /**
   * Planea acciones defensivas
   */
  private planDefensiveActions(ownedNodes: Node[]): void {
    for (const node of ownedNodes) {
      const incomingPackets = this.getIncomingEnemyPackets(node);
      
      if (incomingPackets.length > 0) {
        // Calcular energía enemiga entrante
        const incomingEnergy = incomingPackets.reduce((sum, p) => sum + p.amount, 0);
        
        // Si no hay suficiente energía para defender, solicitar refuerzos
        if (node.energyPool < incomingEnergy * 1.2) {
          this.requestReinforcements(node, incomingEnergy - node.energyPool);
        }
        
        // Reducir asignaciones de energía ofensiva
        this.plannedActions.push({
          type: 'unassign_energy',
          sourceNode: node,
          amount: 50, // Reducir 50% de asignaciones
          priority: 9, // Alta prioridad
        });
      }
    }
  }

  /**
   * Planea acciones de expansión (capturar nodos neutrales)
   */
  private planExpansionActions(ownedNodes: Node[]): void {
    for (const node of ownedNodes) {
      // Solo expandir desde nodos con suficiente energía
      if (node.energyPool < 50) continue;
      
      const neutralNodes = this.getAdjacentNeutralNodes(node);
      
      for (const target of neutralNodes) {
        const priority = this.calculateNodePriority(target);
        const edge = this.findEdge(node, target);
        
        if (edge) {
          this.plannedActions.push({
            type: 'send_energy',
            sourceNode: node,
            targetNode: target,
            edge,
            amount: Math.min(target.energyPool + 20, node.energyPool * 0.4),
            priority: priority * this.strategy.expansionWeight * 10,
          });
        }
      }
    }
  }

  /**
   * Planea acciones de ataque
   */
  private planAttackActions(ownedNodes: Node[]): void {
    for (const node of ownedNodes) {
      // Solo atacar desde nodos con energía suficiente
      if (node.energyPool < 70) continue;
      
      const enemyNodes = this.getAdjacentEnemyNodes(node);
      
      for (const target of enemyNodes) {
        // Calcular si el ataque es viable
        const requiredEnergy = target.energyPool + 30;
        
        if (node.energyPool >= requiredEnergy * 1.3) {
          const edge = this.findEdge(node, target);
          
          if (edge) {
            this.plannedActions.push({
              type: 'send_energy',
              sourceNode: node,
              targetNode: target,
              edge,
              amount: requiredEnergy,
              priority: this.strategy.aggressiveness * 8,
            });
          }
        }
      }
    }
  }

  /**
   * Planea la gestión de energía de los nodos
   */
  private planEnergyManagement(ownedNodes: Node[]): void {
    for (const node of ownedNodes) {
      const energyPercent = node.energyPool / 100;
      
      // Nodos con poca energía: reducir asignaciones
      if (energyPercent < 0.3) {
        this.plannedActions.push({
          type: 'unassign_energy',
          sourceNode: node,
          amount: 80,
          priority: 7,
        });
      }
      
      // Nodos con mucha energía: aumentar asignaciones
      else if (energyPercent > 0.8 && node.type.toString().toUpperCase() !== 'ENERGY') {
        // Asignar energía a aristas prometedoras
        const edges = this.getEdgesFromNode(node);
        const bestEdge = this.selectBestEdge(edges, node);
        
        if (bestEdge) {
          this.plannedActions.push({
            type: 'assign_energy',
            sourceNode: node,
            edge: bestEdge,
            amount: 30,
            priority: 5,
          });
        }
      }
    }
  }

  /**
   * Solicita refuerzos para un nodo
   */
  private requestReinforcements(node: Node, requiredEnergy: number): void {
    const ownedNodes = this.getOwnedNodes();
    
    for (const ally of ownedNodes) {
      if (ally === node) continue;
      
      const edge = this.findEdge(ally, node);
      
      if (edge && ally.energyPool > 50) {
        this.plannedActions.push({
          type: 'send_energy',
          sourceNode: ally,
          targetNode: node,
          edge,
          amount: Math.min(requiredEnergy, ally.energyPool * 0.5),
          priority: 10, // Máxima prioridad
        });
        break;
      }
    }
  }

  /**
   * Ejecuta las acciones planeadas
   */
  private executeActions(): void {
    const maxActionsPerCycle = this.difficulty === AIDifficulty.HARD ? 3 : 
                               this.difficulty === AIDifficulty.MEDIUM ? 2 : 1;
    
    for (let i = 0; i < Math.min(maxActionsPerCycle, this.plannedActions.length); i++) {
      const action = this.plannedActions.shift();
      if (action) {
        this.executeAction(action);
      }
    }
  }

  /**
   * Ejecuta una acción individual
   */
  private executeAction(action: PlannedAction): void {
    try {
      switch (action.type) {
        case 'send_energy':
          if (action.targetNode && action.edge) {
            // Simular envío de paquete (llamar al comando correspondiente)
            // this.gameManager.sendEnergyPacket(action.sourceNode, action.edge, action.amount);
            console.log(`AI: Sending ${action.amount} energy from ${action.sourceNode.id} to ${action.targetNode.id}`);
          }
          break;
          
        case 'assign_energy':
          if (action.edge) {
            // this.gameManager.assignEnergy(action.sourceNode, action.edge, action.amount);
            console.log(`AI: Assigning ${action.amount}% energy to edge from ${action.sourceNode.id}`);
          }
          break;
          
        case 'unassign_energy':
          // this.gameManager.unassignEnergy(action.sourceNode, action.amount);
          console.log(`AI: Unassigning ${action.amount}% energy from ${action.sourceNode.id}`);
          break;
      }
    } catch (error) {
      console.error('AI action failed:', error);
    }
  }

  /**
   * Calcula la prioridad de un nodo objetivo
   */
  private calculateNodePriority(node: Node): number {
    let priority = 1;
    
    // Priorizar según el tipo de nodo
    const nodeTypeValue = node.type.toString().toUpperCase();
    switch (nodeTypeValue) {
      case 'SUPER_ENERGY':
        priority = 10;
        break;
      case 'ENERGY':
        priority = 8;
        break;
      case 'ATTACK':
        priority = 6;
        break;
      case 'DEFENSE':
        priority = 5;
        break;
      case 'BASIC':
        priority = 3;
        break;
    }
    
    // Ajustar por posición estratégica (nodos con más conexiones)
    const adjacentCount = this.getAdjacentNodes(node).length;
    priority += adjacentCount * 0.5;
    
    return priority;
  }

  /**
   * Selecciona la mejor arista para asignar energía
   */
  private selectBestEdge(edges: Edge[], sourceNode: Node): Edge | null {
    if (edges.length === 0) return null;
    
    let bestEdge: Edge | null = null;
    let bestScore = -1;
    
    for (const edge of edges) {
      const target = edge.nodeA === sourceNode ? edge.nodeB : edge.nodeA;
      let score = this.calculateNodePriority(target);
      
      // Preferir nodos enemigos si somos agresivos
      if (target.owner && target.owner !== this.player) {
        score *= this.strategy.aggressiveness * 2;
      }
      
      // Preferir nodos neutrales para expansión
      if (!target.owner) {
        score *= this.strategy.expansionWeight * 1.5;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestEdge = edge;
      }
    }
    
    return bestEdge;
  }

  // ========== Helper Methods ==========

  private getOwnedNodes(): Node[] {
    return this.gameManager.getNodesByOwner(this.player);
  }

  private getIncomingEnemyPackets(_node: Node) {
    const incoming = this.gameManager.getIncomingPackets(_node);
    return incoming.filter(p => p.owner.id !== this.player.id);
  }

  private getAdjacentNeutralNodes(node: Node): Node[] {
    return this.getAdjacentNodes(node).filter((n) => !n.owner);
  }

  private getAdjacentEnemyNodes(node: Node): Node[] {
    return this.getAdjacentNodes(node).filter((n) => n.owner && n.owner !== this.player);
  }

  private getAdjacentNodes(_node: Node): Node[] {
    return this.gameManager.getAdjacentNodes(_node);
  }

  private findEdge(_nodeA: Node, _nodeB: Node): Edge | null {
    return this.gameManager.findEdge(_nodeA, _nodeB);
  }

  private getEdgesFromNode(_node: Node): Edge[] {
    return this.gameManager.getEdgesFromNode(_node);
  }

  // ========== Public API ==========

  /**
   * Cambia la dificultad de la IA
   */
  setDifficulty(difficulty: AIDifficulty): void {
    this.difficulty = difficulty;
    this.strategy = this.getStrategyForDifficulty(difficulty);
  }

  /**
   * Obtiene la dificultad actual
   */
  getDifficulty(): AIDifficulty {
    return this.difficulty;
  }

  /**
   * Pausa/reanuda la IA
   */
  setEnabled(enabled: boolean): void {
    if (!enabled) {
      this.plannedActions = [];
    }
  }
}
