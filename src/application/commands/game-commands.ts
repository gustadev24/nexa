import type { Edge } from '../../core/entities/edge';
import type { Node } from '../../core/entities/node/node';
import type { Player } from '../../core/entities/player';

/**
 * Interfaz base para comandos (Command Pattern)
 * Permite ejecutar, deshacer y validar acciones del jugador
 */
export interface ICommand {
  /**
   * Ejecuta el comando
   * @returns true si se ejecutó exitosamente
   */
  execute(): boolean;
  
  /**
   * Deshace el comando (si es posible)
   */
  undo?(): void;
  
  /**
   * Verifica si el comando es válido antes de ejecutarlo
   */
  canExecute(): boolean;
  
  /**
   * Nombre descriptivo del comando
   */
  getName(): string;
}

/**
 * Comando abstracto base con lógica común
 */
export abstract class BaseCommand implements ICommand {
  protected executed: boolean = false;
  
  abstract execute(): boolean;
  abstract canExecute(): boolean;
  abstract getName(): string;
  
  undo?(): void {
    console.warn(`Undo not implemented for ${this.getName()}`);
  }
}

/**
 * Comando: Asignar energía a una arista para ataque
 */
export class AssignEnergyCommand extends BaseCommand {
  constructor(
    private node: Node,
    private edge: Edge,
    private amount: number,
  ) {
    super();
  }
  
  canExecute(): boolean {
    // Verificar que el nodo está conectado a la arista
    if (!this.node.hasEdge(this.edge)) {
      return false;
    }
    
    // Verificar que hay suficiente energía disponible
    return this.node.getAvailableEnergy() >= this.amount;
  }
  
  execute(): boolean {
    if (!this.canExecute()) {
      return false;
    }
    
    const success = this.node.assignEnergyToEdge(this.edge, this.amount);
    if (success) {
      this.executed = true;
    }
    
    return success;
  }
  
  undo(): void {
    if (!this.executed) {
      return;
    }
    
    this.node.unassignEnergyFromEdge(this.edge, this.amount);
    this.executed = false;
  }
  
  getName(): string {
    return `AssignEnergy(${this.amount} to Edge ${this.edge.id})`;
  }
}

/**
 * Comando: Desasignar energía de una arista
 */
export class UnassignEnergyCommand extends BaseCommand {
  constructor(
    private node: Node,
    private edge: Edge,
    private amount: number,
  ) {
    super();
  }
  
  canExecute(): boolean {
    // Verificar que hay energía asignada en la arista
    return this.node.hasEdge(this.edge);
  }
  
  execute(): boolean {
    if (!this.canExecute()) {
      return false;
    }
    
    this.node.unassignEnergyFromEdge(this.edge, this.amount);
    this.executed = true;
    return true;
  }
  
  undo(): void {
    if (!this.executed) {
      return;
    }
    
    this.node.assignEnergyToEdge(this.edge, this.amount);
    this.executed = false;
  }
  
  getName(): string {
    return `UnassignEnergy(${this.amount} from Edge ${this.edge.id})`;
  }
}

/**
 * Comando: Enviar paquete de energía por una arista
 */
export class SendEnergyPacketCommand extends BaseCommand {
  constructor(
    private edge: Edge,
    private fromNode: Node,
    private amount: number,
    private owner: Player,
  ) {
    super();
  }
  
  canExecute(): boolean {
    // Verificar que el nodo está conectado a la arista
    if (!this.edge.hasNode(this.fromNode)) {
      return false;
    }
    
    // Verificar que el jugador es dueño del nodo
    if (!this.fromNode.isOwnedBy(this.owner)) {
      return false;
    }
    
    // Verificar que hay suficiente energía asignada
    return this.fromNode.getAttackEnergy(this.edge) >= this.amount;
  }
  
  execute(): boolean {
    if (!this.canExecute()) {
      return false;
    }
    
    this.edge.sendEnergy(this.fromNode, this.amount, this.owner);
    this.executed = true;
    return true;
  }
  
  getName(): string {
    return `SendEnergyPacket(${this.amount} from Node ${this.fromNode.id})`;
  }
}

/**
 * Comando: Limpiar todas las asignaciones de un nodo
 */
export class ClearNodeAssignmentsCommand extends BaseCommand {
  private previousAssignments: Map<Edge, number> = new Map();
  
  constructor(private node: Node) {
    super();
  }
  
  canExecute(): boolean {
    return true; // Siempre se puede limpiar
  }
  
  execute(): boolean {
    // Guardar estado previo para undo
    for (const edge of this.node.edges) {
      const assignment = this.node.getEdgeAssignment(edge);
      if (assignment > 0) {
        this.previousAssignments.set(edge, assignment);
      }
    }
    
    this.node.clearAssignments();
    this.executed = true;
    return true;
  }
  
  undo(): void {
    if (!this.executed) {
      return;
    }
    
    // Restaurar asignaciones previas
    for (const [edge, amount] of this.previousAssignments) {
      this.node.assignEnergyToEdge(edge, amount);
    }
    
    this.previousAssignments.clear();
    this.executed = false;
  }
  
  getName(): string {
    return `ClearNodeAssignments(Node ${this.node.id})`;
  }
}

/**
 * Comando Compuesto: Ejecuta múltiples comandos en secuencia
 */
export class CompositeCommand extends BaseCommand {
  constructor(private commands: ICommand[]) {
    super();
  }
  
  canExecute(): boolean {
    return this.commands.every(cmd => cmd.canExecute());
  }
  
  execute(): boolean {
    if (!this.canExecute()) {
      return false;
    }
    
    for (const command of this.commands) {
      if (!command.execute()) {
        // Si falla alguno, deshacer todos los anteriores
        this.undo();
        return false;
      }
    }
    
    this.executed = true;
    return true;
  }
  
  undo(): void {
    if (!this.executed) {
      return;
    }
    
    // Deshacer en orden inverso
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo?.();
    }
    
    this.executed = false;
  }
  
  getName(): string {
    return `CompositeCommand(${this.commands.length} commands)`;
  }
}

/**
 * Gestor de historial de comandos (para undo/redo)
 */
export class CommandHistory {
  private history: ICommand[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;
  
  /**
   * Ejecuta un comando y lo agrega al historial
   */
  execute(command: ICommand): boolean {
    const success = command.execute();
    
    if (success) {
      // Eliminar comandos futuros si estamos en medio del historial
      this.history = this.history.slice(0, this.currentIndex + 1);
      
      // Agregar nuevo comando
      this.history.push(command);
      this.currentIndex++;
      
      // Limitar tamaño del historial
      if (this.history.length > this.maxHistorySize) {
        this.history.shift();
        this.currentIndex--;
      }
    }
    
    return success;
  }
  
  /**
   * Deshace el último comando
   */
  undo(): boolean {
    if (!this.canUndo()) {
      return false;
    }
    
    const command = this.history[this.currentIndex];
    command.undo?.();
    this.currentIndex--;
    return true;
  }
  
  /**
   * Rehace el siguiente comando
   */
  redo(): boolean {
    if (!this.canRedo()) {
      return false;
    }
    
    this.currentIndex++;
    const command = this.history[this.currentIndex];
    return command.execute();
  }
  
  /**
   * Verifica si se puede deshacer
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }
  
  /**
   * Verifica si se puede rehacer
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }
  
  /**
   * Limpia el historial
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }
  
  /**
   * Obtiene el comando actual
   */
  getCurrentCommand(): ICommand | null {
    if (this.currentIndex < 0) {
      return null;
    }
    return this.history[this.currentIndex];
  }
}
