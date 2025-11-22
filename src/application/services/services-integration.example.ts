import { TickService } from './tick.service';
import { CollisionService } from './collision.service';
import type { GameState } from './game-state.interface';
import { BasicNode } from '@/core/entities/node/basic';
import { AttackNode } from '@/core/entities/node/attack';
import { DefenseNode } from '@/core/entities/node/defense';
import { Edge } from '@/core/entities/edge';
import { Player } from '@/core/entities/player';
import { ArrivalOutcome } from './arrival-result.interface';

const player1 = new Player({
  id: 'player-1',
  username: 'Alice',
  color: { r: 255, g: 0, b: 0 },
});

const player2 = new Player({
  id: 'player-2',
  username: 'Bob',
  color: { r: 0, g: 0, b: 255 },
});

player1.setInGame(true);
player2.setInGame(true);
player1.increaseEnergy(200);
player2.increaseEnergy(200);

const node1 = new AttackNode('node-1');
const node2 = new DefenseNode('node-2');
const node3 = new BasicNode('node-3');

node1.setOwner(player1);
node1.addEnergy(100);
player1.captureNode(node1);
player1.setInitialNode(node1);

node2.setOwner(player2);
node2.addEnergy(80);
player2.captureNode(node2);
player2.setInitialNode(node2);

const edge1 = new Edge('edge-1', [node1, node2], 100);
const edge2 = new Edge('edge-2', [node2, node3], 150);

node1.addEdge(edge1);
node2.addEdge(edge1);
node2.addEdge(edge2);
node3.addEdge(edge2);

node1.assignEnergyToEdge(edge1, 30);
node2.assignEnergyToEdge(edge2, 25);

const gameState: GameState = {
  nodes: [node1, node2, node3],
  edges: [edge1, edge2],
  players: [player1, player2],
};

const tickService = new TickService();
const collisionService = new CollisionService();

console.log('=== SIMULACIÓN DE JUEGO CON AMBOS SERVICIOS ===\n');

console.log('Estado inicial:');
console.log(`- Node 1 (${player1.username}): ${node1.energyPool} energía`);
console.log(`- Node 2 (${player2.username}): ${node2.energyPool} energía`);
console.log(`- Node 3: ${node3.isNeutral() ? 'Neutral' : 'Controlado'}`);
console.log(`- Player 1 energía total: ${player1.totalEnergy}`);
console.log(`- Player 2 energía total: ${player2.totalEnergy}`);

console.log('\n--- TICK 1: Emisión de paquetes ---');
let tickResult = tickService.executeTick(gameState, 20);
console.log(`Colisiones: ${tickResult.collisions}`);
console.log(`Llegadas: ${tickResult.arrivals}`);
console.log(`Capturas: ${tickResult.captures}`);
console.log(`Paquetes en edge1: ${edge1.energyPackets.length}`);
console.log(`Paquetes en edge2: ${edge2.energyPackets.length}`);

console.log('\n--- TICK 2-5: Avance de paquetes ---');
for (let i = 0; i < 4; i++) {
  tickResult = tickService.executeTick(gameState, 20);
  console.log(`Tick ${i + 2}: Colisiones=${tickResult.collisions}, Llegadas=${tickResult.arrivals}, Capturas=${tickResult.captures}`);
}

console.log('\n--- Resolución manual de colisiones con CollisionService ---');
for (const edge of gameState.edges) {
  if (edge.energyPackets.length > 0) {
    console.log(`\nRevisando colisiones en ${edge.endpoints[0].id} <-> ${edge.endpoints[1].id}`);
    const collisionResults = collisionService.resolveEdgeCollisions(edge);

    for (const result of collisionResults) {
      console.log(`  - Paquetes destruidos: ${result.packetsDestroyed.length}`);
      console.log(`  - Paquetes supervivientes: ${result.packetsSurvived.length}`);

      for (const warning of result.wasteWarnings) {
        console.log(`  ⚠️ ${warning.player.username} desperdició ${warning.amountLost} energía en esta arista`);
      }
    }
  }
}

console.log('\n--- Simulación de llegadas con CollisionService ---');
for (const edge of gameState.edges) {
  const arrivedPackets = edge.energyPackets.filter(p => p.hasArrived());

  for (const packet of arrivedPackets) {
    console.log(`\nPaquete llegó a ${packet.target.id} (${packet.amount} energía)`);
    const arrivalResult = collisionService.resolveNodeArrival(packet, packet.target);

    console.log(`  Resultado: ${arrivalResult.outcome}`);

    switch (arrivalResult.outcome) {
      case ArrivalOutcome.CAPTURED:
        console.log(`  ✓ Nodo capturado por ${arrivalResult.capturedBy?.username}`);
        console.log(`  ✓ Energía integrada: ${arrivalResult.energyIntegrated}`);
        break;
      case ArrivalOutcome.INTEGRATED:
        console.log(`  ✓ Energía integrada al nodo aliado: ${arrivalResult.energyIntegrated}`);
        break;
      case ArrivalOutcome.NEUTRALIZED:
        console.log(`  ⚡ Nodo neutralizado (empate perfecto)`);
        console.log(`  ✗ Energía perdida: ${arrivalResult.energyLost}`);
        break;
      case ArrivalOutcome.DEFEATED:
        console.log(`  ✗ Ataque derrotado`);
        console.log(`  ✗ Energía perdida: ${arrivalResult.energyLost}`);

        const returnPacket = collisionService.handleDefeatedEnergy(packet, packet.origin);
        if (returnPacket) {
          console.log(`  ↩️  Energía devuelta al nodo de origen`);
        } else {
          console.log(`  💀 Energía perdida definitivamente (origen capturado)`);
        }
        break;
    }
  }
}

console.log('\n--- Estado final después de simulación ---');
console.log(`- Node 1 (${node1.owner?.username ?? 'Neutral'}): ${node1.energyPool} energía`);
console.log(`- Node 2 (${node2.owner?.username ?? 'Neutral'}): ${node2.energyPool} energía`);
console.log(`- Node 3 (${node3.owner?.username ?? 'Neutral'}): ${node3.energyPool} energía`);
console.log(`- Player 1 nodos controlados: ${player1.controlledNodeCount}`);
console.log(`- Player 2 nodos controlados: ${player2.controlledNodeCount}`);
console.log(`- Player 1 energía total: ${player1.totalEnergy}`);
console.log(`- Player 2 energía total: ${player2.totalEnergy}`);

console.log('\n=== VENTAJAS DE LA SEPARACIÓN ===');
console.log('1. TickService: Orquesta el flujo completo del juego');
console.log('2. CollisionService: Lógica específica de colisiones y llegadas');
console.log('3. Ambos servicios son reutilizables e independientes');
console.log('4. Fácil de testear cada servicio por separado');
console.log('5. Sigue el principio de responsabilidad única (SRP)');
