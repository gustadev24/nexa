import type { Player } from '@/core/entities/player';
import type { Node } from '@/core/entities/node/node';
import type { Edge } from '@/core/entities/edge';

export interface CommandResult {
  success: boolean;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export class EnergyCommandService {
  constructor() {}

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
    if (node.energyPool < amount) return { success: false, error: 'Insufficient energy in node.' };

    try {
      node.assignEnergyToEdge(edge, amount);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message ?? String(err) };
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
    } catch (err: any) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }

  redistributeEnergy(player: Player, fromNode: Node, toNode: Node, amount: number): CommandResult {
    if (amount <= 0) return { success: false, error: 'Amount must be positive.' };

    const vFrom = this.validateCommand(player, fromNode);
    if (!vFrom.valid) return { success: false, error: vFrom.error };
    if (!player.ownsNode(toNode)) return { success: false, error: 'Player does not control destination node.' };

    // Check adjacency: there must be an edge connecting the two nodes
    const connected = Array.from(fromNode.edges).some((e) => e.hasNode(toNode));
    if (!connected) return { success: false, error: 'Nodes are not neighbors.' };

    if (fromNode.energyPool < amount) return { success: false, error: 'Insufficient energy in source node.' };

    try {
      fromNode.removeEnergy(amount);
      toNode.addEnergy(amount);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }
}

export default EnergyCommandService;
