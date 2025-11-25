#!/usr/bin/env tsx

/**
 * Script de Verificación de Integración NEXA
 *
 * Verifica que todos los componentes de la integración estén presentes
 * y correctamente configurados según INTEGRATION.md
 */

import { existsSync } from 'fs';
import { resolve } from 'path';

interface VerificationResult {
  component: string;
  path: string;
  exists: boolean;
  required: boolean;
}

const results: VerificationResult[] = [];

/**
 * Verifica si un archivo existe
 */
function checkFile(component: string, path: string, required = true): void {
  const fullPath = resolve(__dirname, '..', path);
  const exists = existsSync(fullPath);

  results.push({ component, path, exists, required });

  const status = exists ? '✅' : (required ? '❌' : '⚠️');
  const label = required ? 'REQUERIDO' : 'OPCIONAL';

  console.log(`${status} [${label}] ${component}`);
  if (!exists && required) {
    console.log(`   → Archivo faltante: ${path}`);
  }
}

console.log('\n='.repeat(60));
console.log('VERIFICACIÓN DE INTEGRACIÓN NEXA');
console.log('='.repeat(60));

// ============================================
// CAPA DE APLICACIÓN
// ============================================
console.log('\n📦 CAPA DE APLICACIÓN\n');

checkFile('GameService', 'src/application/services/game-service.ts');
checkFile('CaptureService', 'src/application/services/capture-service.ts');
checkFile('TickService', 'src/application/services/tick.service.ts');
checkFile('CollisionService', 'src/application/services/collision.service.ts');
checkFile('VictoryService', 'src/application/services/victory-service.ts');
checkFile('EnergyCommandService', 'src/application/services/energy-command-service.ts');

// ============================================
// CAPA DE INFRAESTRUCTURA
// ============================================
console.log('\n🏗️  CAPA DE INFRAESTRUCTURA\n');

checkFile('GameStateManager', 'src/infrastructure/state/GameStateManager.ts');
checkFile('GameState Types', 'src/infrastructure/state/types.ts');

// ============================================
// CAPA DE PRESENTACIÓN
// ============================================
console.log('\n🎨 CAPA DE PRESENTACIÓN\n');

checkFile('GameRenderer', 'src/presentation/renderer/GameRenderer.ts');
checkFile('InputHandler', 'src/presentation/input/InputHandler.ts');
checkFile('SimpleInputHandler', 'src/presentation/input/SimpleInputHandler.ts');

// ============================================
// COMPONENTES DE INTEGRACIÓN (NUEVOS)
// ============================================
console.log('\n⭐ COMPONENTES DE INTEGRACIÓN\n');

checkFile('GameController', 'src/presentation/game/GameController.ts');
checkFile('GameFactory', 'src/presentation/game/GameFactory.ts');
checkFile('Game Index', 'src/presentation/game/index.ts');

// ============================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================
console.log('\n⚙️  CONSTANTES Y CONFIGURACIÓN\n');

checkFile('Game Constants', 'src/core/constants/game-constants.ts');

// ============================================
// ESCENAS Y TESTS
// ============================================
console.log('\n🎮 ESCENAS Y TESTS\n');

checkFile('TestIntegration Scene', 'src/presentation/scenes/test-integration.ts');

// ============================================
// ENTIDADES CORE
// ============================================
console.log('\n🧬 ENTIDADES CORE\n');

checkFile('Graph', 'src/core/entities/graph.ts');
checkFile('Node', 'src/core/entities/node/node.ts');
checkFile('BasicNode', 'src/core/entities/node/basic.ts');
checkFile('SuperEnergyNode', 'src/core/entities/node/super-energy.ts');
checkFile('Edge', 'src/core/entities/edge.ts');
checkFile('EnergyPacket', 'src/core/entities/energy-packets.ts');
checkFile('Player', 'src/core/entities/player.ts');
checkFile('Game', 'src/core/entities/game.ts');

// ============================================
// DOCUMENTACIÓN
// ============================================
console.log('\n📚 DOCUMENTACIÓN\n');

checkFile('Integration Guide', 'INTEGRATION.md');
checkFile('Integration Complete', 'INTEGRATION_COMPLETE.md');
checkFile('README', 'README.md');

// ============================================
// RESUMEN
// ============================================
console.log('\n' + '='.repeat(60));
console.log('RESUMEN DE VERIFICACIÓN');
console.log('='.repeat(60) + '\n');

const totalFiles = results.length;
const existingFiles = results.filter(r => r.exists).length;
const missingRequired = results.filter(r => r.required && !r.exists).length;
const missingOptional = results.filter(r => !r.required && !r.exists).length;

console.log(`Total de archivos verificados: ${totalFiles}`);
console.log(`✅ Archivos encontrados: ${existingFiles}`);
console.log(`❌ Archivos requeridos faltantes: ${missingRequired}`);
console.log(`⚠️  Archivos opcionales faltantes: ${missingOptional}`);

const percentage = Math.round((existingFiles / totalFiles) * 100);
console.log(`\nCompletitud: ${percentage}%`);

// Barra de progreso
const barLength = 50;
const filledLength = Math.round((existingFiles / totalFiles) * barLength);
const emptyLength = barLength - filledLength;
const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
console.log(`[${progressBar}]`);

console.log('\n' + '='.repeat(60));

if (missingRequired > 0) {
  console.log('\n❌ INTEGRACIÓN INCOMPLETA');
  console.log('\nArchivos requeridos faltantes:\n');

  results
    .filter(r => r.required && !r.exists)
    .forEach((r) => {
      console.log(`  • ${r.component}`);
      console.log(`    ${r.path}\n`);
    });

  console.log('Por favor, crea los archivos faltantes antes de continuar.');
  process.exit(1);
}
else {
  console.log('\n✅ INTEGRACIÓN COMPLETA');
  console.log('\nTodos los componentes requeridos están presentes.');
  console.log('\nPara usar la integración:');
  console.log('  1. Agrega TestIntegration a tus escenas de Phaser');
  console.log('  2. Ejecuta: npm run dev');
  console.log('  3. Navega a la escena TestIntegration');
  console.log('\nO usa GameFactory directamente:');
  console.log('  import { GameFactory } from "@/presentation/game";');
  console.log('  const game = GameFactory.createGame(canvas, players, graph);');

  if (missingOptional > 0) {
    console.log('\n⚠️  Nota: Algunos archivos opcionales no están presentes.');
    console.log('    Esto no afecta la funcionalidad principal.');
  }

  process.exit(0);
}
