# 🤝 Guía de Contribución - Nexa

¡Gracias por tu interés en contribuir a **Nexa**! Esta guía te ayudará a entender nuestro flujo de trabajo, convenciones y mejores prácticas.

---

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Cómo Contribuir](#cómo-contribuir)
- [Convenciones de Commits](#convenciones-de-commits)
- [Flujo de Trabajo con Git](#flujo-de-trabajo-con-git)
- [Estándares de Código](#estándares-de-código)
- [Testing](#testing)
- [Equipo de Desarrollo](#equipo-de-desarrollo)

---

## 📜 Código de Conducta

Este proyecto se rige por principios de respeto, colaboración y excelencia técnica. Al participar, se espera que mantengas un ambiente profesional y constructivo.

---

## 🚀 Cómo Contribuir

### 1. Configuración Inicial

```bash
# Clonar el repositorio
git clone https://github.com/gustadev24/nexa.git
cd nexa

# Instalar dependencias
pnpm install

# Ejecutar en desarrollo
pnpm dev
```

### 2. Crear Rama de Feature

```bash
# Actualiza tu rama dev
git checkout dev
git pull origin dev

# Crea una nueva rama desde dev
git checkout -b feature/nombre-descriptivo

# Ejemplos de nombres de ramas:
# feature/victory-service
# fix/collision-bug
# docs/update-readme
# refactor/game-controller
```

### 3. Desarrollo

- Escribe código limpio y bien documentado
- Sigue los estándares de código del proyecto
- Agrega tests para nuevas funcionalidades
- Actualiza la documentación cuando sea necesario

### 4. Sincronizar con dev Antes del PR

```bash
# Traer últimos cambios
git fetch origin

# Rebase tu rama sobre dev
git rebase origin/dev

# Si hay conflictos:
# - Resuelve los archivos conflictivos
# - git add <archivos-resueltos>
# - git rebase --continue
```

### 5. Push y Pull Request

```bash
# Push a tu rama (puede requerir force push después de rebase)
git push origin feature/nombre-descriptivo
# o si ya existía:
git push --force-with-lease origin feature/nombre-descriptivo
```

---

## 📝 Convenciones de Commits

Usamos **Conventional Commits** para mantener un historial limpio y semántico.

### Formato

```
<tipo>(<alcance>): <descripción>

[cuerpo opcional]
```

### Tipos de Commits

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `feat` | Nueva funcionalidad | `feat: agregar nodo de tipo Energy` |
| `fix` | Corrección de bug | `fix: resolver colisiones duplicadas` |
| `docs` | Cambios en documentación | `docs: actualizar README` |
| `style` | Formateo, espacios | `style: ordenar imports` |
| `refactor` | Refactorización | `refactor: extraer lógica a servicio` |
| `perf` | Mejora de rendimiento | `perf: optimizar renderizado` |
| `test` | Tests | `test: agregar tests para VictoryService` |
| `chore` | Mantenimiento | `chore: actualizar dependencias` |

### Ejemplos de Buenos Commits

```bash
feat(services): implementar CaptureService con detección de articulación
fix(collision): resolver bug de energías duplicadas en aristas
test(victory): agregar tests para condición de tiempo límite
docs: agregar memoria descriptiva del proyecto
refactor(core): usar arquitectura limpia de tres capas
perf(renderer): optimizar actualización de nodos
```

---

## 🔄 Flujo de Trabajo con Git

### Modelo de Ramas

```
main (producción)
 │
 └─ dev (desarrollo)
     ├─ feature/game-state-manager
     ├─ feature/capture-service
     ├─ fix/collision-bug
     └─ docs/contributing
```

### Políticas de Ramas

#### ✅ Permitido en Ramas Personales

- ✅ Rebase libremente antes del PR
- ✅ Force push con `--force-with-lease`
- ✅ Squash de commits relacionados

#### ❌ Prohibido en Ramas Compartidas

- ❌ **NUNCA** hacer rebase de `main` o `dev`
- ❌ **NUNCA** force push a `main` o `dev`
- ❌ **NUNCA** commitear directamente a `main`

### Proceso de Pull Request

1. **Título descriptivo** usando Conventional Commits
2. **Descripción completa** del PR con cambios y testing
3. **Asignar reviewers**: Al menos 1 revisor del equipo
4. **Esperar aprobación**: No auto-mergear

---

## 💻 Estándares de Código

### TypeScript

```typescript
// ✅ Usar tipos explícitos
function calculateDominance(nodes: number, totalNodes: number): number {
  return (nodes / totalNodes) * 100;
}

// ✅ Interfaces para contratos
interface GameState {
  players: Player[];
  graph: Graph;
  currentTick: number;
}

// ✅ Nombres descriptivos
const DOMINANCE_THRESHOLD = 0.7;
```

### Naming Conventions

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Variables | camelCase | `playerEnergy` |
| Constantes | UPPER_SNAKE_CASE | `MAX_NODES` |
| Clases | PascalCase | `GameStateManager` |
| Archivos | kebab-case | `game-state-manager.ts` |

---

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
pnpm test

# Tests específicos
pnpm test GameStateManager

# Watch mode
pnpm test --watch
```

### Cobertura

- ✅ Cada servicio debe tener tests
- ✅ Casos edge incluidos
- ✅ Tests independientes

---

## 👥 Equipo de Desarrollo

### Contribuidores Principales

| Nombre | GitHub | Contribuciones Destacadas |
|--------|--------|---------------------------|
| Luis Gustavo Sequeiros Condori | [@gustadev24](https://github.com/gustadev24) | Arquitectura, Servicios Core, Game Controller, Integración |
| Ricardo Chambilla | [@rikich3](https://github.com/rikich3) | GameStateManager, Infraestructura, Git Workflow, Documentación |
| Paul Cari Lipe | [@PaulCari](https://github.com/PaulCari) | Victory Service, Testing, Validación de Lógica |
| Jhon Aquino | [@JhonAQ](https://github.com/JhonAQ) | Capture Service, Detección de Articulación |
| Raquel Quispe | [@RaqDxs](https://github.com/RaqDxs) | UI/UX, Escenas de Phaser, Diseño Visual |
| Rafael Chambilla | [@rchambillap](https://github.com/rchambillap) | Integración de Servicios, Testing End-to-End |

**Proyecto desarrollado como parte del curso de Ingeniería de Software**  
**Universidad:** Universidad Nacional de San Agustín  
**Fecha:** Diciembre 2025

---

## 📚 Recursos Adicionales

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Workflow con Rebase](contexto/git-workflow-rebase.md)
- [Arquitectura del Proyecto](contexto/descripcion_logica.md)

---

<div align="center">

**¡Gracias por contribuir a Nexa!** 🎮

</div>
