import {
    AssignEnergyCommand,
    ClearNodeAssignmentsCommand,
    CommandHistory,
    SendEnergyPacketCommand,
    UnassignEnergyCommand,
} from '../../application/commands/game-commands';
import type { Edge } from '../../core/entities/edge';
import type { Node } from '../../core/entities/node/node';
import type { Player } from '../../core/entities/player';
import Phaser from 'phaser';

/**
 * InputHandler - Gestiona la entrada del usuario usando Command Pattern
 * Convierte acciones del usuario en comandos ejecutables con undo/redo
 */
export class InputHandler {
  private commandHistory: CommandHistory;
  private selectedNode: Node | null = null;
  private targetEdge: Edge | null = null;
  private currentPlayer: Player;
  
  // UI references
  private scene: Phaser.Scene;
  private selectionIndicator: Phaser.GameObjects.Graphics | null = null;
  private assignmentUI: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.currentPlayer = player;
    this.commandHistory = new CommandHistory();
    
    this.setupKeyboardShortcuts();
  }

  /**
   * Configura atajos de teclado
   */
  private setupKeyboardShortcuts(): void {
    // Ctrl+Z: Undo
    this.scene.input.keyboard?.on('keydown-Z', (event: KeyboardEvent) => {
      if (event.ctrlKey) {
        this.undo();
      }
    });
    
    // Ctrl+Y: Redo
    this.scene.input.keyboard?.on('keydown-Y', (event: KeyboardEvent) => {
      if (event.ctrlKey) {
        this.redo();
      }
    });
    
    // C: Clear assignments
    this.scene.input.keyboard?.on('keydown-C', () => {
      if (this.selectedNode) {
        this.clearNodeAssignments(this.selectedNode);
      }
    });
    
    // Space: Send energy packet
    this.scene.input.keyboard?.on('keydown-SPACE', () => {
      if (this.selectedNode && this.targetEdge) {
        this.sendEnergyPacket(this.selectedNode, this.targetEdge);
      }
    });
    
    // Numbers 1-9: Quick assign energy (10%, 20%, ..., 90%)
    for (let i = 1; i <= 9; i++) {
      this.scene.input.keyboard?.on(`keydown-${i}`, () => {
        if (this.selectedNode && this.targetEdge) {
          const percentage = i * 0.1;
          const amount = Math.floor(this.selectedNode.getAvailableEnergy() * percentage);
          this.assignEnergy(this.selectedNode, this.targetEdge, amount);
        }
      });
    }
  }

  /**
   * Selecciona un nodo
   */
  selectNode(node: Node): void {
    // Solo permitir seleccionar nodos propios
    if (!node.isOwnedBy(this.currentPlayer)) {
      console.log('Cannot select enemy or neutral node');
      return;
    }
    
    this.selectedNode = node;
    this.targetEdge = null;
    
    console.log(`Selected node: ${node.id}`);
    this.updateSelectionIndicator();
    this.showAssignmentUI();
  }

  /**
   * Deselecciona el nodo actual
   */
  deselectNode(): void {
    this.selectedNode = null;
    this.targetEdge = null;
    this.updateSelectionIndicator();
    this.hideAssignmentUI();
  }

  /**
   * Selecciona una arista para asignar energía
   */
  selectEdge(edge: Edge): void {
    if (!this.selectedNode) {
      console.log('No node selected');
      return;
    }
    
    if (!this.selectedNode.hasEdge(edge)) {
      console.log('Edge not connected to selected node');
      return;
    }
    
    this.targetEdge = edge;
    console.log(`Selected edge: ${edge.id}`);
  }

  /**
   * Asigna energía a una arista (Command Pattern)
   */
  assignEnergy(node: Node, edge: Edge, amount: number): boolean {
    const command = new AssignEnergyCommand(node, edge, amount);
    
    if (this.commandHistory.execute(command)) {
      console.log(`✅ Assigned ${amount} energy to edge ${edge.id}`);
      this.updateAssignmentUI();
      return true;
    } else {
      console.log(`❌ Failed to assign energy: insufficient energy or invalid edge`);
      return false;
    }
  }

  /**
   * Desasigna energía de una arista (Command Pattern)
   */
  unassignEnergy(node: Node, edge: Edge, amount: number): boolean {
    const command = new UnassignEnergyCommand(node, edge, amount);
    
    if (this.commandHistory.execute(command)) {
      console.log(`✅ Unassigned ${amount} energy from edge ${edge.id}`);
      this.updateAssignmentUI();
      return true;
    } else {
      console.log(`❌ Failed to unassign energy`);
      return false;
    }
  }

  /**
   * Envía un paquete de energía (Command Pattern)
   */
  sendEnergyPacket(node: Node, edge: Edge): boolean {
    const assignedAmount = node.getEdgeAssignment(edge);
    
    if (assignedAmount === 0) {
      console.log('❌ No energy assigned to this edge');
      return false;
    }
    
    const command = new SendEnergyPacketCommand(edge, node, assignedAmount, this.currentPlayer);
    
    if (this.commandHistory.execute(command)) {
      console.log(`🚀 Sent ${assignedAmount} energy through edge ${edge.id}`);
      return true;
    } else {
      console.log(`❌ Failed to send energy packet`);
      return false;
    }
  }

  /**
   * Limpia todas las asignaciones de un nodo (Command Pattern)
   */
  clearNodeAssignments(node: Node): boolean {
    const command = new ClearNodeAssignmentsCommand(node);
    
    if (this.commandHistory.execute(command)) {
      console.log(`✅ Cleared all assignments from node ${node.id}`);
      this.updateAssignmentUI();
      return true;
    } else {
      console.log(`❌ Failed to clear assignments`);
      return false;
    }
  }

  /**
   * Deshace el último comando
   */
  undo(): boolean {
    if (this.commandHistory.undo()) {
      console.log('⏪ Undid last command');
      this.updateAssignmentUI();
      return true;
    } else {
      console.log('Nothing to undo');
      return false;
    }
  }

  /**
   * Rehace el último comando deshecho
   */
  redo(): boolean {
    if (this.commandHistory.redo()) {
      console.log('⏩ Redid command');
      this.updateAssignmentUI();
      return true;
    } else {
      console.log('Nothing to redo');
      return false;
    }
  }

  /**
   * Actualiza el indicador visual de selección
   */
  private updateSelectionIndicator(): void {
    // Limpiar indicador anterior
    if (this.selectionIndicator) {
      this.selectionIndicator.destroy();
      this.selectionIndicator = null;
    }
    
    // Crear nuevo indicador si hay nodo seleccionado
    if (this.selectedNode) {
      const graphics = this.scene.add.graphics();
      const radius = 35;
      
      graphics.lineStyle(4, 0xffff00, 1);
      graphics.strokeCircle(
        this.selectedNode.position.x,
        this.selectedNode.position.y,
        radius
      );
      
      // Agregar animación de pulso
      this.scene.tweens.add({
        targets: graphics,
        alpha: 0.3,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
      
      this.selectionIndicator = graphics;
    }
  }

  /**
   * Muestra la UI de asignación de energía
   */
  private showAssignmentUI(): void {
    if (!this.selectedNode) return;
    
    this.hideAssignmentUI();
    
    const container = this.scene.add.container(650, 50);
    
    // Panel de fondo
    const bg = this.scene.add.rectangle(0, 0, 300, 200, 0x000000, 0.8);
    container.add(bg);
    
    // Título
    const title = this.scene.add.text(0, -80, `Node: ${this.selectedNode.id}`, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(title);
    
    // Energía disponible
    const availableText = this.scene.add.text(
      0,
      -50,
      `Available: ${Math.floor(this.selectedNode.getAvailableEnergy())}`,
      {
        fontSize: '14px',
        color: '#00ff00',
      }
    ).setOrigin(0.5);
    container.add(availableText);
    
    // Lista de aristas
    let yOffset = -20;
    for (const edge of this.selectedNode.edges) {
      const assigned = this.selectedNode.getEdgeAssignment(edge);
      const edgeText = this.scene.add.text(
        0,
        yOffset,
        `Edge ${edge.id}: ${assigned}`,
        {
          fontSize: '12px',
          color: assigned > 0 ? '#ffff00' : '#888888',
        }
      ).setOrigin(0.5);
      container.add(edgeText);
      yOffset += 20;
    }
    
    // Instrucciones
    const instructions = this.scene.add.text(
      0,
      80,
      'Keys: 1-9=Assign % | C=Clear | Space=Send',
      {
        fontSize: '10px',
        color: '#888888',
      }
    ).setOrigin(0.5);
    container.add(instructions);
    
    this.assignmentUI = container;
  }

  /**
   * Oculta la UI de asignación
   */
  private hideAssignmentUI(): void {
    if (this.assignmentUI) {
      this.assignmentUI.destroy();
      this.assignmentUI = null;
    }
  }

  /**
   * Actualiza la UI de asignación
   */
  private updateAssignmentUI(): void {
    if (this.selectedNode) {
      this.showAssignmentUI();
    }
  }

  /**
   * Limpia todos los recursos
   */
  cleanup(): void {
    if (this.selectionIndicator) {
      this.selectionIndicator.destroy();
    }
    if (this.assignmentUI) {
      this.assignmentUI.destroy();
    }
    this.commandHistory.clear();
  }

  // Getters
  getSelectedNode(): Node | null {
    return this.selectedNode;
  }

  getTargetEdge(): Edge | null {
    return this.targetEdge;
  }

  canUndo(): boolean {
    return this.commandHistory.canUndo();
  }

  canRedo(): boolean {
    return this.commandHistory.canRedo();
  }
}
