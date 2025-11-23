import type { EnergyPacket } from './energy-packets';
import { EnergyPacket as EnergyPacketClass } from './energy-packets';
import type { Node } from './node/node';
import type { Player } from './player';
import type { ID } from '../types/common';
import type { EdgeConfig, EnergyPacketData } from '../types/edge.types';

/**
 * Arista que conecta dos nodos
 * Maneja paquetes de energía en tránsito y el sistema de viaje basado en ticks
 */
export class Edge {
  private _id: ID;
  private _nodeA: Node;
  private _nodeB: Node;
  private _weight: number; // Peso = ticks de viaje (tiempo de tránsito)
  private _packets: Map<ID, EnergyPacket>;

  constructor(config: EdgeConfig) {
    this._id = config.id;
    this._nodeA = config.nodeA;
    this._nodeB = config.nodeB;
    this._weight = config.weight;
    this._packets = new Map();

    // Registrar la arista en ambos nodos
    this._nodeA.addEdge(this);
    this._nodeB.addEdge(this);
  }

  // Getters
  get id(): ID { return this._id; }
  get nodeA(): Node { return this._nodeA; }
  get nodeB(): Node { return this._nodeB; }
  get weight(): number { return this._weight; }
  get length(): number { return this._weight; } // Alias para compatibilidad
  get packets(): ReadonlyMap<ID, EnergyPacket> { return this._packets; }
  get energyPackets(): EnergyPacket[] { return Array.from(this._packets.values()); }
  get endpoints(): [Node, Node] { return [this._nodeA, this._nodeB]; }

  /**
   * Obtiene el nodo opuesto al dado
   */
  getOppositeNode(node: Node): Node | null {
    if (node.equals(this._nodeA)) {
      return this._nodeB;
    } else if (node.equals(this._nodeB)) {
      return this._nodeA;
    }
    return null;
  }

  /**
   * Alias para getOppositeNode
   */
  flipSide(node: Node): Node {
    const opposite = this.getOppositeNode(node);
    if (!opposite) {
      throw new Error('The provided node is not an endpoint of this edge.');
    }
    return opposite;
  }

  /**
   * Verifica si el nodo está conectado a esta arista
   */
  hasNode(node: Node): boolean {
    return node.equals(this._nodeA) || node.equals(this._nodeB);
  }

  /**
   * Agrega un paquete de energía a la arista
   */
  addPacket(packet: EnergyPacket): void {
    this._packets.set(packet.id, packet);
  }

  /**
   * Alias para addPacket
   */
  addEnergyPacket(packet: EnergyPacket): void {
    this.addPacket(packet);
  }

  /**
   * Remueve un paquete de la arista
   */
  removePacket(packetId: ID): void {
    this._packets.delete(packetId);
  }

  /**
   * Remueve un paquete por referencia
   */
  removeEnergyPacket(packet: EnergyPacket): void {
    this.removePacket(packet.id);
  }

  /**
   * Obtiene todos los paquetes de un jugador
   */
  getPacketsByOwner(owner: Player): EnergyPacket[] {
    return Array.from(this._packets.values()).filter(p => p.owner.equals(owner));
  }

  /**
   * Envía energía desde un nodo hacia el otro
   * Crea y registra un nuevo paquete de energía
   * @param from Nodo origen del envío
   * @param assignedAmount Cantidad de energía asignada (será multiplicada por bonificadores del nodo)
   * @param owner Jugador propietario del paquete
   */
  sendEnergy(from: Node, assignedAmount: number, owner: Player): EnergyPacket {
    if (!this.hasNode(from)) {
      throw new Error('Source node is not connected to this edge');
    }

    const target = this.getOppositeNode(from);
    if (!target) {
      throw new Error('Could not find target node');
    }

    // Aplicar multiplicador de ataque del nodo origen
    // Esto calcula la energía efectiva considerando bonificadores
    const effectiveAmount = from.getAttackEnergy(this);

    const packetData: EnergyPacketData = {
      id: `packet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      owner,
      amount: effectiveAmount,
      source: from,
      target,
      edge: this._id,
      progress: 0,
      ticksRemaining: this._weight,
    };

    const packet = new EnergyPacketClass(packetData);
    this.addPacket(packet);
    
    return packet;
  }

  /**
   * Actualiza todos los paquetes en la arista (llamado cada tick de ataque: 20ms)
   * @returns Paquetes que llegaron al destino
   */
  updatePackets(): EnergyPacket[] {
    const arrivedPackets: EnergyPacket[] = [];

    for (const packet of this._packets.values()) {
      const arrived = packet.update();
      if (arrived) {
        arrivedPackets.push(packet);
        this.removePacket(packet.id);
      }
    }

    return arrivedPackets;
  }

  /**
   * Limpia todos los paquetes
   */
  clearPackets(): void {
    this._packets.clear();
  }

  /**
   * Alias para clearPackets
   */
  clearEnergyPackets(): void {
    this.clearPackets();
  }

  equals(other: Edge): boolean {
    return this._id === other._id;
  }

  toString(): string {
    return `Edge(${this._id}: ${this._nodeA.id} <-> ${this._nodeB.id}, weight: ${this._weight})`;
  }
}
