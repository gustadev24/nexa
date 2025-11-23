import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('__filename:', __filename);
console.log('__dirname:', __dirname);
console.log('\nResolved paths from root:');
console.log('@:', path.resolve(__dirname, 'src'));
console.log('@/presentation:', path.resolve(__dirname, 'src/presentation'));
console.log('@/presentation/game:', path.resolve(__dirname, 'src/presentation/game'));

console.log('\nResolved paths from scripts/vite:');
const vitedir = path.join(__dirname, 'scripts/vite');
const vite__dirname = vitedir;
console.log('vite __dirname:', vite__dirname);
console.log('@:', path.resolve(vite__dirname, '../../src'));
console.log('@/presentation:', path.resolve(vite__dirname, '../../src/presentation'));
console.log('@/presentation/game:', path.resolve(vite__dirname, '../../src/presentation/game'));

console.log('\nFile exists checks:');
import fs from 'fs';
console.log('src/presentation/game/main.ts exists:', fs.existsSync(path.resolve(__dirname, 'src/presentation/game/main.ts')));
console.log('src/presentation/game/main.js exists:', fs.existsSync(path.resolve(__dirname, 'src/presentation/game/main.js')));
