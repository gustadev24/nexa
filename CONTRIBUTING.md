# 🤝 Guía de Contribución - Nexa

¡Gracias por tu interés en contribuir a **Nexa**! Este documento establece las normas y mejores prácticas para colaborar en el proyecto de manera efectiva.

---

## 📋 Tabla de Contenidos

- [Código de Conducta](#-código-de-conducta)
- [¿Cómo puedo contribuir?](#-cómo-puedo-contribuir)
- [Flujo de Trabajo Git](#-flujo-de-trabajo-git)
- [Convenciones de Código](#-convenciones-de-código)
- [Convenciones de Commits](#-convenciones-de-commits)
- [Pull Requests](#-pull-requests)
- [Reportar Bugs](#-reportar-bugs)
- [Sugerir Mejoras](#-sugerir-mejoras)

---

## 📜 Código de Conducta

Este proyecto se adhiere a un código de conducta profesional y respetuoso. Al participar, te comprometes a:

- ✅ Ser respetuoso con todos los colaboradores
- ✅ Aceptar críticas constructivas
- ✅ Enfocarte en lo mejor para el proyecto y la comunidad
- ❌ No usar lenguaje ofensivo o comportamiento inapropiado
- ❌ No realizar ataques personales o políticos

---

## 🚀 ¿Cómo puedo contribuir?

Hay múltiples formas de contribuir a Nexa:

### 1. **Desarrollo de Funcionalidades**
- Implementar nuevas mecánicas del juego
- Crear nuevos tipos de nodos
- Mejorar la IA del juego
- Optimizar rendimiento

### 2. **Corrección de Bugs**
- Revisar issues abiertos etiquetados como `bug`
- Reproducir y documentar bugs
- Proponer y aplicar soluciones

### 3. **Documentación**
- Mejorar README y guías
- Documentar funciones y clases
- Crear tutoriales y ejemplos
- Traducir documentación

### 4. **Testing**
- Escribir tests unitarios
- Realizar pruebas de integración
- Testing manual y reportes de QA

### 5. **Diseño y Arte**
- Crear assets visuales
- Diseñar UI/UX
- Proponer mejoras de interfaz

---

## 🌿 Flujo de Trabajo Git

### Estructura de Ramas

El proyecto usa **Git Flow** simplificado:

```
main          → Rama principal (producción estable)
  └─ dev      → Rama de desarrollo (integración)
      ├─ feature/nombre-funcionalidad
      ├─ bugfix/nombre-bug
      └─ hotfix/nombre-hotfix
```

### Tipos de Ramas

| Prefijo | Propósito | Ejemplo |
|---------|-----------|---------|
| `feature/` | Nueva funcionalidad | `feature/node-regeneration` |
| `bugfix/` | Corrección de bugs | `bugfix/energy-calculation` |
| `hotfix/` | Fix urgente en producción | `hotfix/crash-on-start` |
| `docs/` | Documentación | `docs/update-readme` |
| `refactor/` | Refactorización de código | `refactor/game-manager` |
| `test/` | Agregar tests | `test/energy-system` |

### Workflow Paso a Paso

#### 1. **Sincronizar con `dev`**

```bash
# Actualizar rama local dev
git checkout dev
git pull origin dev
```

#### 2. **Crear rama de trabajo**

```bash
# Crear rama desde dev
git checkout -b feature/nombre-descriptivo

# Ejemplo real:
git checkout -b feature/add-super-energy-node
```

#### 3. **Desarrollar y commitear**

```bash
# Ver cambios
git status

# Agregar archivos
git add src/entities/SuperEnergyNode.ts
git add src/core/types/node.types.ts

# Commit con mensaje descriptivo
git commit -m "feat: agregar nodo de super energía"
```

#### 4. **Mantener rama actualizada**

```bash
# Traer últimos cambios de dev
git fetch origin dev

# Rebase para mantener historial limpio
git rebase origin/dev

# Si hay conflictos, resolverlos y continuar
git add .
git rebase --continue
```

#### 5. **Push y crear Pull Request**

```bash
# Primera vez (crear rama remota)
git push -u origin feature/add-super-energy-node

# Siguientes pushes
git push
```

#### 6. **Después del merge**

```bash
# Volver a dev y actualizar
git checkout dev
git pull origin dev

# Eliminar rama local
git branch -d feature/add-super-energy-node

# Eliminar rama remota (opcional)
git push origin --delete feature/add-super-energy-node
```

---

## 💻 Convenciones de Código

### TypeScript

#### Nomenclatura

```typescript
// ✅ Clases: PascalCase
class EnergyNode { }
class GameManager { }

// ✅ Interfaces: PascalCase con prefijo 'I' (opcional)
interface INodeConfig { }
interface PlayerData { }

// ✅ Tipos: PascalCase
type NodeType = 'basic' | 'energy' | 'attack';

// ✅ Variables y funciones: camelCase
const energyTotal = 100;
function calculateDefense() { }

// ✅ Constantes: UPPER_SNAKE_CASE
const MAX_ENERGY = 1000;
const ATTACK_INTERVAL_MS = 20;

// ✅ Enums: PascalCase (nombre y valores)
enum NodeState {
  Idle = 'idle',
  Attacking = 'attacking',
  Defending = 'defending'
}

// ✅ Archivos: kebab-case
// game-manager.ts
// energy-node.ts
// node.types.ts
```

#### Tipos y Type Safety

```typescript
// ✅ Siempre tipar parámetros y retornos
function distributeEnergy(amount: number, nodes: Node[]): boolean {
  // ...
  return true;
}

// ✅ Usar tipos específicos, evitar 'any'
// ❌ Evitar
const data: any = fetchData();

// ✅ Preferir
const data: NodeData = fetchData();

// ✅ Usar tipos de unión cuando sea apropiado
type AttackResult = 'success' | 'failed' | 'neutral';

// ✅ Documentar tipos complejos
/**
 * Configuración de un nodo en el grafo
 */
interface NodeConfig {
  /** ID único del nodo */
  id: string;
  /** Tipo de nodo */
  type: NodeType;
  /** Energía inicial */
  initialEnergy: number;
}
```

#### Estructura de Clases

```typescript
export class EnergyNode {
  // 1. Propiedades privadas
  private _energy: number;
  private _connections: Connection[];

  // 2. Propiedades públicas
  public readonly id: string;
  public type: NodeType;

  // 3. Getters/Setters
  get energy(): number {
    return this._energy;
  }

  set energy(value: number) {
    this._energy = Math.max(0, value);
  }

  // 4. Constructor
  constructor(id: string, type: NodeType) {
    this.id = id;
    this.type = type;
    this._energy = 0;
    this._connections = [];
  }

  // 5. Métodos públicos
  public addConnection(connection: Connection): void {
    this._connections.push(connection);
  }

  public attack(target: Node, amount: number): AttackResult {
    // ...
  }

  // 6. Métodos privados
  private calculateDefense(): number {
    // ...
  }
}
```

### Organización de Imports

```typescript
// 1. Imports de librerías externas
import Phaser from 'phaser';
import { EventEmitter } from 'events';

// 2. Imports de alias del proyecto
import { GameManager } from '@/core/managers/GameManager';
import { NodeType, PlayerData } from '@/core/types';

// 3. Imports relativos (solo si es necesario)
import { Helper } from './helpers/Helper';

// 4. Imports de tipos
import type { INodeConfig } from '@/core/types/node.types';
```

### Comentarios y Documentación

```typescript
/**
 * Gestiona el sistema de energía del juego.
 * 
 * Responsable de:
 * - Distribución de energía entre nodos
 * - Resolución de ataques
 * - Actualización de defensas
 * 
 * @example
 * ```ts
 * const manager = new EnergyManager();
 * manager.distributeEnergy(player, 100);
 * ```
 */
export class EnergyManager {
  /**
   * Distribuye energía desde un nodo a sus conexiones.
   * 
   * @param node - Nodo origen
   * @param amount - Cantidad de energía a distribuir
   * @returns true si la distribución fue exitosa
   */
  public distributeEnergy(node: Node, amount: number): boolean {
    // TODO: Implementar validación de límites
    // FIXME: Revisar edge case cuando amount = 0
    
    // Lógica principal bien comentada
    const availableEnergy = this.getAvailableEnergy(node);
    if (amount > availableEnergy) {
      return false;
    }
    
    // ...
    return true;
  }
}
```

---

## 📝 Convenciones de Commits

Usamos **Conventional Commits** para mantener un historial claro y semántico.

### Formato

```
<tipo>(<scope>): <descripción>

[cuerpo opcional]

[footer opcional]
```

### Tipos de Commit

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `feat` | Nueva funcionalidad | `feat(nodes): agregar nodo de super energía` |
| `fix` | Corrección de bug | `fix(energy): corregir cálculo de defensa` |
| `docs` | Documentación | `docs(readme): actualizar guía de instalación` |
| `style` | Formato de código | `style(core): aplicar prettier` |
| `refactor` | Refactorización | `refactor(manager): simplificar lógica de ataque` |
| `test` | Agregar/modificar tests | `test(energy): agregar tests unitarios` |
| `chore` | Tareas de mantenimiento | `chore(deps): actualizar dependencias` |
| `perf` | Mejora de rendimiento | `perf(graph): optimizar búsqueda de nodos` |

### Ejemplos

```bash
# Feature simple
git commit -m "feat: implementar sistema de regeneración de energía"

# Fix con scope
git commit -m "fix(ai): corregir decisiones de ataque de la IA"

# Commit con cuerpo
git commit -m "feat(nodes): agregar nodo de articulación

- Implementar detección de nodos críticos
- Agregar lógica de división de grafo
- Actualizar tipos de Node

Refs: #45"

# Breaking change
git commit -m "feat(api): cambiar interfaz de GameManager

BREAKING CHANGE: El método start() ahora requiere configuración obligatoria"
```

---

## 🔍 Pull Requests

### Antes de crear un PR

- ✅ Tu código compila sin errores: `pnpm run build`
- ✅ Los tests pasan: `pnpm run test` (si existen)
- ✅ El código sigue las convenciones del proyecto
- ✅ Has actualizado la documentación si es necesario
- ✅ Tu rama está actualizada con `dev`

### Plantilla de PR

```markdown
## 📋 Descripción

Breve descripción de los cambios realizados.

## 🎯 Tipo de cambio

- [ ] 🐛 Bug fix
- [ ] ✨ Nueva funcionalidad
- [ ] 📚 Documentación
- [ ] 🔧 Refactorización
- [ ] ⚡ Mejora de rendimiento

## 🧪 ¿Cómo se ha probado?

Describe las pruebas realizadas:
- [ ] Tests unitarios
- [ ] Tests manuales
- [ ] Tests en diferentes navegadores

## 📸 Screenshots (si aplica)

Agregar capturas de pantalla si hay cambios visuales.

## ✅ Checklist

- [ ] Mi código sigue las convenciones del proyecto
- [ ] He comentado el código en áreas difíciles
- [ ] He actualizado la documentación
- [ ] Mis cambios no generan warnings
- [ ] He agregado tests que prueban mi fix/funcionalidad
- [ ] Los tests nuevos y existentes pasan localmente

## 🔗 Issues relacionados

Closes #123
Refs #456
```

### Revisión de Código

Los PRs serán revisados por al menos un mantenedor. Espera feedback constructivo:

- 💬 **Comentarios:** Responde a todos los comentarios
- 🔄 **Cambios solicitados:** Aplica los cambios y actualiza el PR
- ✅ **Aprobación:** Una vez aprobado, el PR será merged

---

## 🐛 Reportar Bugs

### Antes de reportar

1. Verifica que el bug no haya sido reportado: [Issues](https://github.com/gustadev24/nexa/issues)
2. Asegúrate de estar usando la última versión
3. Intenta reproducir el bug en una instalación limpia

### Plantilla de Bug Report

```markdown
## 🐛 Descripción del Bug

Descripción clara y concisa del problema.

## 🔄 Pasos para Reproducir

1. Ir a '...'
2. Hacer click en '...'
3. Ejecutar '...'
4. Ver error

## ✅ Comportamiento Esperado

Qué debería suceder.

## ❌ Comportamiento Actual

Qué está sucediendo en realidad.

## 🖼️ Screenshots

Si es posible, agregar capturas de pantalla.

## 🌍 Entorno

- **OS:** [e.g. Windows 11, macOS 14, Ubuntu 22.04]
- **Navegador:** [e.g. Chrome 120, Firefox 121]
- **Versión de Node:** [e.g. 20.10.0]
- **Versión del proyecto:** [e.g. 1.2.0]

## 📝 Información Adicional

Cualquier otra información relevante.
```

---

## 💡 Sugerir Mejoras

### Plantilla de Feature Request

```markdown
## 🚀 Feature Request

Descripción de la funcionalidad sugerida.

## 🎯 Problema que Resuelve

¿Qué problema resuelve esta funcionalidad?

## 💭 Solución Propuesta

Cómo imaginas que funcione.

## 🔄 Alternativas Consideradas

Otras soluciones que hayas pensado.

## 📝 Información Adicional

Mockups, referencias, ejemplos, etc.
```

---

## 🏗️ Configuración del Entorno de Desarrollo

### Requisitos

```bash
# Versiones recomendadas
Node.js: >= 18.0.0
pnpm: >= 8.0.0
```

### Instalación

```bash
# 1. Fork del repositorio en GitHub

# 2. Clonar tu fork
git clone https://github.com/TU-USUARIO/nexa.git
cd nexa

# 3. Agregar upstream
git remote add upstream https://github.com/gustadev24/nexa.git

# 4. Instalar dependencias
pnpm install

# 5. Crear rama de trabajo
git checkout -b feature/mi-contribucion

# 6. Verificar que todo funciona
pnpm run dev
```

### Sincronizar con Upstream

```bash
# Traer cambios del repositorio original
git fetch upstream

# Actualizar tu dev local
git checkout dev
git merge upstream/dev

# Actualizar tu fork en GitHub
git push origin dev
```

---

## 🎨 Estándares de Código Adicionales

### Phaser-Specific

```typescript
// ✅ Usar Phaser Types
import type { Scene } from 'phaser';

// ✅ Cleanup en destroy/shutdown
class GameScene extends Phaser.Scene {
  destroy() {
    // Limpiar listeners
    this.events.off('evento');
    
    // Destruir objetos
    this.player?.destroy();
    
    super.destroy();
  }
}

// ✅ Usar constantes para keys
const SCENE_KEYS = {
  BOOT: 'Boot',
  GAME: 'Game',
  MENU: 'MainMenu'
} as const;
```

### Performance

```typescript
// ✅ Evitar cálculos en loops intensivos
// ❌ Evitar
for (let i = 0; i < nodes.length; i++) {
  const distance = Math.sqrt(x * x + y * y); // Cálculo pesado repetido
}

// ✅ Preferir
const distance = Math.sqrt(x * x + y * y);
for (let i = 0; i < nodes.length; i++) {
  // Usar distance precalculado
}

// ✅ Usar object pooling para objetos frecuentes
// ✅ Cachear resultados de cálculos costosos
```

---

## 📞 Contacto y Ayuda

- **Issues:** [GitHub Issues](https://github.com/gustadev24/nexa/issues)
- **Discussions:** [GitHub Discussions](https://github.com/gustadev24/nexa/discussions)
- **Email:** gustadev24@example.com

---

## 🙏 Agradecimientos

¡Gracias por contribuir a Nexa! Tu ayuda hace que este proyecto sea mejor para todos.

---

**Recuerda:** El código es escrito una vez pero leído muchas veces. Prioriza la claridad sobre la brevedad. 🚀
