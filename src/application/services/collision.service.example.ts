import { CollisionService } from './collision.service';
import { BasicNode } from '@/core/entities/node/basic';
import { AttackNode } from '@/core/entities/node/attack';
import { DefenseNode } from '@/core/entities/node/defense';
import { Edge } from '@/core/entities/edge';
import { Player } from '@/core/entities/player';
import { EnergyPacket } from '@/core/entities/energy-packets';
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

const node1 = new BasicNode('node-1');
const node2 = new AttackNode('node-2');

node1.setOwner(player1);
node1.addEnergy(100);
player1.captureNode(node1);
player1.setInitialNode(node1);

node2.setOwner(player2);
node2.addEnergy(80);
player2.captureNode(node2);
player2.setInitialNode(node2);

const edge1 = new Edge('edge-1', [node1, node2], 100);

node1.addEdge(edge1);
node2.addEdge(edge1);

const collisionService = new CollisionService();

console.log('=== EJEMPLO 1: Colisión de paquetes enemigos ===');
const packet1 = new EnergyPacket(player1, 50, node1, node2);
const packet2 = new EnergyPacket(player2, 30, node2, node1);

edge1.addEnergyPacket(packet1);
edge1.addEnergyPacket(packet2);

const collisionResults = collisionService.resolveEdgeCollisions(edge1);

console.log('Resultados de colisión:');
for (const result of collisionResults) {
  console.log(`- Paquetes destruidos: ${result.packetsDestroyed.length}`);
  console.log(`- Paquetes supervivientes: ${result.packetsSurvived.length}`);
  console.log(`- Advertencias de desperdicio: ${result.wasteWarnings.length}`);

  for (const warning of result.wasteWarnings) {
    console.log(
      `  ⚠️ ${warning.player.username} desperdició ${warning.amountLost} de energía`,
    );
  }
}

console.log('\n=== EJEMPLO 2: Llegada a nodo amigo ===');
edge1.clearEnergyPackets();

const friendlyPacket = new EnergyPacket(player1, 25, node2, node1);
const arrivalResult1 = collisionService.resolveNodeArrival(
  friendlyPacket,
  node1,
);

console.log(`Resultado: ${arrivalResult1.outcome}`);
console.log(`Energía integrada: ${arrivalResult1.energyIntegrated}`);

console.log('\n=== EJEMPLO 3: Captura de nodo neutral ===');
const neutralNode = new BasicNode('node-neutral');
neutralNode.addEdge(edge1);

const capturePacket = new EnergyPacket(player1, 100, node1, neutralNode);
const arrivalResult2 = collisionService.resolveNodeArrival(
  capturePacket,
  neutralNode,
);

console.log(`Resultado: ${arrivalResult2.outcome}`);
console.log(`Capturado por: ${arrivalResult2.capturedBy?.username}`);
console.log(`Energía integrada: ${arrivalResult2.energyIntegrated}`);

console.log('\n=== EJEMPLO 4: Ataque a nodo enemigo (captura) ===');
const enemyNode = new DefenseNode('node-enemy');
enemyNode.setOwner(player2);
enemyNode.addEnergy(40);
player2.captureNode(enemyNode);

const attackPacket = new EnergyPacket(player1, 100, node1, enemyNode);
const arrivalResult3 = collisionService.resolveNodeArrival(
  attackPacket,
  enemyNode,
);

console.log(`Resultado: ${arrivalResult3.outcome}`);
console.log(`Capturado por: ${arrivalResult3.capturedBy?.username}`);
console.log(`Energía restante en nodo: ${enemyNode.energyPool}`);

console.log('\n=== EJEMPLO 5: Ataque derrotado con retorno ===');
const strongNode = new DefenseNode('node-strong');
strongNode.setOwner(player2);
strongNode.addEnergy(100);
player2.captureNode(strongNode);

const weakPacket = new EnergyPacket(player1, 50, node1, strongNode);
const arrivalResult4 = collisionService.resolveNodeArrival(
  weakPacket,
  strongNode,
);

console.log(`Resultado: ${arrivalResult4.outcome}`);
console.log(`Energía perdida: ${arrivalResult4.energyLost}`);

if (arrivalResult4.outcome === ArrivalOutcome.DEFEATED) {
  const returnPacket = collisionService.handleDefeatedEnergy(weakPacket, node1);
  if (returnPacket) {
    console.log('✓ Energía devuelta al nodo de origen');
    console.log(`  - Cantidad: ${returnPacket.amount}`);
    console.log(`  - Destino: ${returnPacket.target.id}`);
  }
  else {
    console.log('✗ Energía perdida definitivamente');
  }
}

console.log('\n=== EJEMPLO 6: Empate perfecto (neutralización) ===');
const balancedNode = new BasicNode('node-balanced');
balancedNode.setOwner(player2);
balancedNode.addEnergy(80);
player2.captureNode(balancedNode);

const exactPacket = new EnergyPacket(player1, 80, node1, balancedNode);
const arrivalResult5 = collisionService.resolveNodeArrival(
  exactPacket,
  balancedNode,
);

console.log(`Resultado: ${arrivalResult5.outcome}`);
console.log(`Nodo ahora es neutral: ${balancedNode.isNeutral()}`);
console.log(`Energía del nodo: ${balancedNode.energyPool}`);

console.log('\n=== EJEMPLO 7: Colisión de paquetes del mismo jugador ===');
edge1.clearEnergyPackets();

const ownPacket1 = new EnergyPacket(player1, 40, node1, node2);
const ownPacket2 = new EnergyPacket(player1, 30, node2, node1);

edge1.addEnergyPacket(ownPacket1);
edge1.addEnergyPacket(ownPacket2);

const wasteResults = collisionService.resolveEdgeCollisions(edge1);

console.log('Colisión entre paquetes del mismo jugador:');
for (const result of wasteResults) {
  console.log(`- Paquetes destruidos: ${result.packetsDestroyed.length}`);

  for (const warning of result.wasteWarnings) {
    console.log(
      `  ⚠️ DESPERDICIO: ${warning.player.username} perdió ${warning.amountLost} energía`,
    );
  }
}
