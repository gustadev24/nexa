import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para calcular path relativo entre dos archivos
function getRelativePath(fromFile, toPath) {
  const fromDir = path.dirname(fromFile);
  const absoluteTo = path.resolve(__dirname, 'src', toPath);
  let relative = path.relative(fromDir, absoluteTo);
  
  // Asegurarse de que empiece con ./ o ../
  if (!relative.startsWith('.')) {
    relative = './' + relative;
  }
  
  return relative.replace(/\\/g, '/');  // Normalizar a forward slashes
}

// Función para procesar un archivo
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let modified = false;
  const newLines = lines.map(line => {
    // Buscar imports con @/
    const match = line.match(/from ['"]@\/([^'"]+)['"]/);
    if (match) {
      const importPath = match[1];
      const relativePath = getRelativePath(filePath, importPath);
      const quote = line.includes("'") ? "'" : '"';
      const newLine = line.replace(`@/${importPath}`, relativePath);
      modified = true;
      console.log(`  ${path.relative(__dirname, filePath)}: @/${importPath} -> ${relativePath}`);
      return newLine;
    }
    return line;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    return true;
  }
  return false;
}

// Función para procesar todos los archivos .ts en src/
function processAllFiles(dir) {
  const files = fs.readdirSync(dir);
  let totalModified = 0;
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      totalModified += processAllFiles(fullPath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      if (processFile(fullPath)) {
        totalModified++;
      }
    }
  }
  
  return totalModified;
}

// Ejecutar
console.log('Convirtiendo imports @ a paths relativos...\n');
const modified = processAllFiles(path.join(__dirname, 'src'));
console.log(`\n✅ ${modified} archivos modificados`);
