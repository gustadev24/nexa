import type { Player } from '@/core/entities/player';
import type { Node } from '@/core/entities/node/node';
import type { Edge } from '@/core/entities/edge';
import { EnergyPacket } from '@/core/entities/energy-packet';

export interface CommandResult {
  success: boolean;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export class EnergyCommandService {
  validateCommand(player: Player, node: Node): ValidationResult {
    if (!player.isInGame) return { valid: false, error: 'Player is not in a game.' };
    if (player.isEliminated) return { valid: false, error: 'Player is eliminated.' };
    if (!player.ownsNode(node)) return { valid: false, error: 'Player does not control the node.' };
    return { valid: true };
  }

  assignEnergyToEdge(player: Player, node: Node, edge: Edge, amount: number): CommandResult {
    const v = this.validateCommand(player, node);
    if (!v.valid) return { success: false, error: v.error };

    if (!node.hasEdge(edge)) return { success: false, error: 'Edge is not connected to the node.' };
    if (amount <= 0) return { success: false, error: 'Amount must be positive.' };
    if (node.energyPool < amount) return { success: false, error: 'Insufficient energy in node pool.' };

    try {
      node.assignEnergyToEdge(edge, amount);
      return { success: true };
    }
    catch (err) {
      return { success: false, error: String(err) };
    }
  }

  removeEnergyFromEdge(player: Player, node: Node, edge: Edge, amount: number): CommandResult {
    const v = this.validateCommand(player, node);
    if (!v.valid) return { success: false, error: v.error };

    if (!node.hasEdge(edge)) return { success: false, error: 'Edge is not connected to the node.' };
    if (amount <= 0) return { success: false, error: 'Amount must be positive.' };

    try {
      node.removeEnergyFromEdge(edge, amount);
      return { success: true };
    }
    catch (err) {
      return { success: false, error: String(err) };
    }
  }

  /**
   * Transfiere energía entre nodos aliados mediante un paquete especial.
   * Este paquete incrementa la energía del nodo destino al llegar.
   *
   * @returns CommandResult con el paquete creado si tuvo éxito
   */
  transferEnergyBetweenAllies(
    player: Player,
    fromNode: Node,
    toNode: Node,
    edge: Edge,
    amount: number,
  ): CommandResult & { packet?: EnergyPacket } {
    if (amount <= 0) return { success: false, error: 'Amount must be positive.' };

    const vFrom = this.validateCommand(player, fromNode);
    if (!vFrom.valid) return { success: false, error: vFrom.error };
    if (!player.ownsNode(toNode)) return { success: false, error: 'Player does not control destination node.' };

    if (!edge.hasNode(fromNode) || !edge.hasNode(toNode)) {
      return { success: false, error: 'Edge does not connect these nodes.' };
    }

    // Validar que haya suficiente energía en el pool
    if (fromNode.energyPool < amount) {
      return { success: false, error: 'Insufficient energy in source node.' };
    }

    try {
      // Reducir energía del nodo origen
      fromNode.removeEnergy(amount);

      // Crear paquete de transferencia (isTransfer = true)
      const packet = new EnergyPacket(
        player,
        amount,
        fromNode,
        toNode,
        true, // Marcar como transferencia
      );

      // Agregar el paquete a la arista
      edge.addEnergyPacket(packet);

      return { success: true, packet };
    }
    catch (err) {
      return { success: false, error: String(err) };
    }
  }
}

export default EnergyCommandService;
