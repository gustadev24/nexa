# 📁 Configuración de Vite

Este directorio contiene las configuraciones de Vite para los entornos de desarrollo y producción del proyecto Nexa (Phaser 3 + TypeScript).

---

## 📄 Archivos

### `config.dev.mjs`
Configuración optimizada para desarrollo local.

**Características:**
- ✅ Hot Module Replacement (HMR) automático
- ✅ Servidor de desarrollo en puerto `8080`
- ✅ Alias de imports configurados
- ✅ Source maps habilitados
- ✅ Build incremental rápido

**Comando asociado:**
```bash
pnpm run dev       # Con logs
pnpm run dev-nolog # Sin logs
```

---

### `config.prod.mjs`
Configuración optimizada para builds de producción.

**Características:**
- ✅ Minificación con Terser (2 pases de compresión)
- ✅ Tree-shaking agresivo
- ✅ Code splitting (Phaser en chunk separado)
- ✅ Eliminación de comentarios
- ✅ Mangling de nombres de variables
- ✅ Plugin personalizado con mensaje de Phaser

**Comando asociado:**
```bash
pnpm run build       # Con logs
pnpm run build-nolog # Sin logs
```

**Output:** Genera la carpeta `dist/` en la raíz del proyecto.

---

## 🔧 Configuraciones Compartidas

Ambos archivos de configuración incluyen:

### 1. **Alias de Imports**

```javascript
resolve: {
  alias: {
    '@': resolve(__dirname, '..', 'src'),
    '@/core': resolve(__dirname, '..', 'src', 'core')
  }
}
```

**Uso en código:**
```typescript
// ❌ Antes (rutas relativas)
import { Game } from '../../../game/scenes/Game';
import { Utils } from '../../core/utils';

// ✅ Ahora (rutas absolutas)
import { Game } from '@/game/scenes/Game';
import { Utils } from '@/core/utils';
```

**Beneficios:**
- 🎯 Rutas más limpias y legibles
- 🔄 Fácil refactorización (no se rompen imports al mover archivos)
- 💡 Mejor autocompletado en el editor
- 📦 Consistencia entre entornos

---

### 2. **Code Splitting de Phaser**

```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        phaser: ['phaser']
      }
    }
  }
}
```

**Beneficios:**
- ⚡ Phaser se carga en un archivo separado
- 🚀 Mejor caché del navegador (Phaser no cambia frecuentemente)
- 📉 Builds incrementales más rápidos
- 🎮 Optimización específica para juegos

---

### 3. **Configuración Base**

```javascript
base: './'  // Rutas relativas para deploy flexible
```

Permite desplegar el juego en:
- ✅ Subdirectorios: `example.com/games/nexa/`
- ✅ Raíz del dominio: `example.com/`
- ✅ GitHub Pages
- ✅ Netlify, Vercel, etc.

---

## 🛠️ Detalles Técnicos

### Compatibilidad con ES Modules

Ambos archivos usan la extensión `.mjs` e incluyen este código para compatibilidad:

```javascript
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

**¿Por qué?**
- Los módulos ES no tienen `__dirname` por defecto
- Se necesita para resolver rutas absolutas en los alias
- Mantiene compatibilidad con Node.js moderno

---

### Optimizaciones de Producción

El archivo `config.prod.mjs` incluye configuraciones avanzadas de Terser:

```javascript
terserOptions: {
  compress: {
    passes: 2      // Dos pases de compresión (mejor ratio)
  },
  mangle: true,    // Ofusca nombres de variables
  format: {
    comments: false // Elimina todos los comentarios
  }
}
```

**Impacto:**
- 📊 ~40-60% reducción de tamaño del bundle
- ⚡ Carga más rápida del juego
- 🔒 Ligera ofuscación del código

---

## 🔗 Integración con TypeScript

Los alias configurados aquí se sincronizan con `tsconfig.json`:

**En Vite (`config.*.mjs`):**
```javascript
alias: {
  '@': resolve(__dirname, '..', 'src')
}
```

**En TypeScript (`tsconfig.json`):**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

**Resultado:**
- ✅ Vite resuelve los imports en runtime
- ✅ TypeScript valida tipos correctamente
- ✅ El editor ofrece autocompletado
- ✅ Sin errores de compilación

---

## 📊 Comparación Dev vs Prod

| Característica | Development | Production |
|----------------|-------------|------------|
| **Minificación** | ❌ No | ✅ Sí (Terser) |
| **Source Maps** | ✅ Completos | ⚠️ Externos |
| **HMR** | ✅ Activado | ❌ N/A |
| **Build Time** | ⚡ ~500ms | 🐢 ~5-10s |
| **Tamaño Bundle** | 📦 ~5MB | 📉 ~1.5MB |
| **Logs** | 📢 Verbose | 🔇 Warning |

---

## 🚀 Comandos Rápidos

```bash
# Desarrollo (con auto-reload)
pnpm run dev

# Build para producción
pnpm run build

# Preview del build de producción
pnpm preview

# Verificar configuración
pnpm run dev -- --debug
```

---

## 📝 Notas Importantes

### Port Conflicts
Si el puerto `8080` está ocupado, Vite automáticamente intentará:
- `8081`, `8082`, etc.
- Revisa la consola para ver el puerto asignado

### Modificaciones
Si necesitas cambiar alguna configuración:

1. **Cambiar puerto del servidor:**
```javascript
server: {
  port: 3000  // Cambia 8080 por el puerto deseado
}
```

2. **Agregar más alias:**
```javascript
alias: {
  '@': resolve(__dirname, '..', 'src'),
  '@/core': resolve(__dirname, '..', 'src', 'core'),
  '@/scenes': resolve(__dirname, '..', 'src', 'game', 'scenes'),  // Nuevo
  '@/assets': resolve(__dirname, '..', 'public', 'assets')        // Nuevo
}
```

3. **Cambiar nivel de minificación:**
```javascript
terserOptions: {
  compress: {
    passes: 1  // Menos optimización, build más rápido
  }
}
```

---

## 🐛 Troubleshooting

### Problema: "Cannot find module '@/...'"

**Solución:**
1. Verifica que `tsconfig.json` tenga la configuración de `paths`
2. Reinicia el servidor TypeScript en VSCode: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
3. Verifica que los archivos existan en las rutas especificadas

### Problema: Build lento en producción

**Solución:**
- Reduce `terserOptions.compress.passes` de `2` a `1`
- O usa minificación de Vite en lugar de Terser:
```javascript
build: {
  minify: 'esbuild'  // Más rápido, menos optimizado
}
```

### Problema: Errores en el build

**Solución:**
1. Limpia la caché: `rm -rf node_modules/.vite`
2. Reinstala dependencias: `pnpm install`
3. Verifica errores de TypeScript: `pnpm tsc --noEmit`

---

## 📚 Referencias

- [Documentación de Vite](https://vitejs.dev/)
- [Configuración de Aliases](https://vitejs.dev/config/shared-options.html#resolve-alias)
- [Build Options](https://vitejs.dev/config/build-options.html)
- [Terser Options](https://terser.org/docs/api-reference#minify-options)
- [Phaser 3 Docs](https://photonstorm.github.io/phaser3-docs/)

---

## 📜 Changelog

### v1.0.0 (2025-11-16)
- ✅ Configuración inicial de Vite dev y prod
- ✅ Alias de imports (`@`, `@/core`)
- ✅ Integración con TypeScript
- ✅ Code splitting de Phaser
- ✅ Optimizaciones de producción con Terser

---

**Mantenido por:** Equipo Nexa  
**Última actualización:** Noviembre 16, 2025
